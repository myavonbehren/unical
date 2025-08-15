import { create } from 'zustand'

interface SyllabusUpload {
    id: string
    course_id: string
    filename: string
    parsed_data: JSON
    processing_status: string
    upload_at: string
}

interface UploadStore {
    uploads: SyllabusUpload[]
    setUploads: (uploads: SyllabusUpload[]) => void
    addUpload: (upload: SyllabusUpload) => void
}

export const useUploadStore = create<UploadStore>((set) => ({
    uploads: [],
    setUploads: (uploads) => set({ uploads }),
    addUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
}))

export type { SyllabusUpload }