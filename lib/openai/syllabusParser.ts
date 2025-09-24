// lib/ai/syllabusParser.ts

import type { ProcessedFile } from './fileProcessor'
import { openai } from './client'

// Types for syllabus parsing
export interface ParsedSyllabusData {
  course_info: {
    name: string
    code?: string
    instructor?: string
    semester?: string
    year?: number
    description?: string
  }
  assignments: ParsedAssignment[]
  schedule?: ClassSchedule[]
  metadata: {
    parsing_confidence: number
    weeks_detected: number
    original_format: string
    warnings?: string[]
    processing_time?: number
  }
}

export interface ParsedAssignment {
  title: string
  week?: number
  specific_date?: string
  type: 'homework' | 'exam' | 'project' | 'quiz' | 'reading' | 'lab' | 'discussion'
  description?: string
  points?: number
  percentage?: number
}

export interface ClassSchedule {
  day: string
  start_time: string
  end_time: string
  location?: string
  type?: 'lecture' | 'lab' | 'discussion' | 'office_hours'
}

export interface ParsingError {
  type: 'API_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'PARSING_ERROR' | 'INVALID_RESPONSE'
  message: string
  retryAfter?: number
  details?: any
}

export interface WeekConversionResult {
  assignments: AssignmentWithDate[]
  warnings: string[]
  totalConverted: number
}

export interface AssignmentWithDate {
  title: string
  due_date: string // ISO date string
  original_week?: number
  original_specific_date?: string
  type: ParsedAssignment['type']
  description?: string
  points?: number
}

/**
 * Main function to parse syllabus content with OpenAI
 */
export async function parseSyllabusWithOpenAI(
  processedFile: ProcessedFile,
  options: {
    retryAttempts?: number
    includeSchedule?: boolean
    confidenceThreshold?: number
  } = {}
): Promise<ParsedSyllabusData | { error: ParsingError }> {
  const startTime = Date.now()
  const {
    retryAttempts = 3,
    includeSchedule = false,
    confidenceThreshold = 0.7
  } = options

  try {
    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return {
        error: {
          type: 'AUTH_ERROR',
          message: 'OpenAI API key is not configured'
        }
      }
    }

    let result: ParsedSyllabusData | { error: ParsingError }

    // Route to appropriate parsing method
    if (processedFile.processingMethod === 'vision_api') {
      result = await parseWithVisionAPI(processedFile, retryAttempts)
    } else {
      result = await parseWithTextAPI(processedFile.content, retryAttempts, includeSchedule)
    }

    // Check if parsing was successful
    if ('error' in result) {
      return result
    }

    // Validate parsing confidence
    if (result.metadata.parsing_confidence < confidenceThreshold) {
      result.metadata.warnings = result.metadata.warnings || []
      result.metadata.warnings.push(`Low parsing confidence: ${result.metadata.parsing_confidence.toFixed(2)}`)
    }

    // Add processing time
    result.metadata.processing_time = Date.now() - startTime

    return result

  } catch (error) {
    return {
      error: {
        type: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }
    }
  }
}

/**
 * Parse text-based files using GPT-4
 */
