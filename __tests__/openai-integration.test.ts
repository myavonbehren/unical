// __tests__/openai-integration.test.ts

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import OpenAI from 'openai'

// Types for OpenAI integration
interface OpenAIConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

interface SyllabusParsingPrompt {
  system: string
  user: string
  examples?: Array<{
    input: string
    output: string
  }>
}

interface ParsedSyllabusResponse {
  course_info: {
    name: string
    code?: string
    instructor?: string
    semester?: string
    year?: number
  }
  assignments: Array<{
    title: string
    week?: number
    specific_date?: string
    type: 'homework' | 'exam' | 'project' | 'quiz' | 'reading' | 'lab'
    description?: string
    points?: number
  }>
  schedule?: Array<{
    day: string
    start_time: string
    end_time: string
    location?: string
  }>
  metadata: {
    parsing_confidence: number
    weeks_detected: number
    original_format: string
    warnings?: string[]
  }
}

interface OpenAIError {
  type: 'rate_limit' | 'auth_error' | 'api_error' | 'parsing_error'
  message: string
  retryAfter?: number
}

// Mock OpenAI client for testing
let mockOpenAI: jest.Mocked<OpenAI>

// Sample syllabus texts for testing
const SAMPLE_SYLLABI = {
  withWeeks: `
    CS 101 - Introduction to Computer Science
    Professor: Dr. Jane Smith
    Fall 2024
    
    Schedule:
    Week 1: Introduction to Programming
    Week 3: Variables and Data Types - Assignment 1 due
    Week 5: Control Structures - Quiz 1
    Week 7: Functions - Midterm Exam
    Week 10: Object-Oriented Programming - Project proposal due
    Week 12: Data Structures - Assignment 2 due
    Week 15: Final Project presentations
    Week 16: Final Exam
  `,
  
  withSpecificDates: `
    MATH 201 - Calculus II
    Instructor: Prof. Robert Johnson
    Spring 2024
    
    Important Dates:
    January 15, 2024: First homework due
    February 14, 2024: Valentine's Day Quiz
    March 15, 2024: Midterm Examination
    April 20, 2024: Final Project due
    May 10, 2024: Final Exam
  `,
  
  mixedFormat: `
    ENG 102 - English Composition
    Dr. Sarah Wilson
    Fall 2024 Semester
    
    Assignment Schedule:
    Week 2: Essay 1 draft due
    September 25, 2024: Essay 1 final due
    Week 6: Research proposal due
    October 30, 2024: Research paper due
    Week 12: Portfolio review
    December 10, 2024: Final portfolio due
  `,
  
  noWeeks: `
    ART 101 - Introduction to Art History
    Professor Martinez
    
    Assignments:
    Essay on Renaissance Art - due soon
    Museum visit report - TBD
    Final presentation - end of semester
  `,
  
  multipleCourses: `
    CS 101 - Programming Basics
    Week 3: Assignment 1
    
    CS 102 - Data Structures  
    Week 4: Project 1
    
    MATH 201 - Calculus
    Week 5: Homework 2
  `
}

describe('OpenAI Client Configuration', () => {
  
  beforeEach(() => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any
  })

  it('should initialize OpenAI client with correct configuration', () => {
    const config: OpenAIConfig = {
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.1
    }

    expect(config.apiKey).toBeTruthy()
    expect(config.model).toBe('gpt-4')
    expect(config.temperature).toBeLessThanOrEqual(0.2) // Low temperature for consistent parsing
    expect(config.maxTokens).toBeGreaterThan(1000) // Enough for complex syllabi
  })

  it('should handle missing API key gracefully', () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    expect(() => {
      validateOpenAIConfig()
    }).toThrow('OpenAI API key is required')

    process.env.OPENAI_API_KEY = originalKey
  })

  it('should validate model availability', async () => {
    const models = ['gpt-4', 'gpt-4-vision-preview', 'gpt-3.5-turbo']
    
    for (const model of models) {
      const isValid = await validateModel(model)
      expect(typeof isValid).toBe('boolean')
    }
  })
})

