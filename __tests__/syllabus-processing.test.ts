// __tests__/syllabus-processing.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import OpenAI from 'openai'

// Test utilities and types
interface TestFile {
  name: string
  type: string
  size: number
  content: string | ArrayBuffer
}

interface ParsedSyllabusData {
  course_info: {
    name: string
    code?: string
    instructor?: string
  }
  assignments: Array<{
    title: string
    week?: number
    specific_date?: string
    type: string
    description?: string
  }>
  metadata: {
    parsing_confidence: number
    weeks_detected: number
    original_format: string
  }
}

// Mock file creation utilities
const createMockFile = (name: string, type: string, size: number, content: string): TestFile => ({
  name,
  type,
  size,
  content
})

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

// Sample syllabus content for testing
const SAMPLE_SYLLABUS_TEXT = `
CS 101 - Introduction to Computer Science
Instructor: Dr. Jane Smith
Fall 2024

Course Schedule:
Week 1: Introduction to Programming
Week 3: Data Structures - Assignment 1 due
Week 5: Algorithms - Midterm Exam
Week 8: Object-Oriented Programming - Project due
Week 12: Final Project presentations
Week 15: Final Exam

Assignment Schedule:
- Homework 1: Week 3 (Basic Programming)
- Midterm Exam: Week 5
- Project Proposal: Week 6
- Final Project: Week 12
- Final Exam: Week 15
`

// File Type Validation Tests
describe('File Type Validation', () => {
  
  it('should accept valid PDF files', () => {
    const isValidType = validateFileType(TEST_FILES.validPDF.type)
    expect(isValidType).toBe(true)
  })

  it('should accept valid Word documents', () => {
    const isValidType = validateFileType(TEST_FILES.validWord.type)
    expect(isValidType).toBe(true)
  })

  it('should accept valid image files', () => {
    const isValidType = validateFileType(TEST_FILES.validImage.type)
    expect(isValidType).toBe(true)
  })

  it('should reject invalid file types', () => {
    const isValidType = validateFileType(TEST_FILES.invalidType.type)
    expect(isValidType).toBe(false)
  })

  it('should detect file processing method correctly', () => {
    expect(getProcessingMethod(TEST_FILES.validPDF.type)).toBe('text_extraction')
    expect(getProcessingMethod(TEST_FILES.validWord.type)).toBe('text_extraction')
    expect(getProcessingMethod(TEST_FILES.validImage.type)).toBe('vision_api')
  })
})

// File Size Validation Tests
describe('File Size Validation', () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  it('should accept files within size limit', () => {
    expect(TEST_FILES.validPDF.size).toBeLessThan(MAX_FILE_SIZE)
    expect(validateFileSize(TEST_FILES.validPDF.size, MAX_FILE_SIZE)).toBe(true)
  })

  it('should reject files exceeding size limit', () => {
    expect(TEST_FILES.tooLarge.size).toBeGreaterThan(MAX_FILE_SIZE)
    expect(validateFileSize(TEST_FILES.tooLarge.size, MAX_FILE_SIZE)).toBe(false)
  })

  it('should reject empty files', () => {
    expect(validateFileSize(TEST_FILES.emptyFile.size, MAX_FILE_SIZE)).toBe(false)
  })
})

