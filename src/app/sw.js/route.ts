
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Return 404 to effectively disable the service worker which is causing server instability.
  return new NextResponse('Service worker not found.', {
    status: 404,
  });
}
