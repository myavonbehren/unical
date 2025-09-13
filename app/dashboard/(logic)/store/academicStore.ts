import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Semester, Course, SemesterUpdate, CourseUpdate, SemesterInsert, CourseInsert } from '../types/database'

const supabase = createClient()

interface AcademicStore {
    semesters: Semester[]
    courses: Course[]
    loading: boolean
    error: string | null

    // State setters
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

    // State setters
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

            const secureData = { ...semesterData, user_id: user.id }
            const { data, error } = await supabase
                .from('semesters')
                .insert(secureData)
                .select()
                .single()

            if (error) throw error
            
            // Optimistic update
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
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('semesters')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error

            // Optimistic update
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
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('semesters')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error

            // Optimistic update
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
                .select(`
                    *,
                    semester:semesters!inner(user_id)
                `)
                .eq('semester.user_id', user.id)
            
            if (semesterId) {
                query = query.eq('semester_id', semesterId)
            }

            const { data, error } = await query.order('name')

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

            // Verify semester belongs to user
            const { data: semester } = await supabase
                .from('semesters')
                .select('id')
                .eq('id', courseData.semester_id)
                .eq('user_id', user.id)
                .single()

            if (!semester) {
                throw new Error('Invalid semester')
            }

            const { data, error } = await supabase
                .from('courses')
                .insert(courseData)
                .select()
                .single()

            if (error) throw error

            // Optimistic update
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
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            // First verify the course belongs to the user through semester ownership
            const { data: course } = await supabase
                .from('courses')
                .select(`
                    id,
                    semester:semesters!inner(user_id)
                `)
                .eq('id', id)
                .eq('semester.user_id', user.id)
                .single()

            if (!course) {
                throw new Error('Course not found or access denied')
            }

            const { error } = await supabase
                .from('courses')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            // Optimistic update
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
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            // First verify the course belongs to the user through semester ownership
            const { data: course } = await supabase
                .from('courses')
                .select(`
                    id,
                    semester:semesters!inner(user_id)
                `)
                .eq('id', id)
                .eq('semester.user_id', user.id)
                .single()

            if (!course) {
                throw new Error('Course not found or access denied')
            }

            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            get().deleteCourse(id)
            set({ loading: false })
            return true
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete course', loading: false })
            return false
        }
    },
}))

