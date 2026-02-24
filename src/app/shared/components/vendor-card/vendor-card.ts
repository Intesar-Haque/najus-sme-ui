import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { Vendor } from '../../../core/models';

@Component({
  selector: 'app-vendor-card',
  imports: [
    RouterLink,
    NzAvatarModule, NzTagModule, NzButtonModule,
    NzIconModule, NzRateModule, NzToolTipModule, FormsModule,
  ],
  templateUrl: './vendor-card.html',
  styleUrl: './vendor-card.less',
})
export class VendorCard {
  vendor = input.required<Vendor>();
}