async function parseWithTextAPI(
  text: string,
  retryAttempts: number,
  includeSchedule: boolean
): Promise<ParsedSyllabusData | { error: ParsingError }> {
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const systemPrompt = generateSystemPrompt(includeSchedule)
      const userPrompt = generateUserPrompt(text)

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.1, // Low temperature for consistent parsing
        max_tokens: 1300,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      // DEBUG: Log the raw response
      console.log('=== RAW OPENAI RESPONSE ===')
      console.log(content)
      console.log('=== END RESPONSE ===')

      // Parse JSON response
      let parsedData
      try {
        parsedData = JSON.parse(content)
      } catch (parseError) {
        throw new Error('Invalid response structure: Malformed JSON response')
      }

      
      // DEBUG: Log parsed data structure
      console.log('=== PARSED DATA ===')
      console.log('Course info:', parsedData.course_info)
      console.log('Course name:', parsedData.course_info?.name)
      console.log('=== END PARSED DATA ===')
      
      if (parsedData.course_info) {
        // Convert course_name to name for consistency
        if (parsedData.course_info.course_name && !parsedData.course_info.name) {
          parsedData.course_info.name = parsedData.course_info.course_name
        }
        
        // Convert instructor_name to instructor
        if (parsedData.course_info.instructor_name && !parsedData.course_info.instructor) {
          parsedData.course_info.instructor = parsedData.course_info.instructor_name
        }
        
        // Convert course_code to code
        if (parsedData.course_info.course_code && !parsedData.course_info.code) {
          parsedData.course_info.code = parsedData.course_info.course_code
        }
      }
      
      // Validate response structure
      const validation = validateParsingResponse(parsedData)
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors)
        throw new Error(`Invalid response structure: ${validation.errors.join(', ')}`)
      }

      // Set metadata
      parsedData.metadata.original_format = 'text'
      
      return parsedData

    } catch (error) {
      console.error(`Parse attempt ${attempt} failed:`, error)
      
      // Handle specific OpenAI errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.name === 'RateLimitError') {
          const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff
          if (attempt < retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
          return {
            error: {
              type: 'RATE_LIMIT',
              message: 'OpenAI rate limit exceeded',
              retryAfter: waitTime
            }
          }
        }
        
        if (error.message.includes('API key') || error.name === 'AuthenticationError') {
          return {
            error: {
              type: 'AUTH_ERROR',
              message: 'Invalid OpenAI API key'
            }
          }
        }
      }
      
      // If it's the last attempt, return the error
      if (attempt === retryAttempts) {
        return {
          error: {
            type: 'PARSING_ERROR',
            message: error instanceof Error ? error.message : 'Failed to parse syllabus',
            details: error
          }
        }
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    error: {
      type: 'API_ERROR',
      message: 'Unexpected error in parsing logic'
    }
  }
}

/**
 * Parse image-based files using GPT-4 Vision
 */
