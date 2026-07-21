import { Injectable, signal } from '@angular/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

export interface AppLogin {
  username: string;
  email: string;
  password: string;
}

const SESSION_KEY = 'mat-login-session';
const USER_KEY = 'mat-login-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly loggedIn = signal(localStorage.getItem(SESSION_KEY) === 'true');
  readonly userLabel = signal(localStorage.getItem(USER_KEY) || 'ایڈمن');
  readonly currentUser = signal<User | null>(firebaseAuth.currentUser);

  constructor() {
    onAuthStateChanged(firebaseAuth, user => {
      this.currentUser.set(user);
      this.loggedIn.set(!!user);
      if (user) {
        const label = user.displayName || user.email || 'ایڈمن';
        localStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(USER_KEY, label);
        this.userLabel.set(label);
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_KEY);
        this.userLabel.set('ایڈمن');
      }
    });
  }

  async login(identity: string, password: string): Promise<boolean> {
    const email = identity.trim();
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    const user = firebaseAuth.currentUser;
    const label = user?.displayName || user?.email || email;
    localStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(USER_KEY, label);
    this.currentUser.set(user);
    this.loggedIn.set(true);
    this.userLabel.set(label);
    return true;
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.loggedIn.set(false);
    this.userLabel.set('ایڈمن');
  }

  async getLogin(): Promise<AppLogin | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return {
      username: user.displayName || 'admin',
      email: user.email || '',
      password: '',
    };
  }

  async updateLogin(login: AppLogin): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('No Firebase user is signed in.');

    const username = login.username.trim() || 'admin';
    const email = login.email.trim();
    const password = login.password.trim();

    if (user.displayName !== username) await updateProfile(user, { displayName: username });
    if (email && user.email !== email) await updateEmail(user, email);
    if (password) await updatePassword(user, password);

    const label = username || email || 'ایڈمن';
    localStorage.setItem(USER_KEY, label);
    this.currentUser.set(firebaseAuth.currentUser);
    this.userLabel.set(label);
  }
}
