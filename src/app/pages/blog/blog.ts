import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';

import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzInputModule }      from 'ng-zorro-antd/input';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { NzDrawerModule }     from 'ng-zorro-antd/drawer';
import { NzEmptyModule }      from 'ng-zorro-antd/empty';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzBadgeModule }      from 'ng-zorro-antd/badge';
import { NzDividerModule }    from 'ng-zorro-antd/divider';
import { NzAvatarModule }     from 'ng-zorro-antd/avatar';
import { NzSelectModule }     from 'ng-zorro-antd/select';
import { NzSpinModule }       from 'ng-zorro-antd/spin';

import { ApiService, BlogResponse } from '../../core/services/api.service';
import { BlogPost } from '../../core/models';

export type BlogSort = 'newest' | 'oldest' | 'read-time';

interface FilterChip {
  label: string;
  type: 'search' | 'category' | 'tag';
  value?: string;
}

const EMPTY_RESULT: BlogResponse = {
  data: [],
  featured: null,
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 50, all_categories: [], all_tags: [] },
};

@Component({
  selector: 'app-blog',
  imports: [
    RouterLink, FormsModule, DatePipe, NgTemplateOutlet,
    NzButtonModule, NzIconModule, NzInputModule, NzTagModule,
    NzDrawerModule, NzEmptyModule, NzBreadCrumbModule, NzBadgeModule,
    NzDividerModule, NzAvatarModule, NzSelectModule, NzSpinModule,
  ],
  templateUrl: './blog.html',
  styleUrl:    './blog.less',
})
export class Blog {
  private api = inject(ApiService);

  readonly sortOptions = [
    { value: 'newest',    label: 'Newest First'    },
    { value: 'oldest',    label: 'Oldest First'    },
    { value: 'read-time', label: 'Quick Reads'     },
  ];

  // ── Filter state ──────────────────────────────────────────────────────
  searchQuery      = signal('');
  selectedCategory = signal('');
  selectedTags     = signal<string[]>([]);
  sortBy           = signal<BlogSort>('newest');
  filterDrawerOpen = signal(false);

  // ── Combined filter params ────────────────────────────────────────────
  private filterParams = computed(() => ({
    q:        this.searchQuery()      || undefined,
    category: this.selectedCategory() || undefined,
    tags:     this.selectedTags().length ? this.selectedTags() : undefined,
    sort:     this.sortBy() !== 'newest' ? this.sortBy() : undefined,
    per_page: 50,
  }));

  // ── Reactive API result ───────────────────────────────────────────────
  private result$ = toObservable(this.filterParams).pipe(
    debounceTime(300),
    switchMap(p => this.api.getBlogPosts(p)),
  );

  private result = toSignal(this.result$, { initialValue: EMPTY_RESULT });

  // ── Derived ───────────────────────────────────────────────────────────
  readonly posts         = computed(() => this.result().data);
  readonly totalCount    = computed(() => this.result().meta.total);
  readonly featuredPost  = computed<BlogPost | null>(() => this.result().featured);
  readonly allCategories = computed(() => this.result().meta.all_categories);
  readonly allTags       = computed(() => this.result().meta.all_tags);

  // ── Active filter chips ───────────────────────────────────────────────
  activeFilterCount = computed(() =>
    (this.searchQuery() ? 1 : 0) +
    (this.selectedCategory() ? 1 : 0) +
    this.selectedTags().length
  );

  activeChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.searchQuery()) chips.push({ label: `"${this.searchQuery()}"`, type: 'search' });
    if (this.selectedCategory()) chips.push({ label: this.selectedCategory(), type: 'category', value: this.selectedCategory() });
    this.selectedTags().forEach(t => chips.push({ label: `#${t}`, type: 'tag', value: t }));
    return chips;
  });

  // ── Handlers ──────────────────────────────────────────────────────────
  toggleTag(tag: string) {
    this.selectedTags.update(tags =>
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    );
  }

  removeChip(chip: FilterChip) {
    switch (chip.type) {
      case 'search':   this.searchQuery.set(''); break;
      case 'category': this.selectedCategory.set(''); break;
      case 'tag':      this.selectedTags.update(t => t.filter(v => v !== chip.value)); break;
    }
  }

  clearAll() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedTags.set([]);
    this.sortBy.set('newest');
  }
}
