"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const setIsMobileStable = React.useCallback((mobile: boolean) => {
    setIsMobile(mobile);
  }, []);

  // Update collapsed state when mobile state changes
  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true); // Collapse by default on mobile
    } else {
      setIsCollapsed(false); // Expand by default on desktop
    }
  }, [isMobile]);

  const contextValue = React.useMemo(() => ({
    isCollapsed,
    toggleSidebar,
    isMobile,
    setIsMobile: setIsMobileStable,
  }), [isCollapsed, toggleSidebar, isMobile, setIsMobileStable]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Safe version that returns null if not within provider
export function useSidebarSafe() {
  const context = useContext(SidebarContext);
  return context || null;
}
