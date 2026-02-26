
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RichTextRenderer from '@/components/saas-page-renderer';
import { CountdownBlock, CarouselBlock, ReviewsCarouselBlock } from '@/components/client-blocks';
import { ShowcaseOrderBlock } from '@/components/showcase-order-block';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, User, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
}

export async function PageBlock({ block, username, siteId }: { block: any, username: string, siteId: string }) {
  if (!block || !block.type) {
    return null;
  }
  
  const alignClass = block.align ? alignmentClasses[block.align as keyof typeof alignmentClasses] : 'text-left';
  const paddingClass = block.padding || 'p-0';
  const bgStyle = block.bg_image ? { backgroundImage: `url(${block.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};

  switch (block.type) {
    case 'heading':
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return (
        <div 
          className={cn("my-4 rounded-xl overflow-hidden", paddingClass, alignClass, block.bg_image && "text-white shadow-lg")}
          style={bgStyle}
        >
          <Tag className="text-3xl font-bold leading-tight drop-shadow-md">{block.text}</Tag>
        </div>
      );
    case 'paragraph':
      let content;
      try {
        const parsed = JSON.parse(block.text);
        if (typeof parsed === 'object' && parsed !== null && parsed.type === 'doc') {
            content = parsed;
        } else {
            throw new Error("Not a Tiptap doc");
        }
      } catch (e) {
        content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: block.text || '' }] }] };
      }
      return (
        <div 
          className={cn("my-4 rounded-xl overflow-hidden text-lg prose dark:prose-invert max-w-full", paddingClass, alignClass, block.bg_image && "text-white shadow-lg")}
          style={bgStyle}
        >
            <RichTextRenderer content={content} />
        </div>
      );
    case 'image':
      return (
        <div className="relative my-6 aspect-video overflow-hidden rounded-lg">
          <Image src={block.src} alt={block.alt || ''} fill className="object-cover" />
        </div>
      );
    case 'button':
      return (
        <div 
          className={cn("my-4 rounded-xl overflow-hidden", paddingClass, alignClass)}
          style={bgStyle}
        >
          <Button asChild variant={block.variant || 'default'} size="lg" className="shadow-md">
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
        const SimpleMarkdown = ({ text }: { text: string }) => {
            if (!text) return null;
            const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
            return (
                <>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
                    return part;
                })}
                </>
            );
        };
        return (
            <div 
              className={cn("my-4 rounded-xl overflow-hidden", paddingClass)} 
              style={{ ...bgStyle, backgroundColor: block.color || 'hsl(var(--card))' }}
            >
                <p className="text-lg text-primary-foreground whitespace-pre-wrap drop-shadow-sm"><SimpleMarkdown text={block.text} /></p>
            </div>
        );
    case 'layout':
        const gridClass = `md:grid-cols-${block.columnCount}`;
        return (
            <div className={cn("grid grid-cols-1 gap-6 my-6", gridClass)}>
                {(block.columns || []).map((column: any) => (
                    <div key={column.id}>
                        {(column.blocks || []).map((innerBlock: any, index: number) => (
                            <PageBlock key={innerBlock.id || index} block={innerBlock} username={username} siteId={siteId} />
                        ))}
                    </div>
                ))}
            </div>
        );
    case 'product_showcase':
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
        
        const all_ids = [block.main_product_id, ...(block.optional_product_ids || [])].filter(Boolean) as string[];

        if (all_ids.length === 0) {
            return null;
        }

        const { data: productsData, error } = await supabase
            .from('products')
            .select('*')
            .eq('site_id', siteId)
            .in('id', all_ids);
        
        if (error) {
            console.error("Error fetching products for showcase block:", error.message);
            return <div className="text-destructive my-4 p-4 border border-destructive/50 rounded-md">Error loading products for showcase.</div>;
        }

        const productMap = new Map((productsData || []).map(p => [p.id, p]));
        const orderedProducts = all_ids.map(id => productMap.get(id)).filter(Boolean) as Product[];

        return <ShowcaseOrderBlock 
            main_product_id={block.main_product_id} 
            main_product_unit={block.main_product_unit}
            optional_product_ids={block.optional_product_ids || []} 
            also_buy_title={block.also_buy_title} 
            username={username} 
            siteId={siteId}
            initialProducts={orderedProducts}
        />;
    case 'countdown':
        return (
            <div className="my-8 text-center p-10 rounded-[2rem]" style={{ backgroundColor: block.bg_color || 'transparent' }}>
                {block.title && <h2 className="text-3xl font-bold mb-6">{block.title}</h2>}
                <CountdownBlock endDate={block.endDate} />
            </div>
        );
    case 'carousel':
        return (
            <div className="my-8">
                <CarouselBlock slides={block.slides} />
            </div>
        );
    case 'review':
        return (
            <div className="my-8">
                <ReviewsCarouselBlock reviews={block.reviews || []} />
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
