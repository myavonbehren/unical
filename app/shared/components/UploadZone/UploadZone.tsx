'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Dropzone } from './Dropzone'
import { FileList } from './FileList'
import { ACCEPTED_FILE_TYPES, DEFAULT_MAX_FILES } from './constants'
import { generateFileId } from './utils'
import type { UploadDropzoneProps, UploadedFile } from './types'

export default function UploadZone({
  onFilesSelected,
  onFileRemove,
  onProcessFile,
  className,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES
}: UploadDropzoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [rejectionMessage, setRejectionMessage] = useState<string>('')

  const processFile = useCallback(async (uploadedFile: UploadedFile) => {
    if (!onProcessFile) return

    setUploadedFiles(prev => prev.map(f => 
      f.id === uploadedFile.id 
        ? { ...f, status: 'processing', progress: 0 }
        : f
    ))

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id && f.progress !== undefined
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ))
      }, 200)

      const result = await onProcessFile(uploadedFile.file)
      
      clearInterval(progressInterval)
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'completed', progress: 100, parsedData: result }
          : f
      ))
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Processing failed' 
            }
          : f
      ))
    }
  }, [onProcessFile])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(({ file, errors }) => {
        const errorTypes = errors.map(e => e.code)
        let message = ''
        
        if (errorTypes.includes('too-many-files')) {
          message = `Too many files selected (max ${maxFiles})`
        } else if (errorTypes.includes('file-too-large')) {
          message = `File ${file.name} is too large (max 10MB)`
        } else if (errorTypes.includes('file-invalid-type')) {
          message = `File ${file.name} is not a supported type`
        } else {
          message = `File ${file.name} rejected: ${errors.map(e => e.message).join(', ')}`
        }
        
        return message
      })
      
      // Set rejection message for dropzone display
      setRejectionMessage(errorMessages[0])
      
      // Show toast for each rejection
      errorMessages.forEach(message => {
        toast.error(message)
      })
    } else {
      setRejectionMessage('')
    }

    // Add accepted files to state
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: generateFileId(file),
      status: 'pending'
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    onFilesSelected(acceptedFiles)

    // Auto-process files if handler provided
    if (onProcessFile) {
      for (const uploadedFile of newFiles) {
        await processFile(uploadedFile)
      }
    }
  }, [onFilesSelected, onProcessFile, processFile, maxFiles])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    onFileRemove(fileId)
  }, [onFileRemove])

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: maxFiles,
    disabled,
    onDragEnter: () => {
      setIsDragActive(true)
      setRejectionMessage('')
    },
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => {
      setIsDragActive(false)
      setRejectionMessage('')
    },
    onDropRejected: () => setIsDragActive(false)
  })

  return (
    <div className={cn("w-full space-y-4", className)}>
      <Dropzone
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        disabled={disabled}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        rejectionMessage={rejectionMessage}
      />
      
      <FileList
        files={uploadedFiles}
        onRemove={removeFile}
      />
    </div>
  )
}
