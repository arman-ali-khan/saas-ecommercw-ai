import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const manifest = {
    name: 'DokanBD - দোকানবিডি',
    short_name: 'DokanBD',
    description: 'Modern Multi-tenant E-commerce SaaS Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#3b82f6',
    icons: [
      {
        src: 'https://picsum.photos/seed/ehut/192/192',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'https://picsum.photos/seed/ehut/512/512',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };

  return NextResponse.json(manifest);
}
