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
  // Fix for QA bug #16 ("no way to understand if the 'Most Viewed' filter
  // works") — see SQA-FIX.md Fix #25. Real page-view tracking.
  viewCount: number;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  status?: string;
  // Fix for QA bug #68 ("business user should be able to view why their
  // product was rejected") — see SQA-FIX.md Fix #22. Only ever set on a
  // rejected (draft-status) product.
  rejectionReason?: string | null;
  // Fix for QA bugs #71/#72 ("Deleted tab shows nothing" / "no restore
  // feature") — see SQA-FIX.md Fix #6. Soft-delete leaves `status`
  // untouched, so this is the only reliable signal that a product is
  // actually in the trash.
  deletedAt?: string | null;
}

// Fix for QA bug #66 ("Not being able to rate any product") — see
// SQA-FIX.md Fix #3.
export interface ProductReview {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
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
  // Fix for QA bug #28 ("Read More" button did nothing — no blog detail
  // page existed at all) — see SQA-FIX.md Fix #23. Only populated by the
  // single-post response (BlogPostResource only includes it on the
  // blog.show route) — undefined on the list.
  content?: string;
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
  /**
   * Fix for QA bug #41 ("should display user as registered while viewing
   * the event detail again") — see SQA-FIX.md Fix #20. Only populated on
   * the single-event detail response (EventController::show()), never on
   * the events list — `undefined` there. `null` means either the viewer
   * is a guest (not logged in) or is logged in but hasn't registered.
   */
  alreadyRegistered?: boolean | null;
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
  // Fix for QA bug #60 ("no product variant selector") — see SQA-FIX.md
  // Fix #4. The chosen variant, if the product has any; its price/id take
  // precedence over the base product's wherever the cart displays or
  // submits this line.
  variant?: ProductVariant;
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
