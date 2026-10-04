import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic update & cache refresh
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

