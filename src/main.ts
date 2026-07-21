import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import './app/core/firebase';

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => void registration.unregister());
  });
}

if ('caches' in window) {
  void caches.keys().then(keys => {
    keys.forEach(key => void caches.delete(key));
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