describe('Syllabus Parsing Prompts', () => {
  
  it('should generate comprehensive system prompt', () => {
    const prompt = generateSystemPrompt()
    
    expect(prompt).toContain('syllabus')
    expect(prompt).toContain('week')
    expect(prompt).toContain('assignment')
    expect(prompt).toContain('JSON')
    expect(prompt.length).toBeGreaterThan(500) // Detailed prompt
  })

  it('should include week-to-date conversion instructions', () => {
    const prompt = generateSystemPrompt()
    
    expect(prompt).toContain('week number')
    expect(prompt).toContain('semester start')
    expect(prompt).toContain('calculate')
    expect(prompt).toContain('Week 1')
  })

  it('should specify required JSON structure', () => {
    const prompt = generateSystemPrompt()
    
    expect(prompt).toContain('course_info')
    expect(prompt).toContain('assignments')
    expect(prompt).toContain('metadata')
    expect(prompt).toContain('parsing_confidence')
  })

  it('should include assignment type classification', () => {
    const prompt = generateSystemPrompt()
    
    expect(prompt).toContain('homework')
    expect(prompt).toContain('exam')
    expect(prompt).toContain('project')
    expect(prompt).toContain('quiz')
  })
})

describe('OpenAI API Communication', () => {
  
  beforeEach(() => {
    mockOpenAI.chat.completions.create.mockClear()
  })

  it('should successfully parse syllabus with week numbers', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: {
              name: 'Introduction to Computer Science',
              code: 'CS 101',
              instructor: 'Dr. Jane Smith'
            },
            assignments: [
              { title: 'Assignment 1', week: 3, type: 'homework' },
              { title: 'Quiz 1', week: 5, type: 'quiz' },
              { title: 'Midterm Exam', week: 7, type: 'exam' }
            ],
            metadata: {
              parsing_confidence: 0.95,
              weeks_detected: 16,
              original_format: 'text'
            }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)

    const result = await parseSyllabusWithOpenAI(SAMPLE_SYLLABI.withWeeks, mockOpenAI)
    
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4',
        temperature: 0.1,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' })
        ])
      })
    )

    expect(result.course_info.name).toBe('Introduction to Computer Science')
    expect(result.assignments).toHaveLength(3)
    expect(result.assignments[0].week).toBe(3)
    expect(result.metadata.parsing_confidence).toBeGreaterThan(0.9)
  })

  it('should handle mixed date formats correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: {
              name: 'English Composition',
              code: 'ENG 102'
            },
            assignments: [
              { title: 'Essay 1 draft', week: 2, type: 'homework' },
              { title: 'Essay 1 final', specific_date: '2024-09-25', type: 'homework' },
              { title: 'Research proposal', week: 6, type: 'project' },
              { title: 'Research paper', specific_date: '2024-10-30', type: 'project' }
            ],
            metadata: {
              parsing_confidence: 0.88,
              weeks_detected: 12,
              original_format: 'text'
            }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)

    const result = await parseSyllabusWithOpenAI(SAMPLE_SYLLABI.mixedFormat, mockOpenAI)
    
    expect(result.assignments).toHaveLength(4)
    expect(result.assignments[0].week).toBe(2)
    expect(result.assignments[1].specific_date).toBe('2024-09-25')
    expect(result.assignments[2].week).toBe(6)
    expect(result.assignments[3].specific_date).toBe('2024-10-30')
  })

  it('should handle vision API for image processing', async () => {
    const mockImageResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: {
              name: 'Biology 101',
              code: 'BIO 101'
            },
            assignments: [
              { title: 'Lab Report 1', week: 4, type: 'lab' }
            ],
            metadata: {
              parsing_confidence: 0.75,
              weeks_detected: 15,
              original_format: 'image'
            }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockImageResponse as any)

    const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' // Mock base64 image
    const result = await parseImageSyllabusWithOpenAI(imageData, mockOpenAI)

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4-vision-preview',
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({ type: 'text' }),
              expect.objectContaining({ type: 'image_url' })
            ])
          })
        ])
      })
    )

    expect(result.metadata.original_format).toBe('image')
  })
})

