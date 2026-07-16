import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, MessageCircle, Plus, Printer, RotateCcw, TrendingUp, WalletCards, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService } from '../../core/erp-store.service';

@Component({ selector: 'app-sales', imports: [FormsModule, LucideAngularModule], templateUrl: './sales.component.html', styleUrl: './sales.component.css' })
export class SalesComponent {
  readonly icons = { Download, Eye, MessageCircle, Plus, Printer, RotateCcw, TrendingUp, WalletCards };
  readonly search = signal('');
  readonly filtered = computed(() => { const q = this.search().trim(); return this.store.sales().filter(s => !q || `${s.invoice} ${s.customer}`.includes(q)); });
  readonly total = computed(() => this.store.sales().reduce((sum, s) => sum + s.amount, 0));
  readonly profit = computed(() => this.store.sales().reduce((sum, s) => sum + s.profit, 0));
  constructor(readonly store: ErpStoreService) {}
}
