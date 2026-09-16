import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Utilitário de emergência para limpar Service Worker e cache se necessário
declare global {
  interface Window {
    __RTT_APP_MOUNTED__?: boolean;
    resetRttApp?: () => Promise<void>;
  }
}

window.resetRttApp = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    localStorage.removeItem('rtt_audit_logs_cache_v1');
    sessionStorage.clear();
    const targetUrl = window.location.pathname + '?nocache=' + Date.now();
    try {
      window.location.replace(targetUrl);
    } catch {
      window.location.href = targetUrl;
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  } catch {
    window.location.reload();
  }
};

try {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    window.__RTT_APP_MOUNTED__ = true;
  }
} catch (err) {
  console.error('Erro crítico ao montar aplicativo RTT Check:', err);
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center; background: #f8fafc; color: #1e293b;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <svg style="width: 28px; height: 28px; color: #8b0000;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style="color: #8b0000; font-size: 18px; font-weight: 800; margin-bottom: 8px;">Nova Atualização Detectada</h2>
        <p style="color: #64748b; font-size: 13px; max-width: 320px; line-height: 1.5; margin-bottom: 20px;">
          Arquivos novos foram publicados no GitHub. Toque no botão abaixo para carregar a versão mais recente.
        </p>
        <button onclick="window.resetRttApp && window.resetRttApp()" style="background: #8b0000; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(139, 0, 0, 0.25);">
          CARREGAR ATUALIZAÇÃO AGORA
        </button>
      </div>
    `;
  }
}