async function parseWithVisionAPI(
  processedFile: ProcessedFile,
  retryAttempts: number
): Promise<ParsedSyllabusData | { error: ParsingError }> {
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const systemPrompt = generateSystemPrompt(false) // Vision API prompt

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 3000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${systemPrompt}\n\nPlease analyze this syllabus image and extract the structured information.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: processedFile.content,
                  detail: 'high' // High detail for better text extraction
                }
              }
            ]
          }
        ]
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content received from OpenAI Vision API')
      }

      // Parse JSON response
      let parsedData
      try {
        parsedData = JSON.parse(content)
      } catch (parseError) {
        throw new Error('Invalid response structure: Malformed JSON response')
      }
      
      // Validate response structure
      const validation = validateParsingResponse(parsedData)
      if (!validation.isValid) {
        throw new Error(`Invalid response structure: ${validation.errors.join(', ')}`)
      }

      // Set metadata for image processing
      parsedData.metadata.original_format = 'image'
      parsedData.metadata.warnings = parsedData.metadata.warnings || []
      parsedData.metadata.warnings.push('Parsed from image - accuracy may vary')
      
      return parsedData

    } catch (error) {
      console.error(`Vision API attempt ${attempt} failed:`, error)
      
      if (attempt === retryAttempts) {
        return {
          error: {
            type: 'PARSING_ERROR',
            message: error instanceof Error ? error.message : 'Failed to parse syllabus image',
            details: error
          }
        }
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  return {
    error: {
      type: 'API_ERROR',
      message: 'All vision API attempts failed'
    }
  }
}

/**
 * Generate system prompt for OpenAI (your unique week-parsing innovation!)
 */
function generateSystemPrompt(includeSchedule: boolean = false): string {
  return `You are an expert syllabus parsing assistant. Your job is to extract structured data from academic syllabi and return it as valid JSON.

CRITICAL FEATURE - Week Number Extraction:
When you see assignments, quizzes, readings, or events referenced by week numbers (e.g., "Week 3", "Week 7"), preserve these week numbers exactly. The system will later convert and calculate actual dates from week numbers using the semester start date.

Examples:

* "Week 3: Assignment 1 due" → extract as week: 3
* "Quiz 1 in week 2" → extract as week: 2
* "Midterm exam week 8" → extract as week: 8
* "September 15: Essay due" → extract as specific\_date: "2024-09-15"
* Week 1 - Submit Discussion 1 
* Week Four - Quiz 1

Extract the following information:

1. **COURSE INFORMATION**:

   * Course name (full title)
   * Course code (e.g., "CS 101", "MATH 201")
   * Instructor name
   * Semester/term
   * Course description (if available)

2. **ASSIGNMENTS, QUIZZES, AND READINGS**:
   For each, extract:

   * Title (e.g., “Assignment 1: …”, “Quiz 2”, “Read: Chapter 3”, "Submit Discussion 1")
   * Week number (if mentioned)
   * Specific date (if given instead of week)
   * Type: homework, exam, project, quiz, reading, lab, discussion, deadline
   * Description or details
   * Point value or percentage (if mentioned)

   **Important academic dates** (e.g., “Last day to drop”) should also be included as type: "deadline".

3. **CLASS SCHEDULE (\${includeSchedule ? 'REQUIRED' : 'OPTIONAL'})**:

   * Days of the week
   * Start and end times
   * Location/room
   * Type (lecture, lab, discussion)

ASSIGNMENT TYPES:

* homework: Regular assignments, problem sets, exercises
* exam: Midterms, finals, tests
* project: Long-term projects, presentations
* quiz: Short quizzes, weekly tests
* reading: Required reading assignments
* lab: Laboratory sessions
* discussion: Online or in-class discussions
* deadline: Administrative deadlines (drop/withdraw, etc.)

IMPORTANT PARSING RULES:

1. Always extract **quizzes, readings, and deadlines** just like assignments.
2. If you see "Week X" format, always extract the week number.
3. If you see specific dates, extract them in YYYY-MM-DD format.
4. If unclear, estimate confidence and add warnings.
5. Include ALL identifiable course work, readings, quizzes, and events.
6. Be conservative with assignment types if unsure.

Return ONLY valid JSON in this exact format:

{
  "course_info": { ... },
  "assignments": [
    {
      "title": "string",
      "week": number,
      "specific_date": "YYYY-MM-DD",
      "type": "homework|exam|project|quiz|reading|lab|discussion|deadline",
      "description": "string",
      "points": number
    }
  ],
  ${includeSchedule ? '"schedule": [{"day": "string", "start_time": "HH:MM", "end_time": "HH:MM", "location": "string", "type": "lecture|lab|discussion"}],' : ''}
  "metadata": {
    "parsing_confidence": number,
    "weeks_detected": number,
    "warnings": ["string"]
  }
}

Parsing confidence should be:
- 0.9-1.0: Very clear, well-structured syllabus
- 0.7-0.9: Good structure, minor ambiguities
- 0.5-0.7: Some unclear sections, but extractable
- 0.3-0.5: Poorly structured, many assumptions made
- 0.0-0.3: Very unclear, minimal extraction possible`
}

/**
 * Generate user prompt with the syllabus content
 */
function generateUserPrompt(syllabusText: string): string {
  return `Please analyze this syllabus and extract the structured information according to the system instructions. Focus especially on identifying week numbers and assignment types.

SYLLABUS CONTENT:
${syllabusText}

Remember: Week numbers are crucial - preserve them exactly as mentioned in the syllabus. Return only the JSON response.`
}

/**
 * Validate the structure of OpenAI's parsing response
 */
function validateParsingResponse(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required top-level fields
  if (!data.course_info) errors.push('Missing course_info')
  if (!data.assignments) errors.push('Missing assignments')
  if (!data.metadata) errors.push('Missing metadata')

  // Validate course_info
  if (data.course_info && !data.course_info.name) {
    errors.push('Missing course name')
  }

  // Validate assignments array
  if (data.assignments && Array.isArray(data.assignments)) {
    data.assignments.forEach((assignment: any, index: number) => {
      if (!assignment.title) errors.push(`Assignment ${index}: missing title`)
      if (!assignment.week && !assignment.specific_date) {
        errors.push(`Assignment ${index}: missing week or specific_date`)
      }
      if (!assignment.type) errors.push(`Assignment ${index}: missing type`)
    })
  } else if (data.assignments) {
    errors.push('Assignments must be an array')
  }

  // Validate metadata
  if (data.metadata) {
    if (typeof data.metadata.parsing_confidence !== 'number') {
      errors.push('parsing_confidence must be a number')
    }
    if (typeof data.metadata.weeks_detected !== 'number') {
      errors.push('weeks_detected must be a number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Convert week numbers to actual dates (YOUR UNIQUE FEATURE!)
 */
export function convertWeeksToDate(
  assignments: ParsedAssignment[],
  semesterStart: string
): AssignmentWithDate[] {
  const convertedAssignments: AssignmentWithDate[] = []
  const startDate = new Date(semesterStart)
  
  // Validate semester start date
  if (isNaN(startDate.getTime())) {
    return []
  }

  assignments.forEach((assignment) => {
    let dueDate: string

    if (assignment.specific_date) {
      // Use specific date if provided
      dueDate = assignment.specific_date
    } else if (assignment.week) {
      // Convert week number to actual date (YOUR INNOVATION!)
      const weekStartDate = new Date(startDate)
      const daysToAdd = (assignment.week - 1) * 7
      weekStartDate.setDate(weekStartDate.getDate() + daysToAdd)
      
      dueDate = weekStartDate.toISOString().split('T')[0]
    } else {
      // Use semester start as fallback
      dueDate = semesterStart
    }

    convertedAssignments.push({
      title: assignment.title,
      due_date: dueDate,
      original_week: assignment.week,
      original_specific_date: assignment.specific_date,
      type: assignment.type,
      description: assignment.description,
      points: assignment.points
    })
  })

  return convertedAssignments
}

/**
 * Convert week numbers to actual dates with detailed results (for internal use)
 */
export function convertWeeksToDateWithDetails(
  assignments: ParsedAssignment[],
  semesterStart: string
): WeekConversionResult {
  const convertedAssignments: AssignmentWithDate[] = []
  const warnings: string[] = []
  let totalConverted = 0

  const startDate = new Date(semesterStart)
  
  // Validate semester start date
  if (isNaN(startDate.getTime())) {
    warnings.push('Invalid semester start date provided')
    return { assignments: [], warnings, totalConverted: 0 }
  }

  assignments.forEach((assignment, index) => {
    let dueDate: string

    if (assignment.specific_date) {
      // Use specific date if provided
      dueDate = assignment.specific_date
    } else if (assignment.week) {
      // Convert week number to actual date (YOUR INNOVATION!)
      const weekStartDate = new Date(startDate)
      const daysToAdd = (assignment.week - 1) * 7
      weekStartDate.setDate(weekStartDate.getDate() + daysToAdd)
      
      // Validate week number is reasonable
      if (assignment.week < 1 || assignment.week > 20) {
        warnings.push(`Assignment "${assignment.title}": Week ${assignment.week} seems unusual`)
      }
      
      dueDate = weekStartDate.toISOString().split('T')[0]
      totalConverted++
    } else {
      warnings.push(`Assignment "${assignment.title}": No date information available`)
      // Use semester start as fallback
      dueDate = semesterStart
    }

    convertedAssignments.push({
      title: assignment.title,
      due_date: dueDate,
      original_week: assignment.week,
      original_specific_date: assignment.specific_date,
      type: assignment.type,
      description: assignment.description,
      points: assignment.points
    })
  })

  return {
    assignments: convertedAssignments,
    warnings,
    totalConverted
  }
}

/**
 * Estimate processing cost for OpenAI API calls
 */
export function estimateProcessingCost(
  processedFile: ProcessedFile,
  model: 'gpt-4' | 'gpt-4o-mini' = 'gpt-4'
): number {
  const baseTokens = 1000 // System prompt tokens
  
  if (processedFile.processingMethod === 'vision_api') {
    // Vision API pricing: $0.01 per image
    return 0.01
  } else {
    // Estimate tokens for text content
    const contentTokens = Math.ceil(processedFile.content.length / 4)
    const totalTokens = baseTokens + contentTokens
    
    // GPT-4 pricing: $0.03 per 1K tokens
    return (totalTokens / 1000) * 0.03
  }
}

/**
 * Analyze parsing quality and suggest improvements
 */
export function analyzeParsingQuality(data: ParsedSyllabusData): {
  score: number
  suggestions: string[]
  strengths: string[]
} {
  const suggestions: string[] = []
  const strengths: string[] = []
  let score = 0

  // Check course info completeness (25 points)
  if (data.course_info.name) score += 10
  if (data.course_info.code) score += 5
  if (data.course_info.instructor) score += 5
  if (data.course_info.semester) score += 5

  if (score >= 20) strengths.push('Complete course information')
  else suggestions.push('Consider extracting more course details')

  // Check assignments quality (50 points)
  if (data.assignments.length > 0) {
    score += 20
    strengths.push(`Found ${data.assignments.length} assignments`)
    
    const assignmentsWithDates = data.assignments.filter(a => a.week || a.specific_date)
    if (assignmentsWithDates.length === data.assignments.length) {
      score += 15
      strengths.push('All assignments have date information')
    } else {
      suggestions.push('Some assignments missing date information')
    }
    
    const typedAssignments = data.assignments.filter(a => a.type)
    if (typedAssignments.length === data.assignments.length) {
      score += 15
      strengths.push('All assignments properly categorized')
    } else {
      suggestions.push('Some assignments missing type classification')
    }
  } else {
    suggestions.push('No assignments found - check syllabus format')
  }

  // Check parsing confidence (25 points)
  if (data.metadata.parsing_confidence >= 0.8) {
    score += 25
    strengths.push('High parsing confidence')
  } else if (data.metadata.parsing_confidence >= 0.6) {
    score += 15
    suggestions.push('Moderate parsing confidence - consider manual review')
  } else {
    suggestions.push('Low parsing confidence - manual review recommended')
  }

  return { score, suggestions, strengths }
}

// Helper functions for testing and integration
export function chooseOptimalModel(text: string): string {
  const complexity = text.length + (text.match(/\n/g) || []).length
  return complexity > 200 ? 'gpt-4' : 'gpt-4o-mini'
}

export async function parseSyllabusWithRetry(
  text: string,
  openai: any,
  maxRetries: number = 3
): Promise<ParsedSyllabusData & { error?: ParsingError }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await parseWithTextAPI(text, maxRetries, false)
      if ('error' in result) {
        // Handle returned errors as failures and continue retry
        if (attempt === maxRetries) {
          return {
            course_info: { name: '' },
            assignments: [],
            metadata: { parsing_confidence: 0, weeks_detected: 0, original_format: 'text' },
            error: result.error
          }
        }
        
        // Map error types for retry logic
        if (result.error.type === 'RATE_LIMIT') {
          const waitTime = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        if (result.error.type === 'AUTH_ERROR') {
          return {
            course_info: { name: '' },
            assignments: [],
            metadata: { parsing_confidence: 0, weeks_detected: 0, original_format: 'text' },
            error: {
              type: 'AUTH_ERROR',
              message: 'Invalid OpenAI API key'
            }
          }
        }
        
        // For other errors, continue retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
      }
      
      return result as ParsedSyllabusData
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          course_info: { name: '' },
          assignments: [],
          metadata: { parsing_confidence: 0, weeks_detected: 0, original_format: 'text' },
          error: {
            type: 'API_ERROR',
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

export async function processFullSyllabus(
  text: string,
  semesterStart: string,
  openai: any
): Promise<{
  success: boolean;
  course?: any;
  assignments?: any[];
  cost?: number;
  error?: string;
}> {
  try {
    const parsed = await parseSyllabusWithOpenAI(
      { content: text, processingMethod: 'text' } as any,
      { retryAttempts: 3, includeSchedule: false }
    )
    
    if ('error' in parsed) {
      return { success: false, error: parsed.error.message }
    }
    
    const assignments = convertWeeksToDate(parsed.assignments, semesterStart)
    const cost = estimateProcessingCost(
      { content: text, processingMethod: 'text' } as any,
      'gpt-4'
    )
    
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

// Export for testing
export {
  generateSystemPrompt,
  generateUserPrompt,
  validateParsingResponse,
  parseWithTextAPI,
  parseWithVisionAPI
}