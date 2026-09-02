import {
  Component, inject, signal, OnInit, AfterViewInit,
  DestroyRef, ViewChild, ElementRef, computed,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

import { NzButtonModule }      from 'ng-zorro-antd/button';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzFormModule }        from 'ng-zorro-antd/form';
import { NzInputModule }       from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule }      from 'ng-zorro-antd/select';
import { NzCascaderModule }    from 'ng-zorro-antd/cascader';
import { NzSwitchModule }      from 'ng-zorro-antd/switch';
import { NzSpinModule }        from 'ng-zorro-antd/spin';
import { NzMessageService }    from 'ng-zorro-antd/message';
import { NzCardModule }        from 'ng-zorro-antd/card';
import { NzProgressModule }    from 'ng-zorro-antd/progress';
import { NzToolTipModule }     from 'ng-zorro-antd/tooltip';

import { ApiService } from '../../../core/services/api.service';
import { Category }   from '../../../core/models';
import { extractErrorMessage } from '../../../core/utils/http-error';

interface ScoreCriterion {
  label: string;
  points: number;
  earned: number;
  tip: string;
}

@Component({
  selector: 'app-dash-product-create',
  imports: [
    RouterLink, ReactiveFormsModule,
    NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzInputNumberModule, NzSelectModule, NzCascaderModule, NzSwitchModule, NzSpinModule,
    NzCardModule, NzProgressModule, NzToolTipModule,
  ],
  templateUrl: './product-create.html',
  styleUrl:    './product-create.less',
})
export class DashProductCreate implements OnInit, AfterViewInit {
  private api        = inject(ApiService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('descRte')       descRteEl!:       ElementRef<HTMLDivElement>;
  @ViewChild('highlightsRte') highlightsRteEl!: ElementRef<HTMLDivElement>;

  categories      = signal<Category[]>([]);
  catLoading      = signal(true);
  saving      = signal(false);
  submitting  = signal(false);
  categoryOptions = computed(() => this.categories().map(c => this.toCatOption(c)));
  imageFiles    = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);
  videoFile     = signal<File | null>(null);
  videoMode     = signal<'url' | 'file'>('url');
  descEmpty     = signal(true);
  hlEmpty       = signal(true);

  readonly warrantyTypes = [
    { label: 'No Warranty',     value: 'no_warranty' },
    { label: 'Brand Warranty',  value: 'brand_warranty' },
    { label: 'Seller Warranty', value: 'seller_warranty' },
  ];

