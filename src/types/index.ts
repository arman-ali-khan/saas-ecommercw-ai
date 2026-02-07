import type { PlaceHolderImages } from '@/lib/placeholder-images';

export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  images: typeof PlaceHolderImages;
  origin: string;
  story: string;
}

export interface CartItem extends Product {
  quantity: number;
}
