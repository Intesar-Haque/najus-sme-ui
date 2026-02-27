import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzTagModule }     from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzSpinModule }    from 'ng-zorro-antd/spin';

import { AuthService } from '../../../core/services/auth.service';
import { ApiService, DashboardOverview } from '../../../core/services/api.service';
import { Vendor } from '../../../core/models';

@Component({
  selector: 'app-dash-settings',
  imports: [NzTagModule, NzDividerModule, NzIconModule, NzButtonModule, NzSpinModule],
  templateUrl: './settings.html',
  styleUrl:    './settings.less',
})
export class DashSettings implements OnInit {
  private api        = inject(ApiService);
  private auth       = inject(AuthService);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading  = signal(true);
  member   = this.auth.currentMember;

  private overviewData = signal<DashboardOverview | null>(null);
  vendor = computed<Vendor | null>(() => this.overviewData()?.vendor ?? null);

  ngOnInit() {
    this.api.getDashboardOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.overviewData.set(data); this.loading.set(false); },
        error: ()  => { this.loading.set(false); },
      });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
