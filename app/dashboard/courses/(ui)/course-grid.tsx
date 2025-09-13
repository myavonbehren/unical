'use client'

import { useState, useEffect } from 'react'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import { CourseLoadingSkeleton } from '../../../shared/components/skeletons'
import NoCoursesSemester from './no-courses-semester'
import CourseCard from './course-card'
import { Button } from '@/app/shared/components/ui/button'
import { Course } from '@/app/dashboard/(logic)/types/database'
import AddCourseModal from './add-courses-modal'
import { spacingClasses } from '@/app/shared/design-tokens/spacing'

interface CourseGridProps {
  onEditCourse?: (course: Course) => void
  onDeleteCourse?: (courseId: string) => void
}


export default function CourseGrid({ onEditCourse, onDeleteCourse }: CourseGridProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [hasEverLoaded, setHasEverLoaded] = useState(false) // Track if we've loaded data at least once
  const [minLoadingTime, setMinLoadingTime] = useState(true)

  const { courses, loading, error, fetchCourses, deleteCourseFromDB } = useAcademicStore()

  // Fetch semesters when component mounts
  useEffect(() => {
    fetchCourses()
  }, [])

  // Force minimum loading time ONLY on first load
  useEffect(() => {
    if (!hasEverLoaded) {
      const timer = setTimeout(() => {
        setMinLoadingTime(false)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [hasEverLoaded])

  // Mark as "ever loaded" when first load completes
  useEffect(() => {
    if (!loading && !hasEverLoaded && !minLoadingTime) {
      setHasEverLoaded(true)
    }
  }, [loading, hasEverLoaded, minLoadingTime])

  // No need to provide refresh function to parent - Zustand store handles updates automatically

  const handleEdit = (course: Course) => {
    onEditCourse?.(course)
  }

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourseFromDB(courseId)
      onDeleteCourse?.(courseId)
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const handleAddSuccess = () => {
    // No need to manually refresh - Zustand store handles updates automatically
  }

  // Show skeleton ONLY on very first load (never loaded + still in min time)
  const shouldShowSkeleton = !hasEverLoaded && (loading || minLoadingTime)

  if (shouldShowSkeleton) {
    return <CourseLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading courses: {error}</p>
        <Button onClick={() => fetchCourses()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (hasEverLoaded && (!courses || courses.length === 0)) {
    return <NoCoursesSemester />
  }

  return (
    <>
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${spacingClasses.gridGap} transition-opacity duration-200 ${
          loading ? 'opacity-75' : 'opacity-100'
        }`}
      >
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEditCourse={handleEdit}
            onDeleteCourse={handleDelete}
          />
        ))}
      </div>
      
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  )
}