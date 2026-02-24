import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

import { DataService } from '../../core/services/data.service';
import { BlogPost } from '../../core/models';

export type BlogSort = 'newest' | 'oldest' | 'read-time';

interface FilterChip {
  label: string;
  type: 'search' | 'category' | 'tag';
  value?: string;
}

@Component({
  selector: 'app-blog',
  imports: [
    RouterLink, FormsModule, DatePipe, NgTemplateOutlet,
    NzButtonModule, NzIconModule, NzInputModule, NzTagModule,
    NzDrawerModule, NzEmptyModule, NzBreadCrumbModule, NzBadgeModule,
    NzDividerModule, NzAvatarModule, NzSelectModule,
  ],
  templateUrl: './blog.html',
  styleUrl:    './blog.less',
})
export class Blog {
  private data = inject(DataService);

  readonly allPosts      = this.data.blogPosts;
  readonly allCategories = this.data.allBlogCategories;
  readonly allTags       = this.data.allBlogTags;

  readonly sortOptions = [
    { value: 'newest',    label: 'Newest First'    },
    { value: 'oldest',    label: 'Oldest First'    },
    { value: 'read-time', label: 'Quick Reads'     },
  ];

  // ── Filter state ──────────────────────────────────────────────────────
  searchQuery       = signal('');
  selectedCategory  = signal('');
  selectedTags      = signal<string[]>([]);
  sortBy            = signal<BlogSort>('newest');
  filterDrawerOpen  = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────
  featuredPost = computed<BlogPost | null>(() =>
    this.allPosts.find(p => p.featured) ?? null
  );

  filteredPosts = computed(() => {
    let list = [...this.allPosts];

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    const cat = this.selectedCategory();
    if (cat) list = list.filter(p => p.category === cat);

    const tags = this.selectedTags();
    if (tags.length) list = list.filter(p => tags.some(t => p.tags.includes(t)));

    switch (this.sortBy()) {
      case 'newest':    list.sort((a, b) => b.date.localeCompare(a.date));    break;
      case 'oldest':    list.sort((a, b) => a.date.localeCompare(b.date));    break;
      case 'read-time': list.sort((a, b) => a.readTime - b.readTime);          break;
    }
    return list;
  });

  totalCount = computed(() => this.filteredPosts().length);

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

  categoryPostCount(cat: string): number {
    return this.allPosts.filter(p => p.category === cat).length;
  }
}
