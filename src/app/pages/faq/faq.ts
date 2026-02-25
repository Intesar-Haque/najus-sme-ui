import { Component, signal } from '@angular/core';
import { RouterLink }          from '@angular/router';
import { NzCollapseModule }    from 'ng-zorro-antd/collapse';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzTagModule }         from 'ng-zorro-antd/tag';
import { NzButtonModule }      from 'ng-zorro-antd/button';
import { FormsModule }         from '@angular/forms';
import { NzInputModule }       from 'ng-zorro-antd/input';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id:    string;
  title: string;
  icon:  string;
  color: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  imports: [
    RouterLink, FormsModule,
    NzCollapseModule, NzIconModule, NzTagModule, NzButtonModule, NzInputModule,
  ],
  templateUrl: './faq.html',
  styleUrl:    './faq.less',
})
export class Faq {

  searchQuery    = signal('');
  activeCat      = signal('all');

  readonly categories: FaqCategory[] = [
    {
      id: 'general', title: 'General', icon: 'info-circle', color: '#1976d2',
      items: [
        { q: 'What is NAJUS SME?',
          a: 'NAJUS SME is the marketplace arm of NAJUS NGO — a platform connecting 100+ verified Bangladeshi small and medium enterprises with customers across Bangladesh and beyond. We curate authentic, locally made products and services.' },
        { q: 'Is NAJUS SME affiliated with any government body?',
          a: 'NAJUS is a registered non-governmental organisation (NGO) operating independently. While we collaborate with government programmes for SME development, we are not a government entity.' },
        { q: 'In which areas does NAJUS SME operate?',
          a: 'We primarily serve customers across Bangladesh with plans to expand internationally. Our vendor base spans Dhaka, Chittagong, Sylhet, Khulna, Rajshahi, and rural regions nationwide.' },
        { q: 'What types of products are available on the platform?',
          a: 'Our marketplace features handcrafts, textiles, food & agro-products, fashion, home décor, beauty & wellness, and more — all sourced from verified local SMEs.' },
      ],
    },
    {
      id: 'membership', title: 'Membership', icon: 'idcard', color: '#28a745',
      items: [
        { q: 'Who can become a NAJUS member?',
          a: 'Membership is open to registered Bangladeshi SME owners and entrepreneurs who operate legally. Applicants go through a verification process to ensure standards of quality and authenticity.' },
        { q: 'How do I apply for membership?',
          a: 'You can apply through our "Join as Member" page. Submit your business details and supporting documents. Our team reviews applications within 5–7 working days.' },
        { q: 'What are the benefits of NAJUS membership?',
          a: 'Members receive a verified vendor profile, access to list unlimited products, priority placement in search results, participation in trade fairs & events, and access to business development resources.' },
        { q: 'Is there a membership fee?',
          a: 'Basic membership is free. A nominal annual fee applies for premium tiers, which include enhanced visibility, marketing support, and dedicated account management.' },
        { q: 'How do I log in as a member?',
          a: 'Members log in using their NAJUS Membership Code and a One-Time Password (OTP) sent to their registered email — no password required.' },
      ],
    },
    {
      id: 'shopping', title: 'Shopping', icon: 'shopping-cart', color: '#ff7a00',
      items: [
        { q: 'How do I place an order?',
          a: 'Browse products, add items to your cart, and proceed to checkout. You can purchase as a guest or create an account for faster future checkouts.' },
        { q: 'What payment methods are accepted?',
          a: 'We accept bKash, Nagad, Rocket, major credit/debit cards (Visa, Mastercard), and bank transfers. Cash on delivery is available in select areas.' },
        { q: 'How long does delivery take?',
          a: 'Delivery within Dhaka typically takes 1–3 business days. Outside Dhaka it can take 3–7 business days depending on the region and vendor location.' },
        { q: 'What is the return policy?',
          a: 'Most products have a 7-day return window from the date of delivery. Products must be unused and in original packaging. Perishable and customised items are non-returnable.' },
      ],
    },
    {
      id: 'vendors', title: 'For Vendors', icon: 'shop', color: '#9c27b0',
      items: [
        { q: 'How do I list my products?',
          a: 'After your membership is approved, log in to the member dashboard and use the "Add Product" feature to list your items with photos, descriptions, and pricing.' },
        { q: 'How does payment work for vendors?',
          a: 'Payments are processed securely through the platform and disbursed to vendors within 5–7 business days of order confirmation, after deducting the applicable platform commission.' },
        { q: 'What commission does NAJUS charge?',
          a: 'NAJUS charges a platform commission of 8–12% per sale depending on the product category. This covers payment processing, marketing, and platform maintenance.' },
        { q: 'Can I participate in trade fairs and events?',
          a: 'Yes! Active NAJUS members receive priority invitations to participate in trade fairs, exhibitions, and webinars. Keep an eye on the Events page for upcoming opportunities.' },
      ],
    },
    {
      id: 'events', title: 'Events', icon: 'calendar', color: '#00897b',
      items: [
        { q: 'How can I register for an event?',
          a: 'Visit the Events page, find the event you\'re interested in, and click "Register Now". Some events are free; others require a registration fee payable online.' },
        { q: 'Are events open to the public?',
          a: 'Most trade fairs and exhibitions are open to the general public. Workshops and webinars may be restricted to NAJUS members or require pre-registration.' },
        { q: 'Can I host an event through NAJUS?',
          a: 'NAJUS members can propose community events or workshops. Submit a proposal through the member dashboard and our events team will get in touch.' },
      ],
    },
  ];

  get filteredCategories(): FaqCategory[] {
    const q   = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCat();

    let cats = cat === 'all' ? this.categories : this.categories.filter(c => c.id === cat);

    if (q) {
      cats = cats
        .map(c => ({
          ...c,
          items: c.items.filter(
            i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)
          ),
        }))
        .filter(c => c.items.length > 0);
    }
    return cats;
  }

  get totalCount(): number {
    return this.filteredCategories.reduce((sum, c) => sum + c.items.length, 0);
  }
}