  form: FormGroup = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(200)]],
    description:        ['', Validators.required],
    category_path:      [[]],
    category_id:        [null, Validators.required],
    original_price:     [null],
    tags_input:         [''],
    is_new:             [false],
    video_url:          [''],
    highlights:         [''],
    whats_in_box:       [''],
    weight:             [null],
    dimensions:         [''],
    contains_liquid:    [false],
    contains_flammable: [false],
    warranty_type:      ['no_warranty'],
    warranty_policy:    [''],
    return_policy:      [''],
    variants: this.fb.array([]),
  });

  private formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  scoreItems = computed((): ScoreCriterion[] => {
    const raw      = this.formValues();
    const images   = this.imageFiles();
    const descText = ((raw.description as string) || '').replace(/<[^>]*>/g, '').trim();
    const hlText   = ((raw.highlights   as string) || '').replace(/<[^>]*>/g, '').trim();
    const variants = (raw.variants as any[] || []);
    const hasPrice = variants.some((v: any) => v.price != null && Number(v.price) > 0);

    return [
      {
        label: 'Product Name', points: 15,
        earned: (raw.name?.trim() ? 10 : 0) + ((raw.name?.trim()?.length ?? 0) >= 10 ? 5 : 0),
        tip: 'A clear, descriptive name of 10+ characters improves discoverability',
      },
      {
        label: 'Category', points: 10,
        earned: raw.category_id ? 10 : 0,
        tip: 'Selecting a category helps buyers find your product',
      },
      {
        label: 'Description', points: 20,
        earned: (descText ? 10 : 0) + (descText.length >= 80 ? 10 : 0),
        tip: 'Write a detailed description (80+ characters) to build buyer trust',
      },
      {
        label: 'Product Images', points: 20,
        earned: (images.length > 0 ? 10 : 0) + (images.length >= 3 ? 10 : 0),
        tip: 'Upload at least 3 images to maximise buyer confidence',
      },
      {
        label: 'Price & Variants', points: 15,
        earned: hasPrice ? 15 : 0,
        tip: 'Set a price for at least one colour variant',
      },
      {
        label: 'Highlights', points: 10,
        earned: hlText ? 10 : 0,
        tip: 'Add key selling points to help buyers decide faster',
      },
      {
        label: 'Tags', points: 5,
        earned: raw.tags_input?.trim() ? 5 : 0,
        tip: 'Tags improve search ranking and discoverability',
      },
      {
        label: 'Warranty Info', points: 5,
        earned: raw.warranty_type && raw.warranty_type !== 'no_warranty' ? 5 : 0,
        tip: 'Providing warranty information increases buyer confidence',
      },
    ];
  });

  totalScore = computed(() =>
    this.scoreItems().reduce((s, item) => s + item.earned, 0)
  );

  scoreColor = computed(() => {
    const s = this.totalScore();
    if (s >= 81) return '#28a745';
    if (s >= 61) return '#1890ff';
    if (s >= 41) return '#fa8c16';
    return '#ff4d4f';
  });

  scoreLabel = computed(() => {
    const s = this.totalScore();
    if (s >= 81) return 'Excellent';
    if (s >= 61) return 'Good';
    if (s >= 41) return 'Fair';
    return 'Needs Work';
  });

  readonly scoreFormat = (pct: number): string => `${pct}`;

  get variants(): FormArray { return this.form.get('variants') as FormArray; }
  variantGroup(i: number): FormGroup { return this.variants.at(i) as FormGroup; }

  ngOnInit() {
    this.form.get('category_path')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((path: string[]) => {
        this.form.get('category_id')!.setValue(path?.[path.length - 1] ?? null, { emitEvent: false });
      });

    this.api.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cats => { this.categories.set(cats); this.catLoading.set(false); },
        error: ()  => this.catLoading.set(false),
      });
    this.addVariant();
  }

  ngAfterViewInit() {
    const desc = this.form.get('description')!.value;
    const hl   = this.form.get('highlights')!.value;
    if (desc) { this.descRteEl.nativeElement.innerHTML = desc;       this.descEmpty.set(false); }
    if (hl)   { this.highlightsRteEl.nativeElement.innerHTML = hl;   this.hlEmpty.set(false); }
  }

  execRteCmd(event: MouseEvent, command: string, value?: string) {
    event.preventDefault(); // keep contenteditable focus
    document.execCommand(command, false, value);
  }

  onRteInput(field: 'description' | 'highlights', event: Event) {
    const el   = event.target as HTMLElement;
    const text = el.textContent?.trim() ?? '';
    let   html = el.innerHTML;
    if (html === '<br>') html = '';

    if (field === 'description') this.descEmpty.set(!text);
    else                         this.hlEmpty.set(!text);

    this.form.get(field)!.setValue(html, { emitEvent: true });
  }

  private toCatOption(cat: Category): { value: string; label: string; isLeaf: boolean; children?: any[] } {
    const leaf = !cat.children?.length;
    return {
      value: cat.id,
      label: cat.icon ? `${cat.icon} ${cat.name}` : cat.name,
      isLeaf: leaf,
      children: leaf ? undefined : cat.children!.map(c => this.toCatOption(c)),
    };
  }

  addVariant() {
    this.variants.push(this.fb.group({
      color_name: ['', Validators.required],
      color_hex:  ['#4caf50'],
      price:      [null, [Validators.required, Validators.min(0)]],
      stock:      [0,    [Validators.required, Validators.min(0)]],
    }));
  }

  removeVariant(i: number) {
    if (this.variants.length > 1) this.variants.removeAt(i);
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const combined = [...this.imageFiles(), ...Array.from(input.files)].slice(0, 8);
    this.imagePreviews().forEach(p => URL.revokeObjectURL(p));
    this.imageFiles.set(combined);
    this.imagePreviews.set(combined.map(f => URL.createObjectURL(f)));
    input.value = '';
  }

  removeImage(i: number) {
    const files    = [...this.imageFiles()];
    const previews = [...this.imagePreviews()];
    URL.revokeObjectURL(previews[i]);
    files.splice(i, 1);
    previews.splice(i, 1);
    this.imageFiles.set(files);
    this.imagePreviews.set(previews);
  }

  onVideoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.videoFile.set(input.files[0]);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createDashboardProduct(this.buildFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.message.success(`"${data.name}" saved as draft.`);
          this.saving.set(false);
          this.router.navigate(['/dashboard/products']);
        },
        error: err => {
          // Fix #50 (SQA-FIX.md Fix #9) — surface the real reason (e.g.
          // "Each product image must be 2MB or smaller.") instead of a
          // generic message that hides why the submit actually failed.
          this.message.error(extractErrorMessage(err, 'Failed to create product. Please try again.'));
          this.saving.set(false);
        },
      });
  }

  submitAndReview() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.api.createDashboardProduct(this.buildFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.api.submitDashboardProductForReview(data.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.message.success(`"${data.name}" submitted for review.`);
                this.submitting.set(false);
                this.router.navigate(['/dashboard/products']);
              },
              error: () => {
                this.message.warning(`Product saved as draft but submission failed. You can submit from the edit page.`);
                this.submitting.set(false);
                this.router.navigate([`/dashboard/products/${data.id}/edit`]);
              },
            });
        },
        error: err => {
          this.message.error(extractErrorMessage(err, 'Failed to create product. Please try again.'));
          this.submitting.set(false);
        },
      });
  }

  private buildFormData(): FormData {
    const raw = this.form.getRawValue();
    const fd  = new FormData();

    fd.append('name',        raw.name);
    fd.append('description', raw.description);
    fd.append('category_id', raw.category_id);
    if (raw.original_price != null) fd.append('original_price', String(raw.original_price));

    const tags = (raw.tags_input as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    tags.forEach(t => fd.append('tags[]', t));

    fd.append('is_new', raw.is_new ? '1' : '0');

    if (this.videoMode() === 'url' && raw.video_url?.trim()) {
      fd.append('video_url', raw.video_url.trim());
    } else if (this.videoMode() === 'file' && this.videoFile()) {
      fd.append('video', this.videoFile()!);
    }

    if (raw.highlights?.trim())    fd.append('highlights',    raw.highlights.trim());
    if (raw.whats_in_box?.trim())  fd.append('whats_in_box',  raw.whats_in_box.trim());
    if (raw.weight != null)        fd.append('weight',        String(raw.weight));
    if (raw.dimensions?.trim())    fd.append('dimensions',    raw.dimensions.trim());

    fd.append('contains_liquid',    raw.contains_liquid    ? '1' : '0');
    fd.append('contains_flammable', raw.contains_flammable ? '1' : '0');
    fd.append('warranty_type', raw.warranty_type);
    if (raw.warranty_policy?.trim()) fd.append('warranty_policy', raw.warranty_policy.trim());
    if (raw.return_policy?.trim())   fd.append('return_policy',   raw.return_policy.trim());

    this.imageFiles().forEach(f => fd.append('images[]', f));

    (raw.variants as any[]).forEach((v, i) => {
      fd.append(`variants[${i}][color_name]`, v.color_name);
      if (v.color_hex) fd.append(`variants[${i}][color_hex]`, v.color_hex);
      fd.append(`variants[${i}][price]`, String(v.price));
      fd.append(`variants[${i}][stock]`, String(v.stock ?? 0));
    });

    return fd;
  }
}
