'use client'

import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/app/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/app/shared/ui/card'
import type { Semester } from '@/app/dashboard/(logic)/types/database'

interface SemesterCardProps {
  semester: Semester
  onEdit: (semester: Semester) => void
  onDelete: (semesterId: string) => void
  onClick: (semester: Semester) => void
}

export default function SemesterCard({ semester, onEdit, onDelete, onClick }: SemesterCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling to card click
    onEdit(semester)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling to card click
    if (window.confirm(`Are you sure you want to delete "${semester.name}"? This action cannot be undone.`)) {
      onDelete(semester.id)
    }
  }
  

  return (
    <Card className="w-full transition-shadow duration-200 cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => onClick(semester)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
              {semester.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(semester.start_date)} - {formatDate(semester.end_date)}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={handleEdit}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
