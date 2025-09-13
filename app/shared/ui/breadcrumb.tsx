'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Breadcrumb({ 
  items, 
  className = '',
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  size = 'md'
}: BreadcrumbProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <nav 
      className={cn(
        "flex items-center space-x-1", 
        sizeClasses[size],
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={cn(
                  "font-semibold",
                  item.isActive ? "text-foreground" : "text-muted-foreground"
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
