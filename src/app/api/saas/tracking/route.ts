
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Visitor tracking API route.
 * Fetches IP geolocation data and stores it in the database.
 */

export async function GET(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';
    
    // Get IP from headers (Next.js/Vercel standard)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    // 1. Fetch Geolocation Data (Server-side call avoids mixed content block)
    // We use http-api.com since the server-to-server call is allowed over HTTP if needed
    // However, if using their pro API you'd use HTTPS. 
    // Free version is restricted to HTTP.
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=61439`);
    const geoData = await geoResponse.json();

    if (geoData.status !== 'success') {
      return NextResponse.json({ error: 'Geo lookup failed' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Store in Database
    const { data, error } = await supabaseAdmin
      .from('visitors')
      .insert({
        ip: ip,
        city: geoData.city,
        region: geoData.regionName,
        country: geoData.country,
        country_code: geoData.countryCode,
        lat: geoData.lat,
        lon: geoData.lon,
        timezone: geoData.timezone,
        isp: geoData.isp,
        user_agent: userAgent,
        referrer: referrer,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, visitorId: data.id });

  } catch (err: any) {
    console.error('Visitor Tracking Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
