import { create } from 'zustand'

interface Semester {
    id: string
    user_id: string
    name: string
    start_date: Date
    end_date: Date
    created_at: Date
}

interface Course {
    id: string
    semester_id: string
    name: string
    code: string
    location: string
    color: string
    created_at: Date
}

interface AcademicStore {
    semesters: Semester[]
    courses: Course[]

    setSemesters: (semesters: Semester[]) => void
    addSemester: (semester: Semester) => void
    updateSemester: (semester: Semester, updates: Partial<Semester>) => void
    deleteSemester: (id: string) => void

    setCourses: (courses: Course[]) => void
    addCourse: (course: Course) => void
    updateCourse: (course: Course, updates: Partial<Course>) => void
    deleteCourse: (id: string) => void

    getCoursesForSemester: (semesterId: string) => Course[]
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
    semesters: [],
    courses: [],

    setSemesters: (semesters) => set({ semesters }),
    addSemester: (semester) => set((state) => ({ semesters: [...state.semesters, semester] })),
    updateSemester: (semester, updates) => set((state) => ({ semesters: state.semesters.map((s) => s.id === semester.id ? { ...s, ...updates } : s) })),
    deleteSemester: (id) => set((state) => ({ semesters: state.semesters.filter((s) => s.id !== id) })),

    setCourses: (courses) => set({ courses }),
    addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
    updateCourse: (course, updates) => set((state) => ({ courses: state.courses.map((c) => c.id === course.id ? { ...c, ...updates } : c) })),
    deleteCourse: (id) => set((state) => ({ courses: state.courses.filter((c) => c.id !== id) })),

    getCoursesForSemester: (semesterId: string) => get().courses.filter((c) => c.semester_id === semesterId),
}))

export type { Semester, Course }