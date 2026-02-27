import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';

import { NzAvatarModule }  from 'ng-zorro-antd/avatar';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule }  from 'ng-zorro-antd/drawer';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink, RouterOutlet, RouterLinkActive, DatePipe,
    NzAvatarModule, NzIconModule, NzDividerModule, NzDrawerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.less',
})
export class Dashboard {
  private auth   = inject(AuthService);
  private router = inject(Router);

  member     = this.auth.currentMember;
  drawerOpen = signal(false);

  readonly today = new Date();

  readonly greeting = computed(() => {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly navItems = [
    { label: 'Overview',    icon: 'dashboard', path: '/dashboard/overview'  },
    { label: 'My Products', icon: 'shopping',  path: '/dashboard/products'  },
    { label: 'Analytics',   icon: 'bar-chart', path: '/dashboard/analytics' },
    { label: 'Events',      icon: 'calendar',  path: '/dashboard/events'    },
    { label: 'Settings',    icon: 'setting',   path: '/dashboard/settings'  },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
