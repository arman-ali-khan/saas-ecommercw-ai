
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
    
    // Listen for custom theme toggle events
    const handleToggle = () => applyTheme();
    window.addEventListener('theme-toggle', handleToggle);
    window.addEventListener('storage', applyTheme);
    
    return () => {
        window.removeEventListener('theme-toggle', handleToggle);
        window.removeEventListener('storage', applyTheme);
    };
  }, [defaultMode]);

  return null;
}
