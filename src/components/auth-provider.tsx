'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';
import { usePathname } from 'next/navigation';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setSession, setLoading } = useAuth();
  const pathname = usePathname();

  const getSiteIdFromPath = () => {
    const segments = pathname.split('/').filter(Boolean);
    const KNOWN_ROOT_PATHS = [
      'admin', 'login', 'register', 'profile', 'get-started', 
      'dashboard', 'products', 'about', 'checkout', 'api'
    ];
    if (segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0])) {
      return segments[0];
    }
    return null;
  }

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        // First, check if the user is a site owner/admin
        const { data: adminProfile, error: adminError } = await supabase
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
        } else if (adminError && adminError.code === 'PGRST116') {
          // Not found in profiles, so check if they are a customer for the current site
          const domain = getSiteIdFromPath();
          if (domain) {
            const { data: site } = await supabase.from('profiles').select('id').eq('domain', domain).single();
            if (site) {
               const { data: customerProfile } = await supabase
                .from('customer_profiles')
                .select('*')
                .eq('id', session.user.id)
                .eq('site_id', site.id)
                .single();

                if (customerProfile) {
                  const appUser: User = {
                    id: customerProfile.id,
                    username: customerProfile.email.split('@')[0],
                    fullName: customerProfile.full_name,
                    email: session.user.email!,
                    role: 'customer',
                    domain: '',
                    siteName: '',
                    siteDescription: null,
                    subscriptionPlan: null,
                    subscription_status: 'active',
                    isSaaSAdmin: false,
                  };
                  setUser(appUser);
                } else {
                  // User exists in auth but isn't the admin or a customer of this specific site.
                  // Don't set a user object. The login page will show an error.
                  setUser(null);
                }
            } else {
               setUser(null);
            }
          } else {
             // We are on a SaaS page (e.g. /login), and user is not an admin.
             setUser(null);
          }
        } else {
            // Some other database error occurred
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
  }, [setUser, setSession, setLoading, pathname]);

  return <>{children}</>;
}
