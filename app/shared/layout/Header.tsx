"use client";

import { EnvVarWarning } from "@/app/shared/env-var-warning";
import { AuthButton } from "@/app/auth/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { PanelLeft } from "lucide-react";
import { useSidebarSafe } from "./dashboard/SidebarContext";

export default function Header() {
  const sidebar = useSidebarSafe();

  return (
    <nav className="w-full flex h-[65px] ml-2 bg-background border-b border-border">
      <div className="w-full flex items-center px-5">
        {/* Mobile panel toggle - only visible on mobile */}
        <div className="md:hidden">
          {sidebar && (
            <button
              onClick={sidebar.toggleSidebar}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Spacer for mobile layout */}
        <div className="flex-1 md:hidden"></div>
        
        {/* User info - positioned on the right */}
        <div className="flex items-center gap-2 md:ml-auto">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </div>
    </nav>
  );
}