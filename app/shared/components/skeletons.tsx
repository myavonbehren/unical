'use client'
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';
  
interface NumberLoadingSkeletonProps {
  count?: number
}

export function SemesterLoadingSkeleton({ count = 3 }: NumberLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${shimmer} relative overflow-hidden`}>
          <div className="bg-muted rounded-lg p-4">
            <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CourseLoadingSkeleton({ count = 6 }: NumberLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${shimmer} relative overflow-hidden rounded-lg bg-muted shadow-sm`}>
          {/* Colored top section skeleton */}
          <div className="h-20 w-full bg-muted-foreground/20"></div>
          
          {/* Content section skeleton */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="h-6 bg-muted-foreground/20 rounded mb-1 w-4/5"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
              </div>
              <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


