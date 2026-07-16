import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertTriangle, Banknote, Boxes, CircleDollarSign, CreditCard, PackageCheck, ShoppingCart, TrendingUp, Users, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService } from '../../core/erp-store.service';

@Component({ selector: 'app-dashboard', imports: [RouterLink, LucideAngularModule], templateUrl: './dashboard.component.html', styleUrl: './dashboard.component.css' })
export class DashboardComponent {
  readonly icons = { AlertTriangle, Banknote, Boxes, CircleDollarSign, CreditCard, PackageCheck, ShoppingCart, TrendingUp, Users };
  readonly salesTotal = computed(() => this.store.sales().reduce((sum, sale) => sum + sale.amount, 0));
  readonly profitTotal = computed(() => this.store.sales().reduce((sum, sale) => sum + sale.profit, 0));
  readonly receivables = computed(() => this.store.customers().filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0));
  readonly stockTotal = computed(() => this.store.stock().reduce((sum, item) => sum + item.warehouse + item.shop, 0));
  readonly lowStock = computed(() => this.store.stock().filter(item => item.warehouse + item.shop <= item.minimum * 2));
  readonly cards = computed(() => [
    { title: 'آج کی فروخت', value: `Rs${this.compact(this.salesTotal())}`, note: `${this.store.sales().length} انوائس`, icon: TrendingUp, tone: 'green' },
    { title: 'آج کی خریداری', value: 'Rs86K', note: '8 انوائس', icon: ShoppingCart, tone: 'orange' },
    { title: 'آج کا منافع', value: `Rs${this.compact(this.profitTotal())}`, note: 'موجودہ فروخت', icon: CircleDollarSign, tone: 'mint' },
    { title: 'ماہانہ منافع', value: 'Rs5.4L', note: 'جولائی 2026', icon: TrendingUp, tone: 'green' },
    { title: 'نقد دستیاب', value: 'Rs2.1L', note: 'کیش ان ہینڈ', icon: CreditCard, tone: 'purple' },
    { title: 'بینک بیلنس', value: 'Rs8.7L', note: '4 اکاؤنٹس', icon: Banknote, tone: 'blue' },
    { title: 'بقایا جات', value: `Rs${this.compact(this.receivables())}`, note: `${this.store.customers().filter(c => c.balance > 0).length} صارفین`, icon: AlertTriangle, tone: 'red' },
    { title: 'کل دستیاب اسٹاک', value: `${this.stockTotal()} بوری`, note: `${this.store.stock().length} مصنوعات`, icon: Boxes, tone: 'green' },
  ]);
  constructor(readonly store: ErpStoreService) {}
  compact(value: number): string { return value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${Math.round(value / 1000)}K` : `${value}`; }
}
