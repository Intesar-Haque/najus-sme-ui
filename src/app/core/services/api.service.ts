import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Category, Member, Product, Vendor, BlogPost, SmeEvent, SiteStats } from '../models';

interface ApiList<T> { data: T[] }

export interface ProductsMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  max_price: number;
}

export interface ProductsResponse {
  data: Product[];
  meta: ProductsMeta;
}

export interface ProductsParams {
  q?: string;
  categories?: string[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  in_stock?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface EventsMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  free_count: number;
  open_count: number;
}

export interface EventsResponse {
  data: SmeEvent[];
  meta: EventsMeta;
}

export interface EventsParams {
  q?: string;
  types?: string[];
  free?: boolean;
  open?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface VendorsMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  all_categories: string[];
  all_districts: string[];
}

export interface VendorsResponse {
  data: Vendor[];
  meta: VendorsMeta;
}

export interface VendorsParams {
  q?: string;
  categories?: string[];
  districts?: string[];
  verified?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface BlogMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  all_categories: string[];
  all_tags: string[];
}

export interface BlogResponse {
  data: BlogPost[];
  featured: BlogPost | null;
  meta: BlogMeta;
}

export interface BlogParams {
  q?: string;
  category?: string;
  tags?: string[];
  sort?: string;
  page?: number;
  per_page?: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardOverview {
  member: Member;
  vendor: Vendor | null;
  product_count: number;
  total_orders: number;
  monthly_revenue: number;
}

export interface DashboardAnalytics {
  monthly_revenue: { month: string; revenue: number }[];
  top_products:    { name: string; reviews: number; rating: number; pct: number }[];
  summary: {
    orders_this_month:      number;
    orders_last_month:      number;
    avg_order_value:        number;
    avg_order_value_last:   number;
    pending_orders:         number;
    cancellation_rate:      number;
    cancellation_rate_last: number;
  };
}

export interface DashApiOrder {
  id:            number;
  product_name:  string;
  customer_name: string;
  amount:        number;
  order_date:    string;
  status:        'pending' | 'processing' | 'delivered' | 'cancelled';
}

/** Map frontend sort keys to API sort keys */
const PRODUCT_SORT_MAP: Record<string, string> = {
  'price-asc':  'price_asc',
  'price-desc': 'price_desc',
  'rating':     'rating',
  'popular':    'popular',
  'newest':     'newest',
};

const EMPTY_STATS: SiteStats = {
  members: 0, products: 0, categories: 0, events: 0, districts: 0, yearsActive: 0,
};

const EMPTY_EVENTS: EventsResponse = {
  data: [],
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 50, free_count: 0, open_count: 0 },
};

const EMPTY_VENDORS: VendorsResponse = {
  data: [],
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 20, all_categories: [], all_districts: [] },
};

