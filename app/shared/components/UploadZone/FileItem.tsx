'use client'

import { X, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/app/shared/components/ui/button'
import { Card } from '@/app/shared/components/ui/card'
import { Badge } from '@/app/shared/components/ui/badge'
import { Progress } from '@/app/shared/components/ui/progress'
import { getFileIcon, formatFileSize } from './utils'
import type { FileItemProps } from './types'

export function FileItem({ uploadedFile, onRemove }: FileItemProps) {
  const { file, status, progress, error } = uploadedFile

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getBadgeVariant = () => {
    switch (status) {
      case 'completed':
        return 'default' as const
      case 'error':
        return 'destructive' as const
      case 'processing':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-3">
        {/* File Icon */}
        <div className="flex-shrink-0">
          {getFileIcon(file)}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <Badge variant={getBadgeVariant()}>
              {status}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
            <p className="text-xs text-muted-foreground">
              {file.type || 'Unknown type'}
            </p>
          </div>

          {/* Progress bar */}
          {status === 'processing' && progress !== undefined && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Processing... {progress}%
              </p>
            </div>
          )}

          {/* Error message */}
          {status === 'error' && error && (
            <p className="text-xs text-destructive mt-1">
              {error}
            </p>
          )}

          {/* Success message */}
          {status === 'completed' && (
            <p className="text-xs text-green-500 mt-1">
              Successfully processed
            </p>
          )}
        </div>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(uploadedFile.id)}
          disabled={status === 'processing'}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
