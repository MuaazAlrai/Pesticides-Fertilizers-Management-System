import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, EyeOff, MessageCircle, Pencil, Plus, Save, Trash2, X, LucideAngularModule } from 'lucide-angular';
import { Customer, CustomerStatus, ErpStoreService, Sale } from '../../core/erp-store.service';

type CustomerForm = Omit<Customer, 'id'>;

interface LedgerRow {
  date: string;
  invoice: string;
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  profit: number;
  source: string;
  payment: string;
}

@Component({
  selector: 'app-customers',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
})
export class CustomersComponent {
  readonly icons = { Download, Eye, EyeOff, MessageCircle, Pencil, Plus, Save, Trash2, X };
  readonly search = signal('');
  readonly status = signal<CustomerStatus | 'all'>('all');
  readonly modalMode = signal<'add' | 'edit' | 'view' | null>(null);
  readonly selectedCustomerId = signal<number | null>(null);
  readonly historyCustomerId = signal<number | null>(null);
  readonly profitHidden = signal(false);
  readonly fromDate = signal(this.todayIso());
  readonly toDate = signal(this.todayIso());
  readonly message = signal('');
  readonly form = signal<CustomerForm>({ name: '', mobile: '', city: '', type: 'Retail', balance: 0, status: 'active', lastDeal: 'New customer' });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.store.customers().filter(customer =>
      (this.status() === 'all' || customer.status === this.status()) &&
      (!q || `${customer.name} ${customer.mobile} ${customer.city}`.toLowerCase().includes(q))
    );
  });
  readonly selectedHistoryCustomer = computed(() => this.store.customers().find(customer => customer.id === this.historyCustomerId()));
  readonly customerHistory = computed(() => {
    const customer = this.selectedHistoryCustomer();
    if (!customer) return [];
    return this.store.sales().filter(sale =>
      (sale.customer === customer.name || sale.customerId === customer.id) &&
      this.saleDate(sale) >= this.fromDate() &&
      this.saleDate(sale) <= this.toDate()
    );
  });
  readonly ledgerRows = computed<LedgerRow[]>(() => this.customerHistory().flatMap(sale => {
    const lines = sale.lines?.length ? sale.lines : [{
      itemName: sale.itemName || '-',
      quantity: sale.quantity || 0,
      unit: '',
      rate: sale.quantity ? Math.round(sale.amount / sale.quantity) : sale.amount,
      total: sale.amount,
      profit: sale.profit,
      source: sale.source ?? 'shop',
    }];

    return lines.map(line => ({
      date: this.saleDate(sale),
      invoice: sale.invoice,
      itemName: line.itemName,
      quantity: line.quantity,
      unit: line.unit,
      rate: line.rate,
      total: line.total,
      profit: Number(line.profit ?? sale.profit ?? 0),
      source: line.source === 'warehouse' ? 'Godown' : 'Dukan',
      payment: sale.payType ? this.payTypeLabel(sale.payType) : this.paymentLabel(sale.payment),
    }));
  }));
  readonly historyTotal = computed(() => this.customerHistory().reduce((sum, sale) => sum + sale.amount, 0));
  readonly historyProfit = computed(() => this.customerHistory().reduce((sum, sale) => sum + sale.profit, 0));
  readonly historyItems = computed(() => this.ledgerRows().reduce((sum, row) => sum + row.quantity, 0));

  constructor(readonly store: ErpStoreService) {}

  openAdd(): void {
    this.selectedCustomerId.set(null);
    this.form.set({ name: '', mobile: '', city: '', type: 'Retail', balance: 0, status: 'active', lastDeal: 'New customer' });
    this.modalMode.set('add');
  }

  openEdit(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.form.set(this.toForm(customer));
    this.modalMode.set('edit');
  }

  openView(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.historyCustomerId.set(customer.id);
    this.form.set(this.toForm(customer));
    this.modalMode.set('view');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedCustomerId.set(null);
  }

  saveCustomer(): void {
    const customer = this.normalizedForm();
    if (!customer.name || !customer.mobile) {
      this.message.set('Customer name aur mobile zaroori hain.');
      return;
    }

    const id = this.selectedCustomerId();
    if (id) {
      this.store.updateCustomer(id, customer);
      this.message.set('Customer update ho gaya.');
    } else {
      this.store.addCustomer(customer);
      this.message.set('Customer add ho gaya.');
    }
    this.closeModal();
  }

  deleteCustomer(customer: Customer): void {
    if (!confirm(`${customer.name} delete karna hai?`)) return;
    this.store.deleteCustomer(customer.id);
    if (this.historyCustomerId() === customer.id) this.historyCustomerId.set(null);
    this.message.set('Customer delete ho gaya.');
  }

  showHistory(customer: Customer): void {
    this.historyCustomerId.set(customer.id);
  }

  updateForm(key: keyof CustomerForm, value: string | number): void {
    const numeric = key === 'balance';
    this.form.update(current => ({ ...current, [key]: numeric ? Number(value) || 0 : value }));
  }

  updateFromDate(value: string): void {
    this.fromDate.set(value);
  }

  updateToDate(value: string): void {
    this.toDate.set(value);
  }

  statusLabel(status: CustomerStatus): string {
    if (status === 'active' || status === 'فعال') return 'Active';
    if (status === 'inactive' || status === 'غیر فعال') return 'Inactive';
    return 'Blocked';
  }

  saleDate(sale: Sale): string {
    return sale.date || this.todayIso();
  }

  customerSalesTotal(customer: Customer): number {
    return this.customerSales(customer).reduce((sum, sale) => sum + sale.amount, 0);
  }

  customerCashPaid(customer: Customer): number {
    return this.customerSales(customer).reduce((sum, sale) => sum + Number(sale.receivedCash || 0), 0);
  }

  customerDue(customer: Customer): number {
    return this.customerSales(customer).reduce((sum, sale) => sum + Number(sale.balance || 0), 0);
  }

  customerAdvance(customer: Customer): number {
    return this.customerSales(customer).reduce((sum, sale) => sum + Math.max(0, Number(sale.receivedCash || 0) - sale.amount), 0);
  }

  paymentLabel(payment: Sale['payment']): string {
    if (payment === 'paid' || payment === 'فعال') return 'Cash';
    if (payment === 'due' || payment === 'بقایا') return 'Credit';
    return 'Partial';
  }

  payTypeLabel(payType: Sale['payType']): string {
    return payType === 'cash' ? 'Cash' : payType === 'credit' ? 'Credit' : 'Partial';
  }

  private normalizedForm(): CustomerForm {
    const current = this.form();
    return {
      name: current.name.trim(),
      mobile: current.mobile.trim(),
      city: current.city.trim(),
      type: current.type.trim() || 'Retail',
      balance: Number(current.balance) || 0,
      status: current.status || 'active',
      lastDeal: current.lastDeal?.trim() || 'New customer',
    };
  }

  private toForm(customer: Customer): CustomerForm {
    return {
      name: customer.name,
      mobile: customer.mobile,
      city: customer.city,
      type: customer.type,
      balance: customer.balance,
      status: customer.status,
      lastDeal: customer.lastDeal,
    };
  }

  private customerSales(customer: Customer): Sale[] {
    return this.store.sales().filter(sale => sale.customerId === customer.id || sale.customer === customer.name);
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
