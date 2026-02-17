
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { customerId, siteId, updates, newPassword } = await request.json();

        if (!customerId || !siteId) {
            return NextResponse.json({ error: 'Missing customer or site ID.' }, { status: 400 });
        }

        if (!updates && !newPassword) {
            return NextResponse.json({ error: 'No update information provided.' }, { status: 400 });
        }
        
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const updatePayload: { [key: string]: any } = {};
        if (updates?.full_name) {
            updatePayload.full_name = updates.full_name;
        }
        if (newPassword) {
            updatePayload.password_hash = await bcrypt.hash(newPassword, 10);
        }

        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('customer_profiles')
            .update(updatePayload)
            .eq('id', customerId)
            .eq('site_id', siteId)
            .select()
            .single();

        if (updateError) {
            console.error("Update profile API - Update Error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        const { password_hash, ...safeUser } = updatedProfile;

        return NextResponse.json({ customer: safeUser }, { status: 200 });

    } catch (e: any) {
        console.error("Update profile API - Catch Error:", e.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
