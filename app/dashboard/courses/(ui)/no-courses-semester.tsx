import { Button } from "@/app/shared/components/ui/button";
import Link from "next/link";


export default function NoCoursesSemester() {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">
              Please select a semester to view its courses.
            </p>
            <Link href="/dashboard/semesters">
              <Button variant="outline">
                Go to Semesters
              </Button>
            </Link>
      </div>
    );
  }