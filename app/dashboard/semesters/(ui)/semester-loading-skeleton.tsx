'use client'

interface SemesterLoadingSkeletonProps {
  count?: number
}

export default function SemesterLoadingSkeleton({ count = 3 }: SemesterLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg p-4">
            <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
