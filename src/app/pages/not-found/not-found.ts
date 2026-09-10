import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';

/**
 * Fix for LAUNCH-GAPS.md's "would be nice" list — any unknown URL used to
 * hit the wildcard route (`app.routes.ts`) and silently `redirectTo: ''`,
 * bouncing straight to the homepage with no explanation. A mistyped or
 * dead link looked like it worked, just landed somewhere the visitor didn't
 * expect, which is more confusing than an honest "that page doesn't exist."
 *
 * Note: this is a client-rendered SPA with no server-side rendering (see
 * SQA_REPORT.md's H-21 and this app's own `angular.json` — no `server`
 * builder configured), so the hosting layer still answers every path with
 * HTTP 200 and this app's `index.html` — that part can't change without
 * adding SSR. What this fixes is the in-app behavior: the router now shows
 * an actual "page not found" screen instead of silently redirecting.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.less',
})
export class NotFound {}
