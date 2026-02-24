import { Injectable, signal, computed } from '@angular/core';
import {
  Category, Product, Vendor, BlogPost, SmeEvent, SiteStats
} from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {

  // ─── Stats ───────────────────────────────────────────────────────────────
  readonly stats: SiteStats = {
    members: 148,
    products: 2340,
    categories: 20,
    events: 38,
    districts: 12,
    yearsActive: 5,
  };

  // ─── Categories ──────────────────────────────────────────────────────────
  readonly categories: Category[] = [
    { id: 'handicrafts',  name: 'Handicrafts',        nameBn: 'হস্তশিল্প',        icon: 'tool',        color: '#d97706', bgColor: '#fef3c7', productCount: 312 },
    { id: 'textiles',     name: 'Textiles & Fashion',  nameBn: 'বস্ত্র ও ফ্যাশন',  icon: 'experiment',  color: '#7c3aed', bgColor: '#ede9fe', productCount: 487 },
    { id: 'food',         name: 'Food & Spices',       nameBn: 'খাবার ও মশলা',     icon: 'coffee',      color: '#b45309', bgColor: '#fef9c3', productCount: 261 },
    { id: 'electronics',  name: 'Electronics',         nameBn: 'ইলেকট্রনিক্স',     icon: 'mobile',      color: '#0284c7', bgColor: '#e0f2fe', productCount: 94  },
    { id: 'health',       name: 'Health & Beauty',     nameBn: 'স্বাস্থ্য ও সৌন্দর্য', icon: 'heart',   color: '#db2777', bgColor: '#fce7f3', productCount: 178 },
    { id: 'home',         name: 'Home & Living',       nameBn: 'গৃহ ও সজ্জা',      icon: 'home',        color: '#059669', bgColor: '#d1fae5', productCount: 203 },
    { id: 'agriculture',  name: 'Agriculture & Organic', nameBn: 'কৃষি ও জৈব',    icon: 'environment', color: '#16a34a', bgColor: '#dcfce7', productCount: 167 },
    { id: 'services',     name: 'Professional Services', nameBn: 'পেশাদার সেবা',   icon: 'solution',    color: '#475569', bgColor: '#f1f5f9', productCount: 96  },
  ];

  // ─── Products ────────────────────────────────────────────────────────────
  readonly products: Product[] = [
    {
      id: 'p1',
      name: 'Jamdani Saree — Heritage Weave',
      description: 'Hand-woven Jamdani saree crafted by master weavers in Narayanganj. UNESCO-listed intangible cultural heritage.',
      price: 4500,
      originalPrice: 5200,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/jamdani1/400/400'],
      categoryId: 'textiles',
      category: 'Textiles & Fashion',
      vendor: { id: 'v3', name: 'Dhaka Muslin House', logo: 'https://picsum.photos/seed/dml/64/64', verified: true },
      rating: 4.8, reviewCount: 124, tags: ['saree', 'handwoven', 'heritage'],
      inStock: true, featured: true, isNew: false,
    },
    {
      id: 'p2',
      name: 'Sylhet Premium Organic Tea (500g)',
      description: 'Single-estate black tea from the lush hills of Sylhet. First flush, hand-picked, no additives.',
      price: 480,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/sylhettea/400/400'],
      categoryId: 'food',
      category: 'Food & Spices',
      vendor: { id: 'v2', name: 'Sylhet Tea Garden', logo: 'https://picsum.photos/seed/stg/64/64', verified: true },
      rating: 4.9, reviewCount: 218, tags: ['tea', 'organic', 'sylhet'],
      inStock: true, featured: true, isNew: false,
    },
    {
      id: 'p3',
      name: 'Nakshi Kantha — Embroidered Quilt',
      description: 'Handcrafted Nakshi Kantha quilt by artisan women of Jamalpur. Each piece tells a unique story.',
      price: 2800,
      originalPrice: 3200,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/kantha1/400/400'],
      categoryId: 'handicrafts',
      category: 'Handicrafts',
      vendor: { id: 'v5', name: 'Nakshi Collective', logo: 'https://picsum.photos/seed/nkc/64/64', verified: true },
      rating: 4.7, reviewCount: 86, tags: ['kantha', 'embroidery', 'quilt'],
      inStock: true, featured: true, isNew: false,
    },
    {
      id: 'p4',
      name: 'Cold-Pressed Mustard Oil (1 Litre)',
      description: 'Pure mustard oil extracted via traditional wooden ghani press from Rajshahi farms. No refining.',
      price: 320,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/mustardoil/400/400'],
      categoryId: 'food',
      category: 'Food & Spices',
      vendor: { id: 'v4', name: 'Green Earth Organics', logo: 'https://picsum.photos/seed/geo/64/64', verified: false },
      rating: 4.6, reviewCount: 152, tags: ['oil', 'organic', 'rajshahi'],
      inStock: true, featured: true, isNew: false,
    },
    {
      id: 'p5',
      name: 'Shital Pati Woven Mat',
      description: 'Eco-friendly floor mat handwoven from murta reed by artisans of Sylhet. Keeps surfaces cool.',
      price: 950,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/shitalpati/400/400'],
      categoryId: 'handicrafts',
      category: 'Handicrafts',
      vendor: { id: 'v1', name: 'Rupali Handicrafts', logo: 'https://picsum.photos/seed/rh/64/64', verified: true },
      rating: 4.5, reviewCount: 67, tags: ['mat', 'eco-friendly', 'sylhet'],
      inStock: true, featured: true, isNew: true,
    },
    {
      id: 'p6',
      name: 'Rajshahi Silk Dupatta',
      description: 'Pure Rajshahi silk dupatta with traditional motifs. Lightweight and lustrous.',
      price: 1800,
      originalPrice: 2200,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/silkdupatta/400/400'],
      categoryId: 'textiles',
      category: 'Textiles & Fashion',
      vendor: { id: 'v3', name: 'Dhaka Muslin House', logo: 'https://picsum.photos/seed/dml/64/64', verified: true },
      rating: 4.7, reviewCount: 98, tags: ['silk', 'dupatta', 'rajshahi'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p7',
      name: 'Terracotta Pottery Set (4-piece)',
      description: 'Handcrafted terracotta bowls from Rajshahi potters. Food-safe, kiln-fired, perfect for tableware.',
      price: 1200,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/terracottapot/400/400'],
      categoryId: 'handicrafts',
      category: 'Handicrafts',
      vendor: { id: 'v6', name: 'Bengal Pottery Studio', logo: 'https://picsum.photos/seed/bps/64/64', verified: false },
      rating: 4.4, reviewCount: 44, tags: ['pottery', 'terracotta', 'handmade'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p8',
      name: 'Bamboo Basket Collection (Set of 3)',
      description: 'Eco-friendly handwoven bamboo baskets. Great for storage and gifting. Sustainably sourced.',
      price: 750,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/bamboobasket/400/400'],
      categoryId: 'home',
      category: 'Home & Living',
      vendor: { id: 'v1', name: 'Rupali Handicrafts', logo: 'https://picsum.photos/seed/rh/64/64', verified: true },
      rating: 4.3, reviewCount: 58, tags: ['bamboo', 'eco-friendly', 'basket'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p9',
      name: 'Jamdani Dupatta',
      description: 'Lightweight Jamdani cotton dupatta with delicate floral motifs. Perfect for both casual and formal wear.',
      price: 1200,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/jamdanidupatta/400/400'],
      categoryId: 'textiles', category: 'Textiles & Fashion',
      vendor: { id: 'v3', name: 'Dhaka Muslin House', logo: 'https://picsum.photos/seed/dml/64/64', verified: true },
      rating: 4.6, reviewCount: 71, tags: ['dupatta', 'jamdani', 'cotton'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p10',
      name: 'Organic Turmeric Powder (200g)',
      description: 'Pure, stone-ground turmeric from Rajshahi farms. No fillers or additives. Rich in curcumin.',
      price: 180,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/turmeric/400/400'],
      categoryId: 'food', category: 'Food & Spices',
      vendor: { id: 'v4', name: 'Green Earth Organics', logo: 'https://picsum.photos/seed/geo/64/64', verified: false },
      rating: 4.7, reviewCount: 139, tags: ['turmeric', 'organic', 'spice'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p11',
      name: 'Bamboo Desk Organiser Set',
      description: 'Eco-friendly bamboo pen holder, card tray, and phone stand. Minimalist design for modern workspaces.',
      price: 620,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/bambooorganiser/400/400'],
      categoryId: 'home', category: 'Home & Living',
      vendor: { id: 'v1', name: 'Rupali Handicrafts', logo: 'https://picsum.photos/seed/rh/64/64', verified: true },
      rating: 4.2, reviewCount: 33, tags: ['bamboo', 'desk', 'organiser'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p12',
      name: 'Handloom Cotton Kurti',
      description: 'Breezy handloom cotton kurti with block-print border. Comfortable for everyday wear.',
      price: 1650,
      originalPrice: 1950,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/cottonkurti/400/400'],
      categoryId: 'textiles', category: 'Textiles & Fashion',
      vendor: { id: 'v5', name: 'Nakshi Collective', logo: 'https://picsum.photos/seed/nkc/64/64', verified: true },
      rating: 4.5, reviewCount: 88, tags: ['kurti', 'handloom', 'cotton'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p13',
      name: 'Green Herbal Tea Blend (100g)',
      description: 'Refreshing blend of green tea, lemongrass, and ginger from Sylhet highlands. Caffeine-light.',
      price: 290,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/herbaltea/400/400'],
      categoryId: 'food', category: 'Food & Spices',
      vendor: { id: 'v2', name: 'Sylhet Tea Garden', logo: 'https://picsum.photos/seed/stg/64/64', verified: true },
      rating: 4.8, reviewCount: 195, tags: ['tea', 'herbal', 'green tea'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p14',
      name: 'Terracotta Wall Plaque',
      description: 'Handcrafted decorative wall plaque with traditional Bengali motifs. Kiln-fired, ready to hang.',
      price: 680,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/terraplaque/400/400'],
      categoryId: 'handicrafts', category: 'Handicrafts',
      vendor: { id: 'v6', name: 'Bengal Pottery Studio', logo: 'https://picsum.photos/seed/bps/64/64', verified: false },
      rating: 4.3, reviewCount: 27, tags: ['terracotta', 'wall', 'decor'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p15',
      name: 'Natural Sidr Honey (500g)',
      description: 'Raw, unfiltered Sidr honey from Sundarbans bee farms. High medicinal value, no added sugar.',
      price: 860,
      originalPrice: 980,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/sidrhoney/400/400'],
      categoryId: 'food', category: 'Food & Spices',
      vendor: { id: 'v4', name: 'Green Earth Organics', logo: 'https://picsum.photos/seed/geo/64/64', verified: false },
      rating: 4.9, reviewCount: 302, tags: ['honey', 'sidr', 'sundarbans'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p16',
      name: 'Woven Jute Table Runner',
      description: 'Handwoven natural jute table runner with geometric pattern. Eco-friendly and durable.',
      price: 380,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/juterunner/400/400'],
      categoryId: 'home', category: 'Home & Living',
      vendor: { id: 'v5', name: 'Nakshi Collective', logo: 'https://picsum.photos/seed/nkc/64/64', verified: true },
      rating: 4.1, reviewCount: 19, tags: ['jute', 'table', 'eco-friendly'],
      inStock: false, featured: false, isNew: false,
    },
    {
      id: 'p17',
      name: 'Hand-Block Print Cotton Fabric (1 yd)',
      description: 'Vegetable-dyed, hand-block printed muslin cotton. 45-inch width, ideal for kurtas and sarees.',
      price: 420,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/blockprint/400/400'],
      categoryId: 'textiles', category: 'Textiles & Fashion',
      vendor: { id: 'v3', name: 'Dhaka Muslin House', logo: 'https://picsum.photos/seed/dml/64/64', verified: true },
      rating: 4.5, reviewCount: 55, tags: ['fabric', 'block-print', 'muslin'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p18',
      name: 'Traditional Brass Candle Stand',
      description: 'Intricately engraved solid brass candle stand. Traditional Mughal-inspired patterns.',
      price: 1400,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/brasstand/400/400'],
      categoryId: 'handicrafts', category: 'Handicrafts',
      vendor: { id: 'v6', name: 'Bengal Pottery Studio', logo: 'https://picsum.photos/seed/bps/64/64', verified: false },
      rating: 4.6, reviewCount: 41, tags: ['brass', 'candle', 'traditional'],
      inStock: true, featured: false, isNew: false,
    },
    {
      id: 'p19',
      name: 'Moringa Leaf Powder (200g)',
      description: 'Sun-dried, pure Moringa oleifera leaf powder from organic Rajshahi farms. Rich in vitamins A, C and iron.',
      price: 340,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/moringa/400/400'],
      categoryId: 'health', category: 'Health & Beauty',
      vendor: { id: 'v4', name: 'Green Earth Organics', logo: 'https://picsum.photos/seed/geo/64/64', verified: false },
      rating: 4.7, reviewCount: 84, tags: ['moringa', 'superfood', 'organic'],
      inStock: true, featured: false, isNew: true,
    },
    {
      id: 'p20',
      name: 'Embroidered Kantha Cushion Cover',
      description: 'Hand-embroidered kantha-stitch cushion cover (16×16 in). Vivid thread work by Jamalpur artisans.',
      price: 650,
      currency: 'BDT',
      images: ['https://picsum.photos/seed/kanthacover/400/400'],
      categoryId: 'handicrafts', category: 'Handicrafts',
      vendor: { id: 'v5', name: 'Nakshi Collective', logo: 'https://picsum.photos/seed/nkc/64/64', verified: true },
      rating: 4.4, reviewCount: 62, tags: ['kantha', 'cushion', 'embroidery'],
      inStock: true, featured: false, isNew: false,
    },
  ];

  // ─── Vendors ─────────────────────────────────────────────────────────────
  readonly vendors: Vendor[] = [
    {
      id: 'v1',
      name: 'Rupali Handicrafts',
      logo: 'https://picsum.photos/seed/rh/128/128',
      coverImage: 'https://picsum.photos/seed/rh-cover/800/300',
      description: 'A women-led cooperative producing authentic Bengali handicrafts — from shital pati mats to bamboo art.',
      categories: ['Handicrafts', 'Home & Living'],
      location: 'Banasree, Dhaka', district: 'Dhaka',
      memberSince: '2020', productCount: 47,
      rating: 4.6, reviewCount: 203, verified: true, featured: true,
      phone: '+880-1712-345678', email: 'rupali@example.com', facebook: 'rupalihandicrafts',
    },
    {
      id: 'v2',
      name: 'Sylhet Tea Garden',
      logo: 'https://picsum.photos/seed/stg/128/128',
      coverImage: 'https://picsum.photos/seed/stg-cover/800/300',
      description: 'Direct-from-garden premium teas from Srimangal estates. Single-origin, zero additives, sustainable farming.',
      categories: ['Food & Spices'],
      location: 'Srimangal, Moulvibazar', district: 'Moulvibazar',
      memberSince: '2021', productCount: 23,
      rating: 4.9, reviewCount: 417, verified: true, featured: true,
      phone: '+880-1811-234567', email: 'tea@sylhettea.bd',
    },
    {
      id: 'v3',
      name: 'Dhaka Muslin House',
      logo: 'https://picsum.photos/seed/dml/128/128',
      coverImage: 'https://picsum.photos/seed/dml-cover/800/300',
      description: 'Reviving the legendary Dhaka Muslin tradition. Jamdani sarees, silk, and cotton textiles by master craftsmen.',
      categories: ['Textiles & Fashion'],
      location: 'Demra, Narayanganj', district: 'Narayanganj',
      memberSince: '2019', productCount: 89,
      rating: 4.8, reviewCount: 534, verified: true, featured: true,
      facebook: 'dhakamus',
    },
    {
      id: 'v4',
      name: 'Green Earth Organics',
      logo: 'https://picsum.photos/seed/geo/128/128',
      coverImage: 'https://picsum.photos/seed/geo-cover/800/300',
      description: 'Certified organic farm produce — mustard oil, jute products, and seasonal vegetables from Rajshahi.',
      categories: ['Agriculture & Organic', 'Food & Spices'],
      location: 'Godagari, Rajshahi', district: 'Rajshahi',
      memberSince: '2022', productCount: 31,
      rating: 4.5, reviewCount: 189, verified: false, featured: true,
      phone: '+880-1615-678901',
    },
    {
      id: 'v5',
      name: 'Nakshi Collective',
      logo: 'https://picsum.photos/seed/nkc/128/128',
      coverImage: 'https://picsum.photos/seed/nkc-cover/800/300',
      description: 'Fair-trade cooperative of 60+ women artisans creating Nakshi Kantha quilts, embroidery, and block-print fabrics.',
      categories: ['Handicrafts', 'Textiles & Fashion'],
      location: 'Jamalpur Sadar', district: 'Jamalpur',
      memberSince: '2020', productCount: 62,
      rating: 4.7, reviewCount: 278, verified: true, featured: true,
    },
    {
      id: 'v6',
      name: 'Bengal Pottery Studio',
      logo: 'https://picsum.photos/seed/bps/128/128',
      coverImage: 'https://picsum.photos/seed/bps-cover/800/300',
      description: 'Third-generation potters crafting terracotta, stoneware, and decorative clay art from Rajshahi.',
      categories: ['Handicrafts', 'Home & Living'],
      location: 'Rajpara, Rajshahi', district: 'Rajshahi',
      memberSince: '2023', productCount: 38,
      rating: 4.4, reviewCount: 112, verified: false, featured: false,
    },
  ];

  // ─── Events ──────────────────────────────────────────────────────────────
  readonly events: SmeEvent[] = [
    {
      id: 'e1',
      title: 'NAJUS SME Trade Fair 2025',
      description: 'Annual showcase of 100+ SME vendors — live demos, wholesale orders, and networking sessions.',
      image: 'https://picsum.photos/seed/tradefair/600/350',
      date: '2025-03-15', endDate: '2025-03-20',
      location: 'Bangabandhu International Conference Centre, Dhaka',
      type: 'trade-fair', organizer: 'NAJUS', isFree: false, price: 50,
      featured: true, registrationOpen: true,
    },
    {
      id: 'e2',
      title: 'Women Entrepreneurs Workshop',
      description: 'A hands-on workshop on digital marketing, e-commerce setup, and financial management for women-led SMEs.',
      image: 'https://picsum.photos/seed/workshop/600/350',
      date: '2025-02-28', endDate: '2025-02-28',
      location: 'NAJUS Training Centre, Dhaka',
      type: 'workshop', organizer: 'NAJUS', isFree: true,
      featured: true, registrationOpen: true,
    },
    {
      id: 'e3',
      title: 'Product Photography Masterclass',
      description: 'Learn to shoot stunning product photos using only your smartphone. Boost your online sales instantly.',
      image: 'https://picsum.photos/seed/photoclass/600/350',
      date: '2025-03-05', endDate: '2025-03-05',
      location: 'Online (Zoom)',
      type: 'webinar', organizer: 'NAJUS Digital', isFree: true,
      featured: false, registrationOpen: true,
    },
    {
      id: 'e4',
      title: 'Rajshahi Agro-Products Exhibition',
      description: 'Regional exhibition showcasing Rajshahi\'s finest organic produce, silk, and crafts.',
      image: 'https://picsum.photos/seed/agrofair/600/350',
      date: '2025-04-10', endDate: '2025-04-12',
      location: 'Rajshahi Divisional Stadium',
      type: 'exhibition', organizer: 'NAJUS Rajshahi Chapter', isFree: false, price: 30,
      featured: false, registrationOpen: false,
    },
  ];

  // ─── Blog Posts ──────────────────────────────────────────────────────────
  readonly blogPosts: BlogPost[] = [
    {
      id: 'b1',
      title: 'How Jamdani Weaving Empowers Women in Narayanganj',
      excerpt: 'Behind every Jamdani saree is a story of skill, patience, and economic independence. Meet the weavers transforming their communities.',
      image: 'https://picsum.photos/seed/blog-jamdani/700/400',
      author: 'Fatema Begum', authorImage: 'https://picsum.photos/seed/auth1/64/64',
      date: '2025-01-18', tags: ['artisans', 'women', 'heritage'],
      category: 'Success Stories', readTime: 5, featured: true,
    },
    {
      id: 'b2',
      title: '5 Ways NAJUS SMEs Are Transforming Bangladesh\'s Economy',
      excerpt: 'From rural Rajshahi to export markets in Europe — local SMEs are proving that small is mighty.',
      image: 'https://picsum.photos/seed/blog-economy/700/400',
      author: 'Karim Ahmed', authorImage: 'https://picsum.photos/seed/auth2/64/64',
      date: '2025-01-10', tags: ['economy', 'growth', 'impact'],
      category: 'Insights', readTime: 6, featured: true,
    },
    {
      id: 'b3',
      title: 'Getting Started with E-commerce: A Practical Guide for SMEs',
      excerpt: 'Step-by-step guide to listing your products online, managing inventory, and accepting digital payments.',
      image: 'https://picsum.photos/seed/blog-ecommerce/700/400',
      author: 'Nadia Islam', authorImage: 'https://picsum.photos/seed/auth3/64/64',
      date: '2024-12-28', tags: ['guide', 'e-commerce', 'digital'],
      category: 'Guides', readTime: 8, featured: false,
    },
    {
      id: 'b4',
      title: 'From Clay to Market: The Rise of Bengal Pottery Studio',
      excerpt: 'Three generations of Rajshahi potters are taking their terracotta art to urban markets and beyond.',
      image: 'https://picsum.photos/seed/blog-pottery/700/400',
      author: 'Rahim Uddin', authorImage: 'https://picsum.photos/seed/auth4/64/64',
      date: '2024-12-15', tags: ['artisans', 'pottery', 'rajshahi'],
      category: 'Success Stories', readTime: 4, featured: false,
    },
    {
      id: 'b5',
      title: 'Understanding the NAJUS Membership: Benefits and How to Join',
      excerpt: 'Everything you need to know about joining the NAJUS SME network — from application to your first sale.',
      image: 'https://picsum.photos/seed/blog-membership/700/400',
      author: 'Fatema Begum', authorImage: 'https://picsum.photos/seed/auth1/64/64',
      date: '2024-11-30', tags: ['membership', 'guide', 'network'],
      category: 'Guides', readTime: 6, featured: false,
    },
    {
      id: 'b6',
      title: 'Tea Tourism in Sylhet: How SMEs Are Cashing In',
      excerpt: 'The booming tea tourism scene in Srimangal is creating new opportunities for local food and craft entrepreneurs.',
      image: 'https://picsum.photos/seed/blog-sylhet/700/400',
      author: 'Karim Ahmed', authorImage: 'https://picsum.photos/seed/auth2/64/64',
      date: '2024-11-18', tags: ['tourism', 'sylhet', 'food'],
      category: 'Insights', readTime: 7, featured: false,
    },
  ];

  // ─── Popular Searches ────────────────────────────────────────────────────
  readonly popularSearches: string[] = [
    'Jamdani Saree', 'Sylhet Tea', 'Nakshi Kantha', 'Mustard Oil', 'Bamboo Crafts', 'Silk Fabric'
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────────
  readonly maxPrice = Math.ceil(
    Math.max(...this.products.map(p => p.originalPrice ?? p.price)) / 500
  ) * 500;

  getFeaturedProducts(limit = 8): Product[] {
    return this.products.slice(0, limit);
  }

  getFeaturedVendors(limit = 4): Vendor[] {
    return this.vendors.filter(v => v.featured).slice(0, limit);
  }

  getFeaturedEvents(limit = 3): SmeEvent[] {
    return this.events.slice(0, limit);
  }

  getEventById(id: string): SmeEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  getRelatedEvents(eventId: string, type: string, limit = 3): SmeEvent[] {
    return this.events
      .filter(e => e.id !== eventId && (e.type === type || e.featured))
      .slice(0, limit);
  }

  getFeaturedBlogPosts(limit = 3): BlogPost[] {
    return this.blogPosts.slice(0, limit);
  }

  readonly allVendorCategories: string[] =
    [...new Set(this.vendors.flatMap(v => v.categories))].sort();

  readonly allDistricts: string[] =
    [...new Set(this.vendors.map(v => v.district))].sort();

  readonly allBlogCategories: string[] =
    [...new Set(this.blogPosts.map(p => p.category))].sort();

  readonly allBlogTags: string[] =
    [...new Set(this.blogPosts.flatMap(p => p.tags))].sort();

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getRelatedProducts(productId: string, categoryId: string, limit = 4): Product[] {
    return this.products
      .filter(p => p.categoryId === categoryId && p.id !== productId)
      .slice(0, limit);
  }

  getVendorById(id: string): Vendor | undefined {
    return this.vendors.find(v => v.id === id);
  }

  getProductsByVendor(vendorId: string): Product[] {
    return this.products.filter(p => p.vendor.id === vendorId);
  }

  getProductsByCategory(categoryId: string): Product[] {
    return this.products.filter(p => p.categoryId === categoryId);
  }

  searchProducts(query: string): Product[] {
    const q = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.vendor.name.toLowerCase().includes(q)
    );
  }
}
