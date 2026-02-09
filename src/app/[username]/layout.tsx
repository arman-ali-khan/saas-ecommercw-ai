import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import { createServerClient } from '@supabase/ssr';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import CustomerAuthInitializer from '@/components/auth/customer-auth-initializer';

// এখানে 'generateMetadata' নামটি যোগ করা হয়েছে
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params; 
  const cookieStore = await cookies(); 
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('site_name, site_description')
    .eq('domain', username)
    .single();

  if (!profile) {
    return {
      title: 'Store Not Found',
    };
  }

  return {
    title: profile.site_name,
    description: profile.site_description,
  };
}

export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <>
      <CustomerAuthInitializer /> 
      {children}
      <FixedCartButton username={username} />
      <FloatingChatButton />
    </>
  );
}