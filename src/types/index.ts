
export interface ProductImage {
  imageUrl: string;
  imageHint: string;
}

export interface Product {
  id: string; // This is the slug, e.g., 'mango-himsagar'
  site_id: string; // The user's ID
  name: string;
  description: string;
  long_description: string;
  price: number;
  currency: string;
  images: ProductImage[];
  origin: string;
  story: string;
  categories: string[];
  is_featured: boolean;
  created_at: string;
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

export interface Category {
  id: number;
  site_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UncompletedOrder {
  id: string;
  customer_info: {
      name?: string;
      address?: string;
      city?: string;
      phone?: string;
  };
  cart_items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  cart_total: number;
  status: string;
  created_at: string;
}
