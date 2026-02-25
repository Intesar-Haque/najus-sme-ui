import { Component } from '@angular/core';
import { RouterLink }   from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface TermsSection {
  id:      string;
  title:   string;
  content: string[];
}

@Component({
  selector: 'app-terms',
  imports: [RouterLink, NzIconModule],
  templateUrl: './terms.html',
  styleUrl:    './terms.less',
})
export class Terms {

  readonly lastUpdated = 'February 1, 2026';

  readonly sections: TermsSection[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: [
        'By accessing or using the NAJUS SME marketplace ("Platform"), you agree to be bound by these Terms of Use and all applicable laws and regulations.',
        'If you do not agree with any part of these terms, you must not use the Platform.',
        'These terms apply to all visitors, users, registered members, and vendors on the Platform.',
        'We reserve the right to update these terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised terms.',
      ],
    },
    {
      id: 'use-of-platform',
      title: '2. Use of the Platform',
      content: [
        'You must be at least 18 years of age or have parental consent to use the Platform.',
        'You agree to use the Platform only for lawful purposes and in a way that does not infringe the rights of others.',
        'You must not use the Platform to transmit spam, malware, or any other harmful content.',
        'You must not attempt to gain unauthorised access to any part of the Platform or its related systems.',
        'Automated scraping, crawling, or data harvesting of the Platform is strictly prohibited without prior written consent from NAJUS.',
      ],
    },
    {
      id: 'accounts',
      title: '3. Member Accounts',
      content: [
        'NAJUS membership is granted upon successful completion of our verification process. Members receive a unique Membership Code.',
        'You are responsible for maintaining the confidentiality of your Membership Code and any OTPs sent to your registered email.',
        'You must notify us immediately at security@najussme.org if you suspect unauthorised use of your account.',
        'NAJUS reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful behaviour.',
        'Members must keep their profile and business information accurate and up to date.',
      ],
    },
    {
      id: 'vendor-obligations',
      title: '4. Vendor Obligations',
      content: [
        'Vendors must list only products they own, produce, or have legal right to sell. Counterfeit or stolen goods are strictly prohibited.',
        'All product descriptions, images, and pricing must be accurate and not misleading.',
        'Vendors are responsible for fulfilling orders in a timely manner and maintaining adequate inventory.',
        'Vendors must comply with all applicable Bangladeshi laws including consumer protection, trade, and tax regulations.',
        'NAJUS reserves the right to remove any listing or suspend any vendor account found to be in violation of these obligations.',
      ],
    },
    {
      id: 'transactions',
      title: '5. Transactions & Payments',
      content: [
        'All prices displayed on the Platform are in Bangladeshi Taka (BDT) unless otherwise stated.',
        'Payments are processed through secure third-party payment gateways. NAJUS does not store raw payment card data.',
        'By completing a purchase, you authorise the charge to your selected payment method.',
        'Vendor payouts are disbursed within 5–7 business days of confirmed delivery, net of applicable platform commissions.',
        'NAJUS is not liable for payment failures, delays, or errors caused by third-party payment processors.',
      ],
    },
    {
      id: 'returns',
      title: '6. Returns & Refunds',
      content: [
        'Customers may return eligible items within 7 days of delivery. Items must be unused, undamaged, and in original packaging.',
        'Perishable goods, customised/personalised items, and digital products are non-returnable.',
        'Refunds are processed to the original payment method within 7–10 business days of return approval.',
        'Shipping costs for returns are borne by the customer unless the return is due to a defective or incorrect item.',
        'For disputes, contact our support team at support@najussme.org. We aim to resolve all disputes within 14 business days.',
      ],
    },
    {
      id: 'intellectual-property',
      title: '7. Intellectual Property',
      content: [
        'The NAJUS SME brand, logo, platform design, and all original content are the exclusive property of NAJUS NGO.',
        'You may not reproduce, distribute, modify, or create derivative works from any platform content without prior written permission.',
        'Vendors retain ownership of their product listings and images. By listing on the Platform, vendors grant NAJUS a non-exclusive licence to display their content for marketplace purposes.',
        'If you believe any content on the Platform infringes your intellectual property rights, contact legal@najussme.org.',
      ],
    },
    {
      id: 'liability',
      title: '8. Limitation of Liability',
      content: [
        'The Platform is provided "as is" without warranties of any kind, express or implied.',
        'NAJUS does not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.',
        'To the fullest extent permitted by law, NAJUS shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.',
        'Our total liability to you for any claim arising out of these Terms shall not exceed the amount paid by you to NAJUS in the 12 months preceding the claim.',
      ],
    },
    {
      id: 'governing-law',
      title: '9. Governing Law',
      content: [
        'These Terms of Use shall be governed by and construed in accordance with the laws of the People\'s Republic of Bangladesh.',
        'Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.',
        'We encourage amicable resolution of disputes before pursuing formal legal remedies.',
      ],
    },
    {
      id: 'contact',
      title: '10. Contact Us',
      content: [
        'For questions or concerns regarding these Terms of Use, please contact:',
        'Email: legal@najussme.org',
        'Address: NAJUS NGO Head Office, 123 NGO Road, Mohakhali, Dhaka 1212, Bangladesh',
        'Phone: +880-1700-000000',
      ],
    },
  ];
}
