// lib/ai/fileProcessor.ts

import mammoth from 'mammoth'

// Dynamic import for PDF.js to avoid server-side issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfJs() {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    // Don't set workerSrc - let PDF.js handle it automatically
    // This will use the default behavior which should work in most cases
  }
  return pdfjsLib
}
// Types for file processing
export interface ProcessedFile {
  content: string
  type: 'text' | 'base64'
  processingMethod: 'text_extraction' | 'vision_api'
  metadata: {
    originalName: string
    mimeType: string
    size: number
    pageCount?: number
    wordCount: number
  }
}

export interface ProcessingError {
  type: 'UNSUPPORTED_FILE' | 'CORRUPTED_FILE' | 'PROCESSING_ERROR' | 'FILE_TOO_LARGE'
  message: string
  fileName: string
}

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain'
]

/**
 * Main file processing function
 * Determines processing method and routes to appropriate handler
 */
export async function processFile(file: File): Promise<ProcessedFile | ProcessingError> {
  try {
    // Validate file first
    const validation = validateFile(file)
    if (!validation.isValid) {
      return {
        type: validation.errorType || 'PROCESSING_ERROR',
        message: validation.error || 'File validation failed',
        fileName: file.name
      }
    }

    // Determine processing method
    const processingMethod = getProcessingMethod(file.type)
    
    let content: string
    let metadata: ProcessedFile['metadata'] = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      wordCount: 0
    }

    // Route to appropriate processor
    switch (processingMethod) {
      case 'text_extraction':
        const textResult = await extractText(file)
        content = textResult.text
        metadata = { ...metadata, ...textResult.metadata }
        break
        
      case 'vision_api':
        content = await convertToBase64(file)
        break
        
      default:
        return {
          type: 'UNSUPPORTED_FILE',
          message: `Processing method not implemented for ${file.type}`,
          fileName: file.name
        }
    }

    // Calculate word count for text content
    if (processingMethod === 'text_extraction') {
      metadata.wordCount = countWords(content)
    }

    return {
      content,
      type: processingMethod === 'text_extraction' ? 'text' : 'base64',
      processingMethod,
      metadata
    }

  } catch (error) {
    return {
      type: 'PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown processing error',
      fileName: file.name
    }
  }
}

/**
 * Validate file type, size, and basic properties
 */