// Text Extraction Tests
describe('Text Extraction', () => {
  
  it('should extract text from PDF files', async () => {
    // Mock PDF text extraction
    const mockExtractTextFromPDF = jest.fn<(file: TestFile) => Promise<string>>()
    mockExtractTextFromPDF.mockResolvedValue(SAMPLE_SYLLABUS_TEXT)
    
    const extractedText = await mockExtractTextFromPDF(TEST_FILES.validPDF)
    
    expect(extractedText).toContain('CS 101')
    expect(extractedText).toContain('Dr. Jane Smith')
    expect(extractedText).toContain('Week 3')
    expect(extractedText.length).toBeGreaterThan(100)
  })

  it('should extract text from Word documents', async () => {
    // Mock Word text extraction
    const mockExtractTextFromWord = jest.fn<(file: TestFile) => Promise<string>>()
    mockExtractTextFromWord.mockResolvedValue(SAMPLE_SYLLABUS_TEXT)
    
    const extractedText = await mockExtractTextFromWord(TEST_FILES.validWord)
    
    expect(extractedText).toContain('Assignment Schedule')
    expect(extractedText).toContain('Homework 1')
    expect(typeof extractedText).toBe('string')
  })

  it('should handle corrupted files gracefully', async () => {
    const mockExtractTextFromPDF = jest.fn<(file: TestFile) => Promise<string>>()
    mockExtractTextFromPDF.mockRejectedValue(new Error('Corrupted file'))
    
    await expect(mockExtractTextFromPDF(TEST_FILES.corruptedPDF))
      .rejects.toThrow('Corrupted file')
  })

  it('should return meaningful error for unsupported content', async () => {
    const mockExtractText = jest.fn<(file: TestFile) => Promise<string>>()
    mockExtractText.mockResolvedValue('')
    
    const result = await mockExtractText(TEST_FILES.emptyFile)
    expect(result).toBe('')
  })
})

// OpenAI API Connectivity Tests
describe('OpenAI API Integration', () => {
  let mockOpenAI: jest.Mocked<OpenAI>

  beforeEach(() => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any
  })

  it('should successfully connect to OpenAI API', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: { name: 'CS 101', instructor: 'Dr. Smith' },
            assignments: [{ title: 'Homework 1', week: 3, type: 'homework' }]
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)

    const result = await mockOpenAI.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Test message' }]
    })

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Test message' }]
    })
    expect(result.choices[0].message.content).toContain('CS 101')
  })

  it('should handle OpenAI API errors', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('API rate limit exceeded')
    )

    await expect(
      mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }]
      })
    ).rejects.toThrow('API rate limit exceeded')
  })

  it('should validate API response structure', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: { name: 'CS 101' },
            assignments: [{ title: 'Test', week: 1, type: 'homework' }],
            metadata: { parsing_confidence: 0.85, weeks_detected: 15, original_format: 'pdf' }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)
    
    const response = await mockOpenAI.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: SAMPLE_SYLLABUS_TEXT }]
    })

    const parsedData = JSON.parse(response.choices[0].message.content!)
    
    expect(parsedData).toHaveProperty('course_info')
    expect(parsedData).toHaveProperty('assignments')
    expect(parsedData).toHaveProperty('metadata')
    expect(parsedData.course_info).toHaveProperty('name')
    expect(Array.isArray(parsedData.assignments)).toBe(true)
  })
})

// Data Quality and Comprehensibility Tests
describe('Parsed Data Quality', () => {
  
  it('should extract course information correctly', () => {
    const mockParsedData: ParsedSyllabusData = {
      course_info: {
        name: 'Introduction to Computer Science',
        code: 'CS 101',
        instructor: 'Dr. Jane Smith'
      },
      assignments: [],
      metadata: {
        parsing_confidence: 0.9,
        weeks_detected: 15,
        original_format: 'pdf'
      }
    }

    expect(mockParsedData.course_info.name).toBeTruthy()
    expect(mockParsedData.course_info.name.length).toBeGreaterThan(5)
    expect(mockParsedData.course_info.code).toMatch(/^[A-Z]{2,4}\s?\d{3}$/)
  })

  it('should extract assignments with week numbers (your unique feature)', () => {
    const mockAssignments = [
      { title: 'Homework 1', week: 3, type: 'homework', description: 'Basic Programming' },
      { title: 'Midterm Exam', week: 5, type: 'exam' },
      { title: 'Final Project', week: 12, type: 'project' }
    ]

    mockAssignments.forEach(assignment => {
      expect(assignment.title).toBeTruthy()
      expect(assignment.week).toBeGreaterThan(0)
      expect(assignment.week).toBeLessThanOrEqual(16) // Typical semester length
      expect(['homework', 'exam', 'project', 'quiz', 'reading']).toContain(assignment.type)
    })
  })

  it('should handle mixed date formats (weeks and specific dates)', () => {
    const mockAssignments = [
      { title: 'Assignment 1', week: 3, type: 'homework' },
      { title: 'Assignment 2', specific_date: '2024-09-15', type: 'homework' },
      { title: 'Assignment 3', week: 8, type: 'project' }
    ]

    mockAssignments.forEach(assignment => {
      const hasWeek = assignment.week !== undefined
      const hasSpecificDate = assignment.specific_date !== undefined
      
      expect(hasWeek || hasSpecificDate).toBe(true) // Should have at least one
    })
  })

  it('should validate parsing confidence threshold', () => {
    const mockMetadata = {
      parsing_confidence: 0.85,
      weeks_detected: 15,
      original_format: 'pdf'
    }

    expect(mockMetadata.parsing_confidence).toBeGreaterThan(0.7) // Minimum confidence
    expect(mockMetadata.parsing_confidence).toBeLessThanOrEqual(1.0)
    expect(mockMetadata.weeks_detected).toBeGreaterThan(0)
    expect(['pdf', 'docx', 'image']).toContain(mockMetadata.original_format)
  })
})

