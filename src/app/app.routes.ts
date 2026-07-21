import { Routes } from '@angular/router';
import { ErpShellComponent } from './layout/erp-shell/erp-shell.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: ErpShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'sales', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'sales/new', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent), data: { mode: 'form' } },
      { path: 'sales/edit/:invoice', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent), data: { mode: 'form' } },
      { path: 'purchase', loadComponent: () => import('./pages/purchase/purchase.component').then(m => m.PurchaseComponent) },
      { path: 'purchase/new', loadComponent: () => import('./pages/purchase/purchase.component').then(m => m.PurchaseComponent), data: { mode: 'form' } },
      { path: 'purchase/edit/:invoice', loadComponent: () => import('./pages/purchase/purchase.component').then(m => m.PurchaseComponent), data: { mode: 'form' } },
      { path: 'roznamcha', loadComponent: () => import('./pages/roznamcha/roznamcha.component').then(m => m.RoznamchaComponent) },
      { path: 'party-khata', loadComponent: () => import('./pages/party-khata/party-khata.component').then(m => m.PartyKhataComponent) },
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'dukan', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent), data: { location: 'shop' } },
      { path: 'godown', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent), data: { location: 'warehouse' } },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
