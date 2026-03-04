
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Visitor tracking API route.
 * Fetches comprehensive IP geolocation data and stores it in the database.
 */

export async function GET(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referrer = request.headers.get('referer') || 'Direct';
    
    // Get IP from headers (Next.js/Vercel standard)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    // 1. Fetch Comprehensive Geolocation Data
    // Fields mapping to requested JSON structure
    const fields = 'status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,mobile,proxy,hosting,query';
    
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`);
    const geoData = await geoResponse.json();

    if (geoData.status !== 'success') {
      console.error("Geo lookup failed:", geoData.message);
      return NextResponse.json({ error: 'Geo lookup failed' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Store in Database with full mapping
    const { data, error } = await supabaseAdmin
      .from('visitors')
      .insert({
        ip: geoData.query,
        continent: geoData.continent,
        continent_code: geoData.continentCode,
        country: geoData.country,
        country_code: geoData.countryCode,
        region: geoData.regionName,
        city: geoData.city,
        district: geoData.district,
        zip: geoData.zip,
        lat: geoData.lat,
        lon: geoData.lon,
        timezone: geoData.timezone,
        utc_offset: geoData.offset,
        currency: geoData.currency,
        isp: geoData.isp,
        org: geoData.org,
        as_info: geoData.as,
        as_name: geoData.asname,
        is_mobile: geoData.mobile,
        is_proxy: geoData.proxy,
        is_hosting: geoData.hosting,
        user_agent: userAgent,
        referrer: referrer,
        dns_info: { geo: `${geoData.country} - ${geoData.org}`, ip: geoData.query } // Simplified DNS mock based on your example
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
