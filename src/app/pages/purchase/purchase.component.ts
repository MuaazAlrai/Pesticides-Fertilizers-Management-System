import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, MessageCircle, Pencil, Plus, Printer, RotateCcw, Save, Trash2, TrendingUp, WalletCards, X, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService, PaymentStatus, Purchase, PurchaseInput, SaleLine, StockLocation } from '../../core/erp-store.service';

type Period = 'all' | 'today' | 'month' | 'year' | 'custom';
type PayType = 'cash' | 'credit' | 'partial';
interface PurchaseLineDraft { itemId: number; quantity: number; rate: number; source: StockLocation; }

@Component({
  selector: 'app-purchase',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.css',
})
export class PurchaseComponent {
  readonly store = inject(ErpStoreService);
  readonly icons = { Download, Eye, MessageCircle, Pencil, Plus, Printer, RotateCcw, Save, Trash2, TrendingUp, WalletCards, X };
  readonly search = signal('');
  readonly period = signal<Period>('today');
  readonly fromDate = signal(this.todayIso());
  readonly toDate = signal(this.todayIso());
  readonly formVisible = signal(true);
  readonly editingInvoice = signal<string | null>(null);
  readonly viewing = signal<Purchase | null>(null);
  readonly message = signal('');
  readonly form = signal({ date: this.todayIso(), supplierId: 0, supplier: '', payType: 'cash' as PayType, paidCash: 0 });
  readonly lines = signal<PurchaseLineDraft[]>([this.blankLine()]);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.store.purchases().filter(p => this.matchesPeriod(p) && (!q || `${p.invoice} ${p.supplier} ${p.itemName ?? ''}`.toLowerCase().includes(q)));
  });
  readonly total = computed(() => this.filtered().reduce((sum, p) => sum + p.amount, 0));
  readonly due = computed(() => this.filtered().filter(p => !this.isPaid(p.payment)).reduce((sum, p) => sum + (p.balance ?? p.amount), 0));
  readonly billTotal = computed(() => this.lines().reduce((sum, line) => sum + this.lineTotal(line), 0));
  readonly balance = computed(() => Math.max(0, this.billTotal() - Number(this.form().paidCash || 0)));

  startNewPurchase(): void {
    this.editingInvoice.set(null);
    this.viewing.set(null);
    this.form.set({ date: this.todayIso(), supplierId: 0, supplier: '', payType: 'cash', paidCash: 0 });
    this.lines.set([this.blankLine()]);
    this.formVisible.set(true);
  }

  editPurchase(purchase: Purchase): void {
    const supplier = this.store.customers().find(row => row.name === purchase.supplier || row.id === purchase.supplierId);
    this.editingInvoice.set(purchase.invoice);
    this.viewing.set(null);
    this.form.set({
      date: this.purchaseDate(purchase),
      supplierId: supplier?.id ?? purchase.supplierId ?? 0,
      supplier: purchase.supplier,
      payType: purchase.payType ?? this.payTypeFromPayment(purchase.payment),
      paidCash: purchase.paidCash ?? (this.isPaid(purchase.payment) ? purchase.amount : 0),
    });
    this.lines.set(this.linesFromPurchase(purchase));
    this.formVisible.set(true);
  }

  savePurchase(): void {
    const supplier = this.form().supplier.trim();
    const lines = this.normalizedLines();
    if (!supplier || !lines.length) {
      this.message.set('Supplier aur kam az kam 1 product zaroori hai.');
      return;
    }
    const payType = this.form().payType;
    const current: PurchaseInput = {
      invoice: this.editingInvoice() ?? undefined,
      supplierId: this.form().supplierId || undefined,
      supplier,
      amount: this.billTotal(),
      payment: this.paymentFromPayType(payType),
      payType,
      kind: this.payTypeLabel(payType),
      itemId: lines[0].itemId,
      quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      destination: lines[0].source,
      date: this.form().date,
      paidCash: Number(this.form().paidCash || 0),
      balance: this.balance(),
      lines,
    };
    const invoice = this.editingInvoice();
    if (invoice) {
      const previous = this.store.purchases().find(row => row.invoice === invoice);
      if (!previous) return;
      const ok = this.store.updatePurchase(invoice, { ...previous, ...current, invoice, time: previous.time, itemName: lines.length === 1 ? lines[0].itemName : `${lines.length} products` });
      this.message.set(ok ? 'Purchase update ho gayi.' : 'Purchase update nahi ho saki.');
      if (!ok) return;
    } else {
      const ok = this.store.addPurchase(current);
      this.message.set(ok ? 'Purchase save ho gayi aur stock add ho gaya.' : 'Purchase save nahi ho saki.');
      if (!ok) return;
    }
    this.startNewPurchase();
  }

  deletePurchase(purchase: Purchase): void {
    if (!confirm(`${purchase.invoice} delete karni hai?`)) return;
    this.store.deletePurchase(purchase.invoice);
    this.message.set('Purchase delete ho gayi.');
  }

  addLine(): void { this.lines.update(lines => [...lines, this.blankLine()]); }
  removeLine(index: number): void { this.lines.update(lines => lines.length === 1 ? lines : lines.filter((_, i) => i !== index)); }
  viewPurchase(purchase: Purchase): void { this.viewing.set(purchase); }
  closeView(): void { this.viewing.set(null); }
  setPeriod(period: Period): void { this.period.set(period); }
  updateFromDate(value: string): void { this.fromDate.set(value); this.period.set('custom'); }
  updateToDate(value: string): void { this.toDate.set(value); this.period.set('custom'); }
  lineTotal(line: PurchaseLineDraft): number { return Number(line.quantity || 0) * Number(line.rate || 0); }
  purchaseDate(purchase: Purchase): string { return purchase.date || this.todayIso(); }
  locationLabel(location: StockLocation | undefined): string { return location === 'warehouse' ? 'Godown' : 'Dukan'; }
  payTypeLabel(payType: PayType): string { return payType === 'cash' ? 'Cash' : payType === 'credit' ? 'Credit' : 'Partial'; }
  paymentLabel(payment: PaymentStatus): string { return this.isPaid(payment) ? 'Cash' : payment === 'due' || payment === 'بقایا' ? 'Credit' : 'Partial'; }
  stockLabel(line: PurchaseLineDraft): string {
    const item = this.store.stock().find(row => row.id === Number(line.itemId));
    return item ? `Dukan ${item.shop} / Godown ${item.warehouse} ${item.unit}` : '';
  }

  updateForm(key: 'date' | 'supplierId' | 'supplier' | 'payType' | 'paidCash', value: string | number): void {
    this.form.update(form => {
      const next = { ...form, [key]: key === 'paidCash' || key === 'supplierId' ? Number(value) || 0 : value };
      if (key === 'supplierId') next.supplier = this.store.customers().find(row => row.id === Number(value))?.name ?? '';
      if (key === 'payType') next.paidCash = value === 'cash' ? this.billTotal() : value === 'credit' ? 0 : next.paidCash;
      return next as typeof form;
    });
  }

  updateLine(index: number, key: keyof PurchaseLineDraft, value: string | number): void {
    this.lines.update(lines => lines.map((line, i) => {
      if (i !== index) return line;
      const next = { ...line, [key]: key === 'source' ? value : Math.max(0, Number(value) || 0) };
      if (key === 'itemId') next.rate = this.defaultRate(Number(value));
      return next as PurchaseLineDraft;
    }));
  }

  private normalizedLines(): SaleLine[] {
    return this.lines().map(line => {
      const item = this.store.stock().find(row => row.id === Number(line.itemId));
      if (!item) return null;
      const quantity = Number(line.quantity || 0);
      const rate = Number(line.rate || 0);
      return { itemId: item.id, itemName: item.name, unit: item.unit, quantity, rate, source: line.source, total: quantity * rate };
    }).filter((line): line is SaleLine => !!line && line.quantity > 0 && line.rate > 0);
  }

  private blankLine(): PurchaseLineDraft {
    const itemId = this.store.stock()[0]?.id ?? 0;
    return { itemId, quantity: 1, rate: this.defaultRate(itemId), source: 'warehouse' };
  }
  private defaultRate(itemId: number): number {
    const item = this.store.stock().find(row => row.id === Number(itemId));
    return item ? Math.max(1, Math.round(((item.warehouse + item.shop) || 1) * 8)) : 0;
  }
  private linesFromPurchase(purchase: Purchase): PurchaseLineDraft[] {
    if (purchase.lines?.length) return purchase.lines.map(line => ({ itemId: line.itemId, quantity: line.quantity, rate: line.rate, source: line.source }));
    return [{ itemId: purchase.itemId ?? this.store.stock()[0]?.id ?? 0, quantity: purchase.quantity ?? 1, rate: purchase.quantity ? Math.round(purchase.amount / purchase.quantity) : purchase.amount, source: purchase.destination ?? 'warehouse' }];
  }
  private paymentFromPayType(payType: PayType): PaymentStatus { return payType === 'cash' ? 'paid' : payType === 'credit' ? 'due' : 'partial'; }
  private payTypeFromPayment(payment: PaymentStatus): PayType { return this.isPaid(payment) ? 'cash' : payment === 'due' || payment === 'بقایا' ? 'credit' : 'partial'; }
  private matchesPeriod(purchase: Purchase): boolean {
    const date = this.purchaseDate(purchase);
    const today = this.todayIso();
    if (this.period() === 'all') return true;
    if (this.period() === 'today') return date === today;
    if (this.period() === 'month') return date.slice(0, 7) === today.slice(0, 7);
    if (this.period() === 'year') return date.slice(0, 4) === today.slice(0, 4);
    return date >= this.fromDate() && date <= this.toDate();
  }
  private isPaid(payment: PaymentStatus): boolean { return payment === 'paid' || payment === 'فعال'; }
  private todayIso(): string { return new Date().toISOString().slice(0, 10); }
}