describe('Error Handling and Reliability', () => {
  
  it('should handle rate limit errors', async () => {
    const rateLimitError = new Error('Rate limit exceeded')
    rateLimitError.name = 'RateLimitError'
    
    mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError)

    const result = await parseSyllabusWithRetry(SAMPLE_SYLLABI.withWeeks, mockOpenAI)
    
    expect(result.error).toBeDefined()
    expect(result.error?.type).toBe('rate_limit')
    expect(result.error?.retryAfter).toBeGreaterThan(0)
  })

  it('should handle authentication errors', async () => {
    const authError = new Error('Incorrect API key')
    authError.name = 'AuthenticationError'
    
    mockOpenAI.chat.completions.create.mockRejectedValue(authError)

    const result = await parseSyllabusWithRetry(SAMPLE_SYLLABI.withWeeks, mockOpenAI)
    
    expect(result.error).toBeDefined()
    expect(result.error?.type).toBe('auth_error')
  })

  it('should handle malformed JSON responses', async () => {
    const malformedResponse = {
      choices: [{
        message: {
          content: 'This is not valid JSON content'
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(malformedResponse as any)

    const result = await parseSyllabusWithOpenAI(SAMPLE_SYLLABI.withWeeks, mockOpenAI)
    
    expect(result.error).toBeDefined()
    expect(result.error?.type).toBe('parsing_error')
  })

  it('should retry failed requests with exponential backoff', async () => {
    const networkError = new Error('Network timeout')
    
    mockOpenAI.chat.completions.create
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              course_info: { name: 'Test Course' },
              assignments: [],
              metadata: { parsing_confidence: 0.8, weeks_detected: 0, original_format: 'text' }
            })
          }
        }]
      } as any)

    const result = await parseSyllabusWithRetry(SAMPLE_SYLLABI.withWeeks, mockOpenAI, 3)
    
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3)
    expect(result.course_info.name).toBe('Test Course')
  })

  it('should validate response structure before returning', async () => {
    const incompleteResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: { name: 'Test Course' },
            // Missing assignments and metadata
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(incompleteResponse as any)

    const result = await parseSyllabusWithOpenAI(SAMPLE_SYLLABI.withWeeks, mockOpenAI)
    
    expect(result.error).toBeDefined()
    expect(result.error?.message).toContain('Invalid response structure')
  })
})

describe('Data Quality and Validation', () => {
  
  it('should validate course information completeness', () => {
    const courseInfo = {
      name: 'Introduction to Computer Science',
      code: 'CS 101',
      instructor: 'Dr. Jane Smith'
    }

    const validation = validateCourseInfo(courseInfo)
    
    expect(validation.isValid).toBe(true)
    expect(validation.completeness).toBeGreaterThan(0.8)
  })

  it('should validate assignment data quality', () => {
    const assignments = [
      { title: 'Assignment 1', week: 3, type: 'homework' as const },
      { title: 'Midterm Exam', week: 7, type: 'exam' as const },
      { title: 'Final Project', week: 12, type: 'project' as const }
    ]

    assignments.forEach(assignment => {
      const validation = validateAssignment(assignment)
      
      expect(validation.isValid).toBe(true)
      expect(assignment.title.length).toBeGreaterThan(3)
      expect(assignment.week).toBeGreaterThan(0)
      expect(assignment.week).toBeLessThanOrEqual(16)
    })
  })

  it('should detect and handle low confidence parsing', () => {
    const lowConfidenceResult = {
      course_info: { name: 'Unknown Course' },
      assignments: [],
      metadata: {
        parsing_confidence: 0.4,
        weeks_detected: 0,
        original_format: 'text',
        warnings: ['Low confidence parsing', 'Unclear document structure']
      }
    }

    const shouldRetry = shouldRetryParsing(lowConfidenceResult)
    expect(shouldRetry).toBe(true)
    expect(lowConfidenceResult.metadata.warnings).toContain('Low confidence parsing')
  })

  it('should validate week number consistency', () => {
    const assignments = [
      { title: 'Assignment 1', week: 3, type: 'homework' as const },
      { title: 'Assignment 2', week: 25, type: 'homework' as const }, // Invalid week
      { title: 'Assignment 3', week: -1, type: 'homework' as const }   // Invalid week
    ]

    const validation = validateWeekNumbers(assignments, 16) // 16-week semester
    
    expect(validation.validAssignments).toHaveLength(1)
    expect(validation.invalidAssignments).toHaveLength(2)
    expect(validation.errors).toContain('Week 25 exceeds semester length')
    expect(validation.errors).toContain('Week -1 is invalid')
  })
})

