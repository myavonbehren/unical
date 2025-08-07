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
    currentSemester: string | null
    // actions
    addSemester: (semester: Semester) => void
    setCourses: (courses: Course[]) => void
    setCurrentSemester: (id: string) => void
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
    semesters: [],
    courses: [],
    currentSemester: null,
    addSemester: (semester) => set((state) => ({
      semesters: [...state.semesters, semester]
    })),
    setCourses: (courses) => set({ courses }),
    setCurrentSemester: (id) => set({ currentSemester: id }),
}))