const EMPTY_BLOG: BlogResponse = {
  data: [],
  featured: null,
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 50, all_categories: [], all_tags: [] },
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.api;

  // ─── Stats ───────────────────────────────────────────────────────────────
  getStats(): Observable<SiteStats> {
    return this.http.get<SiteStats>(`${this.base}/stats`).pipe(
      catchError(() => of(EMPTY_STATS)),
    );
  }

  // ─── Categories ──────────────────────────────────────────────────────────
  getCategories(): Observable<Category[]> {
    return this.http.get<ApiList<Category>>(`${this.base}/categories`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  // ─── Products ────────────────────────────────────────────────────────────
  getProducts(p: ProductsParams = {}): Observable<ProductsResponse> {
    let params = new HttpParams();
    if (p.q)              params = params.set('q',          p.q);
    if (p.categories?.length) {
      p.categories.forEach(c => { params = params.append('categories[]', c); });
    }
    if (p.min_price)      params = params.set('min_price',  p.min_price);
    if (p.max_price)      params = params.set('max_price',  p.max_price);
    if (p.min_rating)     params = params.set('min_rating', p.min_rating);
    if (p.in_stock)       params = params.set('in_stock',   '1');
    if (p.sort && p.sort !== 'default') params = params.set('sort', PRODUCT_SORT_MAP[p.sort] ?? p.sort);
    if (p.page)           params = params.set('page',       p.page);
    if (p.per_page)       params = params.set('per_page',   p.per_page);

    const empty: ProductsResponse = {
      data: [],
      meta: { total: 0, current_page: 1, last_page: 1, per_page: 12, max_price: 0 },
    };
    return this.http.get<ProductsResponse>(`${this.base}/products`, { params }).pipe(
      catchError(() => of(empty)),
    );
  }

  getFeaturedProducts(limit = 8): Observable<Product[]> {
    const params = new HttpParams()
      .set('featured', '1')
      .set('per_page', limit);
    return this.http.get<ApiList<Product>>(`${this.base}/products`, { params }).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getProductById(id: string): Observable<Product | null> {
    return this.http.get<{ data: Product }>(`${this.base}/products/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null)),
    );
  }

  getRelatedProducts(id: string): Observable<Product[]> {
    return this.http.get<ApiList<Product>>(`${this.base}/products/${id}/related`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  // ─── Vendors ─────────────────────────────────────────────────────────────
  getVendors(p: VendorsParams = {}): Observable<VendorsResponse> {
    let params = new HttpParams();
    if (p.q) params = params.set('q', p.q);
    if (p.categories?.length) {
      p.categories.forEach(c => { params = params.append('categories[]', c); });
    }
    if (p.districts?.length) {
      p.districts.forEach(d => { params = params.append('districts[]', d); });
    }
    if (p.verified) params = params.set('verified', '1');
    if (p.sort && p.sort !== 'default') params = params.set('sort', p.sort);
    if (p.page)     params = params.set('page',     p.page);
    if (p.per_page) params = params.set('per_page', p.per_page);

    return this.http.get<VendorsResponse>(`${this.base}/vendors`, { params }).pipe(
      catchError(() => of(EMPTY_VENDORS)),
    );
  }

  getFeaturedVendors(limit = 4): Observable<Vendor[]> {
    const params = new HttpParams()
      .set('featured', '1')
      .set('per_page', limit);
    return this.http.get<ApiList<Vendor>>(`${this.base}/vendors`, { params }).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getVendorById(id: string): Observable<Vendor | null> {
    return this.http.get<{ data: Vendor }>(`${this.base}/vendors/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null)),
    );
  }

  getVendorProducts(id: string): Observable<Product[]> {
    return this.http.get<ApiList<Product>>(`${this.base}/vendors/${id}/products`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  // ─── Events ──────────────────────────────────────────────────────────────
  getEvents(p: EventsParams = {}): Observable<EventsResponse> {
    let params = new HttpParams();
    if (p.q) params = params.set('q', p.q);
    if (p.types?.length) p.types.forEach(t => { params = params.append('type[]', t); });
    if (p.free) params = params.set('free', '1');
    if (p.open) params = params.set('open', '1');
    if (p.sort && p.sort !== 'featured') {
      params = params.set('sort', p.sort === 'date-asc' ? 'date_asc' : 'date_desc');
    }
    if (p.page)     params = params.set('page',     p.page);
    if (p.per_page) params = params.set('per_page', p.per_page);

    return this.http.get<EventsResponse>(`${this.base}/events`, { params }).pipe(
      catchError(() => of(EMPTY_EVENTS)),
    );
  }

  getFeaturedEvents(limit = 3): Observable<SmeEvent[]> {
    const params = new HttpParams()
      .set('featured', '1')
      .set('per_page', limit);
    return this.http.get<ApiList<SmeEvent>>(`${this.base}/events`, { params }).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getEventById(id: string): Observable<SmeEvent | null> {
    return this.http.get<{ data: SmeEvent }>(`${this.base}/events/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null)),
    );
  }

  getRelatedEvents(id: string): Observable<SmeEvent[]> {
    return this.http.get<ApiList<SmeEvent>>(`${this.base}/events/${id}/related`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  registerForEvent(id: string, body: object): Observable<{ message: string; registration_id: number }> {
    return this.http.post<{ message: string; registration_id: number }>(
      `${this.base}/events/${id}/register`, body,
    );
  }

  // ─── Blog ─────────────────────────────────────────────────────────────────
  getBlogPosts(p: BlogParams = {}): Observable<BlogResponse> {
    let params = new HttpParams();
    if (p.q)       params = params.set('q',        p.q);
    if (p.category) params = params.set('category', p.category);
    if (p.tags?.length) p.tags.forEach(t => { params = params.append('tags[]', t); });
    if (p.sort && p.sort !== 'newest') {
      params = params.set('sort', p.sort === 'read-time' ? 'read_time' : p.sort);
    }
    if (p.page)     params = params.set('page',     p.page);
    if (p.per_page) params = params.set('per_page', p.per_page);

    return this.http.get<BlogResponse>(`${this.base}/blog`, { params }).pipe(
      catchError(() => of(EMPTY_BLOG)),
    );
  }

  getFeaturedBlogPosts(limit = 3): Observable<BlogPost[]> {
    const params = new HttpParams()
      .set('featured', '1')
      .set('per_page', limit);
    return this.http.get<ApiList<BlogPost>>(`${this.base}/blog`, { params }).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getBlogPostById(id: string): Observable<BlogPost | null> {
    return this.http.get<{ data: BlogPost }>(`${this.base}/blog/${id}`).pipe(
      map(r => r.data),
      catchError(() => of(null)),
    );
  }

  // ─── Dashboard (authenticated) ────────────────────────────────────────────
  getDashboardOverview(): Observable<DashboardOverview | null> {
    return this.http.get<DashboardOverview>(`${this.base}/dashboard/overview`).pipe(
      catchError(() => of(null)),
    );
  }

  getDashboardProducts(): Observable<Product[]> {
    return this.http.get<ApiList<Product>>(`${this.base}/dashboard/products`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getDashboardOrders(): Observable<DashApiOrder[]> {
    return this.http.get<{ data: DashApiOrder[] }>(`${this.base}/dashboard/orders`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  getDashboardAnalytics(): Observable<DashboardAnalytics> {
    const empty: DashboardAnalytics = {
      monthly_revenue: [],
      top_products: [],
      summary: {
        orders_this_month: 0, orders_last_month: 0,
        avg_order_value: 0,   avg_order_value_last: 0,
        pending_orders: 0,
        cancellation_rate: 0, cancellation_rate_last: 0,
      },
    };
    return this.http.get<DashboardAnalytics>(`${this.base}/dashboard/analytics`).pipe(
      catchError(() => of(empty)),
    );
  }

  getDashboardEvents(): Observable<SmeEvent[]> {
    return this.http.get<ApiList<SmeEvent>>(`${this.base}/dashboard/events`).pipe(
      map(r => r.data),
      catchError(() => of([])),
    );
  }

  createDashboardProduct(body: object): Observable<{ data: Product }> {
    return this.http.post<{ data: Product }>(`${this.base}/dashboard/products`, body);
  }

  updateDashboardSettings(body: object): Observable<{ member: Member }> {
    return this.http.put<{ member: Member }>(`${this.base}/dashboard/settings`, body);
  }
}
