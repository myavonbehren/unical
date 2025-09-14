import { FileText, Image } from 'lucide-react'

// File utility functions
export const getFileIcon = (file: File) => {
  if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-destructive" />
  if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-8 w-8 text-primary" />
  if (file.type.includes('image')) return <Image className="h-8 w-8 text-green-500" alt="Image file" />
  return <FileText className="h-8 w-8 text-muted-foreground" />
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const generateFileId = (file: File): string => {
  return `${file.name}-${Date.now()}-${Math.random()}`
}
