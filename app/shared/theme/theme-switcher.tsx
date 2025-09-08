"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSidebarSafe } from "../layout/dashboard/SidebarContext";
import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/shared/ui/tooltip';

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const sidebarContext = useSidebarSafe();
  const isCollapsed = sidebarContext?.isCollapsed ?? false;
  const isMobile = sidebarContext?.isMobile ?? false;

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const themeButton = (
    <DropdownMenuTrigger asChild>
      <div className={clsx(
        'flex h-[48px] items-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
        {
          'justify-center': isCollapsed && !isMobile,
          'justify-start gap-2 p-3': isMobile,
          'justify-start md:p-1 md:px-3': !isMobile && !isCollapsed,
        }
      )}>
        {theme === "light" ? (
          <Sun
            key="light"
            size={ICON_SIZE}
            className={"text-foreground w-4"}
          />
        ) : theme === "dark" ? (
          <Moon
            key="dark"
            size={ICON_SIZE}
            className={"text-foreground w-4"}
          />
        ) : (
          <Laptop
            key="system"
            size={ICON_SIZE}
            className={"text-foreground w-4"}
          />
        )}
        <span className={clsx(
          "transition-opacity duration-200",
          isMobile ? "block" : isCollapsed ? "hidden" : "hidden md:block",
          isMobile ? "" : "ml-3"
        )}>
          {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
        </span>
      </div>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {!isMobile && isCollapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {themeButton}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        themeButton
      )}
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <Sun size={ICON_SIZE} className="text-foreground" />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <Moon size={ICON_SIZE} className="text-foreground" />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <Laptop size={ICON_SIZE} className="text-foreground" />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
