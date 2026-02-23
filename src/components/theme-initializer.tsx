
'use client';

import { useEffect } from 'react';

interface ThemeInitializerProps {
  defaultMode: string;
}

export default function ThemeInitializer({ defaultMode }: ThemeInitializerProps) {
  useEffect(() => {
    // 1. Check manual override in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // 2. Determine target theme (saved override OR database default)
    const targetTheme = savedTheme || defaultMode;
    
    // 3. Apply to document
    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [defaultMode]);

  return null;
}
