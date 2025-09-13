'use client';

import Link from 'next/link';
import NavLinks from '@/app/shared/layout/dashboard/NavLinks';
import { SettingsIcon, PanelLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ThemeSwitcher } from "@/app/shared/theme/theme-switcher";
import { useSidebar } from './SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/components/ui/tooltip';

export default function SideNav() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  return (
    <div className={clsx(
      "flex h-full flex-col bg-sidebar border-r border-border",
      isCollapsed ? "px-2" : "px-3 md:px-2"
    )}>
      {/* Header section with toggle and logo */}
      <div className="flex items-center border-b border-border py-2">
        {/* Toggle button - PanelLeft on desktop */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'flex h-[48px] items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            {
              'justify-center': isCollapsed,
              'justify-start': !isCollapsed,
            }
          )}
        >
          <PanelLeft className="w-4" />
        </button>
        
        {/* UniCal Logo */}
        <div className={clsx(
          "flex items-center h-[48px] ml-2 font-semibold font-heading text-xl transition-opacity duration-200",
          isCollapsed ? "hidden" : "block"
        )}>
          UniCal
        </div>
      </div>
      
      <div className="flex grow flex-col justify-between space-y-2 py-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md md:block"></div>
        <ThemeSwitcher />
        
        <TooltipProvider>
          {(() => {
            const settingsLink = (
              <Link
                href="/dashboard/settings"
                className={clsx(
                  'flex h-[48px] items-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  {
                    'bg-accent text-accent-foreground': pathname === '/dashboard/settings',
                    'bg-sidebar': pathname !== '/dashboard/settings',
                    'justify-center': isCollapsed,
                    'justify-start md:p-1 md:px-3': !isCollapsed,
                  },
                )}
              >
                <SettingsIcon className="w-4" />
                <span className={clsx(
                  "transition-opacity duration-200 ml-3",
                  isCollapsed ? "hidden" : "hidden md:block"
                )}>Settings</span>
              </Link>
            );

            // Show tooltip only when collapsed on desktop
            if (isCollapsed) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {settingsLink}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return settingsLink;
          })()}
        </TooltipProvider>
        
      </div>
    </div>
  );
}
