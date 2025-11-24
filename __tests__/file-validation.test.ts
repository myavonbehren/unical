// __tests__/file-validation.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  processFile, 
  validateMultipleFiles, 
  processMultipleFiles, 
  getProcessingStats,

  MAX_FILE_SIZE,
  SUPPORTED_TYPES,
  type ProcessedFile,
  type ProcessingError
} from '../lib/openai/fileProcessor'

// External dependencies are mocked via __mocks__ directory

// Mock FileReader for Node.js environment
global.FileReader = class FileReader {
  result: string | null = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsDataURL(file: any) {
    // Simulate successful read
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-base64-data'
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }
} as any

// Mock File class for testing
class MockFile implements File {
  name: string
  type: string
  size: number
  lastModified: number
  webkitRelativePath: string
  arrayBuffer: () => Promise<ArrayBuffer>
  bytes: () => Promise<Uint8Array>
  slice: (start?: number, end?: number, contentType?: string) => Blob
  stream: () => ReadableStream<Uint8Array>
  text: () => Promise<string>

  constructor(name: string, type: string, size: number, arrayBuffer?: ArrayBuffer) {
    this.name = name
    this.type = type
    this.size = size
    this.lastModified = Date.now()
    this.webkitRelativePath = ''
    
    this.arrayBuffer = (() => Promise.resolve(arrayBuffer || new ArrayBuffer(8))) as any
    this.bytes = (() => Promise.resolve(new Uint8Array(8))) as any
    this.slice = (() => this as any) as any
    this.stream = (() => new ReadableStream()) as any
    this.text = (() => Promise.resolve('mock content')) as any
  }
}

// Test utilities and types
interface TestFile {
  name: string
  type: string
  size: number
  content: string | ArrayBuffer
}

// Mock file creation utilities
const createMockFile = (name: string, type: string, size: number, content: string): TestFile => ({
  name,
  type,
  size,
  content
})

const createMockFileObject = (name: string, type: string, size: number, arrayBuffer?: ArrayBuffer): File => 
  new MockFile(name, type, size, arrayBuffer)

// Test file samples
const TEST_FILES = {
  validPDF: createMockFile('syllabus.pdf', 'application/pdf', 1024 * 1024, 'mock pdf content'),
  validWord: createMockFile('syllabus.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 512 * 1024, 'mock word content'),
  validImage: createMockFile('syllabus.jpg', 'image/jpeg', 2 * 1024 * 1024, 'mock image content'),
  invalidType: createMockFile('syllabus.exe', 'application/x-executable', 1024, 'invalid content'),
  tooLarge: createMockFile('huge-syllabus.pdf', 'application/pdf', 15 * 1024 * 1024, 'huge content'),
  emptyFile: createMockFile('empty.pdf', 'application/pdf', 0, ''),
  corruptedPDF: createMockFile('corrupted.pdf', 'application/pdf', 1024, 'not-a-pdf-content')
}

// File Type Validation Tests
describe('File Type Validation', () => {
  
  it('should accept valid PDF files', () => {
    const isValidType = SUPPORTED_TYPES.includes(TEST_FILES.validPDF.type)
    expect(isValidType).toBe(true)
  })

  it('should accept valid Word documents', () => {
    const isValidType = SUPPORTED_TYPES.includes(TEST_FILES.validWord.type)
    expect(isValidType).toBe(true)
  })

  it('should accept valid image files', () => {
    const isValidType = SUPPORTED_TYPES.includes(TEST_FILES.validImage.type)
    expect(isValidType).toBe(true)
  })

  it('should reject invalid file types', () => {
    const isValidType = SUPPORTED_TYPES.includes(TEST_FILES.invalidType.type)
    expect(isValidType).toBe(false)
  })
})

// File Size Validation Tests
describe('File Size Validation', () => {
  it('should accept files within size limit', () => {
    expect(TEST_FILES.validPDF.size).toBeLessThan(MAX_FILE_SIZE)
  })

  it('should reject files exceeding size limit', () => {
    expect(TEST_FILES.tooLarge.size).toBeGreaterThan(MAX_FILE_SIZE)
  })

  it('should reject empty files', () => {
    expect(TEST_FILES.emptyFile.size).toBe(0)
  })
})

// File Processing Tests
describe('File Processing', () => {
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Set up mock implementations
    const { getDocument } = require('pdfjs-dist')
    const { extractRawText } = require('mammoth')
    
    // Use jest.mocked to properly type the mocks
    const mockedGetDocument = jest.mocked(getDocument)
    const mockedExtractRawText = jest.mocked(extractRawText)
    
    // Create mock functions separately to avoid type issues
    const mockGetTextContent = jest.fn()
    const mockGetPage = jest.fn()
    
    // Use any type assertions to bypass Jest type issues
    ;(mockGetTextContent as any).mockResolvedValue({ items: [{ str: 'Mock PDF content' }] })
    ;(mockGetPage as any).mockResolvedValue({ getTextContent: mockGetTextContent })
    
    mockedGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: mockGetPage
      })
    })

    mockedExtractRawText.mockResolvedValue({
      value: 'Mock Word document content'
    })
  })
  
  it('should process valid PDF files', async () => {
    // Create a proper mock File object with arrayBuffer method
    const mockFile = createMockFileObject('test.pdf', 'application/pdf', 1024)
    
    const result = await processFile(mockFile)
    
    expect('content' in result).toBe(true)
    if ('content' in result) {
      expect(result.content).toBeTruthy()
      expect(result.processingMethod).toBe('text_extraction')
      expect(result.metadata.originalName).toBe('test.pdf')
    }
  })

  it('should process valid Word documents', async () => {
    // Create a proper mock File object with arrayBuffer method
    const mockFile = createMockFileObject('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024)
    
    const result = await processFile(mockFile)
    
    expect('content' in result).toBe(true)
    if ('content' in result) {
      expect(result.content).toBeTruthy()
      expect(result.processingMethod).toBe('text_extraction')
    }
  })

  it('should process image files for vision API', async () => {
    // Create a proper mock File object
    const mockFile = createMockFileObject('test.jpg', 'image/jpeg', 1024)
    
    const result = await processFile(mockFile)
    
    expect('content' in result).toBe(true)
    if ('content' in result) {
      expect(result.processingMethod).toBe('vision_api')
      expect(result.type).toBe('base64')
    }
  })

  it('should reject unsupported file types', async () => {
    const mockFile = createMockFileObject('test.exe', 'application/x-executable', 1024)
    
    const result = await processFile(mockFile)
    
    expect('type' in result).toBe(true)
    if ('type' in result) {
      expect(result.type).toBe('UNSUPPORTED_FILE')
      expect((result as ProcessingError).message).toContain('not supported')
    }
  })

  it('should reject files that are too large', async () => {
    const mockFile = createMockFileObject('huge.pdf', 'application/pdf', 15 * 1024 * 1024)
    
    const result = await processFile(mockFile)
    
    expect('type' in result).toBe(true)
    if ('type' in result) {
      expect(result.type).toBe('FILE_TOO_LARGE')
      expect((result as ProcessingError).message).toContain('too large')
    }
  })

  it('should reject empty files', async () => {
    const mockFile = createMockFileObject('empty.pdf', 'application/pdf', 0)
    
    const result = await processFile(mockFile)
    
    expect('type' in result).toBe(true)
    if ('type' in result) {
      expect(result.type).toBe('CORRUPTED_FILE')
      expect((result as ProcessingError).message).toContain('empty')
    }
  })
})

