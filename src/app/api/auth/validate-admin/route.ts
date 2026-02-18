
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { email, domain } = await request.json();

    if (!email || !domain) {
      return NextResponse.json({ error: 'Email and domain are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch admins for this domain
    // We fetch by domain first as it is not encrypted and unique per site.
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('domain', domain)
      .eq('role', 'admin');

    if (error || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'This user is not a valid administrator for this site.' }, { status: 401 });
    }

    // 2. Find the profile with matching decrypted email
    const profile = profiles.find(p => decrypt(p.email) === email);

    if (!profile) {
      return NextResponse.json({ error: 'This user is not a valid administrator for this site.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Validate Admin API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
