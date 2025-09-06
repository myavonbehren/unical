// app/(dashboard)/test/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/app/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/ui/card'
import { Badge } from '@/app/shared/ui/badge'
import { useSemesters, useCourses, useAssignments, useWeekCalculation, useCurrentUser } from '@/app/(dashboard)/(logic)/hooks/useSupabase'

export default function TestPage() {
  const [results, setResults] = useState<string[]>([])
  const [testSemesterId, setTestSemesterId] = useState<string | null>(null)
  const [testCourseId, setTestCourseId] = useState<string | null>(null)

  // Initialize hooks
  const { user } = useCurrentUser()
  const {
    semesters,
    loading: semesterLoading,
    error: semesterError,
    fetchSemesters,
    createSemester,
    updateSemester,
    deleteSemester
  } = useSemesters()

  const {
    courses,
    loading: courseLoading,
    error: courseError,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse
  } = useCourses()

  const {
    assignments,
    loading: assignmentLoading,
    error: assignmentError,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    toggleAssignmentComplete,
    deleteAssignment
  } = useAssignments()

  const {
    loading: weekLoading,
    error: weekError,
    calculateWeekDate,
    convertWeekAssignmentsToDates,
    getSemesterWeeks
  } = useWeekCalculation()

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    setResults(prev => [formattedMessage, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  // Test data
  const testSemesterData = {
    user_id: user?.id || '',
    name: 'Test Fall 2024',
    start_date: '2024-09-01',
    end_date: '2024-12-15'
  }

  const testCourseData = {
    semester_id: testSemesterId || '',
    name: 'Test Computer Science 101',
    code: 'CS101',
    location: 'Science Building Room 204',
    color: '#3B82F6'
  }

  const testAssignmentData = {
    course_id: testCourseId || '',
    title: 'Test Assignment 1',
    description: 'This is a test assignment',
    due_date: '2024-09-15T23:59:00',
    assignment_type: 'homework' as const,
    completed: false
  }

  // Test functions
  const testCreateSemester = async () => {
    if (!user?.id) {
      addResult('No user logged in', 'error')
      return
    }

    try {
      const result = await createSemester(testSemesterData)
      if (result) {
        setTestSemesterId(result.id)
        addResult(`Semester created: ${result.name} (ID: ${result.id})`, 'success')
      } else {
        addResult('Failed to create semester', 'error')
      }
    } catch (error) {
      addResult(`Error creating semester: ${error}`, 'error')
    }
  }

  const testFetchSemesters = async () => {
    try {
      await fetchSemesters()
      addResult(`Fetched ${semesters.length} semesters`, 'success')
    } catch (error) {
      addResult(`Error fetching semesters: ${error}`, 'error')
    }
  }

  const testUpdateSemester = async () => {
    if (!testSemesterId) {
      addResult('No test semester to update', 'error')
      return
    }

    try {
      const result = await updateSemester(testSemesterId, { name: 'Updated Test Fall 2024' })
      if (result) {
        addResult('Semester updated successfully', 'success')
      } else {
        addResult('Failed to update semester', 'error')
      }
    } catch (error) {
      addResult(`Error updating semester: ${error}`, 'error')
    }
  }

  const testCreateCourse = async () => {
    if (!testSemesterId) {
      addResult('Create a semester first', 'error')
      return
    }

    try {
      const courseData = { ...testCourseData, semester_id: testSemesterId }
      const result = await createCourse(courseData)
      if (result) {
        setTestCourseId(result.id)
        addResult(`Course created: ${result.name} (ID: ${result.id})`, 'success')
      } else {
        addResult('Failed to create course', 'error')
      }
    } catch (error) {
      addResult(`Error creating course: ${error}`, 'error')
    }
  }

  const testFetchCourses = async () => {
    try {
      await fetchCourses()
      addResult(`Fetched ${courses.length} courses`, 'success')
    } catch (error) {
      addResult(`Error fetching courses: ${error}`, 'error')
    }
  }

  const testCreateAssignment = async () => {
    if (!testCourseId) {
      addResult('Create a course first', 'error')
      return
    }

    try {
      const assignmentData = { ...testAssignmentData, course_id: testCourseId }
      const result = await createAssignment(assignmentData)
      if (result) {
        addResult(`Assignment created: ${result.title} (ID: ${result.id})`, 'success')
      } else {
        addResult('Failed to create assignment', 'error')
      }
    } catch (error) {
      addResult(`Error creating assignment: ${error}`, 'error')
    }
  }

  const testFetchAssignments = async () => {
    try {
      await fetchAssignments()
      addResult(`Fetched ${assignments.length} assignments`, 'success')
    } catch (error) {
      addResult(`Error fetching assignments: ${error}`, 'error')
    }
  }

  const testWeekCalculation = () => {
    try {
      const weekDate = calculateWeekDate(3, '2024-09-01')
      addResult(`Week 3 calculation: ${weekDate}`, 'success')

      const semesterWeeks = getSemesterWeeks('2024-09-01', '2024-12-15')
      addResult(`Semester has ${semesterWeeks.length} weeks`, 'success')
    } catch (error) {
      addResult(`Error in week calculation: ${error}`, 'error')
    }
  }

  const testRLSPolicies = async () => {
    // This will test if RLS policies are working
    // Try to fetch data - should only return user's own data
    await testFetchSemesters()
    await testFetchCourses()
    await testFetchAssignments()
    addResult('RLS policy test completed - check that you only see your own data', 'info')
  }

  const cleanupTestData = async () => {
    try {
      // Delete in reverse order due to foreign key constraints
      if (testSemesterId) {
        await deleteSemester(testSemesterId)
        addResult('Test semester deleted (cascades to courses and assignments)', 'success')
        setTestSemesterId(null)
        setTestCourseId(null)
      }
    } catch (error) {
      addResult(`Error cleaning up: ${error}`, 'error')
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Database Test Page</h1>
        <div className="flex gap-2">
          <Badge variant={user ? 'default' : 'destructive'}>
            {user ? `User: ${user.email}` : 'Not logged in'}
          </Badge>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Semester Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Semester Tests</CardTitle>
            <CardDescription>Test semester CRUD operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testCreateSemester} 
              disabled={semesterLoading || !user}
              className="w-full"
            >
              Create Test Semester
            </Button>
            <Button 
              onClick={testFetchSemesters} 
              disabled={semesterLoading}
              variant="outline"
              className="w-full"
            >
              Fetch Semesters ({semesters.length})
            </Button>
            <Button 
              onClick={testUpdateSemester} 
              disabled={semesterLoading || !testSemesterId}
              variant="outline"
              className="w-full"
            >
              Update Test Semester
            </Button>
          </CardContent>
        </Card>

        {/* Course Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Course Tests</CardTitle>
            <CardDescription>Test course CRUD operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testCreateCourse} 
              disabled={courseLoading || !testSemesterId}
              className="w-full"
            >
              Create Test Course
            </Button>
            <Button 
              onClick={testFetchCourses} 
              disabled={courseLoading}
              variant="outline"
              className="w-full"
            >
              Fetch Courses ({courses.length})
            </Button>
          </CardContent>
        </Card>

        {/* Assignment Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Tests</CardTitle>
            <CardDescription>Test assignment CRUD operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testCreateAssignment} 
              disabled={assignmentLoading || !testCourseId}
              className="w-full"
            >
              Create Test Assignment
            </Button>
            <Button 
              onClick={testFetchAssignments} 
              disabled={assignmentLoading}
              variant="outline"
              className="w-full"
            >
              Fetch Assignments ({assignments.length})
            </Button>
          </CardContent>
        </Card>

        {/* Week Calculation Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Week Calculation</CardTitle>
            <CardDescription>Test your unique week-to-date feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testWeekCalculation} 
              disabled={weekLoading}
              className="w-full"
            >
              Test Week Calculation
            </Button>
          </CardContent>
        </Card>

        {/* RLS Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Security Tests</CardTitle>
            <CardDescription>Test Row Level Security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testRLSPolicies}
              variant="outline"
              className="w-full"
            >
              Test RLS Policies
            </Button>
          </CardContent>
        </Card>

        {/* Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup</CardTitle>
            <CardDescription>Clean up test data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={cleanupTestData}
              variant="destructive"
              className="w-full"
              disabled={!testSemesterId}
            >
              Delete Test Data
            </Button>
            <Button 
              onClick={clearResults}
              variant="outline"
              className="w-full"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current State Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            {semesters.length === 0 ? (
              <p className="text-muted-foreground">No semesters found</p>
            ) : (
              <div className="space-y-2">
                {semesters.map(semester => (
                  <div key={semester.id} className="p-2 bg-muted rounded">
                    <p className="font-medium">{semester.name}</p>
                    <p className="text-sm text-muted-foreground">{semester.start_date} to {semester.end_date}</p>
                    {semester.id === testSemesterId && (
                      <Badge variant="secondary" className="mt-1">Test Data</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground">No courses found</p>
            ) : (
              <div className="space-y-2">
                {courses.map(course => (
                  <div key={course.id} className="p-2 bg-muted rounded">
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm text-muted-foreground">{course.code} - {course.location}</p>
                    {course.id === testCourseId && (
                      <Badge variant="secondary" className="mt-1">Test Data</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground">No assignments found</p>
            ) : (
              <div className="space-y-2">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="p-2 bg-muted rounded">
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                    <Badge variant={assignment.completed ? 'default' : 'outline'}>
                      {assignment.completed ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {(semesterError || courseError || assignmentError || weekError) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {semesterError && <p className="text-destructive">Semester: {semesterError}</p>}
            {courseError && <p className="text-destructive">Course: {courseError}</p>}
            {assignmentError && <p className="text-destructive">Assignment: {assignmentError}</p>}
            {weekError && <p className="text-destructive">Week Calculation: {weekError}</p>}
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Latest 10 test results</CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No test results yet. Run some tests!</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('SUCCESS') ? 'bg-green-50 text-green-800' :
                    result.includes('ERROR') ? 'bg-red-50 text-red-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}