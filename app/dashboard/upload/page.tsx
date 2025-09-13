'use client'

import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';

export default function UploadPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Upload</DashboardPageTitle>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Upload page coming soon...</p>
        </div>
      </DashboardPageContent>
    </DashboardPage>
  );
}