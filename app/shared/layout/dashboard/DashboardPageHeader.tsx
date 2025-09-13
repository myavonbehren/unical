'use client'

import { ReactNode } from 'react'
import { spacingClasses } from '@/app/shared/design-tokens/spacing'

interface DashboardPageHeaderProps {
  children: ReactNode
  className?: string
}

/**
 * Dashboard page header component
 * Provides consistent header layout with proper spacing
 */
export default function DashboardPageHeader({ children, className = '' }: DashboardPageHeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      {children}
    </div>
  )
}
