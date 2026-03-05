// This file is removed and moved to src/app/manifest.json/route.ts
export async function GET() {
    return new Response('Moved to /manifest.json', { status: 301, headers: { 'Location': '/manifest.json' } });
}