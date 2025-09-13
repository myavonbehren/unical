import { Course } from "../../(logic)/types/database"
import CoursesCard from "./courses-card"

interface CourseGridProps {
    courses: Course[]
    onEditCourse: (course: Course) => void
}

export default function CourseGrid({ courses, onEditCourse }: CourseGridProps) {
    return (
        <div>
            <CoursesCard courses={courses} onEditCourse={onEditCourse} />
        </div>
    )
}