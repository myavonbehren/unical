'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard'
import { Button } from '@/app/shared/ui/button'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NoCoursesSemester from './(ui)/no-courses-semester'  
import NoCoursesId from './(ui)/no-courses-id'

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const semesterId = searchParams.get('semester')
  const { semesters, courses, fetchSemesters, fetchCourses } = useAcademicStore()
  const [selectedSemester, setSelectedSemester] = useState<any>(null)

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

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <div>
          <Link href="/dashboard/semesters">
            <Button variant="ghost" size="default">
              <ArrowLeft className="h-9 w-9" />
            </Button>
          </Link>
        </div>

        <Button>
          Add Course
        </Button>
      </DashboardPageHeader>
      
      <DashboardPageContent>
      <div className="ml-4">
            <DashboardPageTitle>
              {selectedSemester ? selectedSemester.name : 'Courses'}
            </DashboardPageTitle>
            {selectedSemester && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(selectedSemester.start_date)} - {formatDate(selectedSemester.end_date)}
              </p>
            )}
      </div>
        {!semesterId ? (
          <NoCoursesSemester />
        ) : !selectedSemester ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading semester...</p>
          </div>
        ) : courses.length === 0 ? (
          <NoCoursesId semesterName={selectedSemester.name} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
                {course.code && (
                  <p className="text-sm text-muted-foreground mb-2">{course.code}</p>
                )}
                {course.location && (
                  <p className="text-sm text-muted-foreground">{course.location}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardPageContent>
    </DashboardPage>
  )
}
