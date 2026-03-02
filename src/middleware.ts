
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // ১. সিস্টেম ফাইল এবং এপিআই এন্ডপয়েন্টের জন্য রিরাইট স্কিপ করা
  const globalSystemFiles = ['/favicon.ico', '/sw.js', '/manifest.json', '/robots.txt', '/sitemap.xml', '/logo.png'];
  
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    globalSystemFiles.includes(url.pathname)
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  
  // হোস্টনেম ক্লিন করা (www সরানো এবং ছোট হাতের অক্ষরে রূপান্তর)
  // উদাহরণ: dokanbd.shop অথবা store1.schoolbd.top
  const curHost = hostname.replace('www.', '').split(':')[0].toLowerCase();
  
  // রুট ডোমেইন বা লোকালহোস্ট হলে প্ল্যাটফর্ম ল্যান্ডিং পেজ দেখানো
  const isRoot = curHost === rootDomain || curHost.includes('vercel.app') || curHost.includes('localhost') || curHost.includes('workstation');
  
  if (isRoot) {
      return NextResponse.next();
  }

  let username = '';

  // ২. ইউজারনেম (Slug) বের করা
  
  // কেস এ: সাব-ডোমেইন (যেমন: store1.schoolbd.top)
  if (curHost.endsWith(`.${rootDomain}`)) {
    username = curHost.replace(`.${rootDomain}`, '');
  } 
  // কেস বি: কাস্টম ডোমেইন (যেমন: dokanbd.shop)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // ডাটাবেস থেকে কাস্টম ডোমেইন দিয়ে স্টোর ইউজারনেম খোঁজা
            // এটি আপনার ডাটাবেসে থাকা "dokanbd.shop" এর সাথে হুবহু মিলবে
            const { data, error } = await supabase
                .from('profiles')
                .select('domain')
                .eq('custom_domain', curHost)
                .maybeSingle();
            
            if (data?.domain && !error) {
                username = data.domain;
            }
        }
    } catch (e) {
        console.error('Custom domain resolution error:', e);
    }
  }

  // ৩. ডাইনামিক রুটে ইন্টারনাল রিরাইট করা
  if (username && username !== 'www') {
    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // কোনো স্টোর না পাওয়া গেলে ল্যান্ডিং পেজে ফেরত পাঠানো
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
