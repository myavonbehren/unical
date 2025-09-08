"use client";

import SideNav from '@/app/shared/layout/dashboard/SideNav';
import MobileSideNav from '@/app/shared/layout/dashboard/MobileSideNav';
import Header from '../shared/layout/Header';
import Footer from '../shared/layout/Footer';
import { SidebarProvider, useSidebar } from '../shared/layout/dashboard/SidebarContext';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile, setIsMobile } = useSidebar();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return (
    <div className="h-screen flex overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`
            ${isMobile 
              ? `fixed top-0 left-0 h-full z-50 w-3/4 transform transition-transform duration-300 ease-in-out ${
                  isCollapsed ? '-translate-x-full' : 'translate-x-0'
                }`
              : `w-64 flex-none transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'w-16' : 'w-64'
                }`
            }
            ${!isMobile && isCollapsed ? 'md:w-16' : ''}
          `}
        >
          {isMobile ? <MobileSideNav /> : <SideNav />}
        </div>
      
      {/* Main content area with header */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile overlay */}
        {isMobile && !isCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => useSidebar().toggleSidebar()}
          />
        )}
        
        {/* Header positioned next to sidebar */}
        <Header />
        
        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 bg-background">
          {children}
        </div>
        
      </div>
    </div>
    
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}