'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SidebarProjectItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface SidebarProjectContextValue {
  projectId: string;
  projectTitle: string;
  activeView: string;
  items: SidebarProjectItem[];
  onNavigate: (viewId: string) => void;
}

const SidebarContext = createContext<{
  project: SidebarProjectContextValue | null;
  setProject: (value: SidebarProjectContextValue | null) => void;
}>({ project: null, setProject: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<SidebarProjectContextValue | null>(null);
  return (
    <SidebarContext.Provider value={{ project, setProject }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarProject() {
  const { project, setProject } = useContext(SidebarContext);
  const setSidebarProject = useCallback((value: SidebarProjectContextValue | null) => {
    setProject(value);
  }, []);
  return { project, setSidebarProject };
}
