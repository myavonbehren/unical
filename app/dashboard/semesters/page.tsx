import { Button } from "@/app/shared/ui/button";
import NoSemesters from "./(ui)/no-semesters";

export default function SemestersPage() {
    return <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-semibold font-heading text-xl">Semesters</h1>
        <Button>Add Semester</Button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <NoSemesters />
      </div>

    </div>
}