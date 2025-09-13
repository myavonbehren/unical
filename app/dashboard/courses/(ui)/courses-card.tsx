import { Course } from "../../(logic)/types/database"

interface CoursesCardProps {
    courses: Course[]
    onEditCourse: (course: Course) => void
}

export default function CoursesCard({ courses, onEditCourse }: CoursesCardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => onEditCourse(course)}
              >
                <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
                {course.code && (
                  <p className="text-sm text-muted-foreground mb-2">{course.code}</p>
                )}
                {course.location && (
                  <p className="text-sm text-muted-foreground">{course.location}</p>
                )}
              </div>
            ))}
          </div>
    )
}