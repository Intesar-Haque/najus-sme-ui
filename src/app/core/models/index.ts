// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  nameBn: string;
  icon: string;           // nz-icon type
  color: string;
  bgColor: string;
  productCount: number;
}

// ─── Vendor summary (embedded in Product) ────────────────────────────────────
export interface VendorSummary {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
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
  categoryId: string;
  category: string;
  vendor: VendorSummary;
  rating: number;
  reviewCount: number;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
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
  image: string;
  date: string;
  endDate: string;
  location: string;
  type: EventType;
  organizer: string;
  isFree: boolean;
  price?: number;
  featured: boolean;
  registrationOpen: boolean;
}

// ─── Member (authenticated user) ─────────────────────────────────────────────
export interface Member {
  code: string;
  name: string;
  email: string;
  vendorId: string;
  role: 'vendor' | 'admin';
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
