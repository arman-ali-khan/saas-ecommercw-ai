'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setSession, setLoading } = useAuth();

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        try {
          const response = await fetch('/api/auth/get-profile');
          if (response.ok) {
            const { profile: adminProfile } = await response.json();
            const appUser: User = {
              id: adminProfile.id,
              username: adminProfile.username,
              fullName: adminProfile.full_name,
              email: session.user.email!, // Email from session is reliable
              domain: adminProfile.domain,
              siteName: adminProfile.site_name,
              siteDescription: adminProfile.site_description,
              subscriptionPlan: adminProfile.subscription_plan,
              subscription_status: adminProfile.subscription_status,
              role: adminProfile.role,
              isSaaSAdmin: adminProfile.role === 'saas_admin',
            };
            setUser(appUser);
          } else {
            // API call failed or returned not-ok status (e.g., 404)
            console.error('Failed to fetch profile via API route');
            setUser(null);
          }
        } catch (e) {
          console.error('Error fetching profile via API route:', e);
          setUser(null);
        }

      } else {
        // No session, user is logged out.
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);

  return <>{children}</>;
}
