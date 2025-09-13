'use client'

import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';

export default function OverviewPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Overview</DashboardPageTitle>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Welcome to your dashboard overview...</p>
        </div>
      </DashboardPageContent>
    </DashboardPage>
  );
}