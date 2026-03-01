
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Product, Page } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview store-level sitemap.xml generator.
 * Lists store home, products, and custom pages.
 */

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    
    // Determine the base URL from request headers.
    const host = request.headers.get('host') || `${username}.schoolbd.top`;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get site id from domain
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, updated_at')
        .eq('domain', username)
        .single();
    
    if (!profile) {
        return new NextResponse('Not Found', { status: 404 });
    }

    const siteId = profile.id;
    const siteLastMod = new Date(profile.updated_at).toISOString();

    const urls = [
        { loc: baseUrl, lastmod: siteLastMod, priority: '1.0' },
        { loc: `${baseUrl}/products`, lastmod: siteLastMod, priority: '0.8' },
        { loc: `${baseUrl}/about`, lastmod: siteLastMod, priority: '0.7' },
        { loc: `${baseUrl}/track-order`, lastmod: siteLastMod, priority: '0.5' },
    ];
    
    // Get all products for the site
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, updated_at')
        .eq('site_id', siteId);
        
    (products || []).forEach((product: any) => {
        urls.push({
            loc: `${baseUrl}/products/${product.id}`,
            lastmod: new Date(product.updated_at || siteLastMod).toISOString(),
            priority: '0.7'
        });
    });

    // Get all published pages for the site
    const { data: pages } = await supabaseAdmin
        .from('pages')
        .select('slug, updated_at')
        .eq('site_id', siteId)
        .eq('is_published', true);

    (pages || []).forEach((page: any) => {
         urls.push({
            loc: `${baseUrl}/pages/${page.slug}`,
            lastmod: new Date(page.updated_at).toISOString(),
            priority: '0.6'
        });
    });
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
        }
    });
}
