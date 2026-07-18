import { Injectable, signal } from '@angular/core';

export type StockLocation = 'shop' | 'warehouse';
export type PaymentStatus = 'paid' | 'due' | 'partial' | 'فعال' | 'بقایا' | 'جزوی';
export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'فعال' | 'غیر فعال' | 'بلاک';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  city: string;
  type: string;
  balance: number;
  status: CustomerStatus;
  lastDeal: string;
}

export interface Sale {
  invoice: string;
  customer: string;
  customerId?: number;
  time: string;
  date?: string;
  amount: number;
  profit: number;
  payment: PaymentStatus;
  payType?: 'cash' | 'credit' | 'partial';
  kind: string;
  saleMan?: string;
  itemId?: number;
  itemName?: string;
  quantity?: number;
  source?: StockLocation;
  receivedCash?: number;
  balance?: number;
  lines?: SaleLine[];
}

export interface SaleLine {
  itemId: number;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  purchaseRate?: number;
  profit?: number;
  source: StockLocation;
  total: number;
}

export interface Purchase {
  invoice: string;
  supplier: string;
  supplierId?: number;
  time: string;
  date?: string;
  amount: number;
  payment: PaymentStatus;
  payType?: 'cash' | 'credit' | 'partial';
  kind: string;
  itemId?: number;
  itemName?: string;
  quantity?: number;
  destination?: StockLocation;
  paidCash?: number;
  balance?: number;
  lines?: SaleLine[];
}

export type PurchaseInput = Omit<Purchase, 'invoice' | 'time' | 'itemName'> & { invoice?: string };

export interface StockItem {
  id: number;
  name: string;
  category: string;
  warehouse: number;
  shop: number;
  minimum: number;
  unit: string;
}

export interface StockMovement {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  from: StockLocation;
  to: StockLocation;
  note: string;
  time: string;
}

export type StockInput = Omit<StockItem, 'id'>;
export type SaleInput = Omit<Sale, 'invoice' | 'time' | 'profit' | 'itemName'> & { invoice?: string };

@Injectable({ providedIn: 'root' })
export class ErpStoreService {
  readonly customers = signal<Customer[]>(this.load('mat-customers', [
    { id: 1, name: 'Muhammad Iqbal', mobile: '0300-1234567', city: 'Lahore', type: 'Wholesale', balance: 45000, status: 'active', lastDeal: '2 din pehle' },
    { id: 2, name: 'Ahmed Ali', mobile: '0321-9876543', city: 'Faisalabad', type: 'Retail', balance: -8000, status: 'active', lastDeal: 'Aaj' },
    { id: 3, name: 'Khalid Mehmood', mobile: '0312-5551234', city: 'Multan', type: 'Corporate', balance: 120000, status: 'inactive', lastDeal: '65 din pehle' },
  ]));

  readonly sales = signal<Sale[]>(this.load('mat-sales', [
    { invoice: 'INV-0541', customer: 'Muhammad Iqbal', customerId: 1, time: 'Aaj 14:30', date: this.todayIso(), amount: 28500, profit: 3420, payment: 'paid', payType: 'credit', kind: 'Udhar', saleMan: 'Malik Ashraf', itemId: 1, itemName: 'Gandum (50 kilo bori)', quantity: 5, source: 'shop', receivedCash: 0, balance: 28500 },
    { invoice: 'INV-0540', customer: 'Ahmed Ali', customerId: 2, time: 'Aaj 11:15', date: this.todayIso(), amount: 12300, profit: 1476, payment: 'paid', payType: 'cash', kind: 'Naqad', saleMan: 'Malik Ashraf', itemId: 2, itemName: 'Basmati Chawal', quantity: 2, source: 'warehouse', receivedCash: 12300, balance: 0 },
  ]));

  readonly stock = signal<StockItem[]>(this.load('mat-stock', [
    { id: 1, name: 'Gandum (50 kilo bori)', category: 'Anaaj', warehouse: 450, shop: 120, minimum: 50, unit: 'Bori' },
    { id: 2, name: 'Basmati Chawal', category: 'Anaaj', warehouse: 320, shop: 80, minimum: 30, unit: 'Bori' },
    { id: 3, name: 'Safed Cheeni', category: 'Kiryana', warehouse: 75, shop: 24, minimum: 25, unit: 'Bori' },
    { id: 4, name: 'Daal Chana', category: 'Daalain', warehouse: 12, shop: 6, minimum: 20, unit: 'Thela' },
  ]));

  readonly movements = signal<StockMovement[]>(this.load('mat-stock-movements', []));
  readonly purchases = signal<Purchase[]>(this.load('mat-purchases', []));

