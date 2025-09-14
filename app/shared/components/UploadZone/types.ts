// Type definitions for upload components
export interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
  parsedData?: unknown
}

export interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  onFileRemove: (fileId: string) => void
  onProcessFile?: (file: File) => Promise<unknown>
  className?: string
  disabled?: boolean
  maxFiles?: number
}

export interface FileItemProps {
  uploadedFile: UploadedFile
  onRemove: (fileId: string) => void
}

export interface FileListProps {
  files: UploadedFile[]
  onRemove: (fileId: string) => void
}

export interface DropzoneProps {
  isDragActive: boolean
  isDragReject: boolean
  disabled: boolean
  getRootProps: () => Record<string, unknown>
  getInputProps: () => Record<string, unknown>
  rejectionMessage?: string
}
