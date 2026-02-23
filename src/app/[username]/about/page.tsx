
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageBlock } from '@/components/page-block-renderer';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', username).maybeSingle();
  if (!site) return { title: 'About Us' };

  const { data: page } = await supabase.from('pages').select('title').eq('site_id', site.id).eq('slug', 'about').eq('is_published', true).maybeSingle();
  
  return {
    title: page?.title || 'About Us',
  };
}

export default async function AboutPage({ params }: Props) {
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

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', username).maybeSingle();
  if (!site) notFound();

  const { data: page } = await supabase.from('pages').select('title, content').eq('site_id', site.id).eq('slug', 'about').eq('is_published', true).maybeSingle();
  
  if (!page) {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8">About Us</h1>
            <p className="text-muted-foreground">The content for this page has not been created yet. Please visit the Page Manager in your admin dashboard and create a new page with the slug "about" to populate this page.</p>
        </div>
    )
  }

  const contentBlocks = Array.isArray(page.content) ? page.content : [];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8">{page.title}</h1>
      
      {contentBlocks.length > 0 ? (
        contentBlocks.map((block, index) => <PageBlock key={block.id || index} block={block} username={username} siteId={site.id} />)
      ) : (
        <p className="text-muted-foreground">This page has no content yet.</p>
      )}
    </div>
  );
}
