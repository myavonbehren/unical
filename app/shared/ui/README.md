# UI Components

This directory contains reusable UI components for the UniCal application.

## Breadcrumb Component

A flexible and accessible breadcrumb navigation component.

### Features

- ✅ **Accessible** - Proper ARIA labels and semantic HTML
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Customizable** - Multiple sizes and separator options
- ✅ **Keyboard Navigation** - Focus management and keyboard support
- ✅ **Type Safe** - Full TypeScript support

### Usage

#### Basic Usage

```tsx
import Breadcrumb from '@/app/shared/ui/breadcrumb'

const items = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Courses', isActive: true }
]

<Breadcrumb items={items} />
```

#### With Custom Separator

```tsx
<Breadcrumb 
  items={items}
  separator={<span className="text-muted-foreground">/</span>}
/>
```

#### Different Sizes

```tsx
<Breadcrumb items={items} size="sm" />  // text-xs
<Breadcrumb items={items} size="md" />  // text-sm (default)
<Breadcrumb items={items} size="lg" />  // text-base
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | - | Array of breadcrumb items |
| `className` | `string` | `''` | Additional CSS classes |
| `separator` | `ReactNode` | `<ChevronRight />` | Custom separator element |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Text size variant |

### BreadcrumbItem Interface

```tsx
interface BreadcrumbItem {
  label: string        // Display text
  href?: string       // Link URL (optional)
  isActive?: boolean  // Whether this is the current page
}
```

### Accessibility Features

- **ARIA Labels**: Proper `aria-label` and `aria-current` attributes
- **Semantic HTML**: Uses `<nav>` and `<ol>` elements
- **Keyboard Navigation**: Focus management with visible focus rings
- **Screen Reader Support**: Hidden separators with `aria-hidden="true"`

### Styling

The component uses Tailwind CSS classes and follows the design system:

- **Colors**: Uses theme-aware colors (`text-muted-foreground`, `text-foreground`)
- **Hover States**: Smooth transitions on interactive elements
- **Focus States**: Visible focus rings for keyboard navigation
- **Typography**: Consistent font weights and sizes

### Examples

#### Courses Page Breadcrumb

```tsx
import CoursesBreadcrumb from './(ui)/courses-breadcrumb'

<CoursesBreadcrumb semesterId={semesterId} />
```

This creates a breadcrumb like: "Semesters > Fall 2025"

#### Custom Breadcrumb

```tsx
const items = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'Project Alpha', isActive: true }
]

<Breadcrumb items={items} size="lg" />
```

### Best Practices

1. **Keep it Simple**: Don't create overly deep breadcrumb trails
2. **Use Clear Labels**: Make breadcrumb labels descriptive and concise
3. **Current Page**: Always mark the current page with `isActive: true`
4. **Consistent Navigation**: Use the same breadcrumb structure across similar pages
5. **Mobile Friendly**: Test on mobile devices to ensure readability

### Integration with Layout Components

The breadcrumb component integrates seamlessly with the dashboard layout components:

```tsx
<DashboardPageHeader>
  <div className="flex flex-col gap-2">
    <Breadcrumb items={breadcrumbItems} />
    <p className="text-sm text-muted-foreground">Additional context</p>
  </div>
  <Button>Action</Button>
</DashboardPageHeader>
```
