import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Building2, Eye, Pencil, ReceiptText, Trash2, Users, WalletCards, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService, Purchase, Sale } from '../../core/erp-store.service';

type PartyType = 'customer' | 'supplier';

interface PartyOption {
  key: string;
  name: string;
  type: PartyType;
}

interface KhataRow {
  date: string;
  time: string;
  type: 'Sale' | 'Purchase';
  invoice: string;
  item: string;
  total: number;
  cash: number;
  balance: number;
  advance: number;
  route: '/sales' | '/purchase';
  record: Sale | Purchase;
}

@Component({
  selector: 'app-party-khata',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './party-khata.component.html',
  styleUrl: './party-khata.component.css',
})
export class PartyKhataComponent {
  readonly store = inject(ErpStoreService);
  readonly icons = { Building2, Eye, Pencil, ReceiptText, Trash2, Users, WalletCards };
  readonly selectedPartyKey = signal('');

  readonly parties = computed<PartyOption[]>(() => {
    const map = new Map<string, PartyOption>();

    for (const customer of this.store.customers()) {
      map.set(this.partyKey('customer', customer.name), { key: this.partyKey('customer', customer.name), name: customer.name, type: 'customer' });
    }
    for (const sale of this.store.sales()) {
      map.set(this.partyKey('customer', sale.customer), { key: this.partyKey('customer', sale.customer), name: sale.customer, type: 'customer' });
    }
    for (const purchase of this.store.purchases()) {
      map.set(this.partyKey('supplier', purchase.supplier), { key: this.partyKey('supplier', purchase.supplier), name: purchase.supplier, type: 'supplier' });
    }

    return [...map.values()].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  });

  readonly selectedParty = computed(() => this.parties().find(party => party.key === this.selectedPartyKey()) ?? this.parties()[0]);

  readonly khataRows = computed<KhataRow[]>(() => {
    const party = this.selectedParty();
    if (!party) return [];

    const saleRows = party.type === 'customer'
      ? this.store.sales().filter(sale => sale.customer === party.name).map(sale => this.saleRow(sale))
      : [];
    const purchaseRows = party.type === 'supplier'
      ? this.store.purchases().filter(purchase => purchase.supplier === party.name).map(purchase => this.purchaseRow(purchase))
      : [];

    return [...saleRows, ...purchaseRows].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  });

  readonly total = computed(() => this.khataRows().reduce((sum, row) => sum + row.total, 0));
  readonly cash = computed(() => this.khataRows().reduce((sum, row) => sum + row.cash, 0));
  readonly balance = computed(() => this.khataRows().reduce((sum, row) => sum + row.balance, 0));
  readonly advance = computed(() => this.khataRows().reduce((sum, row) => sum + row.advance, 0));

  updateParty(value: string): void {
    this.selectedPartyKey.set(value);
  }

  deleteRow(row: KhataRow): void {
    if (!confirm(`${row.invoice} delete karni hai?`)) return;
    if (row.type === 'Sale') this.store.deleteSale(row.invoice);
    else this.store.deletePurchase(row.invoice);
  }

  partyTypeLabel(type: PartyType): string {
    return type === 'supplier' ? 'Supplier / Company' : 'Customer';
  }

  private saleRow(sale: Sale): KhataRow {
    const cash = Number(sale.receivedCash || 0);
    return {
      date: sale.date || '',
      time: sale.time,
      type: 'Sale',
      invoice: sale.invoice,
      item: sale.itemName || `${sale.lines?.length ?? 0} items`,
      total: sale.amount,
      cash,
      balance: Number(sale.balance || 0),
      advance: Math.max(0, cash - sale.amount),
      route: '/sales',
      record: sale,
    };
  }

  private purchaseRow(purchase: Purchase): KhataRow {
    const cash = Number(purchase.paidCash || 0);
    return {
      date: purchase.date || '',
      time: purchase.time,
      type: 'Purchase',
      invoice: purchase.invoice,
      item: purchase.itemName || `${purchase.lines?.length ?? 0} items`,
      total: purchase.amount,
      cash,
      balance: Number(purchase.balance || 0),
      advance: Math.max(0, cash - purchase.amount),
      route: '/purchase',
      record: purchase,
    };
  }

  private partyKey(type: PartyType, name: string): string {
    return `${type}:${name.trim().toLowerCase()}`;
  }
}