  addCustomer(customer: Omit<Customer, 'id'>): void {
    const next = [...this.customers(), { ...customer, id: Date.now() }];
    this.customers.set(next);
    this.save('mat-customers', next);
  }

  updateCustomer(id: number, customer: Omit<Customer, 'id'>): void {
    const previous = this.customers().find(row => row.id === id);
    const next = this.customers().map(row => row.id === id ? { ...customer, id } : row);
    this.customers.set(next);
    this.save('mat-customers', next);

    if (previous && previous.name !== customer.name) {
      const salesNext = this.sales().map(row => row.customer === previous.name ? { ...row, customer: customer.name } : row);
      this.sales.set(salesNext);
      this.save('mat-sales', salesNext);
    }
  }

  deleteCustomer(id: number): void {
    const next = this.customers().filter(row => row.id !== id);
    this.customers.set(next);
    this.save('mat-customers', next);
  }

  addStockItem(item: StockInput): void {
    const next = [...this.stock(), { ...item, id: Date.now() }];
    this.persistStock(next);
  }

  updateStockItem(id: number, item: StockInput): void {
    const next = this.stock().map(row => row.id === id ? { ...row, ...item } : row);
    this.persistStock(next);
  }

  deleteStockItem(id: number): void {
    const next = this.stock().filter(row => row.id !== id);
    this.persistStock(next);
  }

  transfer(itemId: number, quantity: number, from: StockLocation, to: StockLocation, note = 'Manual transfer'): boolean {
    const item = this.stock().find(row => row.id === itemId);
    if (!item || quantity <= 0 || from === to || item[from] < quantity) return false;

    const next = this.stock().map(row => row.id === itemId
      ? { ...row, [from]: row[from] - quantity, [to]: row[to] + quantity }
      : row);

    this.persistStock(next);
    this.addMovement({ itemId, itemName: item.name, quantity, from, to, note });
    return true;
  }

  addSale(input: SaleInput): boolean {
    const lines = input.lines?.length ? input.lines : this.singleLineFromInput(input);
    if (!lines.length) return false;

    if (!this.hasEnoughStock(this.stock(), lines)) return false;

    const stockNext = this.applySaleLines(this.stock(), lines, -1);
    const amount = lines.reduce((sum, line) => sum + Number(line.total || 0), 0) || Number(input.amount || 0);
    const receivedCash = Number(input.receivedCash || 0);
    const balance = Math.max(0, amount - receivedCash);
    const sale: Sale = {
      ...input,
      invoice: input.invoice?.trim() || this.nextInvoice(),
      time: this.nowLabel(),
      date: input.date || this.todayIso(),
      amount,
      itemId: lines[0].itemId,
      itemName: lines.length === 1 ? lines[0].itemName : `${lines.length} products`,
      quantity: lines.reduce((sum, line) => sum + Number(line.quantity), 0),
      source: lines[0].source,
      lines,
      receivedCash,
      balance,
      profit: this.linesProfit(lines, amount),
    };

    this.persistStock(stockNext);
    const salesNext = [sale, ...this.sales()];
    this.sales.set(salesNext);
    this.save('mat-sales', salesNext);
    return true;
  }

  updateSale(invoice: string, sale: Sale): boolean {
    const previous = this.sales().find(row => row.invoice === invoice);
    if (!previous) return false;

    const restoredStock = this.applySaleLines(this.stock(), this.linesForSale(previous), 1);
    const nextLines = sale.lines?.length ? sale.lines : this.linesForSale(sale);
    if (!this.hasEnoughStock(restoredStock, nextLines)) return false;

    const adjustedStock = this.applySaleLines(restoredStock, nextLines, -1);
    const next = this.sales().map(row => row.invoice === invoice ? sale : row);
    this.persistStock(adjustedStock);
    this.sales.set(next);
    this.save('mat-sales', next);
    return true;
  }

  deleteSale(invoice: string): void {
    const sale = this.sales().find(row => row.invoice === invoice);
    if (sale) this.persistStock(this.applySaleLines(this.stock(), this.linesForSale(sale), 1));
    const next = this.sales().filter(row => row.invoice !== invoice);
    this.sales.set(next);
    this.save('mat-sales', next);
  }

  addPurchase(input: PurchaseInput): boolean {
    const lines = input.lines?.length ? input.lines : [];
    if (!lines.length) return false;

    const stockNext = this.applySaleLines(this.stock(), lines, 1);
    const amount = lines.reduce((sum, line) => sum + Number(line.total || 0), 0) || Number(input.amount || 0);
    const paidCash = Number(input.paidCash || 0);
    const purchase: Purchase = {
      ...input,
      invoice: input.invoice?.trim() || this.nextPurchaseInvoice(),
      time: this.nowLabel(),
      date: input.date || this.todayIso(),
      amount,
      itemId: lines[0].itemId,
      itemName: lines.length === 1 ? lines[0].itemName : `${lines.length} products`,
      quantity: lines.reduce((sum, line) => sum + Number(line.quantity), 0),
      destination: lines[0].source,
      lines,
      paidCash,
      balance: Math.max(0, amount - paidCash),
    };

    this.persistStock(stockNext);
    const next = [purchase, ...this.purchases()];
    this.purchases.set(next);
    this.save('mat-purchases', next);
    return true;
  }

