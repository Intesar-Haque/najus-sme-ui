import {
  Component, inject, signal, OnInit, DestroyRef, ViewChild, ElementRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzButtonModule }   from 'ng-zorro-antd/button';
import { NzIconModule }     from 'ng-zorro-antd/icon';
import { NzFormModule }     from 'ng-zorro-antd/form';
import { NzInputModule }    from 'ng-zorro-antd/input';
import { NzSelectModule }   from 'ng-zorro-antd/select';
import { NzSpinModule }     from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService }       from '../../../core/services/api.service';
import { Category, Vendor } from '../../../core/models';

@Component({
  selector: 'app-dash-vendor-edit',
  imports: [
    RouterLink, ReactiveFormsModule,
    NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzSelectModule, NzSpinModule,
  ],
  providers: [NzMessageService],
  templateUrl: './vendor-edit.html',
  styleUrl:    './vendor-edit.less',
})
export class DashVendorEdit implements OnInit {
  private api        = inject(ApiService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('logoInput')  logoInputEl!:  ElementRef<HTMLInputElement>;
  @ViewChild('coverInput') coverInputEl!: ElementRef<HTMLInputElement>;

  loading      = signal(true);
  saving       = signal(false);
  vendor       = signal<Vendor | null>(null);
  categories   = signal<Category[]>([]);
  logoFile     = signal<File | null>(null);
  logoPreview  = signal<string | null>(null);
  coverFile    = signal<File | null>(null);
  coverPreview = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(200)]],
    description:    [''],
    location:       ['', Validators.maxLength(200)],
    district:       ['', Validators.maxLength(100)],
    phone:          ['', Validators.maxLength(30)],
    email:          ['', [Validators.email, Validators.maxLength(150)]],
    facebook:       ['', Validators.maxLength(200)],
    category_slugs: [[]],
  });

  ngOnInit() {
    forkJoin({
      overview:   this.api.getDashboardOverview(),
      categories: this.api.getCategories(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ overview, categories }) => {
          this.categories.set(categories);
          const v = overview?.vendor ?? null;
          this.vendor.set(v);
          if (v) {
            this.form.patchValue({
              name:           v.name,
              description:    v.description ?? '',
              location:       v.location ?? '',
              district:       v.district ?? '',
              phone:          v.phone ?? '',
              email:          v.email ?? '',
              facebook:       v.facebook ?? '',
              category_slugs: v.categorySlugs ?? [],
            });
            if (v.logo)       this.logoPreview.set(v.logo);
            if (v.coverImage) this.coverPreview.set(v.coverImage);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onLogoChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFile.set(file);
    const reader = new FileReader();
    reader.onload = ev => this.logoPreview.set(ev.target!.result as string);
    reader.readAsDataURL(file);
  }

  onCoverChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverFile.set(file);
    const reader = new FileReader();
    reader.onload = ev => this.coverPreview.set(ev.target!.result as string);
    reader.readAsDataURL(file);
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v  = this.form.value;
    const fd = new FormData();

    for (const key of ['name', 'description', 'location', 'district', 'phone', 'email', 'facebook'] as const) {
      fd.append(key, v[key] ?? '');
    }
    (v.category_slugs as string[]).forEach(s => fd.append('category_slugs[]', s));
    if (this.logoFile())  fd.append('logo',        this.logoFile()!);
    if (this.coverFile()) fd.append('cover_image', this.coverFile()!);

    this.api.updateDashboardVendor(fd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.success('Vendor profile updated.');
          this.saving.set(false);
          this.router.navigate(['/dashboard/settings']);
        },
        error: err => {
          this.message.error(err?.error?.message ?? 'Failed to update profile. Please try again.');
          this.saving.set(false);
        },
      });
  }
}
