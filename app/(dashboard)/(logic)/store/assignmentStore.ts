import { create } from 'zustand'
import type { Assignment, AssignmentUpdate } from '../types/database'

interface AssignmentStore {
    assignments: Assignment[]
    setAssignments: (assignments: Assignment[]) => void
    addAssignment: (assignment: Assignment) => void
    updateAssignment: (id: string, updates: AssignmentUpdate) => void
    deleteAssignment: (id: string) => void
    getAssignmentsForCourse: (courseId: string) => Assignment[]
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    assignments: [],
    setAssignments: (assignments) => set({ assignments }),
    addAssignment: (assignment) => set((state) => ({ assignments: [...state.assignments, assignment] })),
    updateAssignment: (id, updates) => set((state) => ({ assignments: state.assignments.map((a) => a.id === id ? { ...a, ...updates } : a) })),
    deleteAssignment: (id) => set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),
    getAssignmentsForCourse: (courseId: string) => get().assignments.filter((a) => a.course_id === courseId),
}))

