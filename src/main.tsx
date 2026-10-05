import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// In development, clear any stale service workers or caches to ensure fresh Vite HMR
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.includes('workbox') || key.includes('vite') || key.includes('sw')) {
          caches.delete(key);
        }
      }
    });
  }
}

// Register Service Worker with automatic update & cache refresh in production
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);

