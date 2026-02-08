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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        // User is logged in, check for profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Profile exists, set user in state
          const appUser: User = {
            id: profile.id,
            username: profile.username,
            fullName: profile.full_name,
            email: session.user.email!,
            domain: profile.domain,
            siteName: profile.site_name,
            siteDescription: profile.site_description,
            subscriptionPlan: profile.subscription_plan,
            subscription_status: profile.subscription_status,
            role: profile.role,
            isSaaSAdmin: profile.role === 'saas_admin',
          };
          setUser(appUser);
        } else {
            // Profile does not exist, likely a new user after email confirmation.
            // Try to create profile from user metadata.
            const { user_metadata } = session.user;
            if (user_metadata.username && user_metadata.domain) {
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: session.user.id,
                        username: user_metadata.username,
                        full_name: user_metadata.full_name,
                        domain: user_metadata.domain,
                        site_name: user_metadata.site_name,
                        site_description: user_metadata.site_description,
                        subscription_plan: user_metadata.subscription_plan,
                        subscription_status: user_metadata.subscription_status,
                        role: user_metadata.role || 'admin',
                    })
                    .select()
                    .single();
                
                if (newProfile && !insertError) {
                    // Profile created, now create payment record if applicable
                    const { subscription_plan, payment_method, transaction_id } = user_metadata;
                    if (subscription_plan && subscription_plan !== 'free' && payment_method && transaction_id) {
                        const planPrices: { [key: string]: number } = {
                            pro: 999,
                            enterprise: 0,
                        };
                        const amount = planPrices[subscription_plan as keyof typeof planPrices] ?? 0;
                        
                        const { error: paymentError } = await supabase
                            .from('subscription_payments')
                            .insert({
                                user_id: newProfile.id,
                                plan_id: subscription_plan,
                                amount: amount,
                                payment_method: payment_method,
                                transaction_id: transaction_id,
                                status: 'pending', // Set initial status to pending
                            });

                        if (paymentError) {
                            // This is a non-fatal error for the user session, but needs logging for manual intervention.
                            console.error("CRITICAL: Failed to create subscription_payments record for new user. This is likely due to a missing RLS policy for INSERT on the 'subscription_payments' table. Error:", paymentError);
                        }
                    }

                     const appUser: User = {
                        id: newProfile.id,
                        username: newProfile.username,
                        fullName: newProfile.full_name,
                        email: session.user.email!,
                        domain: newProfile.domain,
                        siteName: newProfile.site_name,
                        siteDescription: newProfile.site_description,
                        subscriptionPlan: newProfile.subscription_plan,
                        subscription_status: newProfile.subscription_status,
                        role: newProfile.role,
                        isSaaSAdmin: newProfile.role === 'saas_admin',
                    };
                    setUser(appUser);
                } else {
                    console.error("Failed to create user profile. This is likely due to a missing RLS policy on the 'profiles' table. Error:", insertError);
                    await supabase.auth.signOut();
                    setUser(null);
                }
            } else {
                // User has session but no profile and no metadata. This is an invalid state.
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
