import { create } from 'zustand'

interface SyllabusUpload {
    id: string
    course_id: string
    filename: string
    parsed_data: any
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    uploaded_at: string
}

interface UploadStore {
    uploads: SyllabusUpload[]
    setUploads: (uploads: SyllabusUpload[]) => void
    addUpload: (upload: SyllabusUpload) => void
    updateUpload: (id: string, updates: Partial<SyllabusUpload>) => void
    deleteUpload: (id: string) => void
    getUploadsByCourse: (courseId: string) => SyllabusUpload[]
}

export const useUploadStore = create<UploadStore>((set, get) => ({
    uploads: [],
    setUploads: (uploads) => set({ uploads }),
    addUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
    updateUpload: (id, updates) => set((state) => ({
        uploads: state.uploads.map((u) => u.id === id ? { ...u, ...updates } : u)
    })),
    deleteUpload: (id) => set((state) => ({
        uploads: state.uploads.filter((u) => u.id !== id)
    })),
    getUploadsByCourse: (courseId: string) => get().uploads.filter((u) => u.course_id === courseId),
}))



export type { SyllabusUpload }