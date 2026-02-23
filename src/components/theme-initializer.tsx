
'use client';

import { useEffect } from 'react';

interface ThemeInitializerProps {
  defaultMode: string;
}

export default function ThemeInitializer({ defaultMode }: ThemeInitializerProps) {
  useEffect(() => {
    const applyTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const targetTheme = savedTheme || defaultMode || 'light';
        
        if (targetTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    };

    applyTheme();
    
    // Watch for manual changes in other tabs
    window.addEventListener('storage', applyTheme);
    return () => window.removeEventListener('storage', applyTheme);
  }, [defaultMode]);

  return null;
}
