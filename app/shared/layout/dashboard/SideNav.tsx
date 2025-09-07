'use client';

import Link from 'next/link';
import NavLinks from '@/app/shared/layout/dashboard/NavLinks';
import { SettingsIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function SideNav() {
  const pathname = usePathname();
  
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2 bg-sidebar">
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md md:block"></div>
        <Link
          href="/dashboard/settings"
          className={clsx(
            'flex h-[48px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex-none md:justify-start md:p-2 md:px-3',
            {
              'bg-sidebar-accent text-sidebar-accent-foreground': pathname === '/dashboard/settings',
            },
          )}
        >
          <SettingsIcon className="w-6" />
          <span className="hidden md:block">Settings</span>
        </Link>
      </div>
    </div>
  );
}
