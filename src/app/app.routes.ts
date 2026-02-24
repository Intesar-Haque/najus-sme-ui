import { Routes } from '@angular/router';
import { Landing }     from './pages/landing/landing';
import { Login }       from './pages/login/login';
import { Dashboard }   from './pages/dashboard/dashboard';
import { Products }    from './pages/products/products';
import { Businesses }  from './pages/businesses/businesses';
import { Profile }     from './pages/businesses/profile/profile';
import { Events }      from './pages/events/events';
import { Blog }          from './pages/blog/blog';
import { ProductDetail } from './pages/products/detail/detail';

export const routes: Routes = [
  { path: '',                component: Landing        },
  { path: 'login',           component: Login          },
  { path: 'dashboard',       component: Dashboard      },
  { path: 'products',        component: Products       },
  { path: 'products/:id',    component: ProductDetail  },
  { path: 'businesses',      component: Businesses     },
  { path: 'businesses/:id',  component: Profile        },
  { path: 'events',          component: Events         },
  { path: 'blog',            component: Blog           },
  { path: '**',              redirectTo: ''            },
];
