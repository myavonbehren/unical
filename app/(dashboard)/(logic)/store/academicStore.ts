import { create } from 'zustand'
import type { Semester, Course, SemesterUpdate, CourseUpdate } from '../types/database'

interface AcademicStore {
    semesters: Semester[]
    courses: Course[]

    setSemesters: (semesters: Semester[]) => void
    addSemester: (semester: Semester) => void
    updateSemester: (id: string, updates: SemesterUpdate) => void
    deleteSemester: (id: string) => void

    setCourses: (courses: Course[]) => void
    addCourse: (course: Course) => void
    updateCourse: (id: string, updates: CourseUpdate) => void
    deleteCourse: (id: string) => void

    getCoursesForSemester: (semesterId: string) => Course[]
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
    semesters: [],
    courses: [],

    setSemesters: (semesters) => set({ semesters }),
    addSemester: (semester) => set((state) => ({ semesters: [...state.semesters, semester] })),
    updateSemester: (id, updates) => set((state) => ({ semesters: state.semesters.map((s) => s.id === id ? { ...s, ...updates } : s) })),
    deleteSemester: (id) => set((state) => ({ semesters: state.semesters.filter((s) => s.id !== id) })),

    setCourses: (courses) => set({ courses }),
    addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
    updateCourse: (id, updates) => set((state) => ({ courses: state.courses.map((c) => c.id === id ? { ...c, ...updates } : c) })),
    deleteCourse: (id) => set((state) => ({ courses: state.courses.filter((c) => c.id !== id) })),

    getCoursesForSemester: (semesterId: string) => get().courses.filter((c) => c.semester_id === semesterId),
}))

