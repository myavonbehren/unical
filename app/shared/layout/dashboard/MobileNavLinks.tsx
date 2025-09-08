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

export default function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] items-center gap-2 rounded-md p-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              {
                'bg-accent text-accent-foreground': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-4" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );
}
