import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Lock, LogIn, User, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly icons = { Lock, LogIn, User };
  readonly identity = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly message = signal('');

  async login(): Promise<void> {
    this.message.set('');
    if (!this.identity().trim() || !this.password()) {
      this.message.set('ای میل اور پاس ورڈ ضروری ہیں۔');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.login(this.identity(), this.password());
      void this.router.navigate(['/dashboard']);
    } catch {
      this.message.set('Firebase Authentication سے لاگ اِن نہیں ہو سکا۔');
    } finally {
      this.loading.set(false);
    }
  }
}
