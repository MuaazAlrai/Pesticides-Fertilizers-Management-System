import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Save, Settings, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  readonly icons = { Save, Settings };
  readonly username = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly message = signal('');

  constructor() {
    void this.loadLogin();
  }

  async loadLogin(): Promise<void> {
    this.loading.set(true);
    try {
      const login = await this.auth.getLogin();
      if (login) {
        this.username.set(login.username);
        this.email.set(login.email);
        this.password.set('');
      } else {
        this.username.set('admin');
        this.message.set('پہلے Firebase Authentication سے لاگ اِن کریں۔');
      }
    } catch {
      this.message.set('لاگ اِن تفصیل load نہیں ہو سکی۔');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.message.set('');
    if (!this.email().trim()) {
      this.message.set('ای میل ضروری ہے۔');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.updateLogin({
        username: this.username(),
        email: this.email(),
        password: this.password(),
      });
      this.password.set('');
      this.message.set('Firebase Auth detail update ہو گئی۔');
    } catch {
      this.message.set('Detail save نہیں ہو سکی۔ دوبارہ login کر کے کوشش کریں۔');
    } finally {
      this.loading.set(false);
    }
  }
}
