import { Routes } from '@angular/router';
import { authGuard }          from './core/guards/auth.guard';
import { Landing }            from './pages/landing/landing';
import { Login }              from './pages/login/login';
import { Dashboard }          from './pages/dashboard/dashboard';
import { DashOverview }       from './pages/dashboard/overview/overview';
import { DashProducts }       from './pages/dashboard/products/products';
import { DashProductCreate }  from './pages/dashboard/product-create/product-create';
import { DashAnalytics }      from './pages/dashboard/analytics/analytics';
import { DashEvents }         from './pages/dashboard/dash-events/dash-events';
import { DashSettings }       from './pages/dashboard/settings/settings';
import { Products }           from './pages/products/products';
import { ProductDetail }      from './pages/products/detail/detail';
import { Businesses }         from './pages/businesses/businesses';
import { Profile }            from './pages/businesses/profile/profile';
import { Events }             from './pages/events/events';
import { EventDetail }        from './pages/events/detail/detail';
import { Blog }               from './pages/blog/blog';
import { About }              from './pages/about/about';
import { Contact }            from './pages/contact/contact';
import { Faq }                from './pages/faq/faq';
import { Privacy }            from './pages/privacy/privacy';
import { Terms }              from './pages/terms/terms';

export const routes: Routes = [
  { path: '',               component: Landing        },
  { path: 'login',          component: Login          },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '',              redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',      component: DashOverview       },
      { path: 'products',      component: DashProducts       },
      { path: 'products/new',  component: DashProductCreate  },
      { path: 'analytics',     component: DashAnalytics      },
      { path: 'events',        component: DashEvents         },
      { path: 'settings',      component: DashSettings       },
    ],
  },
  { path: 'products',        component: Products       },
  { path: 'products/:id',    component: ProductDetail  },
  { path: 'businesses',      component: Businesses     },
  { path: 'businesses/:id',  component: Profile        },
  { path: 'events',          component: Events         },
  { path: 'events/:id',      component: EventDetail    },
  { path: 'blog',            component: Blog           },
  { path: 'about',           component: About          },
  { path: 'contact',         component: Contact        },
  { path: 'faq',             component: Faq            },
  { path: 'privacy',         component: Privacy        },
  { path: 'terms',           component: Terms          },
  { path: '**',              redirectTo: ''            },
];
