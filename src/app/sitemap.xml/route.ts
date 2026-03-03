
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview platform-level sitemap.xml generator.
 * Lists main landing pages and public SaaS pages.
 */

export async function GET(request: Request) {
    const host = request.headers.get('host') || 'dokanbd.shop';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const urls = [
        { loc: baseUrl, lastmod: new Date().toISOString(), priority: '1.0' },
        { loc: `${baseUrl}/about`, lastmod: new Date().toISOString(), priority: '0.8' },
        { loc: `${baseUrl}/get-started`, lastmod: new Date().toISOString(), priority: '0.8' },
        { loc: `${baseUrl}/login`, lastmod: new Date().toISOString(), priority: '0.5' },
        { loc: `${baseUrl}/register`, lastmod: new Date().toISOString(), priority: '0.5' },
    ];

    // Fetch SaaS pages
    try {
        const { data: pages } = await supabaseAdmin
            .from('saas_pages')
            .select('slug, updated_at')
            .eq('is_published', true);

        if (pages) {
            pages.forEach(page => {
                urls.push({
                    loc: `${baseUrl}/p/${page.slug}`,
                    lastmod: new Date(page.updated_at).toISOString(),
                    priority: '0.6'
                });
            });
        }
    } catch (e) {
        console.error('Error fetching SaaS pages for sitemap:', e);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
        }
    });
}
