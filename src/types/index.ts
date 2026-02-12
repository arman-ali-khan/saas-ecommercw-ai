

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
  stock?: number;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  site_id: string;
  customer_email: string;
  shipping_info: {
    name: string;
    address: string;
    city: string;
    phone: string;
    notes?: string;
    shipping_cost?: number;
    shipping_method_name?: string;
  };
  cart_items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  transaction_id: string | null;
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
  subscription_status: 'active' | 'pending' | 'inactive' | 'canceled' | null;
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

export interface ShippingZone {
  id: number;
  site_id: string;
  name: string;
  price: number;
  is_enabled: boolean;
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
  status: 'pending' | 'completed' | 'failed';
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

export interface Section {
  id: string;
  title: string;
  enabled: boolean;
  isCategorySection: boolean;
  category?: string;
}

export interface LiveChatMessage {
  id?: number;
  created_at?: string;
  conversation_id: string;
  site_id: string;
  sender_id?: string | null;
  sender_name: string;
  sender_type: 'customer' | 'agent';
  content: string;
  is_read?: boolean;
}

export interface Page {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  content: any; // For now, will refine later
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarouselSlide {
    id: string;
    site_id: string;
    image_url: string;
    title: string;
    description?: string | null;
    link?: string | null;
    link_text?: string | null;
    order: number;
    is_enabled: boolean;
    created_at: string;
}

export interface SaasFeature {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_at: string;
}

export interface SeoRequest {
    id: string;
    created_at: string;
    site_id: string;
    status: 'pending' | 'completed';
    notes?: string | null;
    product_count: number;
    user_name: string;
    user_email: string;
    site_domain: string;
    site_name: string;
}

    