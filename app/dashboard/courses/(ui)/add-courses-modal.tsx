'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/app/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/app/shared/ui/input'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import type { CourseInsert, Course } from '@/app/dashboard/(logic)/types/database'
import { Loader2 } from 'lucide-react'

// Form validation schema
const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100, 'Course name is too long'),
  code: z.string().optional(),
  location: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
})

type CourseFormData = z.infer<typeof courseSchema>

interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingCourse?: Course | null
  semesterId?: string
}

export default function AddCourseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingCourse,
  semesterId 
}: AddCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createCourse, updateCourseInDB } = useAcademicStore()
  const isEditing = !!editingCourse

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: editingCourse?.name || '',
      code: editingCourse?.code || '',
      location: editingCourse?.location || '',
      color: editingCourse?.color || '#3b82f6', // Default blue color
    },
  })

  // Reset form when editingCourse changes
  React.useEffect(() => {
    if (editingCourse) {
      form.reset({
        name: editingCourse.name,
        code: editingCourse.code || '',
        location: editingCourse.location || '',
        color: editingCourse.color,
      })
    } else {
      form.reset({
        name: '',
        code: '',
        location: '',
        color: '#3b82f6',
      })
    }
  }, [editingCourse, form])

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true)
    
    try {
      if (isEditing && editingCourse) {
        // Update existing course
        const result = await updateCourseInDB(editingCourse.id, {
          name: data.name,
          code: data.code || null,
          location: data.location || null,
          color: data.color,
        })
        
        if (result) {
          form.reset()
          onSuccess?.()
          onClose()
        }
      } else {
        // Create new course
        if (!semesterId) {
          throw new Error('Semester ID is required to create a course')
        }

        const courseData: CourseInsert = {
          semester_id: semesterId,
          name: data.name,
          code: data.code || undefined,
          location: data.location || undefined,
          color: data.color,
        }

        const result = await createCourse(courseData)
        
        if (result) {
          form.reset()
          onSuccess?.()
          onClose()
        }
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} course:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the course information below.'
              : 'Create a new course to organize your assignments and materials.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Introduction to Computer Science" 
                      {...field} 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., CS101, MATH201" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Room 101, Online" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color"
                        className="w-10 h-9 p-1 border rounded"
                        {...field}
                      />
                      <Input 
                        placeholder="#3b82f6"
                        className="flex-1"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Course' : 'Add Course')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
