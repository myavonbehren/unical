'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent
} from '@/app/shared/layout/dashboard'
import { Button } from '@/app/shared/ui/button'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import NoCoursesSemester from './(ui)/no-courses-semester'  
import NoCoursesId from './(ui)/no-courses-id'
import AddCourseModal from './(ui)/add-courses-modal'
import CoursesBreadcrumb from './(ui)/course-breadcrumb'
import CourseGrid from './(ui)/course-grid'

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const semesterId = searchParams.get('semester')
  const { semesters, courses, fetchSemesters, fetchCourses } = useAcademicStore()
  const [selectedSemester, setSelectedSemester] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)

  // Fetch data when component mounts
  useEffect(() => {
    fetchSemesters()
    if (semesterId) {
      fetchCourses(semesterId)
    }
  }, [semesterId])

  // Find the selected semester
  useEffect(() => {
    if (semesterId && semesters.length > 0) {
      const semester = semesters.find(s => s.id === semesterId)
      setSelectedSemester(semester)
    }
  }, [semesterId, semesters])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
  }

  const handleModalSuccess = () => {
    // Refresh courses after successful creation/update
    if (semesterId) {
      fetchCourses(semesterId)
    }
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
    setIsModalOpen(true)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const { deleteCourseFromDB } = useAcademicStore.getState()
        await deleteCourseFromDB(courseId)
        // Refresh courses after successful deletion
        if (semesterId) {
          fetchCourses(semesterId)
        }
      } catch (error) {
        console.error('Failed to delete course:', error)
      }
    }
  }

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <div className="flex flex-col gap-2">
          <CoursesBreadcrumb semesterId={semesterId} className="text-lg" />
        </div>

        {semesterId && selectedSemester && courses.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)}>
            Add Course
          </Button>
        )} 
      </DashboardPageHeader>
      
      <DashboardPageContent>
        {!semesterId ? (
          <NoCoursesSemester />
        ) : !selectedSemester ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading semester...</p>
          </div>
        ) : courses.length === 0 ? (
          <NoCoursesId 
            semesterName={selectedSemester.name} 
            onAddCourse={() => setIsModalOpen(true)}
          />
        ) : (
          <CourseGrid
            courses={courses}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        )}
      </DashboardPageContent>

      {/* Add/Edit Course Modal */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingCourse={editingCourse}
        semesterId={semesterId || undefined}
      />
    </DashboardPage>
  )
}
