import { create } from 'zustand'

interface Assignment {
    id: string
    course_id: string
    title: string
    description?: string
    due_date: string
    assignment_type: string
    completed: boolean
    created_at: string
}

interface AssignmentStore {
    assignments: Assignment[]
    setAssignments: (assignments: Assignment[]) => void
    addAssignment: (assignment: Assignment) => void
    updateAssignment: (assignment: Assignment, updates: Partial<Assignment>) => void
    deleteAssignment: (id: string) => void
    getAssignmentsForCourse: (courseId: string) => Assignment[]
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    assignments: [],
    setAssignments: (assignments) => set({ assignments }),
    addAssignment: (assignment) => set((state) => ({ assignments: [...state.assignments, assignment] })),
    updateAssignment: (assignment) => set((state) => ({ assignments: state.assignments.map((a) => a.id === assignment.id ? assignment : a) })),
    deleteAssignment: (id) => set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),
    getAssignmentsForCourse: (courseId: string) => get().assignments.filter((a) => a.course_id === courseId),
}))