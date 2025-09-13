'use client'

import { ReactNode } from 'react'
import { spacingClasses } from '@/app/shared/design-tokens/spacing'

interface DashboardPageProps {
  children: ReactNode
  className?: string
}

/**
 * Main dashboard page wrapper component
 * Provides consistent layout structure for all dashboard pages
 */
export default function DashboardPage({ children, className = '' }: DashboardPageProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {children}
    </div>
  )
}
