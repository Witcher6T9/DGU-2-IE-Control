import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-refresh when Vite fails to fetch a stale dynamic chunk after rebuild/deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload error detected. Reloading to fetch latest assets...', event);
    window.location.reload();
  });
  // Clear chunk retry marker on successful initialization
  try {
    sessionStorage.removeItem('chunk_retry_occurred');
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
