import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule }   from 'ng-zorro-antd/button';
import { NzIconModule }     from 'ng-zorro-antd/icon';
import { NzDividerModule }  from 'ng-zorro-antd/divider';
import { NzAvatarModule }   from 'ng-zorro-antd/avatar';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-about',
  imports: [
    RouterLink,
    NzButtonModule, NzIconModule, NzDividerModule, NzAvatarModule, NzTimelineModule,
  ],
  templateUrl: './about.html',
  styleUrl:    './about.less',
})
export class About {

  readonly stats = [
    { value: '100+',    label: 'Verified Vendors',  icon: 'shop'      },
    { value: '2,500+',  label: 'Products Listed',   icon: 'shopping'  },
    { value: '50+',     label: 'Events Hosted',     icon: 'calendar'  },
    { value: '10,000+', label: 'Happy Customers',   icon: 'smile'     },
  ];

  readonly values = [
    { icon: 'safety-certificate', color: '#28a745',
      title: 'Trust & Verification',
      desc:  'Every business is rigorously verified by NAJUS to ensure authenticity, quality, and reliability for our customers.' },
    { icon: 'team',               color: '#1976d2',
      title: 'Community First',
      desc:  'We put SME entrepreneurs and their communities at the heart of every decision we make.' },
    { icon: 'rise',               color: '#ff7a00',
      title: 'Sustainable Growth',
      desc:  'We champion environmentally responsible and socially conscious business practices across Bangladesh.' },
    { icon: 'global',             color: '#9c27b0',
      title: 'Bangladesh Proud',
      desc:  'Celebrating Bangladeshi craftsmanship, culture, and entrepreneurial spirit — locally rooted, globally connected.' },
  ];

  readonly team = [
    { name: 'Dr. Rahim Uddin',  role: 'Executive Director',       initials: 'RU', color: '#28a745' },
    { name: 'Nasrin Sultana',   role: 'Head of SME Development',  initials: 'NS', color: '#1976d2' },
    { name: 'Kamal Hossain',    role: 'Technology Lead',          initials: 'KH', color: '#ff7a00' },
    { name: 'Fatema Begum',     role: 'Community Manager',        initials: 'FB', color: '#9c27b0' },
  ];

  readonly milestones = [
    { year: '2015', title: 'NAJUS NGO Founded',
      desc: 'Established with a mission to empower Bangladeshi entrepreneurs and strengthen local economies.' },
    { year: '2018', title: 'First Trade Fair',
      desc: 'Hosted 50 SMEs at our inaugural national trade fair in Dhaka, attracting over 5,000 visitors.' },
    { year: '2020', title: 'Digital Pivot',
      desc: 'Launched an online marketplace to reach customers nationwide — connecting rural producers to urban buyers.' },
    { year: '2022', title: 'NAJUS SME Platform',
      desc: 'Launched the full e-commerce platform connecting 100+ verified vendors with a streamlined buying experience.' },
    { year: '2024', title: '10,000+ Customers',
      desc: 'Crossed a milestone of 10,000 happy customers and 2,500+ products across all categories.' },
  ];
}
