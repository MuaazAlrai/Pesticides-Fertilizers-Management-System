import { Routes } from '@angular/router';
import { ErpShellComponent } from './layout/erp-shell/erp-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ErpShellComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'sales', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'purchase', loadComponent: () => import('./pages/purchase/purchase.component').then(m => m.PurchaseComponent) },
      { path: 'roznamcha', loadComponent: () => import('./pages/roznamcha/roznamcha.component').then(m => m.RoznamchaComponent) },
      { path: 'party-khata', loadComponent: () => import('./pages/party-khata/party-khata.component').then(m => m.PartyKhataComponent) },
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
