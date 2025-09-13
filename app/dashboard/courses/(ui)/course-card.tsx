import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/app/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/app/shared/ui/card'
import { Course } from "../../(logic)/types/database"

interface CourseCardProps {
    course: Course
    onEditCourse: (course: Course) => void
    onDeleteCourse: (courseId: string) => void
}

export default function CourseCard({ course, onEditCourse, onDeleteCourse }: CourseCardProps) {
    return (
      <Card className="w-full transition-shadow duration-200 cursor-pointer hover:shadow-md overflow-hidden" onClick={() => onEditCourse(course)}>
        {/* Colored top section */}
        <div 
          className="h-24 w-full"
          style={{ backgroundColor: course.color }}
        />
        
        {/* Content section */}
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                {course.name}
              </h3>
              {course.code && (
                <p className="text-sm text-muted-foreground">
                  {course.code}
                </p>
              )}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditCourse(course)
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCourse(course.id)
                  }}
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