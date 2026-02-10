
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
  subscription_status: 'active' | 'pending' | 'inactive' | 'canceled' | 'pending_verification' | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
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

export interface SubscriptionPayment {
  id: number;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'pending_verification';
  created_at: string;
}

export interface SubscriptionPaymentWithDetails extends SubscriptionPayment {
  profiles: {
    full_name: string;
    username: string;
  } | null;
  plans: {
    name: string;
  } | null;
}

export interface Notification {
    id: string;
    created_at: string;
    recipient_id: string;
    recipient_type: 'admin' | 'customer';
    site_id: string;
    order_id: string | null;
    message: string;
    is_read: boolean;
    link: string | null;
}
