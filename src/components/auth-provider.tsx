
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
        // First, check if the user is a site owner/admin
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
          // If not an admin, check if they are a customer
          const { data: customerProfile } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (customerProfile) {
            const appUser: User = {
              id: customerProfile.id,
              username: customerProfile.email.split('@')[0], // Create a fallback username
              fullName: customerProfile.full_name,
              email: session.user.email!,
              role: 'customer',
              // Nullify site-owner specific fields
              domain: '',
              siteName: '',
              siteDescription: null,
              subscriptionPlan: null,
              subscription_status: 'active', // Customers are always active
              isSaaSAdmin: false,
            };
            setUser(appUser);
          } else {
            // User exists in auth but not in any profile table.
            // This might happen for users created before the trigger was active.
            console.error('User profile not found in `profiles` or `customer_profiles`. Signing out.');
            await supabase.auth.signOut();
            setUser(null);
          }
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