  updatePurchase(invoice: string, purchase: Purchase): boolean {
    const previous = this.purchases().find(row => row.invoice === invoice);
    if (!previous) return false;
    const restoredStock = this.applySaleLines(this.stock(), previous.lines ?? [], -1);
    const nextLines = purchase.lines ?? [];
    const adjustedStock = this.applySaleLines(restoredStock, nextLines, 1);
    const next = this.purchases().map(row => row.invoice === invoice ? purchase : row);
    this.persistStock(adjustedStock);
    this.purchases.set(next);
    this.save('mat-purchases', next);
    return true;
  }

  deletePurchase(invoice: string): void {
    const purchase = this.purchases().find(row => row.invoice === invoice);
    if (purchase) this.persistStock(this.applySaleLines(this.stock(), purchase.lines ?? [], -1));
    const next = this.purchases().filter(row => row.invoice !== invoice);
    this.purchases.set(next);
    this.save('mat-purchases', next);
  }

  private addMovement(movement: Omit<StockMovement, 'id' | 'time'>): void {
    const next = [{ ...movement, id: Date.now(), time: this.nowLabel() }, ...this.movements()];
    this.movements.set(next);
    this.save('mat-stock-movements', next);
  }

  private persistStock(stock: StockItem[]): void {
    this.stock.set(stock);
    this.save('mat-stock', stock);
  }

  private nextInvoice(): string {
    return `INV-${Date.now().toString().slice(-6)}`;
  }

  private nextPurchaseInvoice(): string {
    return `PUR-${Date.now().toString().slice(-6)}`;
  }

  private singleLineFromInput(input: SaleInput): SaleLine[] {
    const item = this.stock().find(row => row.id === Number(input.itemId));
    const quantity = Number(input.quantity ?? 0);
    if (!item || quantity <= 0) return [];
    const total = Number(input.amount || 0);
    return [{
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      quantity,
      rate: quantity ? Math.round(total / quantity) : total,
      source: input.source ?? 'shop',
      total,
    }];
  }

  private linesForSale(sale: Sale): SaleLine[] {
    if (sale.lines?.length) return sale.lines;
    const item = this.stock().find(row => row.id === Number(sale.itemId));
    const quantity = Number(sale.quantity ?? 0);
    if (!item || quantity <= 0) return [];
    return [{
      itemId: item.id,
      itemName: sale.itemName ?? item.name,
      unit: item.unit,
      quantity,
      rate: quantity ? Math.round(Number(sale.amount || 0) / quantity) : Number(sale.amount || 0),
      source: sale.source ?? 'shop',
      total: Number(sale.amount || 0),
    }];
  }

  private hasEnoughStock(stock: StockItem[], lines: SaleLine[]): boolean {
    return stock.every(item => {
      const shopUsed = lines.filter(line => Number(line.itemId) === item.id && line.source === 'shop').reduce((sum, line) => sum + Number(line.quantity), 0);
      const warehouseUsed = lines.filter(line => Number(line.itemId) === item.id && line.source === 'warehouse').reduce((sum, line) => sum + Number(line.quantity), 0);
      return item.shop >= shopUsed && item.warehouse >= warehouseUsed;
    }) && lines.every(line => stock.some(item => item.id === Number(line.itemId)) && Number(line.quantity) > 0);
  }

  private applySaleLines(stock: StockItem[], lines: SaleLine[], direction: 1 | -1): StockItem[] {
    return stock.map(item => {
      const shopQty = lines.filter(line => Number(line.itemId) === item.id && line.source === 'shop').reduce((sum, line) => sum + Number(line.quantity), 0);
      const warehouseQty = lines.filter(line => Number(line.itemId) === item.id && line.source === 'warehouse').reduce((sum, line) => sum + Number(line.quantity), 0);
      return { ...item, shop: item.shop + shopQty * direction, warehouse: item.warehouse + warehouseQty * direction };
    });
  }

  private linesProfit(lines: SaleLine[], amount: number): number {
    const profit = lines.reduce((sum, line) => sum + Number(line.profit ?? ((line.rate - Number(line.purchaseRate || 0)) * line.quantity)), 0);
    return Math.round(profit || amount * 0.12);
  }

  private nowLabel(): string {
    return new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
