'use client'

import { useState } from 'react'
import { Button } from "@/app/shared/ui/button";
import SemesterGrid from "./(ui)/semester-grid";
import AddSemesterModal from "./(ui)/add-semester-modal";
import type { Semester } from '@/app/dashboard/(logic)/types/database';
import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';

export default function SemestersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingSemester(null)
  }

  const handleModalSuccess = () => {
    // No need to refresh manually - Zustand store will handle updates
    setIsModalOpen(false)
    setEditingSemester(null)
  }

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester)
    setIsModalOpen(true)
  }

  const handleDeleteSemester = (semesterId: string) => {
    // The delete operation is handled in SemesterGrid via Zustand store
    // This callback can be used for additional cleanup if needed
    console.log('Semester deleted:', semesterId)
  }

  return (
    <DashboardPage>
      {/* Header */}
      <DashboardPageHeader>
        <DashboardPageTitle>Semesters</DashboardPageTitle>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Semester
        </Button>
      </DashboardPageHeader>

      {/* Content */}
      <DashboardPageContent>
        <SemesterGrid
          onEditSemester={handleEditSemester}
          onDeleteSemester={handleDeleteSemester}
        />
      </DashboardPageContent>

      {/* Add/Edit Semester Modal */}
      <AddSemesterModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingSemester={editingSemester}
      />
    </DashboardPage>
  )
}