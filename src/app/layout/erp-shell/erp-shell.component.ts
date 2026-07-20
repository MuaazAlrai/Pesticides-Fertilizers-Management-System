import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bell, Boxes, Building2, ChevronDown, CircleDollarSign, LayoutDashboard, Menu, Package, ReceiptText, Search, Settings, ShoppingCart, Store, Truck, Users, Warehouse, X, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-erp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './erp-shell.component.html',
  styleUrl: './erp-shell.component.css',
})
export class ErpShellComponent {
  readonly sidebarOpen = signal(false);
  readonly icons = { Bell, Boxes, Building2, ChevronDown, CircleDollarSign, LayoutDashboard, Menu, Package, ReceiptText, Search, Settings, ShoppingCart, Store, Truck, Users, Warehouse, X };
  readonly links = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Khad / Spray', path: '/inventory', icon: Package },
    { label: 'Sales', path: '/sales', icon: CircleDollarSign },
    { label: 'Purchase', path: '/purchase', icon: ShoppingCart },
    { label: 'Roznamcha', path: '/roznamcha', icon: ReceiptText },
    { label: 'Party Khata', path: '/party-khata', icon: Building2 },
    // { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Dukan', path: '/dukan', icon: Store },
    { label: 'Godown', path: '/godown', icon: Warehouse },
    { label: 'Suppliers', path: '/customers', icon: Truck },
    // { label: 'Accounts', path: '/party-khata', icon: ReceiptText },
  ];
  closeSidebar(): void { this.sidebarOpen.set(false); }
}
