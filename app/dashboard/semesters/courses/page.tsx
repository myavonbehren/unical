'use client'

import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';

export default function CoursesPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Courses</DashboardPageTitle>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Courses page coming soon...</p>
        </div>
      </DashboardPageContent>
    </DashboardPage>
  );
}