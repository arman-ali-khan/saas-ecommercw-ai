import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import { createServerClient } from '@supabase/ssr';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
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
    .eq('domain', params.username)
    .single();

  if (!profile) {
    return {
      title: 'Store Not Found',
      description: 'The requested store does not exist.',
    };
  }

  return {
    title: profile.site_name,
    description: profile.site_description,
  };
}


export default function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  return (
    <>
      {children}
      <FixedCartButton username={params.username} />
      <FloatingChatButton />
    </>
  );
}
