'use client'

import { useState, useEffect } from 'react'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import SemesterLoadingSkeleton from './semester-loading-skeleton'
import NoSemesters from './no-semesters'
import SemesterCard from './semester-card'
import { Button } from '@/app/shared/ui/button'
import { Semester } from '@/app/dashboard/(logic)/types/database'
import AddSemesterModal from './add-semester-modal'
import { spacingClasses } from '@/app/shared/design-tokens/spacing'
import { useRouter } from 'next/navigation'

interface SemesterGridProps {
  onEditSemester?: (semester: Semester) => void
  onDeleteSemester?: (semesterId: string) => void
}


export default function SemesterGrid({ onEditSemester, onDeleteSemester }: SemesterGridProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [hasEverLoaded, setHasEverLoaded] = useState(false) // Track if we've loaded data at least once
  const [minLoadingTime, setMinLoadingTime] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)

  const { semesters, loading, error, fetchSemesters, deleteSemesterFromDB } = useAcademicStore()

  // Fetch semesters when component mounts
  useEffect(() => {
    fetchSemesters()
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

  const handleEdit = (semester: Semester) => {
    onEditSemester?.(semester)
  }

  const handleDelete = async (semesterId: string) => {
    try {
      await deleteSemesterFromDB(semesterId)
      onDeleteSemester?.(semesterId)
    } catch (error) {
      console.error('Failed to delete semester:', error)
    }
  }

  const handleAddSuccess = () => {
    // No need to manually refresh - Zustand store handles updates automatically
  }

  const handleClick = (semester: Semester) => {
    (`/dashboard/semesters/${semester.id}`)
  }

  // Show skeleton ONLY on very first load (never loaded + still in min time)
  const shouldShowSkeleton = !hasEverLoaded && (loading || minLoadingTime)

  if (shouldShowSkeleton) {
    return <SemesterLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading semesters: {error}</p>
        <Button onClick={fetchSemesters} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (hasEverLoaded && (!semesters || semesters.length === 0)) {
    return <NoSemesters />
  }

  return (
    <>
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${spacingClasses.gridGap} transition-opacity duration-200 ${
          loading ? 'opacity-75' : 'opacity-100'
        }`}
      >
        {semesters.map((semester) => (
          <SemesterCard
            key={semester.id}
            semester={semester}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClick={handleClick}
          />
        ))}
      </div>
      
      <AddSemesterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  )
}