describe('Week-to-Date Conversion (Unique Feature)', () => {
  
  it('should convert week numbers to actual dates', () => {
    const semesterStart = '2024-09-01' // Sunday
    const assignments = [
      { title: 'Assignment 1', week: 1, type: 'homework' as const },
      { title: 'Assignment 2', week: 3, type: 'homework' as const },
      { title: 'Assignment 3', week: 8, type: 'homework' as const }
    ]

    const convertedAssignments = convertWeeksToDate(assignments, semesterStart)
    
    expect(convertedAssignments[0].due_date).toBe('2024-09-01') // Week 1 = semester start
    expect(convertedAssignments[1].due_date).toBe('2024-09-15') // Week 3 = start + 14 days
    expect(convertedAssignments[2].due_date).toBe('2024-10-20') // Week 8 = start + 49 days
  })

  it('should handle different semester start days', () => {
    const mondayStart = '2024-09-02' // Monday
    const assignments = [{ title: 'Test', week: 2, type: 'homework' as const }]

    const converted = convertWeeksToDate(assignments[0], mondayStart)
    
    expect(converted.due_date).toBe('2024-09-09') // Week 2 from Monday start
  })

  it('should preserve specific dates when provided', () => {
    const assignments = [
      { title: 'Assignment 1', week: 3, type: 'homework' as const },
      { title: 'Assignment 2', specific_date: '2024-10-15', type: 'homework' as const }
    ]

    const semesterStart = '2024-09-01'
    const converted = convertWeeksToDate(assignments[1], semesterStart)
    
    expect(converted.due_date).toBe('2024-10-15') // Should preserve specific date
  })

  it('should handle end-of-semester edge cases', () => {
    const semesterStart = '2024-09-01'
    const semesterEnd = '2024-12-15'
    const assignment = { title: 'Final Project', week: 20, type: 'project' as const } // Beyond semester

    const validation = validateWeekAgainstSemester(assignment, semesterStart, semesterEnd)
    
    expect(validation.isValid).toBe(false)
    expect(validation.adjustedWeek).toBeLessThanOrEqual(16)
  })
})

describe('Cost Estimation and Optimization', () => {
  
  it('should estimate API costs accurately', () => {
    const textInput = 'A'.repeat(1000) // 1000 characters ≈ 250 tokens
    const expectedTokens = Math.ceil(textInput.length / 4) // Rough token estimation
    
    const cost = estimateOpenAICost(textInput, 'gpt-4')
    
    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(1) // Should be less than $1 for reasonable input
  })

  it('should optimize prompts for token efficiency', () => {
    const originalPrompt = generateSystemPrompt()
    const optimizedPrompt = optimizePromptForTokens(originalPrompt)
    
    expect(optimizedPrompt.length).toBeLessThanOrEqual(originalPrompt.length)
    expect(optimizedPrompt).toContain('syllabus') // Key terms preserved
    expect(optimizedPrompt).toContain('JSON') // Key terms preserved
  })

  it('should choose appropriate model based on complexity', () => {
    const simpleText = 'CS 101 - Assignment due week 3'
    const complexText = SAMPLE_SYLLABI.multipleCourses
    
    const simpleModel = chooseOptimalModel(simpleText)
    const complexModel = chooseOptimalModel(complexText)
    
    expect(simpleModel).toBe('gpt-3.5-turbo') // Cheaper for simple content
    expect(complexModel).toBe('gpt-4') // More capable for complex content
  })
})

