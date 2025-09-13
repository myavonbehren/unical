import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Assignment, AssignmentUpdate, AssignmentInsert } from '../types/database'

const supabase = createClient()

interface AssignmentStore {
    assignments: Assignment[]
    loading: boolean
    error: string | null

    // State setters
    setAssignments: (assignments: Assignment[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void

    // Local state operations (optimistic updates)
    addAssignment: (assignment: Assignment) => void
    updateAssignment: (id: string, updates: AssignmentUpdate) => void
    deleteAssignment: (id: string) => void

    // Utility methods
    getAssignmentsForCourse: (courseId: string) => Assignment[]

    // Supabase sync methods
    fetchAssignments: (courseId?: string) => Promise<void>
    createAssignment: (assignmentData: AssignmentInsert) => Promise<Assignment | null>
    updateAssignmentInDB: (id: string, updates: AssignmentUpdate) => Promise<boolean>
    deleteAssignmentFromDB: (id: string) => Promise<boolean>
    toggleAssignmentComplete: (id: string) => Promise<boolean>
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    assignments: [],
    loading: false,
    error: null,

    // State setters
    setAssignments: (assignments) => set({ assignments }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Local state operations (optimistic updates)
    addAssignment: (assignment) => set((state) => ({ assignments: [...state.assignments, assignment] })),
    updateAssignment: (id, updates) => set((state) => ({ assignments: state.assignments.map((a) => a.id === id ? { ...a, ...updates } : a) })),
    deleteAssignment: (id) => set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),

    // Utility methods
    getAssignmentsForCourse: (courseId: string) => get().assignments.filter((a) => a.course_id === courseId),

    // Supabase sync methods
    fetchAssignments: async (courseId?: string) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            let query = supabase.from('assignments').select(`
                *,
                course:courses!inner(
                    name, code, color,
                    semester:semesters!inner(user_id)
                )
            `).eq('course.semester.user_id', user.id)
            
            if (courseId) {
                query = query.eq('course_id', courseId)
            }

            const { data, error } = await query.order('due_date')

            if (error) throw error
            set({ assignments: data || [], loading: false })
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch assignments', loading: false })
        }
    },

    createAssignment: async (assignmentData: AssignmentInsert) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            // Verify course belongs to user
            const { data: course } = await supabase
                .from('courses')
                .select('id, semester:semesters!inner(user_id)')
                .eq('id', assignmentData.course_id)
                .eq('semester.user_id', user.id)
                .single()

            if (!course) {
                throw new Error('Invalid course')
            }

            const { data, error } = await supabase
                .from('assignments')
                .insert(assignmentData)
                .select()
                .single()

            if (error) throw error

            // Optimistic update
            get().addAssignment(data)
            set({ loading: false })
            return data
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create assignment', loading: false })
            return null
        }
    },

    updateAssignmentInDB: async (id: string, updates: AssignmentUpdate) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('assignments')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            get().updateAssignment(id, updates)
            set({ loading: false })
            return true
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update assignment', loading: false })
            return false
        }
    },

    deleteAssignmentFromDB: async (id: string) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            get().deleteAssignment(id)
            set({ loading: false })
            return true
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete assignment', loading: false })
            return false
        }
    },

    toggleAssignmentComplete: async (id: string) => {
        const assignment = get().assignments.find(a => a.id === id)
        if (!assignment) return false

        return get().updateAssignmentInDB(id, { completed: !assignment.completed })
    },
}))

