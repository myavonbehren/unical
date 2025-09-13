// components/Upload/UploadDropzone.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Button } from '@/app/shared/components/ui/button'
import { Card, CardContent } from '@/app/shared/components/ui/card'
import { Badge } from '@/app/shared/components/ui/badge'
import { Progress } from '@/app/shared/components/ui/progress'
import {
  Upload,
  FileText,
  Image,
  X,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react'

// Supported file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'text/plain': ['.txt']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
  parsedData?: any
}

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  onFileRemove: (fileId: string) => void
  onProcessFile?: (file: File) => Promise<any>
  className?: string
  disabled?: boolean
  maxFiles?: number
}

export default function UploadDropzone({
  onFilesSelected,
  onFileRemove,
  onProcessFile,
  className,
  disabled = false,
  maxFiles = 5
}: UploadDropzoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors)
      })
    }

    // Add accepted files to state
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
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
  }, [onFilesSelected, onProcessFile])

  const processFile = async (uploadedFile: UploadedFile) => {
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

      const result = await onProcessFile!(uploadedFile.file)
      
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
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    onFileRemove(fileId)
  }

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />
    if (file.type.includes('image')) return <Image className="h-8 w-8 text-green-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Dropzone */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragActive && !isDragReject && "border-blue-400 bg-blue-50",
          isDragReject && "border-red-400 bg-red-50",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragActive && !isDragReject && "border-gray-300 hover:border-gray-400"
        )}
      >
        <CardContent 
          {...getRootProps()}
          className="flex flex-col items-center justify-center py-12 px-6 text-center"
        >
          <input {...getInputProps()} />
          
          <div className={cn(
            "rounded-full p-4 mb-4 transition-colors",
            isDragActive && !isDragReject && "bg-blue-100",
            isDragReject && "bg-red-100",
            !isDragActive && !isDragReject && "bg-gray-100"
          )}>
            <Upload className={cn(
              "h-8 w-8",
              isDragActive && !isDragReject && "text-blue-500",
              isDragReject && "text-red-500",
              !isDragActive && !isDragReject && "text-gray-500"
            )} />
          </div>

          {isDragReject ? (
            <div className="text-red-600">
              <p className="text-lg font-semibold mb-2">Invalid file type</p>
              <p className="text-sm">Please upload PDF, Word documents, or images only</p>
            </div>
          ) : isDragActive ? (
            <div className="text-blue-600">
              <p className="text-lg font-semibold mb-2">Drop your syllabus here</p>
              <p className="text-sm">Release to upload</p>
            </div>
          ) : (
            <div className="text-gray-600">
              <p className="text-lg font-semibold mb-2">Upload your syllabus</p>
              <p className="text-sm mb-4">
                Drag and drop your syllabus files here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports PDF, Word documents, and images (max {formatFileSize(MAX_FILE_SIZE)})
              </p>
              <Button variant="outline" size="sm" disabled={disabled}>
                Choose Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-4">
              <div className="flex items-center space-x-3">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <Badge variant={
                      uploadedFile.status === 'completed' ? 'default' :
                      uploadedFile.status === 'error' ? 'destructive' :
                      uploadedFile.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {uploadedFile.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uploadedFile.file.type || 'Unknown type'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  {uploadedFile.status === 'processing' && uploadedFile.progress !== undefined && (
                    <div className="mt-2">
                      <Progress value={uploadedFile.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Processing... {uploadedFile.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}

                  {/* Success message */}
                  {uploadedFile.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">
                      Successfully processed
                    </p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(uploadedFile.status)}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  disabled={uploadedFile.status === 'processing'}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
