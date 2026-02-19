import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // A minimal, valid service worker required for PWA installation criteria.
  const content = `
    const CACHE_NAME = 'bangla-naturals-v1';
    
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(clients.claim());
    });

    self.addEventListener('fetch', (event) => {
      // The presence of a fetch handler is a requirement for PWA installability.
      // We'll just pass through the request to the network.
      event.respondWith(fetch(event.request));
    });
  `;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
