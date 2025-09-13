'use client'

import { ReactNode } from 'react'
import { JSX } from 'react'

interface DashboardPageTitleProps {
  children: ReactNode
  className?: string
  /**
   * Title level (h1, h2, h3, etc.)
   * @default "h1"
   */
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Dashboard page title component
 * Provides consistent title styling across all dashboard pages
 */
export default function DashboardPageTitle({ 
  children, 
  className = '',
  level = 'h1'
}: DashboardPageTitleProps) {
  const baseClasses = 'font-semibold font-heading text-xl'
  const Tag = level as keyof JSX.IntrinsicElements
  
  return (
    <Tag className={`${baseClasses} ${className}`}>
      {children}
    </Tag>
  )
}
