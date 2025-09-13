import { createClient } from '@/lib/supabase/client'
import { useAcademicStore } from './academicStore'
import { useAssignmentStore } from './assignmentStore'
import { useUploadStore } from './uploadStore'
import type { Semester, Course, Assignment, SyllabusUpload } from '../types/database'

const supabase = createClient()

// Store initialization functions
export class StoreInitializer {
  private static instance: StoreInitializer
  private initialized = false

  static getInstance(): StoreInitializer {
    if (!StoreInitializer.instance) {
      StoreInitializer.instance = new StoreInitializer()
    }
    return StoreInitializer.instance
  }

  async initializeStores(): Promise<void> {
    if (this.initialized) return

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication required for store initialization')
        return
      }

      // Initialize all stores in parallel
      await Promise.all([
        this.initializeAcademicStore(user.id),
        this.initializeAssignmentStore(user.id),
        this.initializeUploadStore(user.id)
      ])

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize stores:', error)
    }
  }

  private async initializeAcademicStore(userId: string): Promise<void> {
    try {
      // Fetch semesters
      const { data: semesters, error: semestersError } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })

      if (semestersError) throw semestersError

      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          semester:semesters!inner(user_id)
        `)
        .eq('semester.user_id', userId)
        .order('name')

      if (coursesError) throw coursesError

      // Update the store
      const { setSemesters, setCourses } = useAcademicStore.getState()
      setSemesters(semesters || [])
      setCourses(courses || [])
    } catch (error) {
      console.error('Failed to initialize academic store:', error)
    }
  }

  private async initializeAssignmentStore(userId: string): Promise<void> {
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses!inner(
            name, code, color,
            semester:semesters!inner(user_id)
          )
        `)
        .eq('course.semester.user_id', userId)
        .order('due_date')

      if (error) throw error

      const { setAssignments } = useAssignmentStore.getState()
      setAssignments(assignments || [])
    } catch (error) {
      console.error('Failed to initialize assignment store:', error)
    }
  }

  private async initializeUploadStore(userId: string): Promise<void> {
    try {
      const { data: uploads, error } = await supabase
        .from('syllabus_uploads')
        .select(`
          *,
          course:courses(name, code)
        `)
        .order('upload_date', { ascending: false })

      if (error) throw error

      const { setUploads } = useUploadStore.getState()
      setUploads(uploads || [])
    } catch (error) {
      console.error('Failed to initialize upload store:', error)
    }
  }

  // Method to refresh all stores
  async refreshStores(): Promise<void> {
    this.initialized = false
    await this.initializeStores()
  }

  // Method to refresh specific store
  async refreshAcademicStore(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await this.initializeAcademicStore(user.id)
    }
  }

  async refreshAssignmentStore(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await this.initializeAssignmentStore(user.id)
    }
  }

  async refreshUploadStore(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await this.initializeUploadStore(user.id)
    }
  }

  // Method to refresh stores after specific operations
  async refreshAfterSemesterChange(): Promise<void> {
    // When semesters change, we might need to refresh courses and assignments
    await Promise.all([
      this.refreshAcademicStore(),
      this.refreshAssignmentStore()
    ])
  }

  async refreshAfterCourseChange(): Promise<void> {
    // When courses change, we might need to refresh assignments and uploads
    await Promise.all([
      this.refreshAcademicStore(),
      this.refreshAssignmentStore(),
      this.refreshUploadStore()
    ])
  }
}

// Hook to initialize stores
export function useStoreInitializer() {
  const initializer = StoreInitializer.getInstance()
  
  return {
    initializeStores: () => initializer.initializeStores(),
    refreshStores: () => initializer.refreshStores(),
    refreshAcademicStore: () => initializer.refreshAcademicStore(),
    refreshAssignmentStore: () => initializer.refreshAssignmentStore(),
    refreshUploadStore: () => initializer.refreshUploadStore(),
    refreshAfterSemesterChange: () => initializer.refreshAfterSemesterChange(),
    refreshAfterCourseChange: () => initializer.refreshAfterCourseChange(),
  }
}
