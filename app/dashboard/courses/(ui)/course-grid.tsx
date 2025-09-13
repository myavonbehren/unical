import { spacingClasses } from "@/app/shared/design-tokens/spacing"
import { Course } from "../../(logic)/types/database"
import AddCourseModal from "./add-courses-modal"
import CourseCard from "./course-card"
import { useState } from "react"

interface CourseGridProps {
    courses: Course[]
    onEditCourse: (course: Course) => void
    onDeleteCourse: (courseId: string) => void
}

export default function CourseGrid({ courses, onEditCourse, onDeleteCourse }: CourseGridProps) {
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleAddCourseSuccess = () => {
        setIsAddCourseModalOpen(false)
    }

    const handleEditCourse = (course: Course) => {
        onEditCourse(course)
        setIsAddCourseModalOpen(true)
    }

    const handleDeleteCourse = (courseId: string) => {
        onDeleteCourse(courseId)
    }

    return (
        <>
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${spacingClasses.gridGap} transition-opacity duration-200 ${
          loading ? 'opacity-75' : 'opacity-100'
        }`}
      >
            {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEditCourse={onEditCourse}
            onDeleteCourse={onDeleteCourse}
          />
        ))}
      </div>
      
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onSuccess={handleAddCourseSuccess}
      />
    </>
    )
}