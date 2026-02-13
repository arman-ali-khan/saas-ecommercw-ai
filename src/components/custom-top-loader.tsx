'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

export default function CustomTopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handlePopState = () => {
      NProgress.start();
      // A failsafe to end the progress bar
      setTimeout(() => NProgress.done(), 2000);
    };
    
    const originalPushState = window.history.pushState;
    if (originalPushState.toString().indexOf('nprogress') === -1) {
        window.history.pushState = function(...args) {
          NProgress.start();
          originalPushState.apply(window.history, args);
        };
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
        window.history.pushState = originalPushState;
        window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
