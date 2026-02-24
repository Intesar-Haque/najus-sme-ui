import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NzButtonModule, NzIconModule, NzCardModule, NzAvatarModule, NzTagModule],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.less',
})
export class Dashboard {
  private auth   = inject(AuthService);
  private router = inject(Router);

  member = this.auth.currentMember;

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
