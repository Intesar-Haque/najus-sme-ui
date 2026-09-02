import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap, map } from 'rxjs';

import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }      from 'ng-zorro-antd/empty';
import { NzAvatarModule }     from 'ng-zorro-antd/avatar';
import { NzSpinModule }       from 'ng-zorro-antd/spin';
import { NzDividerModule }    from 'ng-zorro-antd/divider';

import { ApiService } from '../../../core/services/api.service';
import { BlogPost }   from '../../../core/models';

/**
 * Fix for QA bug #28 ("Read More" button on the blog list did nothing) —
 * see SQA-FIX.md Fix #23. There was no blog detail page or route at all —
 * the backend's GET /blog/{id} (blog.show) was already ready and waiting,
 * the frontend just never built anything to call it. Structured the same
 * way as the events/products detail pages (breadcrumb → hero → content →
 * related), for consistency with the rest of the app.
 */
@Component({
  selector: 'app-blog-detail',
  imports: [
    RouterLink, DatePipe,
    NzButtonModule, NzIconModule, NzTagModule, NzBreadCrumbModule,
    NzEmptyModule, NzAvatarModule, NzSpinModule, NzDividerModule,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class BlogDetail implements OnInit {
  private api        = inject(ApiService);
  private route       = inject(ActivatedRoute);
  private router       = inject(Router);
  private destroyRef  = inject(DestroyRef);

  post          = signal<BlogPost | null>(null);
  relatedPosts  = signal<BlogPost[]>([]);
  notFound      = signal(false);
  loading       = signal(true);

  // The API stores content as plain prose (no markup) — see the seeder —
  // so this just preserves paragraph breaks rather than trusting/rendering
  // HTML the way the product description does (that one's sanitized
  // server-side specifically because it comes from a rich-text editor;
  // blog content doesn't).
  paragraphs = computed<string[]>(() => {
    const content = this.post()?.content;
    if (!content) return [];
    return content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  });

  ngOnInit() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params.get('id')),
      switchMap(id => {
        if (!id) return of({ id, post: null as BlogPost | null, related: [] as BlogPost[] });
        this.loading.set(true);
        this.notFound.set(false);
        return this.api.getBlogPostById(id).pipe(
          switchMap(post => {
            if (!post) return of({ id, post: null as BlogPost | null, related: [] as BlogPost[] });
            return this.api.getBlogPosts({ category: post.category, per_page: 4 }).pipe(
              map(r => r.data.filter(p => p.id !== post.id).slice(0, 3)),
              switchMap(related => of({ id, post, related })),
            );
          }),
        );
      }),
    ).subscribe({
      next: ({ id, post, related }) => {
        if (!id || !post) {
          this.notFound.set(true);
        } else {
          this.post.set(post);
          this.relatedPosts.set(related);
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  goBack() {
    this.router.navigate(['/blog']);
  }
}
