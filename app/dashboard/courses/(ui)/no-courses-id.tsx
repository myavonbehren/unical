import { Button } from "@/app/shared/ui/button";
import Link from "next/link";

interface NoCoursesIdProps {
  semesterName: string
}
  export default function NoCoursesId({ semesterName }: NoCoursesIdProps) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">
          No courses found for {semesterName}
        </p>
      </div>
    );
  }