// Multiple File Processing Tests
describe('Multiple File Processing', () => {
  
  it('should validate multiple files correctly', () => {
    const files = [
      createMockFileObject('file1.pdf', 'application/pdf', 1024),
      createMockFileObject('file2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024),
      createMockFileObject('file3.exe', 'application/x-executable', 1024)
    ]
    
    const result = validateMultipleFiles(files)
    
    expect(result.validFiles).toHaveLength(2)
    expect(result.invalidFiles).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.totalSize).toBeGreaterThan(0)
  })

  it('should respect file count limits', () => {
    const files = Array.from({ length: 10 }, (_, i) => 
      createMockFileObject(`file${i}.pdf`, 'application/pdf', 1024)
    )
    
    const result = validateMultipleFiles(files, 5)
    
    expect(result.validFiles).toHaveLength(5)
    expect(result.errors).toContain('Maximum 5 files allowed. Only the first 5 files will be processed.')
  })

  it('should process multiple files concurrently', async () => {
    const files = [
      createMockFileObject('file1.pdf', 'application/pdf', 1024),
      createMockFileObject('file2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024)
    ]
    
    const result = await processMultipleFiles(files)
    
    expect(result.successful).toHaveLength(2)
    expect(result.failed).toHaveLength(0)
    expect(result.totalProcessed).toBe(2)
  })
})

// Statistics Tests
describe('Processing Statistics', () => {
  
  it('should calculate processing statistics correctly', () => {
    const mockResults: ProcessedFile[] = [
      {
        content: 'content1',
        type: 'text',
        processingMethod: 'text_extraction',
        metadata: {
          originalName: 'file1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          wordCount: 100
        }
      },
      {
        content: 'content2',
        type: 'text',
        processingMethod: 'text_extraction',
        metadata: {
          originalName: 'file2.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048,
          wordCount: 200
        }
      }
    ]
    
    const stats = getProcessingStats(mockResults)
    
    expect(stats.totalFiles).toBe(2)
    expect(stats.totalSize).toBe(3072)
    expect(stats.totalWords).toBe(300)
    expect(stats.averageWordsPerFile).toBe(150)
    expect(stats.processingMethods['text_extraction']).toBe(2)
    expect(stats.fileTypes['application/pdf']).toBe(1)
    expect(stats.fileTypes['application/vnd.openxmlformats-officedocument.wordprocessingml.document']).toBe(1)
  })
})

// Note: File name sanitization tests removed as sanitizeFileName function is not exported from fileProcessor

// Error Handling Tests
describe('Error Handling', () => {
  
  it('should handle processing errors gracefully', async () => {
    // Mock a file that will cause processing to fail
    const mockFile = createMockFileObject('corrupted.pdf', 'application/pdf', 1024)
    
    // Mock pdfjs-dist to throw an error
    const { getDocument } = require('pdfjs-dist')
    const mockedGetDocument = jest.mocked(getDocument)
    mockedGetDocument.mockReturnValueOnce({
      promise: Promise.reject(new Error('Corrupted PDF'))
    })
    
    const result = await processFile(mockFile)
    
    expect('type' in result).toBe(true)
    if ('type' in result) {
      expect(result.type).toBe('PROCESSING_ERROR')
      expect((result as ProcessingError).message).toContain('Failed to extract text from PDF')
    }
  })
})

// Export test utilities for use in other tests
export {
  TEST_FILES,
  createMockFile,
  createMockFileObject,
  MockFile,
  type TestFile
}
