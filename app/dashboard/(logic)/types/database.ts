// types/database.ts

// Core database table interfaces
export interface Semester {
    id: string
    user_id: string
    name: string
    start_date: string // ISO date string
    end_date: string   // ISO date string
    created_at: string // ISO timestamp string
  }
  
  export interface Course {
    id: string
    semester_id: string
    name: string
    code: string | null
    location: string | null
    color: string
    created_at: string
  }
  
  export interface Assignment {
    id: string
    course_id: string
    title: string
    description: string | null
    due_date: string // ISO timestamp string
    assignment_type: string
    completed: boolean
    created_at: string
  }
  
  export interface SyllabusUpload {
    id: string
    course_id: string
    filename: string
    parsed_data: ParsedSyllabusData
    processing_status: ProcessingStatus
    upload_date: string
  }
  
  // Parsed syllabus data structure (for JSONB field)
  export interface ParsedSyllabusData {
    assignments: ParsedAssignment[]
    course_info?: {
      instructor?: string
      office_hours?: string
      description?: string
    }
    metadata?: {
      parsing_confidence?: number
      weeks_detected?: number
      original_format?: string
    }
  }
  
  export interface ParsedAssignment {
    title: string
    week?: number          // Week number (your unique feature!)
    specific_date?: string // If actual date was found
    type: AssignmentType
    description?: string
    points?: number
  }
  
  // Enums and union types
  export type AssignmentType = 'homework' | 'exam' | 'project' | 'quiz' | 'reading' | 'lab' | 'discussion'
  
  export type ProcessingStatus = 'processing' | 'completed' | 'failed' | 'pending'
  
  // Insert types (for creating new records - excludes auto-generated fields)
  export interface SemesterInsert {
    user_id: string
    name: string
    start_date: string
    end_date: string
  }
  
  export interface CourseInsert {
    semester_id: string
    name: string
    code?: string
    location?: string
    color?: string
  }
  
  export interface AssignmentInsert {
    course_id: string
    title: string
    description?: string
    due_date: string
    assignment_type?: AssignmentType
    completed?: boolean
  }
  
  export interface SyllabusUploadInsert {
    course_id: string
    filename: string
    parsed_data: ParsedSyllabusData
    processing_status?: ProcessingStatus
  }
  
  // Update types (partial updates)
  export type SemesterUpdate = Partial<Omit<Semester, 'id' | 'user_id' | 'created_at'>>
  export type CourseUpdate = Partial<Omit<Course, 'id' | 'semester_id' | 'created_at'>>
  export type AssignmentUpdate = Partial<Omit<Assignment, 'id' | 'course_id' | 'created_at'>>
  export type SyllabusUploadUpdate = Partial<Omit<SyllabusUpload, 'id' | 'course_id' | 'upload_date'>>
  
  // API response types
  export interface ApiResponse<T> {
    data: T | null
    error: string | null
    success: boolean
  }
  
  export interface ApiError {
    message: string
    code?: string
    details?: any
  }
  
  // Supabase query result types
  export interface SupabaseResponse<T> {
    data: T[] | null
    error: any
    count?: number
  }
  
  // Extended types with relations (for joined queries)
  export interface CourseWithSemester extends Course {
    semester: Semester
  }
  
  export interface AssignmentWithCourse extends Assignment {
    course: Course
  }
  
  export interface AssignmentWithCourseAndSemester extends Assignment {
    course: CourseWithSemester
  }
  
  export interface SyllabusUploadWithCourse extends SyllabusUpload {
    course: Course
  }
  
  // Form validation types
  export interface SemesterFormData {
    name: string
    start_date: Date
    end_date: Date
  }
  
  export interface CourseFormData {
    name: string
    code: string
    location: string
    color: string
  }
  
  export interface AssignmentFormData {
    title: string
    description: string
    due_date: Date
    assignment_type: AssignmentType
  }
  
  // Dashboard data types
  export interface DashboardStats {
    total_courses: number
    total_assignments: number
    completed_assignments: number
    upcoming_assignments: number
    overdue_assignments: number
  }
  
  export interface UpcomingAssignment {
    id: string
    title: string
    due_date: string
    course_name: string
    course_code: string | null
    assignment_type: AssignmentType
    days_until_due: number
  }
  
  // Week calculation types (for your unique feature)
  export interface WeekCalculation {
    week_number: number
    start_date: string
    end_date: string
    assignments: ParsedAssignment[]
  }
  
  export interface SemesterWeeks {
    semester_id: string
    weeks: WeekCalculation[]
    total_weeks: number
  }
  
  // Calendar export types
  export interface CalendarEvent {
    title: string
    start: string
    end: string
    description?: string
    location?: string
    category: 'assignment' | 'exam' | 'class'
  }
  
  export interface ExportOptions {
    include_completed: boolean
    include_assignments: boolean
    include_exams: boolean
    date_range?: {
      start: string
      end: string
    }
  }
  
  // File upload types
  export interface FileUploadProgress {
    file: File
    progress: number
    status: 'uploading' | 'processing' | 'completed' | 'error'
    error?: string
  }
  
  // Utility types
  export type DatabaseTables = 'semesters' | 'courses' | 'assignments' | 'syllabus_uploads'
  
  export type SelectFields<T> = {
    [K in keyof T]?: boolean
  }
  
  // Type guards
  export function isParsedAssignment(obj: any): obj is ParsedAssignment {
    return typeof obj === 'object' && 
           typeof obj.title === 'string' && 
           (typeof obj.week === 'number' || typeof obj.specific_date === 'string')
  }
  
  export function isValidProcessingStatus(status: string): status is ProcessingStatus {
    return ['processing', 'completed', 'failed', 'pending'].includes(status)
  }
  
  export function isValidAssignmentType(type: string): type is AssignmentType {
    return ['homework', 'exam', 'project', 'quiz', 'reading', 'lab', 'discussion'].includes(type)
  }