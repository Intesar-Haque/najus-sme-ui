import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';

/** Routes that use their own full-page layout (no shared navbar/footer). */
const SHELL_EXCLUDED = ['/login', '/dashboard'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url }
  );

  showShell = computed(() =>
    !SHELL_EXCLUDED.some(prefix => this.currentUrl().startsWith(prefix))
  );
}