function validateFile(file: File): { 
  isValid: boolean
  error?: string
  errorType?: ProcessingError['type']
} {
  // Check file size
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty',
      errorType: 'CORRUPTED_FILE'
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      isValid: false,
      error: `File is too large (${sizeMB}MB). Maximum size is 10MB.`,
      errorType: 'FILE_TOO_LARGE'
    }
  }

  // Check file type
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Please use PDF, Word documents, or images.`,
      errorType: 'UNSUPPORTED_FILE'
    }
  }

  return { isValid: true }
}

/**
 * Determine which processing method to use based on file type
 */
function getProcessingMethod(mimeType: string): 'text_extraction' | 'vision_api' {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif']
  return imageTypes.includes(mimeType) ? 'vision_api' : 'text_extraction'
}

/**
 * Extract text content from various document types
 */
async function extractText(file: File): Promise<{
  text: string
  metadata: Partial<ProcessedFile['metadata']>
}> {
  switch (file.type) {
    case 'application/pdf':
      return await extractTextFromPDF(file)
      
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractTextFromWord(file)
      
    case 'text/plain':
      return await extractTextFromPlainText(file)
      
    default:
      throw new Error(`Text extraction not implemented for ${file.type}`)
  }
}

/**
 * Extract text from PDF files using PDF.js
 */
async function extractTextFromPDF(file: File): Promise<{
  text: string
  metadata: Partial<ProcessedFile['metadata']>
}> {
  try {
    const pdfjs = await getPdfJs()
    if (!pdfjs) {
      throw new Error('PDF.js not available in this environment')
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    
    let fullText = ''
    const pageCount = pdf.numPages
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine text items from the page
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n'
    }
    
    // Clean up the extracted text
    const cleanedText = cleanExtractedText(fullText)
    
    return {
      text: cleanedText,
      metadata: {
        pageCount
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from Word documents using Mammoth.js
 */
async function extractTextFromWord(file: File): Promise<{
  text: string
  metadata: Partial<ProcessedFile['metadata']>
}> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Extract text using Mammoth
    const result = await mammoth.extractRawText({ arrayBuffer })
    
    // Clean up the extracted text
    const cleanedText = cleanExtractedText(result.value)
    
    return {
      text: cleanedText,
      metadata: {}
    }
    
  } catch (error) {
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from plain text files
 */
async function extractTextFromPlainText(file: File): Promise<{
  text: string
  metadata: Partial<ProcessedFile['metadata']>
}> {
  try {
    const text = await file.text()
    
    return {
      text: cleanExtractedText(text),
      metadata: {}
    }
    
  } catch (error) {
    throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert image files to base64 for OpenAI Vision API
 */
async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to convert file to base64'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Clean up extracted text by removing extra whitespace, fixing encoding issues, etc.
 */
function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from beginning and end
    .trim()
    // Fix common OCR/extraction issues
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Count words in text content
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

/**
 * Validate multiple files at once
 */
export function validateMultipleFiles(files: File[], maxFiles: number = 5): {
  validFiles: File[]
  invalidFiles: File[]
  errors: string[]
  totalSize: number
} {
  const validFiles: File[] = []
  const invalidFiles: File[] = []
  const errors: string[] = []
  let totalSize = 0

  // Check file count limit
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed. Only the first ${maxFiles} files will be processed.`)
    files = files.slice(0, maxFiles)
  }

  // Validate each file
  files.forEach(file => {
    const validation = validateFile(file)
    
    if (validation.isValid) {
      validFiles.push(file)
      totalSize += file.size
    } else {
      invalidFiles.push(file)
      errors.push(`${file.name}: ${validation.error}`)
    }
  })

  return {
    validFiles,
    invalidFiles,
    errors,
    totalSize
  }
}

/**
 * Process multiple files concurrently
 */
export async function processMultipleFiles(files: File[]): Promise<{
  successful: ProcessedFile[]
  failed: ProcessingError[]
  totalProcessed: number
}> {
  const successful: ProcessedFile[] = []
  const failed: ProcessingError[] = []

  // Process all files concurrently
  const results = await Promise.allSettled(
    files.map(file => processFile(file))
  )

  // Separate successful and failed results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const processedResult = result.value
      if ('content' in processedResult) {
        successful.push(processedResult)
      } else {
        failed.push(processedResult)
      }
    } else {
      failed.push({
        type: 'PROCESSING_ERROR',
        message: result.reason?.message || 'Unknown error',
        fileName: files[index]?.name || 'Unknown file'
      })
    }
  })

  return {
    successful,
    failed,
    totalProcessed: files.length
  }
}

/**
 * Get file processing statistics
 */
export function getProcessingStats(results: ProcessedFile[]): {
  totalFiles: number
  totalSize: number
  totalWords: number
  averageWordsPerFile: number
  processingMethods: Record<string, number>
  fileTypes: Record<string, number>
} {
  const stats = {
    totalFiles: results.length,
    totalSize: 0,
    totalWords: 0,
    averageWordsPerFile: 0,
    processingMethods: {} as Record<string, number>,
    fileTypes: {} as Record<string, number>
  }

  results.forEach(result => {
    stats.totalSize += result.metadata.size
    stats.totalWords += result.metadata.wordCount
    
    // Count processing methods
    stats.processingMethods[result.processingMethod] = 
      (stats.processingMethods[result.processingMethod] || 0) + 1
    
    // Count file types
    stats.fileTypes[result.metadata.mimeType] = 
      (stats.fileTypes[result.metadata.mimeType] || 0) + 1
  })

  stats.averageWordsPerFile = stats.totalFiles > 0 ? 
    Math.round(stats.totalWords / stats.totalFiles) : 0

  return stats
}

// Export validation functions for use in tests
export {
  validateFile,
  getProcessingMethod,
  cleanExtractedText,
  countWords,
  MAX_FILE_SIZE,
  SUPPORTED_TYPES
}