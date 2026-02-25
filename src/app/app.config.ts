import {
  ApplicationConfig, provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection, importProvidersFrom, APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

registerLocaleData(en);

const httpLoaderFactory = (http: HttpClient) =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

// Block app startup until the active translation file is fully loaded
// so that | translate pipes always have data on first render.
function initTranslate(translate: TranslateService) {
  return () => {
    translate.addLangs(['en', 'bn']);
    translate.setDefaultLang('en');
    const saved = (localStorage.getItem('lang') as 'en' | 'bn') ?? 'en';
    return firstValueFrom(translate.use(saved));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideNzI18n(en_US),
    provideHttpClient(withInterceptorsFromDi()),
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
