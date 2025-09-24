'use client'

import { useEffect } from 'react'
import { 
  DashboardPage, 
  DashboardPageHeader, 
  DashboardPageContent, 
  DashboardPageTitle 
} from '@/app/shared/layout/dashboard';
import { UploadZone } from '@/app/shared/components/UploadZone';
import { initializePdfJs } from '@/lib/openai/pdfjs-setup';

const handleFilesSelected = (files: File[]) => {
  console.log(files)
}

const handleFileRemove = (fileId: string) => {
  console.log(fileId)
}

export default function UploadPage() {
  // Initialize PDF.js when the component mounts
  useEffect(() => {
    initializePdfJs().catch(console.error)
  }, [])

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