describe('Integration Testing Scenarios', () => {
  
  it('should handle complete end-to-end parsing workflow', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: {
              name: 'Introduction to Computer Science',
              code: 'CS 101',
              instructor: 'Dr. Jane Smith'
            },
            assignments: [
              { title: 'Assignment 1', week: 3, type: 'homework' },
              { title: 'Midterm Exam', week: 7, type: 'exam' },
              { title: 'Final Project', week: 12, type: 'project' }
            ],
            metadata: {
              parsing_confidence: 0.92,
              weeks_detected: 16,
              original_format: 'text'
            }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)

    const semesterStart = '2024-09-01'
    const result = await processFullSyllabus(SAMPLE_SYLLABI.withWeeks, semesterStart, mockOpenAI)
    
    expect(result.success).toBe(true)
    expect(result.course).toBeDefined()
    expect(result.assignments).toHaveLength(3)
    expect(result.assignments?.[0].due_date).toBeTruthy() // Converted to actual date
    expect(result.cost).toBeGreaterThan(0)
  })

  it('should handle real-world messy syllabi', async () => {
    const messySyllabus = `
      cS   101    -   intro TO programming!!!
      
      prof smith (office hrs: tbd)
      
      assignments:
      - hw1 (week three) - basic stuff
      - MIDTERM EXAM!!! - week 7 or 8 maybe?
      - final project - due end of semester
      
      other stuff:
      participation matters
      no late submissions
    `

    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            course_info: {
              name: 'Introduction to Programming',
              code: 'CS 101',
              instructor: 'Prof Smith'
            },
            assignments: [
              { title: 'Homework 1', week: 3, type: 'homework' },
              { title: 'Midterm Exam', week: 7, type: 'exam' },
              { title: 'Final Project', week: 16, type: 'project' }
            ],
            metadata: {
              parsing_confidence: 0.75,
              weeks_detected: 16,
              original_format: 'text',
              warnings: ['Unclear formatting', 'Ambiguous due dates']
            }
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any)

    const result = await parseSyllabusWithOpenAI(messySyllabus, mockOpenAI)
    
    expect(result.course_info.name).toBe('Introduction to Programming')
    expect(result.metadata.parsing_confidence).toBeGreaterThan(0.7)
    expect(result.metadata.warnings).toContain('Unclear formatting')
  })
})

// Helper function implementations
function validateOpenAIConfig(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required')
  }
}

async function validateModel(model: string): Promise<boolean> {
  // Mock implementation - in real code, check with OpenAI API
  const supportedModels = ['gpt-4', 'gpt-4-vision-preview', 'gpt-3.5-turbo']
  return supportedModels.includes(model)
}

function generateSystemPrompt(): string {
  return `You are a syllabus parsing assistant. Extract structured data from academic syllabi and return it as JSON.

Your task is to identify:
1. Course information (name, code, instructor)
2. Assignments with week numbers or specific dates
3. Assignment types (homework, exam, project, quiz, reading, lab)

IMPORTANT: Week-to-date conversion is a key feature. When you see "Week 3", "Week 7", etc., preserve the week number. The system will convert these to actual dates based on the semester start date.

Return JSON in this exact format:
{
  "course_info": {
    "name": "string",
    "code": "string",
    "instructor": "string"
  },
  "assignments": [
    {
      "title": "string",
      "week": number,
      "specific_date": "YYYY-MM-DD",
      "type": "homework|exam|project|quiz|reading|lab",
      "description": "string"
    }
  ],
  "metadata": {
    "parsing_confidence": number,
    "weeks_detected": number,
    "original_format": "text|pdf|image"
  }
}`
}

async function parseSyllabusWithOpenAI(text: string, openai: OpenAI): Promise<ParsedSyllabusResponse & { error?: OpenAIError }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: generateSystemPrompt() },
        { role: 'user', content: text }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    const parsed = JSON.parse(content)
    
    // Validate response structure
    if (!parsed.course_info || !parsed.assignments || !parsed.metadata) {
      throw new Error('Invalid response structure')
    }

    return parsed
  } catch (error) {
    return {
      course_info: { name: '' },
      assignments: [],
      metadata: { parsing_confidence: 0, weeks_detected: 0, original_format: 'text' },
      error: {
        type: 'parsing_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

async function parseImageSyllabusWithOpenAI(imageData: string, openai: OpenAI): Promise<ParsedSyllabusResponse> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: generateSystemPrompt() },
        { type: 'image_url', image_url: { url: imageData } }
      ]
    }]
  })

  return JSON.parse(response.choices[0]?.message?.content || '{}')
}

async function parseSyllabusWithRetry(text: string, openai: OpenAI, maxRetries: number = 3): Promise<ParsedSyllabusResponse & { error?: OpenAIError }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await parseSyllabusWithOpenAI(text, openai)
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          course_info: { name: '' },
          assignments: [],
          metadata: { parsing_confidence: 0, weeks_detected: 0, original_format: 'text' },
          error: {
            type: 'api_error',
            message: error instanceof Error ? error.message : 'Max retries exceeded',
            retryAfter: Math.pow(2, attempt) * 1000
          }
        }
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected code path')
}

function validateCourseInfo(courseInfo: any): { isValid: boolean; completeness: number } {
  const fields = ['name', 'code', 'instructor']
  const presentFields = fields.filter(field => courseInfo[field] && courseInfo[field].length > 0)
  
  return {
    isValid: presentFields.length >= 1, // At least name is required
    completeness: presentFields.length / fields.length
  }
}

