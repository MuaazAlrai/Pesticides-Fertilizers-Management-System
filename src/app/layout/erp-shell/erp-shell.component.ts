import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bell, Boxes, Building2, ChevronDown, CircleDollarSign, LayoutDashboard, Menu, Package, ReceiptText, Search, Settings, ShoppingCart, Store, Truck, Users, WalletCards, Warehouse, X, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-erp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './erp-shell.component.html',
  styleUrl: './erp-shell.component.css',
})
export class ErpShellComponent {
  readonly sidebarOpen = signal(false);
  readonly icons = { Bell, Boxes, Building2, ChevronDown, CircleDollarSign, LayoutDashboard, Menu, Package, ReceiptText, Search, Settings, ShoppingCart, Store, Truck, Users, WalletCards, Warehouse, X };
  readonly links = [
    { label: 'ڈیش بورڈ', path: '/dashboard', icon: LayoutDashboard },
    { label: 'صارفین', path: '/customers', icon: Users },
    { label: 'مصنوعات', path: '/inventory', icon: Package },
    { label: 'فروخت', path: '/sales', icon: CircleDollarSign },
    { label: 'پی او ایس', path: '/sales', icon: WalletCards },
    { label: 'خریداری', path: '/inventory', icon: ShoppingCart },
    { label: 'انوینٹری', path: '/inventory', icon: Boxes },
    { label: 'گودام', path: '/inventory', icon: Warehouse },
    { label: 'دکان', path: '/inventory', icon: Store },
    { label: 'سپلائرز', path: '/customers', icon: Truck },
    { label: 'اکاؤنٹس', path: '/dashboard', icon: ReceiptText },
  ];
  closeSidebar(): void { this.sidebarOpen.set(false); }
}
