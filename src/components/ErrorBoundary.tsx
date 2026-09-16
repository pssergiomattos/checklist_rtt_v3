import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RTT Check] Erro capturado pelo ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetApp = async () => {
    try {
      // Desregistra todos os Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Limpa caches do navegador
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }

      // Limpa dados temporários que poderiam causar inconsistência
      sessionStorage.clear();

      // Força recarga limpa da URL principal
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch (e) {
      console.warn('Erro ao limpar aplicativo:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#f0f2f5]">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 text-[#8b0000] flex items-center justify-center mb-4 border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">
              {isChunkError ? 'Nova Versão Disponível' : 'Recuperação do Sistema'}
            </h1>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {isChunkError
                ? 'O aplicativo foi atualizado no servidor. Toque no botão abaixo para carregar a versão mais recente.'
                : 'Ocorreu uma instabilidade passageira ao carregar as telas. Você pode recarregar ou limpar o cache do celular.'}
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#8b0000] hover:bg-[#720000] active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Aplicativo</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetApp}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpar Cache e Atualizar</span>
              </button>
            </div>

            {this.state.error && (
              <details className="w-full mt-4 text-left">
                <summary className="text-[10px] text-slate-400 cursor-pointer select-none text-center hover:text-slate-600">
                  Detalhes técnicos
                </summary>
                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500 font-mono break-all max-h-24 overflow-y-auto">
                  {this.state.error.toString()}
                </div>
              </details>
            )}

            <div className="mt-5 text-[10px] text-slate-400">
              RTT Check • Controle de Qualidade
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
