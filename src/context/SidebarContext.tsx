'use client';

import { createContext, useContext } from 'react';

type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggleSidebar: () => {}, // Default noop
});

export const useSidebar = () => useContext(SidebarContext);
