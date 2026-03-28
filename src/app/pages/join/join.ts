import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzInputModule }   from 'ng-zorro-antd/input';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzAlertModule }   from 'ng-zorro-antd/alert';
import { NzSpinModule }    from 'ng-zorro-antd/spin';
import { NzSelectModule }  from 'ng-zorro-antd/select';

import { ApiService }  from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type Step = 1 | 2 | 3;

const FILE_FIELDS = [
  'attachment_nid_passport',
  'attachment_trade_licence',
  'attachment_registration_licence',
  'attachment_tin',
  'attachment_bin',
] as const;

type FileField = (typeof FILE_FIELDS)[number];

@Component({
  selector: 'app-join',
  imports: [
    RouterLink, ReactiveFormsModule,
    NzButtonModule, NzInputModule, NzIconModule,
    NzAlertModule, NzSpinModule, NzSelectModule,
  ],
  templateUrl: './join.html',
  styleUrl: './join.less',
})
export class Join {
  private fb     = inject(FormBuilder);
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  step         = signal<Step>(1);
  loading      = signal(false);
  errorMessage = signal('');

  // ── Step 1 form ─────────────────────────────────────────────────────────────
  companyForm: FormGroup = this.fb.group({
    company_name:          ['', Validators.required],
    registered_address:    ['', Validators.required],
    registered_phone:      ['', Validators.required],
    company_type:          ['', Validators.required],
    company_nature:        ['', Validators.required],
    trade_licence_number:  ['', Validators.required],
    organization_scale:    ['', Validators.required],
    website:               [''],
    tin:                   [''],
    bin:                   [''],
  });

  // ── Step 2 form ─────────────────────────────────────────────────────────────
  contactForm: FormGroup = this.fb.group({
    contact_name:  ['', Validators.required],
    contact_email: ['', [Validators.required, Validators.email]],
  });

  // ── File state ───────────────────────────────────────────────────────────────
  files: Partial<Record<FileField, File>> = {};
  fileErrors: Partial<Record<FileField, string>> = {};

  readonly fileLabels: Record<FileField, string> = {
    attachment_nid_passport:        'NID / Passport',
    attachment_trade_licence:        'Trade Licence',
    attachment_registration_licence: 'Registration Licence',
    attachment_tin:                  'TIN Certificate',
    attachment_bin:                  'BIN Certificate',
  };

  readonly fileFields = FILE_FIELDS;

  // ── Dropdown options ─────────────────────────────────────────────────────────
  readonly companyTypeOptions = [
    { value: 'limited',        label: 'Limited Company'   },
    { value: 'partnership',    label: 'Partnership'        },
    { value: 'proprietorship', label: 'Proprietorship'     },
    { value: 'others',         label: 'Others'             },
  ];

  readonly companyNatureOptions = [
    { value: 'manufacturer',            label: 'Manufacturer'             },
    { value: 'manufacturer_cum_export', label: 'Manufacturer cum Export'  },
  ];

  readonly scaleOptions = [
    { value: 'micro',  label: 'Micro Enterprise'  },
    { value: 'medium', label: 'Medium Enterprise' },
  ];

  // ── Navigation ───────────────────────────────────────────────────────────────
  nextStep() {
    this.companyForm.markAllAsTouched();
    if (this.companyForm.invalid) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }
    this.errorMessage.set('');
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack() {
    this.step.set(1);
    this.errorMessage.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── File handling ────────────────────────────────────────────────────────────
  onFileChange(field: FileField, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.fileErrors[field] = 'Only PDF, JPG, JPEG, PNG allowed.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.fileErrors[field] = 'File must be under 5 MB.';
      input.value = '';
      return;
    }
    this.fileErrors[field] = '';
    this.files[field] = file;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  submit() {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    // Validate all files present
    for (const field of FILE_FIELDS) {
      if (!this.files[field]) {
        this.errorMessage.set(`Please upload ${this.fileLabels[field]}.`);
        return;
      }
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const fd = new FormData();
    for (const [k, v] of Object.entries(this.companyForm.value) as [string, string][]) {
      if (v) fd.append(k, v);
    }
    for (const [k, v] of Object.entries(this.contactForm.value) as [string, string][]) {
      if (v) fd.append(k, v);
    }
    for (const field of FILE_FIELDS) {
      const file = this.files[field];
      if (file) fd.append(field, file);
    }

    this.api.submitRegistration(fd).subscribe({
      next: () => {
        this.loading.set(false);
        // Mark the member as submitted so the dashboard shows the pending-review state
        const m = this.auth.currentMember();
        if (m) {
          this.auth.currentMember.set({ ...m, membershipSubmitted: true });
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  fieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
