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
        // This provider is for Site Admins. Only check the profiles table.
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (adminProfile) {
          const appUser: User = {
            id: adminProfile.id,
            username: adminProfile.username,
            fullName: adminProfile.full_name,
            email: session.user.email!,
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
          // User is authenticated but not found in the admin profiles table.
          // They are not an admin. Set user to null.
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
