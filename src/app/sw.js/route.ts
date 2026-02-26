import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // A standard, installable service worker.
  const content = `
    const CACHE_NAME = 'ehut-v1';
    
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(clients.claim());
    });

    self.addEventListener('fetch', (event) => {
      // Required for PWA installability
      if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request));
      }
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
