# Design System & Layout Components

This directory contains the standardized design system and reusable layout components for the application.

## 🎨 Spacing System

### Overview
The spacing system is based on a 4px base unit for consistent alignment and visual hierarchy.

### Spacing Scale
```typescript
const spacing = {
  xs: '4',    // 16px - Small spacing (between related elements)
  sm: '6',    // 24px - Medium spacing (between sections)
  md: '8',    // 32px - Large spacing (between major sections)
  lg: '12',   // 48px - Extra large spacing (between page sections)
  xl: '16',   // 64px - Maximum spacing (between major page areas)
  '2xl': '20', // 80px - Extra maximum spacing
  '3xl': '24', // 96px - Ultra maximum spacing
}
```

### Responsive Spacing
```typescript
const responsiveSpacing = {
  container: { mobile: '4', desktop: '8' },    // 16px → 32px
  content: { mobile: '6', desktop: '12' },     // 24px → 48px
  section: { mobile: '8', desktop: '16' },     // 32px → 64px
  page: { mobile: '12', desktop: '20' },       // 48px → 80px
}
```

### Pre-built Spacing Classes
```typescript
const spacingClasses = {
  containerPadding: 'p-4 md:p-8',           // Container padding
  contentPadding: 'p-6 md:p-12',            // Content padding
  bottomPadding: 'pb-8 md:pb-12',           // Bottom padding for scrollable content
  sectionMargin: 'mb-8 md:mb-12',           // Section margins
  gridGap: 'gap-4',                         // Grid gaps
  gridGapLarge: 'gap-6',                    // Large grid gaps
}
```

## 🏗️ Layout Components

### DashboardPage
Main wrapper component for all dashboard pages.

```tsx
import { DashboardPage } from '@/app/shared/layout/dashboard'

<DashboardPage>
  {/* Page content */}
</DashboardPage>
```

**Props:**
- `children: ReactNode` - Page content
- `className?: string` - Additional CSS classes

### DashboardPageHeader
Consistent header layout with proper spacing.

```tsx
import { DashboardPageHeader } from '@/app/shared/layout/dashboard'

<DashboardPageHeader>
  <DashboardPageTitle>Page Title</DashboardPageTitle>
  <Button>Action</Button>
</DashboardPageHeader>
```

**Props:**
- `children: ReactNode` - Header content
- `className?: string` - Additional CSS classes

### DashboardPageContent
Content area with proper spacing and scroll handling.

```tsx
import { DashboardPageContent } from '@/app/shared/layout/dashboard'

<DashboardPageContent>
  {/* Main content */}
</DashboardPageContent>
```

**Props:**
- `children: ReactNode` - Content
- `className?: string` - Additional CSS classes
- `addBottomPadding?: boolean` - Whether to add bottom padding (default: true)

### DashboardPageTitle
Consistent title styling across all pages.

```tsx
import { DashboardPageTitle } from '@/app/shared/layout/dashboard'

<DashboardPageTitle level="h1">Page Title</DashboardPageTitle>
```

**Props:**
- `children: ReactNode` - Title text
- `className?: string` - Additional CSS classes
- `level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'` - HTML heading level (default: 'h1')

## 📋 Usage Examples

### Basic Page Structure
```tsx
import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard'

export default function MyPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>My Page</DashboardPageTitle>
        <Button>Add Item</Button>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        {/* Your page content */}
      </DashboardPageContent>
    </DashboardPage>
  )
}
```

### Custom Spacing
```tsx
import { spacingClasses } from '@/app/shared/design-tokens/spacing'

// Use pre-built classes
<div className={spacingClasses.containerPadding}>
  Content with consistent padding
</div>

// Use individual spacing values
<div className={`p-${spacing.md} md:p-${spacing.lg}`}>
  Custom responsive padding
</div>
```

## 🎯 Benefits

### Consistency
- All pages follow the same layout structure
- Spacing is consistent across the application
- Easy to maintain and update

### Responsive Design
- Built-in responsive spacing
- Mobile-first approach
- Consistent breakpoints

### Developer Experience
- Reusable components reduce code duplication
- Type-safe spacing system
- Clear documentation and examples

### Performance
- Pre-built CSS classes reduce bundle size
- Consistent patterns improve rendering performance
- Better caching of styles

## 🔄 Migration Guide

### Before (Old Pattern)
```tsx
<div className="h-full flex flex-col">
  <div className="flex justify-between items-center mb-6">
    <h1 className="font-semibold font-heading text-xl">Title</h1>
    <Button>Action</Button>
  </div>
  <div className="flex-1 pb-8 md:pb-8">
    {/* Content */}
  </div>
</div>
```

### After (New Pattern)
```tsx
<DashboardPage>
  <DashboardPageHeader>
    <DashboardPageTitle>Title</DashboardPageTitle>
    <Button>Action</Button>
  </DashboardPageHeader>
  <DashboardPageContent>
    {/* Content */}
  </DashboardPageContent>
</DashboardPage>
```

## 🚀 Future Enhancements

- [ ] Add more layout variants (sidebar, full-width, etc.)
- [ ] Create form-specific layout components
- [ ] Add animation and transition utilities
- [ ] Create component-specific spacing tokens
- [ ] Add dark mode spacing variants
