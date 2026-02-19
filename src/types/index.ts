
export interface ProductImage {
  imageUrl: string;
  imageHint: string;
}

export interface ProductVariant {
  unit: string;
  price: number;
  stock: number;
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
  brand?: string[] | null;
  unit?: string[] | null;
  size?: string[] | null;
  color?: string[] | null;
  has_flash_deal?: boolean;
  flash_deal_price?: number;
  flash_deal_range?: { from?: Date; to?: Date };
  avg_rating?: number;
  review_count?: number;
  variants?: ProductVariant[] | null;
}

export interface ProductReview {
    id: string;
    created_at: string;
    site_id: string;
    product_id: string;
    customer_id?: string;
    customer_name: string;
    rating: number;
    title?: string;
    review_text: string;
    is_approved: boolean;
}

export interface ProductQna {
  id: string;
  created_at: string;
  site_id: string;
  product_id: string;
  customer_id?: string | null;
  customer_name: string;
  question: string;
  answer?: string | null;
  is_approved: boolean;
  answerer_name?: string | null;
  products?: { name: string, images: { imageUrl: string }[] } | null;
}

export interface CartItem extends Product {
  quantity: number;
  selected_unit?: string;
}

export interface FlashDeal {
  id: string;
  site_id: string;
  product_id: string;
  discount_price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  products: Product; // For joining data
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
    selected_unit?: string;
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
  subscription_status: 'active' | 'pending' | 'pending_verification' | 'inactive' | 'canceled' | 'failed' | null;
  last_subscription_from: string | null;
  product_limit: number | null;
  customer_limit: number | null;
  order_limit: number | null;
  subscription_end_date: string | null;
  language?: 'en' | 'bn';
  logo_type?: 'icon' | 'image';
  logo_icon?: string;
  logo_image_url?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string | null;
  description: string;
  features: string[];
  product_limit: number | null;
  customer_limit: number | null;
  order_limit: number | null;
}

export interface Category {
  id: number;
  site_id: string;
  name: string;
  description: string | null;
  created_at: string;
  icon: string;
  image_url?: string | null;
  card_color?: string | null;
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
    selected_unit?: string;
  }[];
  cart_total: number;
  status: string;
  created_at: string;
  is_viewed: boolean;
}

export interface SubscriptionPayment {
  id: number;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  status: 'pending' | 'pending_verification' | 'completed' | 'failed';
  created_at: string;
  subscription_from: string | null;
}

export interface SubscriptionPaymentWithDetails extends SubscriptionPayment {
  profiles: {
    full_name: string;
    username: string;
    email?: string;
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

export interface ProductAttribute {
  id: string;
  site_id: string;
  type: 'brand' | 'unit' | 'size' | 'tag' | 'color';
  value: string;
  created_at: string;
}

export interface StoreFeature {
  id: string;
  site_id: string;
  title: string;
  description: string | null;
  icon: string;
  order: number;
  created_at: string;
  image_url?: string | null;
}

export interface SaaSReview {
  id: string;
  created_at: string;
  name: string;
  company?: string;
  review_text: string;
  rating: number;
  is_approved: boolean;
  avatar_url?: string;
}

export interface SaasShowcaseItem {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  order: number;
  is_enabled: boolean;
  created_at: string;
}
    
export interface Address {
    id: string;
    customer_id: string;
    site_id: string;
    name: string;
    details: string; // Street address, etc.
    city: string;
    phone: string | null;
    type: 'home' | 'work' | 'other' | null;
    created_at: string;
};

export interface HeaderLink {
  id: string;
  site_id: string;
  label: string;
  href: string;
  order: number;
}

export interface FooterLink {
  id: string;
  site_id: string;
  category_id: string;
  label: string;
  href: string;
  order: number;
}

export interface FooterLinkCategory {
  id: string;
  site_id: string;
  title: string;
  order: number;
  links?: FooterLink[]; // For grouping in UI
  footer_links: FooterLink[];
}

export interface SocialLink {
  id: string;
  site_id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin';
  href: string;
}
