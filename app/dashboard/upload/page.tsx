'use client'

import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';
import { UploadZone } from '@/app/shared/components/UploadZone';

export default function UploadPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Upload</DashboardPageTitle>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        <div className="text-center pb-4">
          <UploadZone onFilesSelected={() => {}} onFileRemove={() => {}} />
        </div>
      </DashboardPageContent>
    </DashboardPage>
  );
}