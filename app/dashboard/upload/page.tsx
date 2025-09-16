'use client'

import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';
import { UploadZone } from '@/app/shared/components/UploadZone';

const handleFilesSelected = (files: File[]) => {
  console.log(files)
}

const handleFileRemove = (fileId: string) => {
  console.log(fileId)
}

export default function UploadPage() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageTitle>Upload</DashboardPageTitle>
      </DashboardPageHeader>
      
      <DashboardPageContent>
        <div className="text-center pb-4">
          <UploadZone onFilesSelected={handleFilesSelected} onFileRemove={handleFileRemove} />
        </div>
      </DashboardPageContent>
    </DashboardPage>
  );
}