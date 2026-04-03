// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  slug?: string;
  name: string;
  nameBn?: string;
  icon?: string | null;
  color?: string;
  bgColor?: string;
  productCount?: number;
  parent_id?: string | null;
  parentId?: string | null;
  level?: number;
  children?: Category[];
}

// ─── Vendor summary (embedded in Product) ────────────────────────────────────
export interface VendorSummary {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
}

// ─── Product Variant ──────────────────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex?: string | null;
  price: number;
  stock: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  videoUrl?: string | null;
  highlights?: string | null;
  whatsInBox?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  containsLiquid?: boolean;
  containsFlammable?: boolean;
  warrantyType?: 'no_warranty' | 'brand_warranty' | 'seller_warranty' | null;
  warrantyPolicy?: string | null;
  returnPolicy?: string | null;
  variants?: ProductVariant[];
  categoryId: string;
  category: string;
  vendor: VendorSummary;
  rating: number;
  reviewCount: number;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  status?: string;
}

// ─── Vendor / SME ─────────────────────────────────────────────────────────────
export interface Vendor {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  categories: string[];
  location: string;
  district: string;
  memberSince: string;
  productCount: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  phone?: string;
  email?: string;
  facebook?: string;
  categorySlugs?: string[];
}

// ─── Blog Post ────────────────────────────────────────────────────────────────
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  authorImage: string;
  date: string;
  tags: string[];
  category: string;
  readTime: number;
  featured: boolean;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export type EventType = 'trade-fair' | 'workshop' | 'exhibition' | 'webinar' | 'networking';

export interface SmeEvent {
  id: string;
  title: string;
  description: string;
  image: string | null;
  date: string;
  endDate: string;
  location: string;
  type: EventType;
  organizer: string;
  venue: string;
  isFree: boolean;
  price: number | null;
  featured: boolean;
  registrationOpen: boolean;
  maxTickets: number | null;
  ticketsSold: number;
  ticketsRemaining: number | null;
}

// ─── Member (authenticated user) ─────────────────────────────────────────────
export interface Member {
  code: string;
  name: string;
  email: string;
  vendorId: string;
  role: 'vendor' | 'admin';
  membershipSubmitted?: boolean;
  membershipVerified?: boolean;
  registrationStatus: null | 'pending' | 'approved' | 'rejected';
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Site Stats ───────────────────────────────────────────────────────────────
export interface SiteStats {
  members: number;
  products: number;
  categories: number;
  events: number;
  districts: number;
  yearsActive: number;
}
