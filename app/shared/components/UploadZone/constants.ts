// File type constants and configuration
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'text/plain': ['.txt']
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const DEFAULT_MAX_FILES = 5
