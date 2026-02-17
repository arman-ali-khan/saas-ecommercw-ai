
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { customerId, siteId, newPassword } = await request.json();

        if (!customerId || !siteId || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const password_hash = await bcrypt.hash(newPassword, 10);

        const { error } = await supabaseAdmin
            .from('customer_profiles')
            .update({ password_hash })
            .eq('id', customerId)
            .eq('site_id', siteId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
