import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertTriangle,
  Banknote,
  Boxes,
  CircleDollarSign,
  CreditCard,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  LucideAngularModule,
} from 'lucide-angular';
import { ErpStoreService } from '../../core/erp-store.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly icons = {
    AlertTriangle,
    Banknote,
    Boxes,
    CircleDollarSign,
    CreditCard,
    PackageCheck,
    ShoppingCart,
    TrendingUp,
    Users,
  };

  readonly salesTotal = computed(() => this.store.sales().reduce((sum, sale) => sum + sale.amount, 0));
  readonly profitTotal = computed(() => this.store.sales().reduce((sum, sale) => sum + sale.profit, 0));
  readonly receivables = computed(() => this.store.customers().filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0));
  readonly stockTotal = computed(() => this.store.stock().reduce((sum, item) => sum + item.warehouse + item.shop, 0));
  readonly lowStock = computed(() => this.store.stock().filter(item => item.warehouse + item.shop <= item.minimum * 2));

  readonly cards = computed(() => [
    { title: 'Aaj ki sales', value: `Rs${this.compact(this.salesTotal())}`, note: `${this.store.sales().length} invoices`, icon: TrendingUp, tone: 'green' },
    { title: 'Aaj ki purchase', value: 'Rs86K', note: '8 invoices', icon: ShoppingCart, tone: 'orange' },
    { title: 'Aaj ka profit', value: `Rs${this.compact(this.profitTotal())}`, note: 'Mojooda sales', icon: CircleDollarSign, tone: 'mint' },
    { title: 'Monthly profit', value: 'Rs5.4L', note: 'July 2026', icon: TrendingUp, tone: 'green' },
    { title: 'Cash available', value: 'Rs2.1L', note: 'Cash in hand', icon: CreditCard, tone: 'purple' },
    { title: 'Bank balance', value: 'Rs8.7L', note: '4 accounts', icon: Banknote, tone: 'blue' },
    { title: 'Receivables', value: `Rs${this.compact(this.receivables())}`, note: `${this.store.customers().filter(c => c.balance > 0).length} customers`, icon: AlertTriangle, tone: 'red' },
    { title: 'Total stock', value: `${this.stockTotal()} items`, note: `${this.store.stock().length} khad/spray items`, icon: Boxes, tone: 'green' },
  ]);

  constructor(readonly store: ErpStoreService) {}

  compact(value: number): string {
    return value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${Math.round(value / 1000)}K` : `${value}`;
  }
}
