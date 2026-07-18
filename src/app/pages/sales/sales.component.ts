import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, MessageCircle, Pencil, Plus, Printer, RotateCcw, Save, Trash2, TrendingUp, WalletCards, X, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService, PaymentStatus, Sale, SaleInput, SaleLine, StockLocation } from '../../core/erp-store.service';

type SalesPeriod = 'all' | 'today' | 'month' | 'year' | 'custom';
type PayType = 'cash' | 'credit' | 'partial';

interface SaleLineDraft {
  itemId: number;
  quantity: number;
  rate: number;
  source: StockLocation;
}

@Component({
  selector: 'app-sales',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent {
  readonly store = inject(ErpStoreService);
  readonly icons = { Download, Eye, MessageCircle, Pencil, Plus, Printer, RotateCcw, Save, Trash2, TrendingUp, WalletCards, X };
  readonly search = signal('');
  readonly period = signal<SalesPeriod>('today');
  readonly fromDate = signal(this.todayIso());
  readonly toDate = signal(this.todayIso());
  readonly formVisible = signal(true);
  readonly profitHidden = signal(false);
  readonly editingInvoice = signal<string | null>(null);
  readonly viewingSale = signal<Sale | null>(null);
  readonly message = signal('');
  readonly saleForm = signal({
    date: this.todayIso(),
    customerId: 0,
    customer: '',
    saleMan: 'Malik Ashraf',
    payType: 'cash' as PayType,
    receivedCash: 0,
  });
  readonly lines = signal<SaleLineDraft[]>([this.blankLine()]);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.store.sales().filter(sale =>
      this.matchesPeriod(sale) &&
      (!q || `${sale.invoice} ${sale.customer} ${sale.itemName ?? ''} ${this.locationLabel(sale.source)}`.toLowerCase().includes(q))
    );
  });
  readonly total = computed(() => this.filtered().reduce((sum, sale) => sum + sale.amount, 0));
  readonly profit = computed(() => this.filtered().reduce((sum, sale) => sum + sale.profit, 0));
  readonly due = computed(() => this.filtered().filter(sale => !this.isPaid(sale.payment)).reduce((sum, sale) => sum + (sale.balance ?? sale.amount), 0));
  readonly billTotal = computed(() => this.lines().reduce((sum, line) => sum + this.lineTotal(line), 0));
  readonly billCost = computed(() => this.lines().reduce((sum, line) => sum + this.lineCost(line), 0));
  readonly billProfit = computed(() => this.billTotal() - this.billCost());
  readonly balance = computed(() => Math.max(0, this.billTotal() - Number(this.saleForm().receivedCash || 0)));

  startNewSale(): void {
    this.editingInvoice.set(null);
    this.viewingSale.set(null);
    this.saleForm.set({ date: this.todayIso(), customerId: 0, customer: '', saleMan: 'Malik Ashraf', payType: 'cash', receivedCash: 0 });
    this.lines.set([this.blankLine()]);
    this.formVisible.set(true);
  }

  editSale(sale: Sale): void {
    const customer = this.store.customers().find(row => row.name === sale.customer || row.id === sale.customerId);
    this.editingInvoice.set(sale.invoice);
    this.viewingSale.set(null);
    this.saleForm.set({
      date: this.saleDate(sale),
      customerId: customer?.id ?? sale.customerId ?? 0,
      customer: sale.customer,
      saleMan: sale.saleMan ?? 'Malik Ashraf',
      payType: sale.payType ?? this.payTypeFromPayment(sale.payment),
      receivedCash: sale.receivedCash ?? (this.isPaid(sale.payment) ? sale.amount : 0),
    });
    this.lines.set(this.linesFromSale(sale));
    this.formVisible.set(true);
  }

  viewSale(sale: Sale): void {
    this.viewingSale.set(sale);
  }

  closeView(): void {
    this.viewingSale.set(null);
  }

  saveSale(): void {
    const customerName = this.saleForm().customer.trim();
    const saleLines = this.normalizedLines();
    if (!customerName || !saleLines.length) {
      this.message.set('Customer aur kam az kam 1 product zaroori hai.');
      return;
    }

    const payType = this.saleForm().payType;
    const current: SaleInput = {
      invoice: this.editingInvoice() ?? undefined,
      customerId: this.saleForm().customerId || undefined,
      customer: customerName,
      amount: this.billTotal(),
      payment: this.paymentFromPayType(payType),
      payType,
      kind: this.payTypeLabel(payType),
      saleMan: this.saleForm().saleMan.trim() || 'Malik Ashraf',
      itemId: saleLines[0].itemId,
      quantity: saleLines.reduce((sum, line) => sum + line.quantity, 0),
      source: saleLines[0].source,
      date: this.saleForm().date,
      receivedCash: Number(this.saleForm().receivedCash || 0),
      balance: this.balance(),
      lines: saleLines,
    };

    const invoice = this.editingInvoice();
    if (invoice) {
      const previous = this.store.sales().find(row => row.invoice === invoice);
      if (!previous) return;
      const ok = this.store.updateSale(invoice, { ...previous, ...current, invoice, time: previous.time, itemName: saleLines.length === 1 ? saleLines[0].itemName : `${saleLines.length} products`, profit: this.billProfit() });
      this.message.set(ok ? 'Sale update ho gayi.' : 'Selected product/source par stock kam hai.');
      if (!ok) return;
    } else {
      const ok = this.store.addSale(current);
      this.message.set(ok ? 'Sale save ho gayi aur stock minus ho gaya.' : 'Selected product/source par stock kam hai.');
      if (!ok) return;
    }

    this.startNewSale();
  }

  deleteSale(sale: Sale): void {
    if (!confirm(`${sale.invoice} delete karni hai?`)) return;
    this.store.deleteSale(sale.invoice);
    this.message.set('Sale delete ho gayi.');
  }

  addLine(): void {
    this.lines.update(lines => [...lines, this.blankLine()]);
  }

  removeLine(index: number): void {
    this.lines.update(lines => lines.length === 1 ? lines : lines.filter((_, i) => i !== index));
  }

  updateLine(index: number, key: keyof SaleLineDraft, value: string | number): void {
    this.lines.update(lines => lines.map((line, i) => {
      if (i !== index) return line;
      const next = { ...line, [key]: key === 'source' ? value : Math.max(0, Number(value) || 0) };
      if (key === 'itemId') next.rate = this.defaultRate(Number(value));
      return next as SaleLineDraft;
    }));
  }

  updateForm(key: 'date' | 'customerId' | 'customer' | 'saleMan' | 'payType' | 'receivedCash', value: string | number): void {
    this.saleForm.update(form => {
      const next = { ...form, [key]: key === 'receivedCash' || key === 'customerId' ? Number(value) || 0 : value };
      if (key === 'customerId') {
        const customer = this.store.customers().find(row => row.id === Number(value));
        next.customer = customer?.name ?? '';
      }
      if (key === 'payType') {
        const payType = value as PayType;
        next.receivedCash = payType === 'cash' ? this.billTotal() : payType === 'credit' ? 0 : next.receivedCash;
      }
      return next as typeof form;
    });
  }

  setPeriod(period: SalesPeriod): void {
    this.period.set(period);
  }

  updateFromDate(value: string): void {
    this.fromDate.set(value);
    this.period.set('custom');
  }

  updateToDate(value: string): void {
    this.toDate.set(value);
    this.period.set('custom');
  }

  lineTotal(line: SaleLineDraft): number {
    return Number(line.quantity || 0) * Number(line.rate || 0);
  }

  purchaseRate(line: SaleLineDraft | SaleLine): number {
    if ('purchaseRate' in line && line.purchaseRate !== undefined) return Number(line.purchaseRate || 0);
    const purchases = this.store.purchases()
      .flatMap(purchase => (purchase.lines ?? []).map(purchaseLine => ({ date: purchase.date || '', line: purchaseLine })))
      .filter(row => Number(row.line.itemId) === Number(line.itemId) && Number(row.line.rate) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    return Number(purchases[0]?.line.rate || 0);
  }

  lineCost(line: SaleLineDraft | SaleLine): number {
    return Number(line.quantity || 0) * this.purchaseRate(line);
  }

  lineProfit(line: SaleLineDraft | SaleLine): number {
    const savedProfit = 'profit' in line ? line.profit : undefined;
    return savedProfit !== undefined ? Number(savedProfit || 0) : Number(line.quantity || 0) * (Number(line.rate || 0) - this.purchaseRate(line));
  }

  stockLabel(line: SaleLineDraft): string {
    const item = this.store.stock().find(row => row.id === Number(line.itemId));
    if (!item) return '';
    return `${this.locationLabel(line.source)} me ${item[line.source].toLocaleString()} ${item.unit} available`;
  }

  sourceStock(line: SaleLineDraft, source: StockLocation): number {
    const item = this.store.stock().find(row => row.id === Number(line.itemId));
    return item ? item[source] : 0;
  }

  itemUnit(line: SaleLineDraft): string {
    return this.store.stock().find(row => row.id === Number(line.itemId))?.unit ?? '';
  }

  locationLabel(location: StockLocation | undefined): string {
    return location === 'warehouse' ? 'Godown' : 'Dukan';
  }

  paymentLabel(payment: PaymentStatus): string {
    if (this.isPaid(payment)) return 'Cash';
    if (payment === 'due' || payment === 'بقایا') return 'Credit';
    return 'Partial';
  }

  payTypeLabel(payType: PayType): string {
    return payType === 'cash' ? 'Cash' : payType === 'credit' ? 'Credit' : 'Partial';
  }

  saleDate(sale: Sale): string {
    return sale.date || this.todayIso();
  }

  private normalizedLines(): SaleLine[] {
    return this.lines()
      .map((line): SaleLine | null => {
        const item = this.store.stock().find(row => row.id === Number(line.itemId));
        if (!item) return null;
        const quantity = Number(line.quantity || 0);
        const rate = Number(line.rate || 0);
        const purchaseRate = this.purchaseRate(line);
        return {
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          quantity,
          rate,
          purchaseRate,
          profit: quantity * (rate - purchaseRate),
          source: line.source,
          total: quantity * rate,
        };
      })
      .filter((line): line is SaleLine => !!line && line.quantity > 0 && line.rate > 0);
  }

  private blankLine(): SaleLineDraft {
    const itemId = this.store.stock()[0]?.id ?? 0;
    return { itemId, quantity: 1, rate: this.defaultRate(itemId), source: 'shop' };
  }

  private defaultRate(itemId: number): number {
    const item = this.store.stock().find(row => row.id === Number(itemId));
    return item ? Math.max(1, Math.round(((item.warehouse + item.shop) || 1) * 10)) : 0;
  }

  private linesFromSale(sale: Sale): SaleLineDraft[] {
    if (sale.lines?.length) return sale.lines.map(line => ({ itemId: line.itemId, quantity: line.quantity, rate: line.rate, source: line.source }));
    return [{ itemId: sale.itemId ?? this.store.stock()[0]?.id ?? 0, quantity: sale.quantity ?? 1, rate: sale.quantity ? Math.round(sale.amount / sale.quantity) : sale.amount, source: sale.source ?? 'shop' }];
  }

  private paymentFromPayType(payType: PayType): PaymentStatus {
    return payType === 'cash' ? 'paid' : payType === 'credit' ? 'due' : 'partial';
  }

  private payTypeFromPayment(payment: PaymentStatus): PayType {
    if (this.isPaid(payment)) return 'cash';
    if (payment === 'due' || payment === 'بقایا') return 'credit';
    return 'partial';
  }

  private matchesPeriod(sale: Sale): boolean {
    const date = this.saleDate(sale);
    const today = this.todayIso();
    if (this.period() === 'all') return true;
    if (this.period() === 'today') return date === today;
    if (this.period() === 'month') return date.slice(0, 7) === today.slice(0, 7);
    if (this.period() === 'year') return date.slice(0, 4) === today.slice(0, 4);
    return date >= this.fromDate() && date <= this.toDate();
  }

  private isPaid(payment: PaymentStatus): boolean {
    return payment === 'paid' || payment === 'فعال';
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
