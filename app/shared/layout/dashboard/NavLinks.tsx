'use client';

import {
  HomeIcon,
  CalendarIcon,
  BookTextIcon,
  UploadIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useSidebar } from './SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/ui/tooltip';


// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', 
    href: '/dashboard', 
    icon: HomeIcon },
  {
    name: 'Semesters',
    href: '/dashboard/semesters',
    icon: CalendarIcon,
  },
  {
    name: 'Courses',
    href: '/dashboard/courses',
    icon: BookTextIcon,
  },
  { name: 'Upload', 
    href: '/dashboard/upload', 
    icon: UploadIcon 
  }
];

export default function NavLinks() {
  const pathname = usePathname();
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <TooltipProvider>
      {links.map((link) => {
        const LinkIcon = link.icon;
        const linkContent = (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] items-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              {
                'bg-accent text-accent-foreground': pathname === link.href,
                'justify-center': isMobile || isCollapsed,
                'justify-start md:p-1 md:px-3': !isMobile && !isCollapsed,
              },
            )}
          >
            <LinkIcon className="w-4" />
            <p className={clsx(
              "transition-opacity duration-200 ml-3",
              isMobile ? "block" : isCollapsed ? "hidden" : "hidden md:block"
            )}>{link.name}</p>
          </Link>
        );

        // Show tooltip only when collapsed on desktop (not mobile)
        if (!isMobile && isCollapsed) {
          return (
            <Tooltip key={link.name}>
              <TooltipTrigger asChild>
                {linkContent}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{link.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return linkContent;
      })}
    </TooltipProvider>
  );
}
