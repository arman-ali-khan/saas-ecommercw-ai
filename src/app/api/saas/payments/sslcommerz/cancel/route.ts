import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;
    
    try {
        const formData = await req.formData();
        const tran_id = formData.get('tran_id') as string;
        if (tran_id && tran_id.startsWith('UPG')) {
            return NextResponse.redirect(`${origin}/admin/settings?payment=cancelled`, 303);
        }
    } catch (e) {}

    return NextResponse.redirect(`${origin}/get-started?step=payment&error=ssl_cancelled`, 303);
}
