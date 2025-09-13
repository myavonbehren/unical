/**
 * Standardized Spacing System
 * 
 * This file defines consistent spacing values used throughout the application.
 * All spacing values are based on a 4px base unit for better alignment and consistency.
 */

export const spacing = {
  // Base spacing units (4px increments)
  xs: '4',    // 16px - Small spacing (between related elements)
  sm: '6',    // 24px - Medium spacing (between sections)
  md: '8',    // 32px - Large spacing (between major sections)
  lg: '12',   // 48px - Extra large spacing (between page sections)
  xl: '16',   // 64px - Maximum spacing (between major page areas)
  '2xl': '20', // 80px - Extra maximum spacing
  '3xl': '24', // 96px - Ultra maximum spacing
} as const

export const spacingPx = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  '2xl': 80,
  '3xl': 96,
} as const

// Responsive spacing variants
export const responsiveSpacing = {
  // Container padding
  container: {
    mobile: spacing.xs,    // 16px
    desktop: spacing.md,   // 32px
  },
  
  // Content spacing
  content: {
    mobile: spacing.sm,    // 24px
    desktop: spacing.lg,   // 48px
  },
  
  // Section spacing
  section: {
    mobile: spacing.md,    // 32px
    desktop: spacing.xl,   // 64px
  },
  
  // Page spacing
  page: {
    mobile: spacing.lg,    // 48px
    desktop: spacing['2xl'], // 80px
  },
} as const

// Common spacing combinations
export const spacingClasses = {
  // Container padding
  containerPadding: `p-${spacing.xs} md:p-${spacing.md}`,
  
  // Content padding
  contentPadding: `p-${spacing.sm} md:p-${spacing.lg}`,
  
  // Bottom padding for scrollable content
  bottomPadding: `pb-${spacing.md} md:pb-${spacing.lg}`,
  
  // Section margins
  sectionMargin: `mb-${spacing.md} md:mb-${spacing.lg}`,
  
  // Grid gaps
  gridGap: `gap-${spacing.xs}`,
  gridGapLarge: `gap-${spacing.sm}`,
} as const

// Type definitions
export type SpacingKey = keyof typeof spacing
export type ResponsiveSpacingKey = keyof typeof responsiveSpacing
