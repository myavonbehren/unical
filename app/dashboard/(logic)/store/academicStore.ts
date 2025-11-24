import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Semester, Course, SemesterUpdate, CourseUpdate, SemesterInsert, CourseInsert } from '../types/database'

const supabase = createClient()

interface AcademicStore {
  semesters: Semester[]
  courses: Course[]
  loading: boolean
  error: string | null

  // Simple state setters
  setSemesters: (semesters: Semester[]) => void
  setCourses: (courses: Course[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Semester operations
  addSemester: (semester: Semester) => void
  updateSemester: (id: string, updates: SemesterUpdate) => void
  deleteSemester: (id: string) => void

  // Course operations
  addCourse: (course: Course) => void
  updateCourse: (id: string, updates: CourseUpdate) => void
  deleteCourse: (id: string) => void

  // Utility methods
  getCoursesForSemester: (semesterId: string) => Course[]

  // Supabase sync methods
  fetchSemesters: () => Promise<void>
  createSemester: (semesterData: SemesterInsert) => Promise<Semester | null>
  updateSemesterInDB: (id: string, updates: SemesterUpdate) => Promise<boolean>
  deleteSemesterFromDB: (id: string) => Promise<boolean>
  
  fetchCourses: (semesterId?: string) => Promise<void>
  createCourse: (courseData: CourseInsert) => Promise<Course | null>
  updateCourseInDB: (id: string, updates: CourseUpdate) => Promise<boolean>
  deleteCourseFromDB: (id: string) => Promise<boolean>
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
  semesters: [],
  courses: [],
  loading: false,
  error: null,

  // Simple state setters
  setSemesters: (semesters) => set({ semesters }),
  setCourses: (courses) => set({ courses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Local state operations (optimistic updates)
  addSemester: (semester) => set((state) => ({ semesters: [...state.semesters, semester] })),
  updateSemester: (id, updates) => set((state) => ({ semesters: state.semesters.map((s) => s.id === id ? { ...s, ...updates } : s) })),
  deleteSemester: (id) => set((state) => ({ semesters: state.semesters.filter((s) => s.id !== id) })),

  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  updateCourse: (id, updates) => set((state) => ({ courses: state.courses.map((c) => c.id === id ? { ...c, ...updates } : c) })),
  deleteCourse: (id) => set((state) => ({ courses: state.courses.filter((c) => c.id !== id) })),

  // Utility methods
  getCoursesForSemester: (semesterId: string) => get().courses.filter((c) => c.semester_id === semesterId),

  // Supabase sync methods
  fetchSemesters: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (error) throw error
      set({ semesters: data || [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch semesters', loading: false })
    }
  },

  createSemester: async (semesterData: SemesterInsert) => {
    set({ loading: true, error: null })
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('semesters')
        .insert([{ ...semesterData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      get().addSemester(data)
      set({ loading: false })
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create semester', loading: false })
      return null
    }
  },

  updateSemesterInDB: async (id: string, updates: SemesterUpdate) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('semesters')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      get().updateSemester(id, updates)
      set({ loading: false })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update semester', loading: false })
      return false
    }
  },

  deleteSemesterFromDB: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id)

      if (error) throw error
      get().deleteSemester(id)
      set({ loading: false })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete semester', loading: false })
      return false
    }
  },
  
  fetchCourses: async (semesterId?: string) => {
    set({ loading: true, error: null })
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      let query = supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)

      if (semesterId) {
        query = query.eq('semester_id', semesterId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      set({ courses: data || [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch courses', loading: false })
    }
  },

  createCourse: async (courseData: CourseInsert) => {
    set({ loading: true, error: null })
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      get().addCourse(data)
      set({ loading: false })
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create course', loading: false })
      return null
    }
  },

  updateCourseInDB: async (id: string, updates: CourseUpdate) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      get().updateCourse(id, updates)
      set({ loading: false })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update course', loading: false })
      return false
    }
  },

  deleteCourseFromDB: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      get().deleteCourse(id)
      set({ loading: false })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete course', loading: false })
      return false
    }
  }
}))