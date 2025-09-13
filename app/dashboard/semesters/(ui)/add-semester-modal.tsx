'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/app/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/shared/components/ui/form'
import { Input } from '@/app/shared/components/ui/input'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import type { SemesterInsert, Semester } from '@/app/dashboard/(logic)/types/database'
import { Loader2 } from 'lucide-react'

// Form validation schema
const semesterSchema = z.object({
  name: z.string().min(1, 'Semester name is required').max(100, 'Semester name is too long'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: 'Must be after start date',
  path: ['end_date'],
})

type SemesterFormData = z.infer<typeof semesterSchema>

interface AddSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingSemester?: Semester | null
}

export default function AddSemesterModal({ isOpen, onClose, onSuccess, editingSemester }: AddSemesterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createSemester, updateSemesterInDB } = useAcademicStore()
  const isEditing = !!editingSemester

  const form = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      name: editingSemester?.name || '',
      start_date: editingSemester?.start_date || '',
      end_date: editingSemester?.end_date || '',
    },
  })

  // Reset form when editingSemester changes
  React.useEffect(() => {
    if (editingSemester) {
      form.reset({
        name: editingSemester.name,
        start_date: editingSemester.start_date,
        end_date: editingSemester.end_date,
      })
    } else {
      form.reset({
        name: '',
        start_date: '',
        end_date: '',
      })
    }
  }, [editingSemester, form])

  const onSubmit = async (data: SemesterFormData) => {
    setIsSubmitting(true)
    
    try {
      if (isEditing && editingSemester) {
        // Update existing semester
        const result = await updateSemesterInDB(editingSemester.id, {
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        
        if (result) {
          form.reset()
          onSuccess?.()
          onClose()
        }
      } else {
        // Create new semester
        const semesterData: SemesterInsert = {
          user_id: '', // Will be set by the store
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
        }

        const result = await createSemester(semesterData)
        
        if (result) {
          form.reset()
          onSuccess?.()
          onClose()
        }
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} semester:`, error)
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
          <DialogTitle>{isEditing ? 'Edit Semester' : 'Add New Semester'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the semester information below.'
              : 'Create a new semester to organize your courses and assignments.'
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
                  <FormLabel>Semester Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Fall 2025, Spring 2026" 
                      {...field} 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <div className="h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <div className="h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
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
                  : (isEditing ? 'Update Semester' : 'Add Semester')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
