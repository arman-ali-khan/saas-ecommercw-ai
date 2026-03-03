
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview platform-level robots.txt generator.
 */

export async function GET(request: Request) {
    const host = request.headers.get('host') || 'dokanbd.shop';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const content = `User-agent: *
Allow: /
Disallow: /dashboard/
Sitemap: ${baseUrl}/sitemap.xml
`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
        }
    });
}
