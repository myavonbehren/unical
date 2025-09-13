import { Button } from "@/app/shared/ui/button";

interface NoCoursesIdProps {
  semesterName: string
  onAddCourse?: () => void
}

export default function NoCoursesId({ semesterName, onAddCourse }: NoCoursesIdProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-muted-foreground mb-4">
        No courses found for {semesterName}.
      </p>
      {onAddCourse && (
        <Button onClick={onAddCourse}>
          Add First Course
        </Button>
      )}
    </div>
  );
}