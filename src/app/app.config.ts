import {
  ApplicationConfig, provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection, importProvidersFrom, APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

registerLocaleData(en);

const httpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

// Block app startup until the active translation file is fully loaded so
// that | translate pipes always have data on first render.
//
// Fix for LAUNCH-GAPS.md #1 (Bengali translations) — the language switcher
// is dropped for good (not "temporarily disabled" anymore): the 140
// translation keys were never more than ~9 wired up in practice, and
// building out the rest wasn't worth it for a single-language launch.
// English-only from here on; the ngx-translate setup stays only because a
// handful of templates still use the `| translate` pipe for those ~9 keys.
function initTranslate(translate: TranslateService) {
  return () => {
    translate.addLangs(['en']);
    translate.setDefaultLang('en');
    return firstValueFrom(translate.use('en'));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideNoopAnimations(),
    provideRouter(
      routes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideNzI18n(en_US),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      FormsModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslate,
      deps: [TranslateService],
      multi: true,
    },
  ],
};
