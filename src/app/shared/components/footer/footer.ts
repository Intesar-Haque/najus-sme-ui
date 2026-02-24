import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslateModule, NzIconModule, NzDividerModule],
  templateUrl: './footer.html',
  styleUrl: './footer.less',
})
export class Footer {
  readonly year = new Date().getFullYear();

  readonly quickLinks = [
    { label: 'footer.products',   path: '/products' },
    { label: 'footer.businesses', path: '/businesses' },
    { label: 'footer.events',     path: '/events' },
    { label: 'footer.blog',       path: '/blog' },
  ];

  readonly supportLinks = [
    { label: 'footer.about',    path: '/about' },
    { label: 'footer.contact',  path: '/contact' },
    { label: 'footer.faq',      path: '/faq' },
    { label: 'footer.join',     path: '/join' },
  ];
}
