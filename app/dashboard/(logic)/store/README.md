# Zustand Stores Usage Guide

This directory contains Zustand stores that provide centralized state management for the application, eliminating the need for prop drilling.

## Available Stores

### 1. Academic Store (`useAcademicStore`)
Manages semesters and courses data.

```typescript
import { useAcademicStore } from '@/app/dashboard/(logic)/store/academicStore'

function MyComponent() {
  const { 
    semesters, 
    courses, 
    loading, 
    error,
    fetchSemesters,
    createSemester,
    updateSemesterInDB,
    deleteSemesterFromDB,
    fetchCourses,
    createCourse,
    updateCourseInDB,
    deleteCourseFromDB,
    getCoursesForSemester
  } = useAcademicStore()

  // Fetch data
  useEffect(() => {
    fetchSemesters()
    fetchCourses()
  }, [])

  // Create a new semester
  const handleCreateSemester = async () => {
    const newSemester = await createSemester({
      user_id: '', // Will be set automatically
      name: 'Fall 2024',
      start_date: '2024-09-01',
      end_date: '2024-12-15'
    })
  }

  // Get courses for a specific semester
  const semesterCourses = getCoursesForSemester('semester-id')
}
```

### 2. Assignment Store (`useAssignmentStore`)
Manages assignments data.

```typescript
import { useAssignmentStore } from '@/app/dashboard/(logic)/store/assignmentStore'

function AssignmentComponent() {
  const { 
    assignments, 
    loading, 
    error,
    fetchAssignments,
    createAssignment,
    updateAssignmentInDB,
    deleteAssignmentFromDB,
    toggleAssignmentComplete,
    getAssignmentsForCourse
  } = useAssignmentStore()

  // Fetch all assignments or for a specific course
  useEffect(() => {
    fetchAssignments() // All assignments
    // or
    fetchAssignments('course-id') // Specific course
  }, [])

  // Create a new assignment
  const handleCreateAssignment = async () => {
    const newAssignment = await createAssignment({
      course_id: 'course-id',
      title: 'Homework 1',
      description: 'Complete exercises 1-10',
      due_date: '2024-09-15T23:59:00',
      assignment_type: 'homework',
      completed: false
    })
  }

  // Toggle assignment completion
  const handleToggleComplete = async (assignmentId: string) => {
    await toggleAssignmentComplete(assignmentId)
  }

  // Get assignments for a specific course
  const courseAssignments = getAssignmentsForCourse('course-id')
}
```

### 3. Upload Store (`useUploadStore`)
Manages syllabus uploads data.

```typescript
import { useUploadStore } from '@/app/dashboard/(logic)/store/uploadStore'

function UploadComponent() {
  const { 
    uploads, 
    loading, 
    error,
    fetchUploads,
    createUpload,
    updateUploadInDB,
    deleteUploadFromDB,
    getUploadsByCourse
  } = useUploadStore()

  // Fetch all uploads or for a specific course
  useEffect(() => {
    fetchUploads() // All uploads
    // or
    fetchUploads('course-id') // Specific course
  }, [])

  // Create a new upload
  const handleCreateUpload = async () => {
    const newUpload = await createUpload({
      course_id: 'course-id',
      file_name: 'syllabus.pdf',
      file_url: 'https://example.com/syllabus.pdf',
      file_size: 1024000,
      upload_date: new Date().toISOString()
    })
  }

  // Get uploads for a specific course
  const courseUploads = getUploadsByCourse('course-id')
}
```

## Store Initialization

The stores are automatically initialized when the dashboard loads. You can also manually refresh them:

```typescript
import { useStoreInitializer } from '@/app/dashboard/(logic)/store/storeInitializer'

function MyComponent() {
  const { 
    initializeStores,
    refreshStores,
    refreshAcademicStore,
    refreshAssignmentStore,
    refreshUploadStore,
    refreshAfterSemesterChange,
    refreshAfterCourseChange
  } = useStoreInitializer()

  // Manually refresh all stores
  const handleRefresh = () => {
    refreshStores()
  }

  // Refresh after specific operations
  const handleSemesterChange = async () => {
    // ... perform semester operation
    await refreshAfterSemesterChange()
  }
}
```

## Key Features

### ✅ **Optimistic Updates**
All stores perform optimistic updates, so the UI updates immediately while the database operation happens in the background.

### ✅ **Error Handling**
Each store includes comprehensive error handling with user-friendly error messages.

### ✅ **Loading States**
All stores provide loading states for better UX.

### ✅ **Authentication**
All database operations automatically verify user authentication and ensure users can only access their own data.

### ✅ **No Prop Drilling**
Components can access any store data directly without passing props through multiple levels.

## Migration from Hooks

If you're migrating from the old `useSupabase` hooks:

**Before (with hooks):**
```typescript
const { semesters, loading, error, fetchSemesters, createSemester } = useSemesters()
```

**After (with Zustand):**
```typescript
const { semesters, loading, error, fetchSemesters, createSemester } = useAcademicStore()
```

The API is nearly identical, making migration straightforward!

