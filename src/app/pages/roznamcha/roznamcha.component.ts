import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Banknote, CalendarDays, CircleDollarSign, ReceiptText, ShoppingCart, TrendingUp, Users, WalletCards, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService, Purchase, Sale } from '../../core/erp-store.service';

type RoznamchaPeriod = 'today' | 'month' | 'year' | 'custom';

type RoznamchaRow = {
  date: string;
  time: string;
  type: 'Sale' | 'Purchase';
  party: string;
  invoice: string;
  details: string;
  total: number;
  cash: number;
  balance: number;
  profit: number;
};

type CustomerDailyRow = {
  name: string;
  invoices: number;
  total: number;
  cash: number;
  due: number;
  advance: number;
};

@Component({
  selector: 'app-roznamcha',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './roznamcha.component.html',
  styleUrl: './roznamcha.component.css',
})
export class RoznamchaComponent {
  readonly store = inject(ErpStoreService);
  readonly icons = { Banknote, CalendarDays, CircleDollarSign, ReceiptText, ShoppingCart, TrendingUp, Users, WalletCards };
  readonly period = signal<RoznamchaPeriod>('today');
  readonly fromDate = signal(this.todayIso());
  readonly toDate = signal(this.todayIso());

  readonly filteredSales = computed(() => this.store.sales().filter(sale => this.matchesRange(this.saleDate(sale))));
  readonly filteredPurchases = computed(() => this.store.purchases().filter(purchase => this.matchesRange(this.purchaseDate(purchase))));
  readonly rangeLabel = computed(() => this.fromDate() === this.toDate() ? this.fromDate() : `${this.fromDate()} to ${this.toDate()}`);

  readonly salesTotal = computed(() => this.filteredSales().reduce((sum, sale) => sum + sale.amount, 0));
  readonly salesCash = computed(() => this.filteredSales().reduce((sum, sale) => sum + Number(sale.receivedCash || 0), 0));
  readonly salesDue = computed(() => this.filteredSales().reduce((sum, sale) => sum + Number(sale.balance || 0), 0));
  readonly profit = computed(() => this.filteredSales().reduce((sum, sale) => sum + sale.profit, 0));
  readonly purchaseTotal = computed(() => this.filteredPurchases().reduce((sum, purchase) => sum + purchase.amount, 0));
  readonly purchaseCash = computed(() => this.filteredPurchases().reduce((sum, purchase) => sum + Number(purchase.paidCash || 0), 0));
  readonly purchaseDue = computed(() => this.filteredPurchases().reduce((sum, purchase) => sum + Number(purchase.balance || 0), 0));
  readonly netCash = computed(() => this.salesCash() - this.purchaseCash());

  readonly rows = computed<RoznamchaRow[]>(() => [
    ...this.filteredSales().map(sale => this.saleRow(sale)),
    ...this.filteredPurchases().map(purchase => this.purchaseRow(purchase)),
  ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)));

  readonly customerRows = computed<CustomerDailyRow[]>(() => {
    const map = new Map<string, CustomerDailyRow>();
    for (const sale of this.filteredSales()) {
      const row = map.get(sale.customer) ?? { name: sale.customer, invoices: 0, total: 0, cash: 0, due: 0, advance: 0 };
      const cash = Number(sale.receivedCash || 0);
      row.invoices += 1;
      row.total += sale.amount;
      row.cash += cash;
      row.due += Number(sale.balance || 0);
      row.advance += Math.max(0, cash - sale.amount);
      map.set(sale.customer, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  });

  setPeriod(period: RoznamchaPeriod): void {
    const today = this.todayIso();
    this.period.set(period);
    if (period === 'today') {
      this.fromDate.set(today);
      this.toDate.set(today);
    }
    if (period === 'month') {
      this.fromDate.set(`${today.slice(0, 7)}-01`);
      this.toDate.set(today);
    }
    if (period === 'year') {
      this.fromDate.set(`${today.slice(0, 4)}-01-01`);
      this.toDate.set(today);
    }
  }

  updateFromDate(value: string): void {
    this.fromDate.set(value || this.todayIso());
    this.period.set('custom');
  }

  updateToDate(value: string): void {
    this.toDate.set(value || this.todayIso());
    this.period.set('custom');
  }

  private saleRow(sale: Sale): RoznamchaRow {
    return {
      date: this.saleDate(sale),
      time: sale.time,
      type: 'Sale',
      party: sale.customer,
      invoice: sale.invoice,
      details: sale.itemName || `${sale.lines?.length ?? 0} items`,
      total: sale.amount,
      cash: Number(sale.receivedCash || 0),
      balance: Number(sale.balance || 0),
      profit: sale.profit,
    };
  }

  private purchaseRow(purchase: Purchase): RoznamchaRow {
    return {
      date: this.purchaseDate(purchase),
      time: purchase.time,
      type: 'Purchase',
      party: purchase.supplier,
      invoice: purchase.invoice,
      details: purchase.itemName || `${purchase.lines?.length ?? 0} items`,
      total: purchase.amount,
      cash: Number(purchase.paidCash || 0),
      balance: Number(purchase.balance || 0),
      profit: 0,
    };
  }

  private saleDate(sale: Sale): string {
    return sale.date || this.todayIso();
  }

  private purchaseDate(purchase: Purchase): string {
    return purchase.date || this.todayIso();
  }

  private matchesRange(date: string): boolean {
    const from = this.fromDate();
    const to = this.toDate();
    return date >= from && date <= to;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
