
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  params: { slug: string; username: string };
};

const SimpleMarkdown = ({ text }: { text: string }) => {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
};


function PageBlock({ block }: { block: any }) {
  if (!block || !block.type) {
    return null;
  }

  switch (block.type) {
    case 'heading':
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return <Tag className="text-3xl font-bold my-4">{block.text}</Tag>;
    case 'paragraph':
      return <p className="my-4 text-lg text-muted-foreground whitespace-pre-wrap"><SimpleMarkdown text={block.text} /></p>;
    case 'image':
      return (
        <div className="relative my-6 aspect-video overflow-hidden rounded-lg">
          <Image src={block.src} alt={block.alt || ''} fill className="object-cover" />
        </div>
      );
    case 'button':
      return (
        <div className="my-4">
          <Button asChild variant={block.variant || 'default'} size="lg">
            <Link href={block.href || '#'}>{block.text || 'Click Me'}</Link>
          </Button>
        </div>
      );
    case 'youtube':
        return (
          <div className="relative my-6 aspect-video overflow-hidden rounded-lg">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${block.videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
    case 'coloredBox':
        return (
            <div className="my-4 p-6 rounded-lg" style={{ backgroundColor: block.color || '#172554' }}>
                <p className="text-lg text-primary-foreground whitespace-pre-wrap"><SimpleMarkdown text={block.text} /></p>
            </div>
        );
    default:
      return (
        <pre className="bg-muted p-4 rounded-md my-4 text-xs overflow-x-auto">
          {JSON.stringify(block, null, 2)}
        </pre>
      );
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', params.username).single();
  if (!site) return { title: 'Page Not Found' };
  
  const { data: page } = await supabase.from('pages').select('title').eq('site_id', site.id).eq('slug', params.slug).eq('is_published', true).single();
  if (!page) return { title: 'Page Not Found' };

  return { title: page.title };
}

export default async function CustomPage({ params }: Props) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
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
        contentBlocks.map((block, index) => <PageBlock key={block.id || index} block={block} />)
      ) : (
        <p className="text-muted-foreground">This page has no content yet.</p>
      )}
    </div>
  );
}
