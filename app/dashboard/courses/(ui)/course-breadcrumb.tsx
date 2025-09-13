'use client'

import Breadcrumb from '@/app/shared/ui/breadcrumb'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import { useEffect, useState } from 'react'

interface CoursesBreadcrumbProps {
  semesterId?: string | null
  className?: string
}

export default function CoursesBreadcrumb({ semesterId, className = '' }: CoursesBreadcrumbProps) {
  const { semesters } = useAcademicStore()
  const [selectedSemester, setSelectedSemester] = useState<any>(null)

  // Find the selected semester
  useEffect(() => {
    if (semesterId && semesters.length > 0) {
      const semester = semesters.find(s => s.id === semesterId)
      setSelectedSemester(semester)
    }
  }, [semesterId, semesters])

  const breadcrumbItems = [
    {
      label: 'Semesters',
      href: '/dashboard/semesters'
    },
    {
      label: selectedSemester?.name || 'Courses',
      isActive: true
    }
  ]

  return (
    <Breadcrumb 
      items={breadcrumbItems} 
      className={className}
    />
  )
}
