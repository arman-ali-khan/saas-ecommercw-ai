
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Mobile app API is currently disabled.' }, { status: 410 });
}
