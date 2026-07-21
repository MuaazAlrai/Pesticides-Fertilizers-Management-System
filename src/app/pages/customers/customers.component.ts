import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, EyeOff, MessageCircle, Pencil, Plus, Save, Trash2, X, LucideAngularModule } from 'lucide-angular';
import { Customer, CustomerStatus, ErpStoreService, Sale } from '../../core/erp-store.service';

type CustomerForm = Omit<Customer, 'id'>;

interface LedgerRow {
  date: string;
  invoice: string;
  detail: string;
  saleTotal: number;
  received: number;
  balance: number;
  runningBalance: number;
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
  readonly form = signal<CustomerForm>({ name: '', mobile: '', city: '', type: '', balance: 0, status: 'active', lastDeal: 'New customer' });

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
  readonly ledgerRows = computed<LedgerRow[]>(() => {
    let runningBalance = 0;
    return [...this.customerHistory()]
      .sort((a, b) => `${this.saleDate(a)} ${a.time}`.localeCompare(`${this.saleDate(b)} ${b.time}`))
      .map(sale => {
        const received = Number(sale.receivedCash || 0);
        const balance = Number(sale.balance || Math.max(0, sale.amount - received));
        runningBalance += sale.amount - received;
        return {
      date: this.saleDate(sale),
      invoice: sale.invoice,
          detail: this.saleDetail(sale),
          saleTotal: sale.amount,
          received,
          balance,
          runningBalance,
      payment: sale.payType ? this.payTypeLabel(sale.payType) : this.paymentLabel(sale.payment),
        };
      })
      .reverse();
  });
  readonly historyTotal = computed(() => this.customerHistory().reduce((sum, sale) => sum + sale.amount, 0));
  readonly historyWasooli = computed(() => this.customerHistory().reduce((sum, sale) => sum + Number(sale.receivedCash || 0), 0));
  readonly historyBalance = computed(() => this.customerHistory().reduce((sum, sale) => sum + Number(sale.balance || 0), 0));
  readonly historyInvoices = computed(() => this.customerHistory().length);

  constructor(readonly store: ErpStoreService) {}

  openAdd(): void {
    this.selectedCustomerId.set(null);
    this.form.set({ name: '', mobile: '', city: '', type: '', balance: 0, status: 'active', lastDeal: 'New customer' });
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
      this.message.set('کسٹمر نام اور موبائل ضروری ہیں۔');
      return;
    }

    const id = this.selectedCustomerId();
    if (id) {
      this.store.updateCustomer(id, customer);
      this.message.set('کسٹمر update ہو گیا۔');
    } else {
      this.store.addCustomer(customer);
      this.message.set('کسٹمر add ہو گیا۔');
    }
    this.closeModal();
  }

  deleteCustomer(customer: Customer): void {
    if (!confirm(`${customer.name} delete کرنا ہے؟`)) return;
    this.store.deleteCustomer(customer.id);
    if (this.historyCustomerId() === customer.id) this.historyCustomerId.set(null);
    this.message.set('کسٹمر delete ہو گیا۔');
  }

  showHistory(customer: Customer): void {
    this.historyCustomerId.set(customer.id);
  }

  updateForm(key: keyof CustomerForm, value: string | number): void {
    this.form.update(current => ({ ...current, [key]: value }));
  }

  updateFromDate(value: string): void {
    this.fromDate.set(value);
  }

  updateToDate(value: string): void {
    this.toDate.set(value);
  }

  statusLabel(status: CustomerStatus): string {
    if (status === 'active' || status === 'فعال') return 'فعال';
    if (status === 'inactive' || status === 'غیر فعال') return 'غیر فعال';
    return 'بلاک';
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

  customerWhatsAppUrl(customer: Customer): string {
    const message = [
      `Assalam o Alaikum ${customer.name},`,
      `Aap ka account detail:`,
      `Total sale: Rs${this.customerSalesTotal(customer).toLocaleString()}`,
      `Wasooli: Rs${this.customerCashPaid(customer).toLocaleString()}`,
      `Baqaya: Rs${this.customerDue(customer).toLocaleString()}`,
      `Advance: Rs${this.customerAdvance(customer).toLocaleString()}`,
      `Malik Ashraf Traders`,
    ].join('\n');
    return this.whatsAppUrl(customer.mobile, message);
  }

  historyWhatsAppUrl(): string {
    const customer = this.selectedHistoryCustomer();
    if (!customer) return 'https://wa.me/';
    const message = [
      `Assalam o Alaikum ${customer.name},`,
      `Aap ka ledger detail (${this.fromDate()} se ${this.toDate()} tak):`,
      `Invoices: ${this.historyInvoices().toLocaleString()}`,
      `Total sale: Rs${this.historyTotal().toLocaleString()}`,
      `Wasooli: Rs${this.historyWasooli().toLocaleString()}`,
      `Baqaya: Rs${this.historyBalance().toLocaleString()}`,
      `Malik Ashraf Traders`,
    ].join('\n');
    return this.whatsAppUrl(customer.mobile, message);
  }

  paymentLabel(payment: Sale['payment']): string {
    if (payment === 'paid' || payment === 'فعال') return 'وصولی';
    if (payment === 'due' || payment === 'بقایا') return 'ادھار';
    return 'جزوی';
  }

  payTypeLabel(payType: Sale['payType']): string {
    return payType === 'cash' ? 'وصولی' : payType === 'credit' ? 'ادھار' : 'جزوی';
  }

  private normalizedForm(): CustomerForm {
    const current = this.form();
    return {
      name: current.name.trim(),
      mobile: current.mobile.trim(),
      city: current.city.trim(),
      type: '',
      balance: 0,
      status: current.status || 'active',
      lastDeal: current.lastDeal?.trim() || 'New customer',
    };
  }

  private toForm(customer: Customer): CustomerForm {
    return {
      name: customer.name,
      mobile: customer.mobile,
      city: customer.city,
      type: '',
      balance: 0,
      status: customer.status,
      lastDeal: customer.lastDeal,
    };
  }

  private customerSales(customer: Customer): Sale[] {
    return this.store.sales().filter(sale => sale.customerId === customer.id || sale.customer === customer.name);
  }

  private whatsAppUrl(phone: string, message: string): string {
    const number = this.normalizedPhone(phone);
    const text = encodeURIComponent(message);
    return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  private normalizedPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('92')) return digits;
    if (digits.startsWith('0')) return `92${digits.slice(1)}`;
    return digits;
  }

  private saleDetail(sale: Sale): string {
    if (sale.lines?.length) {
      return sale.lines.map(line => `${line.itemName} - ${line.quantity} ${line.unit}`).join(', ');
    }
    return `${sale.itemName || '-'}${sale.quantity ? ` - ${sale.quantity}` : ''}`;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
