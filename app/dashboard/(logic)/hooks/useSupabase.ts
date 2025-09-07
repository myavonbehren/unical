// hooks/useSupabase.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

import type {
  Semester,
  Course,
  Assignment,
  SyllabusUpload,
  SemesterInsert,
  CourseInsert,
  AssignmentInsert,
  SyllabusUploadInsert,
  SemesterUpdate,
  CourseUpdate,
  AssignmentUpdate,
  ParsedAssignment,
  WeekCalculation
} from '@/app/(dashboard)/(logic)/types/database'

const supabase = createClient()

// Generic hook for database operations with authentication
function useSupabaseQuery<T>() {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = (error: any) => {
    // Only log errors in development, never expose internal details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Database operation failed:', error)
    }
    
    // Return generic error messages to prevent information leakage
    const userMessage = error?.message?.includes('permission denied') 
      ? 'You do not have permission to perform this action'
      : 'An error occurred. Please try again.'
    
    setError(userMessage)
    setLoading(false)
  }

  const clearError = () => setError(null)

  // Check if user is authenticated
  const checkAuth = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to perform this action')
      return null
    }
    return user.id
  }

  return { data, setData, loading, setLoading, error, handleError, clearError, checkAuth }
}

// Semester hooks
export function useSemesters() {
  const { data: semesters, setData: setSemesters, loading, setLoading, error, handleError, clearError, checkAuth } = useSupabaseQuery<Semester>()

  const fetchSemesters = async () => {
    const userId = await checkAuth()
    if (!userId) return

    setLoading(true)
    clearError()
    
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', userId) // Filter by authenticated user
        .order('start_date', { ascending: false })

      if (error) throw error
      setSemesters(data || [])
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const createSemester = async (semesterData: SemesterInsert): Promise<Semester | null> => {
    const userId = await checkAuth()
    if (!userId) return null

    setLoading(true)
    clearError()

    try {
      // Ensure user_id is set to authenticated user
      const secureData = { ...semesterData, user_id: userId }
      
      const { data, error } = await supabase
        .from('semesters')
        .insert(secureData)
        .select()
        .single()

      if (error) throw error
      
      // Optimistic update
      setSemesters(prev => [data, ...prev])
      return data
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateSemester = async (id: string, updates: SemesterUpdate): Promise<boolean> => {
    const userId = await checkAuth()
    if (!userId) return false

    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('semesters')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only update their own data

      if (error) throw error

      // Optimistic update
      setSemesters(prev => prev.map(semester => 
        semester.id === id ? { ...semester, ...updates } : semester
      ))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteSemester = async (id: string): Promise<boolean> => {
    const userId = await checkAuth()
    if (!userId) return false

    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only delete their own data

      if (error) throw error

      // Optimistic update
      setSemesters(prev => prev.filter(semester => semester.id !== id))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    semesters,
    loading,
    error,
    fetchSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    clearError
  }
}

// Course hooks
export function useCourses(semesterId?: string) {
  const { data: courses, setData: setCourses, loading, setLoading, error, handleError, clearError, checkAuth } = useSupabaseQuery<Course>()

  const fetchCourses = async () => {
    const userId = await checkAuth()
    if (!userId) return

    setLoading(true)
    clearError()

    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          semester:semesters!inner(user_id)
        `)
        .eq('semester.user_id', userId) // Only fetch courses for user's semesters
      
      if (semesterId) {
        query = query.eq('semester_id', semesterId)
      }

      const { data, error } = await query.order('name')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async (courseData: CourseInsert): Promise<Course | null> => {
    const userId = await checkAuth()
    if (!userId) return null

    setLoading(true)
    clearError()

    try {
      // Verify semester belongs to user before creating course
      const { data: semester } = await supabase
        .from('semesters')
        .select('id')
        .eq('id', courseData.semester_id)
        .eq('user_id', userId)
        .single()

      if (!semester) {
        handleError(new Error('Invalid semester'))
        return null
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      if (error) throw error

      setCourses(prev => [...prev, data])
      return data
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateCourse = async (id: string, updates: CourseUpdate): Promise<boolean> => {
    const userId = await checkAuth()
    if (!userId) return false

    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .eq('semester_id', supabase.from('semesters').select('id').eq('user_id', userId))

      if (error) throw error

      setCourses(prev => prev.map(course => 
        course.id === id ? { ...course, ...updates } : course
      ))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (id: string): Promise<boolean> => {
    const userId = await checkAuth()
    if (!userId) return false

    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('semester_id', supabase.from('semesters').select('id').eq('user_id', userId))

      if (error) throw error

      setCourses(prev => prev.filter(course => course.id !== id))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    clearError
  }
}

// Assignment hooks
export function useAssignments(courseId?: string) {
  const { data: assignments, setData: setAssignments, loading, setLoading, error, handleError, clearError, checkAuth } = useSupabaseQuery<Assignment>()

  const fetchAssignments = async () => {
    const userId = await checkAuth()
    if (!userId) return

    setLoading(true)
    clearError()

    try {
      let query = supabase.from('assignments').select(`
        *,
        course:courses!inner(
          name, code, color,
          semester:semesters!inner(user_id)
        )
      `).eq('course.semester.user_id', userId)
      
      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query.order('due_date')

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (assignmentData: AssignmentInsert): Promise<Assignment | null> => {
    const userId = await checkAuth()
    if (!userId) return null

    setLoading(true)
    clearError()

    try {
      // Verify course belongs to user
      const { data: course } = await supabase
        .from('courses')
        .select('id, semester:semesters!inner(user_id)')
        .eq('id', assignmentData.course_id)
        .eq('semester.user_id', userId)
        .single()

      if (!course) {
        handleError(new Error('Invalid course'))
        return null
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single()

      if (error) throw error

      setAssignments(prev => [...prev, data])
      return data
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateAssignment = async (id: string, updates: AssignmentUpdate): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, ...updates } : assignment
      ))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const toggleAssignmentComplete = async (id: string): Promise<boolean> => {
    const assignment = assignments.find(a => a.id === id)
    if (!assignment) return false

    return updateAssignment(id, { completed: !assignment.completed })
  }

  const deleteAssignment = async (id: string): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAssignments(prev => prev.filter(assignment => assignment.id !== id))
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    toggleAssignmentComplete,
    deleteAssignment,
    clearError
  }
}

// Syllabus upload hooks
export function useSyllabusUploads(courseId?: string) {
  const { data: uploads, setData: setUploads, loading, setLoading, error, handleError, clearError, checkAuth } = useSupabaseQuery<SyllabusUpload>()

  const fetchUploads = async () => {
    setLoading(true)
    clearError()

    try {
      let query = supabase.from('syllabus_uploads').select(`
        *,
        course:courses(name, code)
      `)
      
      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query.order('upload_date', { ascending: false })

      if (error) throw error
      setUploads(data || [])
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const createUpload = async (uploadData: SyllabusUploadInsert): Promise<SyllabusUpload | null> => {
    setLoading(true)
    clearError()

    try {
      const { data, error } = await supabase
        .from('syllabus_uploads')
        .insert(uploadData)
        .select()
        .single()

      if (error) throw error

      setUploads(prev => [data, ...prev])
      return data
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    uploads,
    loading,
    error,
    fetchUploads,
    createUpload,
    clearError
  }
}

// Week calculation hook (your unique feature!)
export function useWeekCalculation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateWeekDate = (weekNumber: number, semesterStart: string): string => {
    const startDate = new Date(semesterStart)
    const daysToAdd = (weekNumber - 1) * 7
    const weekDate = new Date(startDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
    return weekDate.toISOString()
  }

  const convertWeekAssignmentsToDates = async (
    parsedData: { assignments: ParsedAssignment[] },
    semesterStart: string
  ): Promise<AssignmentInsert[]> => {
    setLoading(true)
    setError(null)

    try {
      const assignments: AssignmentInsert[] = []

      for (const parsedAssignment of parsedData.assignments) {
        let dueDate: string

        if (parsedAssignment.specific_date) {
          // Use specific date if provided
          dueDate = parsedAssignment.specific_date
        } else if (parsedAssignment.week) {
          // Convert week number to actual date (your unique feature!)
          dueDate = calculateWeekDate(parsedAssignment.week, semesterStart)
        } else {
          // Skip assignments without date info
          continue
        }

        assignments.push({
          course_id: '', // Will be set by caller
          title: parsedAssignment.title,
          description: parsedAssignment.description || undefined,
          due_date: dueDate,
          assignment_type: parsedAssignment.type,
          completed: false
        })
      }

      return assignments
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Week calculation failed')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getSemesterWeeks = (semesterStart: string, semesterEnd: string): WeekCalculation[] => {
    const start = new Date(semesterStart)
    const end = new Date(semesterEnd)
    const weeks: WeekCalculation[] = []
    
    let currentWeek = 1
    let currentDate = new Date(start)

    while (currentDate <= end) {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)

      weeks.push({
        week_number: currentWeek,
        start_date: currentDate.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
        assignments: []
      })

      currentDate.setDate(currentDate.getDate() + 7)
      currentWeek++
    }

    return weeks
  }

  return {
    loading,
    error,
    calculateWeekDate,
    convertWeekAssignmentsToDates,
    getSemesterWeeks
  }
}

// Utility hook for getting current user with proper typing
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}