import { Injectable, signal } from '@angular/core';

export interface Customer { id: number; name: string; mobile: string; city: string; type: string; balance: number; status: 'فعال' | 'غیر فعال' | 'بلاک'; lastDeal: string; }
export interface Sale { invoice: string; customer: string; time: string; amount: number; profit: number; payment: 'فعال' | 'بقایا' | 'جزوی'; kind: string; }
export interface StockItem { id: number; name: string; category: string; warehouse: number; shop: number; minimum: number; unit: string; }

@Injectable({ providedIn: 'root' })
export class ErpStoreService {
  readonly customers = signal<Customer[]>(this.load('mat-customers', [
    { id: 1, name: 'محمد اقبال', mobile: '0300-1234567', city: 'لاہور', type: 'تھوک', balance: 45000, status: 'فعال', lastDeal: '2 دن پہلے' },
    { id: 2, name: 'احمد علی', mobile: '0321-9876543', city: 'فیصل آباد', type: 'پرچون', balance: -8000, status: 'فعال', lastDeal: 'آج' },
    { id: 3, name: 'خالد محمود', mobile: '0312-5551234', city: 'ملتان', type: 'کارپوریٹ', balance: 120000, status: 'غیر فعال', lastDeal: '65 دن پہلے' },
    { id: 4, name: 'سلیم اختر', mobile: '0333-7778888', city: 'راولپنڈی', type: 'تھوک', balance: 0, status: 'بلاک', lastDeal: '120 دن پہلے' },
    { id: 5, name: 'رضوان حسین', mobile: '0345-1112222', city: 'کراچی', type: 'پرچون', balance: 15000, status: 'فعال', lastDeal: 'کل' },
  ]));
  readonly sales = signal<Sale[]>(this.load('mat-sales', [
    { invoice: 'INV-0541', customer: 'محمد اقبال', time: 'آج 14:30', amount: 28500, profit: 3420, payment: 'فعال', kind: 'ادھار' },
    { invoice: 'INV-0540', customer: 'احمد علی', time: 'آج 11:15', amount: 12300, profit: 1476, payment: 'فعال', kind: 'نقد' },
    { invoice: 'INV-0539', customer: 'عمر فاروق', time: 'کل 16:45', amount: 95000, profit: 11400, payment: 'بقایا', kind: 'تھوک' },
    { invoice: 'INV-0538', customer: 'نعمان صدیق', time: 'کل 10:20', amount: 34200, profit: 4104, payment: 'فعال', kind: 'ادھار' },
  ]));
  readonly stock = signal<StockItem[]>(this.load('mat-stock', [
    { id: 1, name: 'گندم (50 کلو بوری)', category: 'اناج', warehouse: 450, shop: 120, minimum: 50, unit: 'بوری' },
    { id: 2, name: 'باسمتی چاول', category: 'اناج', warehouse: 320, shop: 80, minimum: 30, unit: 'بوری' },
    { id: 3, name: 'سفید چینی', category: 'کریانہ', warehouse: 75, shop: 24, minimum: 25, unit: 'بوری' },
    { id: 4, name: 'دال چنا', category: 'دالیں', warehouse: 12, shop: 6, minimum: 20, unit: 'تھیلا' },
  ]));

  addCustomer(customer: Omit<Customer, 'id'>): void {
    const next = [...this.customers(), { ...customer, id: Date.now() }];
    this.customers.set(next); this.save('mat-customers', next);
  }

  transfer(itemId: number, quantity: number): boolean {
    const item = this.stock().find(row => row.id === itemId);
    if (!item || quantity <= 0 || item.warehouse < quantity) return false;
    const next = this.stock().map(row => row.id === itemId ? { ...row, warehouse: row.warehouse - quantity, shop: row.shop + quantity } : row);
    this.stock.set(next); this.save('mat-stock', next); return true;
  }

  private load<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; } }
  private save<T>(key: string, value: T): void { localStorage.setItem(key, JSON.stringify(value)); }
}
