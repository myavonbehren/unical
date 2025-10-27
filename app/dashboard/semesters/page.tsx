'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/shared/components/ui/button"
import { Card, CardContent } from "@/app/shared/components/ui/card"
import { 
  DashboardPage,
  DashboardPageHeader,
  DashboardPageContent,
  DashboardPageTitle
} from '@/app/shared/layout/dashboard'
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/shared/components/ui/dropdown-menu'

export default function SemestersPage() {
  // Use simple store
  const { semesters, loading, error, fetchSemesters } = useAcademicStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Fetch on mount only
  useEffect(() => {
    if (semesters.length === 0 && !loading) {
      fetchSemesters()
    }
  }, [semesters.length, loading, fetchSemesters])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEdit = (semester: any) => {
    // TODO: Implement edit functionality
  }

  const handleDelete = (semesterId: string) => {
    // TODO: Implement delete functionality
  }

  const handleClick = (semester: any) => {
    // TODO: Navigate to courses page
  }

  if (loading) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageTitle>Semesters</DashboardPageTitle>
          <Button disabled>Add Semester</Button>
        </DashboardPageHeader>
        <DashboardPageContent>
          <div className="text-center py-8">
            <p>Loading semesters...</p>
          </div>
        </DashboardPageContent>
      </DashboardPage>
    )
  }

  if (error) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageTitle>Semesters</DashboardPageTitle>
          <Button onClick={fetchSemesters}>Add Semester</Button>
        </DashboardPageHeader>
        <DashboardPageContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={fetchSemesters} variant="outline">
              Try Again
            </Button>
          </div>
        </DashboardPageContent>
      </DashboardPage>
    )
  }

  if (semesters.length === 0) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageTitle>Semesters</DashboardPageTitle>
          <Button onClick={() => setIsAddModalOpen(true)}>Add Semester</Button>
        </DashboardPageHeader>
        <DashboardPageContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No semesters found. Create your first semester to get started.</p>
          </div>
        </DashboardPageContent>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Semesters</DashboardPageTitle>
        <Button onClick={() => setIsAddModalOpen(true)}>Add Semester</Button>
      </DashboardPageHeader>

      <DashboardPageContent>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {semesters.map((semester) => (
            <Card 
              key={semester.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleClick(semester)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {semester.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(semester.start_date)} - {formatDate(semester.end_date)}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(semester)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(semester.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simple Add Modal Placeholder */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">Add New Semester</h2>
              <p className="text-muted-foreground mb-4">
                Add semester functionality will be implemented here.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1"
                >
                  Add Semester
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardPageContent>
    </DashboardPage>
  )
}
