import { Component } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { NzIconModule }    from 'ng-zorro-antd/icon';

interface PolicySection {
  id:      string;
  title:   string;
  content: string[];
}

@Component({
  selector: 'app-privacy',
  imports: [RouterLink, NzIconModule],
  templateUrl: './privacy.html',
  styleUrl:    './privacy.less',
})
export class Privacy {

  readonly lastUpdated = 'February 1, 2026';

  readonly sections: PolicySection[] = [
    {
      id: 'information-we-collect',
      title: '1. Information We Collect',
      content: [
        'We collect information you provide directly when you create a member account, make a purchase, submit a contact form, or communicate with us.',
        'Account information: full name, email address, NAJUS membership code, business details, and profile data.',
        'Transaction information: purchase history, product interactions, and payment method details (processed securely by third-party providers — we never store raw card data).',
        'Usage data: pages visited, features used, time spent on the platform, click patterns, and device / browser information.',
        'Communications: messages you send us, feedback, support requests, and event registrations.',
      ],
    },
    {
      id: 'how-we-use',
      title: '2. How We Use Your Information',
      content: [
        'To provide, maintain, and improve the NAJUS SME marketplace and its services.',
        'To process transactions and send related information such as purchase confirmations, invoices, and shipping updates.',
        'To send promotional communications — newsletters, event invitations, and offers. You may opt out at any time.',
        'To respond to comments, questions, and requests, and to provide customer support.',
        'To monitor and analyse trends, usage, and activity patterns to improve the platform experience.',
        'To detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities.',
      ],
    },
    {
      id: 'sharing',
      title: '3. Sharing of Information',
      content: [
        'We do not sell, trade, or rent your personal information to third parties for their marketing purposes.',
        'We may share your information with service providers who perform services on our behalf (e.g., payment processors, email delivery, analytics, cloud hosting).',
        'We may disclose your information if required by applicable law or in response to valid legal processes.',
        'In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction with prior notice to you.',
        'Aggregated or de-identified information that cannot reasonably be used to identify you may be shared freely for research or reporting purposes.',
      ],
    },
    {
      id: 'cookies',
      title: '4. Cookies & Tracking Technologies',
      content: [
        'We use cookies and similar tracking technologies to improve your experience on our platform.',
        'Essential cookies are strictly necessary for the platform to function (authentication, session management, cart persistence).',
        'Analytics cookies help us understand how visitors interact with pages so we can improve content and navigation.',
        'Preference cookies remember your settings such as language, region, and display preferences.',
        'You can configure your browser to refuse all cookies or to notify you when a cookie is set. Note that some features may not work correctly if cookies are disabled.',
      ],
    },
    {
      id: 'data-security',
      title: '5. Data Security',
      content: [
        'We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.',
        'All data transmitted between your browser and our servers is encrypted using HTTPS / TLS.',
        'Access to personal data is restricted to authorised personnel with a legitimate business need on a least-privilege basis.',
        'Despite these measures, no security system is impenetrable. We cannot guarantee absolute security, and you transmit data at your own risk.',
      ],
    },
    {
      id: 'retention',
      title: '6. Data Retention',
      content: [
        'We retain personal information for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required by law.',
        'Account data is retained while your account remains active. You may request deletion at any time.',
        'Transaction records may be kept for up to 7 years to comply with financial regulations.',
        'Analytics data is retained in aggregated, anonymised form after 24 months.',
      ],
    },
    {
      id: 'your-rights',
      title: '7. Your Rights',
      content: [
        'Access: Request a copy of the personal information we hold about you.',
        'Correction: Ask us to correct inaccurate or incomplete information.',
        'Deletion: Request deletion of your personal data, subject to certain legal obligations.',
        'Portability: Receive your data in a structured, commonly used, machine-readable format.',
        'Opt-out: Unsubscribe from marketing communications at any time via any email or by contacting us.',
        'To exercise any of these rights, contact us at privacy@najussme.org. We will respond within 30 days.',
      ],
    },
    {
      id: 'contact',
      title: '8. Contact Us',
      content: [
        'If you have questions or concerns about this Privacy Policy, please reach out:',
        'Email: privacy@najussme.org',
        'Address: NAJUS NGO Head Office, 123 NGO Road, Mohakhali, Dhaka 1212, Bangladesh',
        'Phone: +880-1700-000000',
        'We are committed to resolving any complaints about our collection or use of your personal data.',
      ],
    },
  ];
}
