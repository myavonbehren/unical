import { create } from 'zustand'
import type { SyllabusUpload, SyllabusUploadUpdate } from '../types/database'

interface UploadStore {
    uploads: SyllabusUpload[]
    setUploads: (uploads: SyllabusUpload[]) => void
    addUpload: (upload: SyllabusUpload) => void
    updateUpload: (id: string, updates: SyllabusUploadUpdate) => void
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



