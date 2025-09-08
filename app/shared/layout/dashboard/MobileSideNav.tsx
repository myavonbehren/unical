'use client';

import Link from 'next/link';
import MobileNavLinks from '@/app/shared/layout/dashboard/MobileNavLinks';
import { SettingsIcon, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ThemeSwitcher } from "@/app/shared/theme/theme-switcher";
import { useSidebar } from './SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/ui/tooltip';

export default function MobileSideNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-border px-3">
      {/* Mobile header section with logo and close button */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        {/* UniCal Logo */}
        <div className="font-semibold font-heading text-xl ml-2">
          UniCal
        </div>
        
        {/* Close button - always on the right for mobile */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex flex-col h-full">
        {/* Main navigation links */}
        <div className="py-2">
          <MobileNavLinks />
        </div>
        
        {/* Spacer to push bottom items down */}
        <div className="flex-1"></div>
        
        {/* Bottom section with System and Settings */}
        <div className="py-2 space-y-2">
          <ThemeSwitcher />
          
          <TooltipProvider>
            {(() => {
              const settingsLink = (
                <Link
                  href="/dashboard/settings"
                  className={clsx(
                      'flex h-[48px] items-center gap-2 rounded-md p-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      {
                      'bg-accent text-accent-foreground': pathname === '/dashboard/settings',
                      'bg-sidebar': pathname !== '/dashboard/settings',
                    },
                  )}
                >
                  <SettingsIcon className="w-4" />
                  <span>Settings</span>
                </Link>
              );

              return settingsLink;
            })()}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
