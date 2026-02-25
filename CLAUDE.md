# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server on http://localhost:4500
npm run build      # production build → dist/najus-sme/
npm run watch      # dev build in watch mode
npm test           # unit tests via Karma/Jasmine
npx ng build --configuration development   # fast dev build (use to verify no compile errors)
```

No linter is configured. Use `npx ng build --configuration development` as the fastest correctness check after making changes.

## Architecture Overview

**NAJUS SME** is an Angular 20 marketplace platform connecting verified Bangladeshi small and medium enterprises. The application uses standalone components throughout (no NgModule declarations). Implement control flow with @if and @for directives exclusively—avoid ngFor and ngIf. Structure data so dummy values can be seamlessly replaced with API calls; all data retrieval must route through services. Centralize styling to minimize page-specific CSS and maximize reusability. Leverage ng-zorro for layout and structural components wherever possible.

### Directory layout

```
src/
  app/
    app.ts / app.html / app.routes.ts   ← root shell
    core/
      models/index.ts                   ← all TypeScript interfaces
      services/
        data.service.ts                 ← all dummy data (replace methods with HttpClient later)
        auth.service.ts                 ← OTP auth flow (signal-based)
    pages/                              ← one folder per route
      landing / login / dashboard /
      products / events / businesses /
      blog
    shared/components/
      navbar / footer / product-card / vendor-card
  styles/
    variables.less    ← ALL design tokens (import this in every component .less)
    mixins.less       ← reusable LESS mixins
  styles.less         ← global styles + ng-zorro theme overrides
  assets/i18n/en.json ← translation keys
```

### Shell layout

`App` (app.ts) renders `<app-navbar>`, `<router-outlet>`, and `<app-footer>`. Routes listed in `SHELL_EXCLUDED` (`/login`, `/dashboard`) suppress the shared shell so those pages own their full layout.

### Routing

Routes are in `src/app/app.routes.ts`. Pages with detail views follow the pattern:
- listing: `/products`, `/events`, `/businesses`
- detail: `/products/:id`, `/events/:id`, `/businesses/:id`

### Data layer

`DataService` (`src/app/core/services/data.service.ts`) is the sole source of data — all arrays are plain TS constants. When wiring a real API, replace each `DataService` method body with an `HttpClient` call; the service shape stays the same.

### Auth

`AuthService` implements a two-step membership-code + email-OTP flow:
1. `requestOtp(memberCode)` → validates code, returns `maskedEmail`
2. `verifyOtp(memberCode, otp)` → validates OTP, writes `najus_member` to `localStorage`

Both return `Observable` with a simulated delay. Demo OTP is `123456`. Member codes: `NAJUS-001` through `NAJUS-005`.

### Styling conventions

- **Every** component `.less` file must start with:
  ```less
  @import '../../../../styles/variables';   // adjust depth
  @import '../../../../styles/mixins';
  ```
  Files are named `variables.less` / `mixins.less` — **no underscore prefix** (LESS doesn't auto-resolve Sass-style partials).
- Design tokens live exclusively in `variables.less`. Never hardcode colors, spacing, or radii inline.
- Key mixins: `.container()`, `.card()`, `.section()`, `.section-header()`, `.grid-auto(@min, @gap)`, `.clamp(@n)`, `.flex-center()`, `.hide-mobile()`, `.hide-desktop()`.

### Angular patterns (use consistently)

- Signals for all state: `signal()`, `computed()`, `toSignal()`
- `inject()` instead of constructor injection
- `input()` / `output()` for component I/O
- `@for` / `@if` control flow (not `*ngFor` / `*ngIf`)
- `@ViewChild` when a template reference variable must be accessed across `@if` branches

### UI components

[ng-zorro-antd v20](https://ng.ant.design) is the sole UI library. Import individual modules per component (e.g. `NzButtonModule`, `NzIconModule`). Do not import `NzGridModule` — use CSS grid/flexbox instead.

### i18n

`@ngx-translate/core` with JSON files in `src/assets/i18n/`. Only `en.json` exists. Language switcher (en/bn) is in the Navbar; active language stored in `localStorage` and applied as a `body` class (`lang-bn`).

### Backend

`environment.api = 'http://127.0.0.1:8000/api'` — not yet wired. Firebase 11 is installed but not integrated.
