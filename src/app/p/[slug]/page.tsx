
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SaasPageRenderer from '@/components/saas-page-renderer';

type Props = {
  params: { slug: string; };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: page } = await supabase.from('saas_pages').select('title').eq('slug', params.slug).eq('is_published', true).single();
  if (!page) return { title: 'Page Not Found' };

  return { title: page.title };
}

export default async function PublicSaasPage({ params }: Props) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: page } = await supabase.from('saas_pages').select('title, content').eq('slug', params.slug).eq('is_published', true).single();
  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8">{page.title}</h1>
      <SaasPageRenderer content={page.content} />
    </div>
  );
}
