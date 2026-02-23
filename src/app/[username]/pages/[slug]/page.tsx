import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageBlock } from '@/components/page-block-renderer';

type Props = {
  params: { slug: string; username: string };
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', params.username).single();
  if (!site) return { title: 'Page Not Found' };
  
  const { data: page } = await supabase.from('pages').select('title').eq('site_id', site.id).eq('slug', params.slug).eq('is_published', true).single();
  if (!page) return { title: 'Page Not Found' };

  return { title: page.title };
}

export default async function CustomPage({ params }: Props) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', params.username).single();
  if (!site) notFound();

  const { data: page } = await supabase.from('pages').select('title, content').eq('site_id', site.id).eq('slug', params.slug).eq('is_published', true).single();
  if (!page) notFound();

  const contentBlocks = Array.isArray(page.content) ? page.content : [];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8">{page.title}</h1>
      
      {contentBlocks.length > 0 ? (
        contentBlocks.map((block, index) => <PageBlock key={block.id || index} block={block} username={params.username} siteId={site.id} />)
      ) : (
        <p className="text-muted-foreground">This page has no content yet.</p>
      )}
    </div>
  );
}
