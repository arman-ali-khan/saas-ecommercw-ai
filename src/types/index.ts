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
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  domain: string;
  siteName: string;
  siteDescription: string | null;
  subscriptionPlan: string | null;
  role: string | null;
  isSaaSAdmin: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string | null;
  description: string;
  features: string[];
}
