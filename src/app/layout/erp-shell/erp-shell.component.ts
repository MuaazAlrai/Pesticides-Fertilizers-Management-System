import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Building2, CircleDollarSign, LayoutDashboard, LogOut, Menu, Package, PanelRightClose, PanelRightOpen, ReceiptText, Settings, ShoppingCart, Store, Truck, Users, Warehouse, X, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-erp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './erp-shell.component.html',
  styleUrl: './erp-shell.component.css',
})
export class ErpShellComponent {
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(localStorage.getItem('mat-sidebar-collapsed') === 'true');
  readonly icons = { Building2, CircleDollarSign, LayoutDashboard, LogOut, Menu, Package, PanelRightClose, PanelRightOpen, ReceiptText, Settings, ShoppingCart, Store, Truck, Users, Warehouse, X };
  readonly links = [
    { label: 'ڈیش بورڈ', path: '/dashboard', icon: LayoutDashboard },
    { label: 'کسٹمرز', path: '/customers', icon: Users },
    { label: 'اسٹاک', path: '/inventory', icon: Package },
    { label: 'سیلز', path: '/sales', icon: CircleDollarSign },
    { label: 'خریداری', path: '/purchase', icon: ShoppingCart },
    { label: 'روزنامچہ', path: '/roznamcha', icon: ReceiptText },
    { label: 'پارٹی کھاتہ', path: '/party-khata', icon: Building2 },
    { label: 'دکان', path: '/dukan', icon: Store },
    { label: 'گودام', path: '/godown', icon: Warehouse },
    { label: 'سپلائرز', path: '/customers', icon: Truck },
  ];
  constructor(readonly auth: AuthService, private readonly router: Router) {}
  closeSidebar(): void { this.sidebarOpen.set(false); }
  toggleSidebarSplit(): void {
    this.sidebarCollapsed.update(value => {
      const next = !value;
      localStorage.setItem('mat-sidebar-collapsed', String(next));
      return next;
    });
  }
  async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
