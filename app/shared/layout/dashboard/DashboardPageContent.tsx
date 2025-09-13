'use client'

import { ReactNode } from 'react'
import { spacingClasses } from '@/app/shared/design-tokens/spacing'

interface DashboardPageContentProps {
  children: ReactNode
  className?: string
  /**
   * Whether to add bottom padding for scrollable content
   * @default true
   */
  addBottomPadding?: boolean
}

/**
 * Dashboard page content component
 * Provides consistent content layout with proper spacing and scroll handling
 */
export default function DashboardPageContent({ 
  children, 
  className = '',
  addBottomPadding = true 
}: DashboardPageContentProps) {
  const bottomPaddingClass = addBottomPadding ? spacingClasses.bottomPadding : ''
  
  return (
    <div className={`flex-1 ${bottomPaddingClass} ${className}`}>
      {children}
    </div>
  )
}
