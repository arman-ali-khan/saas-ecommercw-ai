
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Product, Page } from '@/types';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const generateSitemap = (urls: { loc: string; lastmod: string }[]) => {
    const urlset = urls.map(url => `
    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
};

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    
    // Determine the base URL from request headers.
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Get site id from domain
    const { data: profile } = await supabase
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
        { loc: baseUrl, lastmod: siteLastMod },
        { loc: `${baseUrl}/products`, lastmod: siteLastMod },
        { loc: `${baseUrl}/about`, lastmod: siteLastMod },
        { loc: `${baseUrl}/track-order`, lastmod: siteLastMod },
    ];
    
    // Get all published products for the site
    const { data: products } = await supabase
        .from('products')
        .select('id, created_at')
        .eq('site_id', siteId);
        
    (products as Pick<Product, 'id'|'created_at'>[] || []).forEach(product => {
        urls.push({
            loc: `${baseUrl}/products/${product.id}`,
            lastmod: new Date(product.created_at).toISOString()
        });
    });

    // Get all published pages for the site
    const { data: pages } = await supabase
        .from('pages')
        .select('slug, updated_at')
        .eq('site_id', siteId)
        .eq('is_published', true);

    (pages as Pick<Page, 'slug'|'updated_at'>[] || []).forEach(page => {
         urls.push({
            loc: `${baseUrl}/pages/${page.slug}`,
            lastmod: new Date(page.updated_at).toISOString()
        });
    });
    
    const sitemap = generateSitemap(urls);

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
        }
    });
}
