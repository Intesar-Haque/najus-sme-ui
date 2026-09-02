import { Routes } from '@angular/router';
import { authGuard }          from './core/guards/auth.guard';
import { joinGuard }          from './core/guards/join.guard';
import { Landing }            from './pages/landing/landing';
import { Login }              from './pages/login/login';
import { Dashboard }          from './pages/dashboard/dashboard';
import { DashOverview }       from './pages/dashboard/overview/overview';
import { DashProducts }       from './pages/dashboard/products/products';
import { DashProductCreate }  from './pages/dashboard/product-create/product-create';
import { DashProductEdit }    from './pages/dashboard/product-edit/product-edit';
import { DashAnalytics }      from './pages/dashboard/analytics/analytics';
import { DashEvents }         from './pages/dashboard/dash-events/dash-events';
import { DashSettings }       from './pages/dashboard/settings/settings';
import { DashVendorEdit }     from './pages/dashboard/vendor-edit/vendor-edit';
import { DashOrders }         from './pages/dashboard/orders/orders';
import { Products }           from './pages/products/products';
import { ProductDetail }      from './pages/products/detail/detail';
import { Businesses }         from './pages/businesses/businesses';
import { Profile }            from './pages/businesses/profile/profile';
import { Events }             from './pages/events/events';
import { EventDetail }        from './pages/events/detail/detail';
import { Blog }               from './pages/blog/blog';
import { BlogDetail }         from './pages/blog/detail/detail';
import { About }              from './pages/about/about';
import { Contact }            from './pages/contact/contact';
import { Faq }                from './pages/faq/faq';
import { Privacy }            from './pages/privacy/privacy';
import { Terms }              from './pages/terms/terms';
import { Join }               from './pages/join/join';
import { Cart }               from './pages/cart/cart';
import { PaymentResult }      from './pages/payment-result/payment-result';

export const routes: Routes = [
  { path: '',               component: Landing        },
  { path: 'login',          component: Login          },
  { path: 'join',           component: Join,           canActivate: [joinGuard] },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '',              redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',      component: DashOverview       },
      { path: 'products',      component: DashProducts       },
      { path: 'products/new',  component: DashProductCreate  },
      { path: 'products/:id',  component: DashProductEdit    },
      { path: 'analytics',     component: DashAnalytics      },
      { path: 'events',        component: DashEvents         },
      { path: 'orders',        component: DashOrders         },
      { path: 'settings',      component: DashSettings       },
      { path: 'vendor',        component: DashVendorEdit     },
    ],
  },
  { path: 'products',        component: Products       },
  { path: 'products/:id',    component: ProductDetail  },
  { path: 'businesses',      component: Businesses     },
  { path: 'businesses/:id',  component: Profile        },
  { path: 'events',          component: Events         },
  { path: 'events/:id',      component: EventDetail    },
  { path: 'blog',            component: Blog           },
  // Fix for QA bug #28 ("Read More" did nothing — no detail page existed)
  // — see SQA-FIX.md Fix #23.
  { path: 'blog/:id',        component: BlogDetail     },
  { path: 'about',           component: About          },
  { path: 'contact',         component: Contact        },
  { path: 'faq',             component: Faq            },
  { path: 'privacy',         component: Privacy        },
  { path: 'terms',           component: Terms          },
  { path: 'cart',            component: Cart           },
  // SSLCommerz redirects here after a payment attempt — see SQA-FIX.md
  // Fix #2 (bugs #26/#43). These routes didn't exist before this fix, so a
  // customer who actually paid landed on the homepage with no confirmation.
  { path: 'payment-success', component: PaymentResult, data: { outcome: 'success' } },
  { path: 'payment-fail',    component: PaymentResult, data: { outcome: 'fail' }    },
  { path: 'payment-cancel',  component: PaymentResult, data: { outcome: 'cancel' }  },
  { path: 'payment-error',   component: PaymentResult, data: { outcome: 'error' }   },
  { path: '**',              redirectTo: ''            },
];