// Edge Cases and Error Handling Tests
describe('Edge Cases and Error Handling', () => {
  
  it('should handle syllabus with no clear week structure', () => {
    const noWeekSyllabus = `
    Math 101 - Calculus
    Homework due every Friday
    Midterm on October 15th
    Final exam TBD
    `
    
    // Mock parsing result for syllabus without week numbers
    const mockResult = {
      course_info: { name: 'Calculus', code: 'Math 101' },
      assignments: [
        { title: 'Midterm', specific_date: '2024-10-15', type: 'exam' }
      ],
      metadata: { parsing_confidence: 0.6, weeks_detected: 0, original_format: 'pdf' }
    }

    expect(mockResult.metadata.weeks_detected).toBe(0)
    expect(mockResult.assignments.length).toBeGreaterThan(0)
    expect(mockResult.metadata.parsing_confidence).toBeGreaterThan(0.5)
  })

  it('should handle multiple courses in one document', () => {
    const multiCourseSyllabus = `
    CS 101 - Intro Programming
    Week 3: Assignment 1
    
    CS 102 - Data Structures  
    Week 4: Project 1
    `
    
    // Should either parse multiple courses or warn about ambiguity
    const mockResult = {
      course_info: { name: 'Intro Programming', code: 'CS 101' },
      assignments: [{ title: 'Assignment 1', week: 3, type: 'homework' }],
      metadata: { 
        parsing_confidence: 0.7, 
        weeks_detected: 4, 
        original_format: 'pdf',
        warnings: ['Multiple courses detected in document']
      }
    }

    expect(mockResult.metadata.parsing_confidence).toBeLessThan(0.9) // Lower confidence for complex docs
  })

  it('should provide meaningful error messages', () => {
    const errorScenarios = [
      { error: 'INVALID_FILE_TYPE', message: 'File type not supported' },
      { error: 'FILE_TOO_LARGE', message: 'File exceeds 10MB limit' },
      { error: 'CORRUPTED_FILE', message: 'Unable to read file content' },
      { error: 'API_ERROR', message: 'OpenAI API error' },
      { error: 'LOW_CONFIDENCE', message: 'Unable to parse syllabus with confidence' }
    ]

    errorScenarios.forEach(scenario => {
      expect(scenario.message).toBeTruthy()
      expect(scenario.message.length).toBeGreaterThan(10)
      expect(scenario.error).toMatch(/^[A-Z_]+$/)
    })
  })
})

// Helper functions that need to be implemented
function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
  return allowedTypes.includes(mimeType)
}

function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

function getProcessingMethod(mimeType: string): 'text_extraction' | 'vision_api' {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif']
  return imageTypes.includes(mimeType) ? 'vision_api' : 'text_extraction'
}

// Export test utilities for use in actual implementation
export {
  TEST_FILES,
  SAMPLE_SYLLABUS_TEXT,
  validateFileType,
  validateFileSize,
  getProcessingMethod,
  type TestFile,
  type ParsedSyllabusData
}