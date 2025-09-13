import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { SyllabusUpload, SyllabusUploadUpdate, SyllabusUploadInsert } from '../types/database'

const supabase = createClient()

interface UploadStore {
    uploads: SyllabusUpload[]
    loading: boolean
    error: string | null

    // State setters
    setUploads: (uploads: SyllabusUpload[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void

    // Local state operations (optimistic updates)
    addUpload: (upload: SyllabusUpload) => void
    updateUpload: (id: string, updates: SyllabusUploadUpdate) => void
    deleteUpload: (id: string) => void

    // Utility methods
    getUploadsByCourse: (courseId: string) => SyllabusUpload[]

    // Supabase sync methods
    fetchUploads: (courseId?: string) => Promise<void>
    createUpload: (uploadData: SyllabusUploadInsert) => Promise<SyllabusUpload | null>
    updateUploadInDB: (id: string, updates: SyllabusUploadUpdate) => Promise<boolean>
    deleteUploadFromDB: (id: string) => Promise<boolean>
}

export const useUploadStore = create<UploadStore>((set, get) => ({
    uploads: [],
    loading: false,
    error: null,

    // State setters
    setUploads: (uploads) => set({ uploads }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Local state operations (optimistic updates)
    addUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
    updateUpload: (id, updates) => set((state) => ({
        uploads: state.uploads.map((u) => u.id === id ? { ...u, ...updates } : u)
    })),
    deleteUpload: (id) => set((state) => ({
        uploads: state.uploads.filter((u) => u.id !== id)
    })),

    // Utility methods
    getUploadsByCourse: (courseId: string) => get().uploads.filter((u) => u.course_id === courseId),

    // Supabase sync methods
    fetchUploads: async (courseId?: string) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            let query = supabase.from('syllabus_uploads').select(`
                *,
                course:courses(name, code)
            `)
            
            if (courseId) {
                query = query.eq('course_id', courseId)
            }

            const { data, error } = await query.order('upload_date', { ascending: false })

            if (error) throw error
            set({ uploads: data || [], loading: false })
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch uploads', loading: false })
        }
    },

    createUpload: async (uploadData: SyllabusUploadInsert) => {
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
                .eq('id', uploadData.course_id)
                .eq('semester.user_id', user.id)
                .single()

            if (!course) {
                throw new Error('Invalid course')
            }

            const { data, error } = await supabase
                .from('syllabus_uploads')
                .insert(uploadData)
                .select()
                .single()

            if (error) throw error

            // Optimistic update
            get().addUpload(data)
            set({ loading: false })
            return data
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create upload', loading: false })
            return null
        }
    },

    updateUploadInDB: async (id: string, updates: SyllabusUploadUpdate) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('syllabus_uploads')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            get().updateUpload(id, updates)
            set({ loading: false })
            return true
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update upload', loading: false })
            return false
        }
    },

    deleteUploadFromDB: async (id: string) => {
        set({ loading: true, error: null })
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Authentication required')
            }

            const { error } = await supabase
                .from('syllabus_uploads')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            get().deleteUpload(id)
            set({ loading: false })
            return true
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete upload', loading: false })
            return false
        }
    },
}))