function validateAssignment(assignment: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!assignment.title || assignment.title.length < 3) {
    errors.push('Assignment title is too short')
  }
  
  if (!assignment.week && !assignment.specific_date) {
    errors.push('Assignment must have either week number or specific date')
  }
  
  if (assignment.week && (assignment.week < 1 || assignment.week > 20)) {
    errors.push('Week number must be between 1 and 20')
  }
  
  const validTypes = ['homework', 'exam', 'project', 'quiz', 'reading', 'lab']
  if (!validTypes.includes(assignment.type)) {
    errors.push(`Invalid assignment type: ${assignment.type}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

function shouldRetryParsing(result: ParsedSyllabusResponse): boolean {
  return result.metadata.parsing_confidence < 0.7 || result.assignments.length === 0
}

function validateWeekNumbers(assignments: any[], semesterLength: number): { validAssignments: any[]; invalidAssignments: any[]; errors: string[] } {
  const valid: any[] = []
  const invalid: any[] = []
  const errors: string[] = []
  
  assignments.forEach(assignment => {
    if (assignment.week) {
      if (assignment.week < 1) {
        invalid.push(assignment)
        errors.push(`Week ${assignment.week} is invalid`)
      } else if (assignment.week > semesterLength) {
        invalid.push(assignment)
        errors.push(`Week ${assignment.week} exceeds semester length`)
      } else {
        valid.push(assignment)
      }
    } else {
      valid.push(assignment) // Assignments with specific dates are valid
    }
  })
  
  return { validAssignments: valid, invalidAssignments: invalid, errors }
}

function convertWeeksToDate(assignment: any, semesterStart: string): any {
  if (assignment.specific_date) {
    return { ...assignment, due_date: assignment.specific_date }
  }
  
  if (assignment.week) {
    const startDate = new Date(semesterStart)
    const daysToAdd = (assignment.week - 1) * 7
    const dueDate = new Date(startDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
    return { ...assignment, due_date: dueDate.toISOString().split('T')[0] }
  }
  
  return assignment
}

function convertWeeksToDateArray(assignments: any[], semesterStart: string): any[] {
  return assignments.map(assignment => convertWeeksToDate(assignment, semesterStart))
}

function validateWeekAgainstSemester(assignment: any, semesterStart: string, semesterEnd: string): { isValid: boolean; adjustedWeek?: number } {
  if (!assignment.week) return { isValid: true }
  
  const startDate = new Date(semesterStart)
  const endDate = new Date(semesterEnd)
  const semesterDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const maxWeeks = Math.ceil(semesterDays / 7)
  
  if (assignment.week > maxWeeks) {
    return { isValid: false, adjustedWeek: maxWeeks }
  }
  
  return { isValid: true }
}

function estimateOpenAICost(text: string, model: string): number {
  const estimatedTokens = Math.ceil(text.length / 4) // Rough estimation
  const pricePerThousandTokens = model === 'gpt-4' ? 0.03 : 0.001
  return (estimatedTokens / 1000) * pricePerThousandTokens
}

function optimizePromptForTokens(prompt: string): string {
  return prompt
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim()
}

function chooseOptimalModel(text: string): string {
  const complexity = text.length + (text.match(/\n/g) || []).length
  return complexity > 500 ? 'gpt-4' : 'gpt-3.5-turbo'
}

async function processFullSyllabus(text: string, semesterStart: string, openai: OpenAI): Promise<{
  success: boolean;
  course?: any;
  assignments?: any[];
  cost?: number;
  error?: string;
}> {
  try {
    const parsed = await parseSyllabusWithOpenAI(text, openai)
    if (parsed.error) {
      return { success: false, error: parsed.error.message }
    }
    
    const assignments = convertWeeksToDateArray(parsed.assignments, semesterStart)
    const cost = estimateOpenAICost(text, 'gpt-4')
    
    return {
      success: true,
      course: parsed.course_info,
      assignments,
      cost
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export {
  generateSystemPrompt,
  parseSyllabusWithOpenAI,
  parseImageSyllabusWithOpenAI,
  parseSyllabusWithRetry,
  validateCourseInfo,
  validateAssignment,
  convertWeeksToDate,
  estimateOpenAICost,
  type ParsedSyllabusResponse,
  type OpenAIError
}