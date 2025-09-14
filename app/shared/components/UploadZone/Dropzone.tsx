'use client'

import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/shared/components/ui/button'
import { Card, CardContent } from '@/app/shared/components/ui/card'
import { MAX_FILE_SIZE } from './constants'
import { formatFileSize } from './utils'
import type { DropzoneProps } from './types'

export function Dropzone({
  isDragActive,
  isDragReject,
  disabled,
  getRootProps,
  getInputProps,
  rejectionMessage
}: DropzoneProps) {
  return (
    <Card 
      className={cn(
        "border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/10",
        isDragReject && "border-destructive bg-destructive/10",
        disabled && "opacity-50 cursor-not-allowed",
        !isDragActive && !isDragReject && "border-border hover:border-border"
      )}
    >
      <CardContent 
        {...getRootProps()}
        className="flex flex-col items-center justify-center py-12 px-6 text-center"
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "rounded-full p-4 mb-4 transition-colors",
          isDragActive && !isDragReject && "bg-primary/10",
          isDragReject && "bg-destructive/10",
          !isDragActive && !isDragReject && "bg-border"
        )}>
          <Upload className={cn(
            "h-8 w-8",
            isDragActive && !isDragReject && "text-primary",
            isDragReject && "text-destructive",
            !isDragActive && !isDragReject && "text-muted-foreground"
          )} />
        </div>

        {isDragReject ? (
          <div className="text-destructive">
            <p className="text-lg font-semibold mb-2">
              {rejectionMessage || 'Invalid file type'}
            </p>
            <p className="text-sm">
              {rejectionMessage?.includes('too many') 
                ? 'Please select fewer files' 
                : 'Please upload PDF, Word documents, or images only'
              }
            </p>
          </div>
        ) : isDragActive ? (
          <div className="text-primary">
            <p className="text-lg font-semibold mb-2">Drop your syllabus here</p>
            <p className="text-sm">Release to upload</p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <p className="text-lg font-semibold mb-2">Upload your syllabus</p>
            <p className="text-sm mb-4">
              Drag and drop your syllabus files here, or click to browse
            </p>
            <p className="text-xs mb-4 text-muted-foreground">
              Supports PDF, Word documents, and images (max {formatFileSize(MAX_FILE_SIZE)})
            </p>
            <Button variant="outline" size="sm" disabled={disabled}>
              Choose Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
