import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';

/**
 * @fileOverview Fetches comprehensive details for a specific site admin.
 * Includes profile info, product list, customer list, and aggregated stats.
 */

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1. Verify Authentication & Authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch Data in Parallel
    // We fetch the profile first, then use its subscription_plan ID to get the plan
    // This avoids "could not find a relationship" errors in PostgREST
    const [
        profileRes,
        productsRes,
        customersRes,
        ordersCountRes
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', id).single(),
        supabaseAdmin.from('products').select('*').eq('site_id', id).order('created_at', { ascending: false }),
        supabaseAdmin.from('customer_profiles').select('*').eq('site_id', id).order('created_at', { ascending: false }),
        supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('site_id', id)
    ]);

    if (profileRes.error) throw profileRes.error;

    const profileData = profileRes.data;
    
    // Fetch plan details separately for robustness
    let planData = null;
    if (profileData.subscription_plan) {
        const { data: plan } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', profileData.subscription_plan)
            .maybeSingle();
        planData = plan;
    }

    // 3. Process and Decrypt Data
    // Attach plan to profile object to maintain frontend compatibility
    const decryptedProfile = decryptObject({
        ...profileData,
        plans: planData ? [planData] : []
    });
    
    const decryptedCustomers = (customersRes.data || []).map(c => decryptObject(c));
    const products = productsRes.data || [];

    return NextResponse.json({
        profile: decryptedProfile,
        products: products,
        customers: decryptedCustomers,
        stats: {
            totalProducts: products.length,
            totalCustomers: decryptedCustomers.length,
            totalOrders: ordersCountRes.count || 0
        }
    }, { status: 200 });

  } catch (err: any) {
    console.error('API /saas/admins/get-details Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
