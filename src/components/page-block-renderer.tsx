
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductShowcaseBlock } from '@/components/product-card';

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

const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
}

export function PageBlock({ block, username }: { block: any, username: string }) {
  if (!block || !block.type) {
    return null;
  }
  
  const alignClass = block.align ? alignmentClasses[block.align as keyof typeof alignmentClasses] : 'text-left';

  switch (block.type) {
    case 'heading':
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return <Tag className={cn("text-3xl font-bold my-4", alignClass)}>{block.text}</Tag>;
    case 'paragraph':
      return <p className={cn("my-4 text-lg text-muted-foreground whitespace-pre-wrap", alignClass)}><SimpleMarkdown text={block.text} /></p>;
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
                            <PageBlock key={innerBlock.id || index} block={innerBlock} username={username} />
                        ))}
                    </div>
                ))}
            </div>
        );
    case 'product_showcase':
        return <ProductShowcaseBlock product_ids={block.product_ids} title={block.title} username={username} />;
    default:
      return (
        <pre className="bg-muted p-4 rounded-md my-4 text-xs overflow-x-auto">
          {JSON.stringify(block, null, 2)}
        </pre>
      );
  }
}
