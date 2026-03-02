
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Mobile app API is currently disabled.' }, { status: 410 });
}
