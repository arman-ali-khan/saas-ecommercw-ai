
import type { Metadata } from 'next';
import { getProductById } from '@/lib/products';
import ProductClientPage from './product-client-page';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string, username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductById(params.id, params.username);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.images[0]?.imageUrl || '',
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductById(params.id, params.username);

  if (!product) {
    notFound();
  }

  return <ProductClientPage product={product} />;
}
