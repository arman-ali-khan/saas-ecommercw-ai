
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
    // We don't strictly need username here as we use the current host header,
    // but we await params to satisfy Next.js 15 requirements for dynamic routes.
    await params;
    
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const content = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
        }
    });
}
