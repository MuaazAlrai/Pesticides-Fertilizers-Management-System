import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertTriangle, ArrowLeftRight, Boxes, Eye, PackagePlus, PackageX, Pencil, Save, Store, Trash2, Warehouse, X, LucideAngularModule } from 'lucide-angular';
import { map } from 'rxjs';
import { ErpStoreService, StockInput, StockItem, StockLocation } from '../../core/erp-store.service';

type InventoryMode = StockLocation | 'all';

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  private readonly route = inject(ActivatedRoute);
  readonly icons = { AlertTriangle, ArrowLeftRight, Boxes, Eye, PackagePlus, PackageX, Pencil, Save, Store, Trash2, Warehouse, X };
  readonly selectedId = signal(1);
  readonly quantity = signal(0);
  readonly from = signal<StockLocation>('warehouse');
  readonly to = signal<StockLocation>('shop');
  readonly message = signal('');
  readonly modalMode = signal<'add' | 'edit' | 'view' | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly form = signal<StockInput>({ name: '', category: '', warehouse: 0, shop: 0, minimum: 0, unit: '' });
  readonly mode = toSignal(this.route.data.pipe(map(data => this.toMode(data['location']))), { initialValue: this.toMode(this.route.snapshot.data['location']) });

  readonly total = computed(() => this.store.stock().reduce((s, i) => s + i.warehouse + i.shop, 0));
  readonly shopTotal = computed(() => this.store.stock().reduce((s, i) => s + i.shop, 0));
  readonly warehouseTotal = computed(() => this.store.stock().reduce((s, i) => s + i.warehouse, 0));
  readonly low = computed(() => this.store.stock().filter(i => i.warehouse + i.shop <= i.minimum * 2).length);
  readonly out = computed(() => this.store.stock().filter(i => i.warehouse + i.shop === 0).length);
  readonly selectedItem = computed(() => this.store.stock().find(i => i.id === this.selectedId()));
  readonly visibleStock = computed(() => {
    const mode = this.mode();
    if (mode === 'shop') return this.store.stock().filter(item => item.shop > 0);
    if (mode === 'warehouse') return this.store.stock().filter(item => item.warehouse > 0);
    return this.store.stock();
  });
  readonly pageTitle = computed(() => this.mode() === 'shop' ? 'Dukan Stock' : this.mode() === 'warehouse' ? 'Godown Stock' : 'Inventory');
  readonly detailTitle = computed(() => this.mode() === 'shop' ? 'Dukan mein para samaan' : this.mode() === 'warehouse' ? 'Godown mein para samaan' : 'Stock Detail');

  constructor(readonly store: ErpStoreService) {}

  setFrom(value: StockLocation): void {
    this.from.set(value);
    this.to.set(value === 'warehouse' ? 'shop' : 'warehouse');
  }

  transfer(): void {
    const ok = this.store.transfer(Number(this.selectedId()), Number(this.quantity()), this.from(), this.to(), 'Dukan/Godown transfer');
    this.message.set(ok ? 'Stock transfer save ho gaya.' : 'Quantity ghalat hai ya selected jagah par stock kam hai.');
    if (ok) this.quantity.set(0);
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.set({ name: '', category: '', warehouse: 0, shop: 0, minimum: 0, unit: '' });
    this.modalMode.set('add');
  }

  openEdit(item: StockItem): void {
    this.editingId.set(item.id);
    this.form.set(this.toInput(item));
    this.modalMode.set('edit');
  }

  openView(item: StockItem): void {
    this.editingId.set(item.id);
    this.form.set(this.toInput(item));
    this.modalMode.set('view');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editingId.set(null);
  }

  saveItem(): void {
    const item = this.normalizedForm();
    if (!item.name || !item.unit) {
      this.message.set('Product name aur unit zaroori hai.');
      return;
    }

    const id = this.editingId();
    if (id) this.store.updateStockItem(id, item);
    else this.store.addStockItem(item);
    this.message.set(id ? 'Product update ho gaya.' : 'Naya product add ho gaya.');
    this.closeModal();
  }

  deleteItem(item: StockItem): void {
    if (!confirm(`${item.name} delete karna hai?`)) return;
    this.store.deleteStockItem(item.id);
    this.message.set('Product delete ho gaya.');
  }

  updateForm(key: keyof StockInput, value: string | number): void {
    const numeric = ['warehouse', 'shop', 'minimum'].includes(key);
    this.form.update(current => ({ ...current, [key]: numeric ? Math.max(0, Number(value) || 0) : String(value) }));
  }

  locationLabel(location: StockLocation | undefined): string {
    return location === 'warehouse' ? 'Godown' : 'Dukan';
  }

  currentLocationLabel(): string {
    return this.mode() === 'warehouse' ? 'Godown' : 'Dukan';
  }

  locationQty(item: StockItem): number {
    return this.mode() === 'warehouse' ? item.warehouse : item.shop;
  }

  private toMode(value: unknown): InventoryMode {
    return value === 'shop' || value === 'warehouse' ? value : 'all';
  }

  private normalizedForm(): StockInput {
    const current = this.form();
    return {
      name: current.name.trim(),
      category: current.category.trim() || 'General',
      warehouse: Number(current.warehouse) || 0,
      shop: Number(current.shop) || 0,
      minimum: Number(current.minimum) || 0,
      unit: current.unit.trim(),
    };
  }

  private toInput(item: StockItem): StockInput {
    return {
      name: item.name,
      category: item.category,
      warehouse: item.warehouse,
      shop: item.shop,
      minimum: item.minimum,
      unit: item.unit,
    };
  }
}
