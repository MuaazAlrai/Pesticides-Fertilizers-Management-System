import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertTriangle, Boxes, Download, PackageX, Printer, RefreshCw, Warehouse, LucideAngularModule } from 'lucide-angular';
import { ErpStoreService } from '../../core/erp-store.service';

@Component({ selector: 'app-inventory', imports: [FormsModule, LucideAngularModule], templateUrl: './inventory.component.html', styleUrl: './inventory.component.css' })
export class InventoryComponent {
  readonly icons = { AlertTriangle, Boxes, Download, PackageX, Printer, RefreshCw, Warehouse };
  readonly selectedId = signal(1); readonly quantity = signal(0); readonly message = signal('');
  readonly total = computed(() => this.store.stock().reduce((s, i) => s + i.warehouse + i.shop, 0));
  readonly low = computed(() => this.store.stock().filter(i => i.warehouse + i.shop <= i.minimum * 2).length);
  readonly out = computed(() => this.store.stock().filter(i => i.warehouse + i.shop === 0).length);
  constructor(readonly store: ErpStoreService) {}
  transfer(): void { const ok = this.store.transfer(Number(this.selectedId()), Number(this.quantity())); this.message.set(ok ? 'اسٹاک کامیابی سے دکان منتقل ہوگیا' : 'مقدار درست نہیں یا گودام میں اسٹاک کم ہے'); if (ok) this.quantity.set(0); }
}
