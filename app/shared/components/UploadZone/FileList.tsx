'use client'

import { FileItem } from './FileItem'
import type { FileListProps } from './types'

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground text-left">
        Uploaded Files ({files.length})
      </h3>
      
      {files.map((uploadedFile) => (
        <FileItem
          key={uploadedFile.id}
          uploadedFile={uploadedFile}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
