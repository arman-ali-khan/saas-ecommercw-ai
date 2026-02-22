
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RichTextRenderer from '@/components/saas-page-renderer';
import { CountdownBlock, CarouselBlock } from '@/components/client-blocks';
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

  switch (block.type) {
    case 'heading':
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return <Tag className={cn("text-3xl font-bold my-4", alignClass)}>{block.text}</Tag>;
    case 'paragraph':
      let content;
      try {
        const parsed = JSON.parse(block.text);
        // Basic check to see if it's a Tiptap object
        if (typeof parsed === 'object' && parsed !== null && parsed.type === 'doc') {
            content = parsed;
        } else {
            // It's valid JSON but not a Tiptap doc, wrap it
            throw new Error("Not a Tiptap doc");
        }
      } catch (e) {
        // Not a valid JSON string, treat as plain text
        content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: block.text || '' }] }] };
      }
      return (
        <div className={cn("my-4 text-lg prose dark:prose-invert max-w-full", alignClass)}>
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
        <div className={cn("my-4", alignClass)}>
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
            <div className="my-4 p-6 rounded-lg" style={{ backgroundColor: block.color || '#172554' }}>
                <p className="text-lg text-primary-foreground whitespace-pre-wrap"><SimpleMarkdown text={block.text} /></p>
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
            return null; // Or a placeholder in edit mode
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
            <div className="my-8 text-center">
                {block.title && <h2 className="text-3xl font-bold mb-4">{block.title}</h2>}
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
        const SocialIcon = {
            facebook: Facebook,
            twitter: Twitter,
            instagram: Instagram,
            linkedin: Linkedin,
            youtube: Youtube,
            none: () => null
        }[block.social_platform as string || 'none'] as React.ElementType;

        return (
            <Card className="my-6 border-2 shadow-md rounded-2xl overflow-hidden max-w-lg mx-auto">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
                            {block.reviewer_image ? (
                                <Image src={block.reviewer_image} alt={block.reviewer_name} width={56} height={56} className="object-cover" />
                            ) : (
                                <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-lg truncate">{block.reviewer_name}</h4>
                                {block.social_platform !== 'none' && (
                                    <div className="text-primary bg-primary/10 p-1.5 rounded-full shrink-0">
                                        <SocialIcon className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < (block.rating || 5) ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif leading-none">"</span>
                        <p className="text-muted-foreground italic leading-relaxed relative z-10">
                            {block.message}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    default:
      return (
        <pre className="bg-muted p-4 rounded-md my-4 text-xs overflow-x-auto">
          {JSON.stringify(block, null, 2)}
        </pre>
      );
  }
}
