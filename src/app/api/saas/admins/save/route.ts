
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  const body = await request.json();
  const { id, fullName, username, email, password, domain, siteName, siteDescription, planId } = body;

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

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Verify caller is a SaaS Admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize Plan ID
    const finalPlanId = (planId && typeof planId === 'string') ? planId.toLowerCase().trim() : 'free';

    if (id) {
      // UPDATE EXISTING ADMIN
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: encrypt(fullName),
          username: encrypt(username),
          site_name: siteName,
          site_description: siteDescription,
          domain: domain,
          subscription_plan: finalPlanId
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, message: 'User updated successfully' });

    } else {
      // CREATE NEW ADMIN
      if (!email || !password || !username || !fullName || !domain || !siteName) {
        return NextResponse.json({ error: 'Missing required fields for new user' }, { status: 400 });
      }

      // Check if domain is already taken
      const { data: existingDomain } = await supabaseAdmin.from('profiles').select('id').eq('domain', domain).maybeSingle();
      if (existingDomain) {
        return NextResponse.json({ error: 'This domain is already in use.' }, { status: 409 });
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'admin',
        }
      });

      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

      // Update the automatically created profile row
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: encrypt(fullName),
          username: encrypt(username),
          email: encrypt(email),
          domain: domain,
          site_name: siteName,
          site_description: siteDescription || '',
          subscription_plan: finalPlanId,
          subscription_status: 'active',
          role: 'admin'
        })
        .eq('id', authData.user.id);

      if (profileError) {
        // Cleanup auth user on profile failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return NextResponse.json({ success: true, message: 'User created successfully' });
    }

  } catch (e: any) {
    console.error('API /saas/admins/save error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
