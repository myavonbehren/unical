'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { SemesterFormData } from "../../(logic)/types/database"
import { useAcademicStore } from "../../(logic)/store/academicStore"
import { z } from "zod"
import { Loader2 } from "lucide-react"

interface AddSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddSemesterModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AddSemesterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createSemester, fetchSemesters } = useAcademicStore()
  const semesterSchema = z.object({
    name: z.string().min(1, 'Semester name is required'),
    start_date: z.date(),
    end_date: z.date(),
  }).refine((data) => data.end_date >= data.start_date, {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      name: '',
      start_date: new Date(),
      end_date: new Date(),
    },
  })

  const onSubmit = async (data: SemesterFormData) => {
    setIsSubmitting(true)
    
    try {
      // Convert Date objects to ISO strings for database
      // Note: user_id will be automatically set by createSemester from the authenticated user
      const result = await createSemester({
        user_id: '', // Will be overwritten by createSemester with authenticated user's ID
        name: data.name,
        start_date: data.start_date.toISOString().split('T')[0], // YYYY-MM-DD format
        end_date: data.end_date.toISOString().split('T')[0], // YYYY-MM-DD format
      })
      
      if (result) {
        // Refresh the semesters list
        await fetchSemesters()
        reset()
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error('Failed to create semester:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Create a new semester to organize your courses and assignments.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Semester Name</Label>
              <Input 
                id="name-1" 
                {...register('name')} 
                placeholder="e.g., Fall 2024"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="start-date-1">Start Date</Label>
                <Input 
                  id="start-date-1" 
                  type="date" 
                  {...register('start_date', { valueAsDate: true })} 
                  disabled={isSubmitting}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="end-date-1">End Date</Label>
                <Input 
                  id="end-date-1" 
                  type="date" 
                  {...register('end_date', { valueAsDate: true })} 
                  disabled={isSubmitting}
                />
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting}
                onClick={handleClose}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
