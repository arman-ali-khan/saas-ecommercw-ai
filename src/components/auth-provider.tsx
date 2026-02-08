'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

const SAAS_ADMIN_EMAIL = 'admin@banglanaturals.com';

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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        if (session.user.email === SAAS_ADMIN_EMAIL) {
          const adminUser: User = {
            id: 'saas-admin',
            username: 'saas-admin',
            fullName: 'SaaS Admin',
            email: SAAS_ADMIN_EMAIL,
            isSaaSAdmin: true,
            domain: '',
            siteName: 'SaaS Platform',
            siteDescription: null,
            subscriptionPlan: 'enterprise',
            role: 'saas_admin',
          };
          setUser(adminUser);
        } else {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const appUser: User = {
              id: profile.id,
              username: profile.username,
              fullName: profile.full_name,
              email: session.user.email!,
              domain: profile.domain,
              siteName: profile.site_name,
              siteDescription: profile.site_description,
              subscriptionPlan: profile.subscription_plan,
              role: profile.role,
              isSaaSAdmin: false,
            };
            setUser(appUser);
          } else {
            // Handle case where profile doesn't exist or there was an error
            setUser(null);
          }
        }
      } else {
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
