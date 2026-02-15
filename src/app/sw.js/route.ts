
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const content = `
    self.addEventListener('install', (event) => {
      console.log('Service worker installing...');
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      console.log('Service worker activating.');
    });

    self.addEventListener('fetch', (event) => {
      event.respondWith(fetch(event.request));
    });
  `;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/', 
    }
  });
}
