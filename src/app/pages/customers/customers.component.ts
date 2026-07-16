import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Download, Eye, MessageCircle, Pencil, Plus, X, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService } from '../../core/erp-store.service';

@Component({ selector: 'app-customers', imports: [FormsModule, LucideAngularModule], templateUrl: './customers.component.html', styleUrl: './customers.component.css' })
export class CustomersComponent {
  readonly icons = { Download, Eye, MessageCircle, Pencil, Plus, X };
  readonly search = signal(''); readonly status = signal('تمام'); readonly formOpen = signal(false);
  readonly filtered = computed(() => { const q = this.search().trim(); return this.store.customers().filter(c => (this.status() === 'تمام' || c.status === this.status()) && (!q || `${c.name} ${c.mobile} ${c.city}`.includes(q))); });
  form = { name: '', mobile: '', city: '', type: 'پرچون', balance: 0 };
  constructor(readonly store: ErpStoreService) {}
  addCustomer(): void { if (!this.form.name.trim() || !this.form.mobile.trim()) return; this.store.addCustomer({ ...this.form, status: 'فعال', lastDeal: 'نیا صارف' }); this.form = { name: '', mobile: '', city: '', type: 'پرچون', balance: 0 }; this.formOpen.set(false); }
}
