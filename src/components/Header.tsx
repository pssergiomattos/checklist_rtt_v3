import React from 'react';
import { ScreenId } from '../types';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  subtitle,
}) => {
  return (
    <header className="w-full grid grid-cols-3 items-center py-2 border-b border-slate-200/80 mb-3">
      {/* Canto superior esquerdo: Logo que redireciona para o Início */}
      <div className="flex items-center justify-start">
        {currentScreen !== 'home' ? (
          <button
            id="btn-logo-home"
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center p-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            title="Voltar ao Início"
            aria-label="Voltar ao Início"
          >
            <img
              src="/logo-192.png"
              alt="REMA TIP TOP - Início"
              className="h-8 w-auto max-w-[80px] object-contain select-none"
            />
          </button>
        ) : (
          <div className="w-10 h-8" />
        )}
      </div>

      {/* Centro: RTT Check centralizado */}
      <div className="flex flex-col items-center justify-center text-center">
        <span className="font-extrabold text-[#8b0000] text-lg tracking-tight leading-tight">
          RTT Check
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-500 font-medium leading-none mt-0.5 whitespace-nowrap">
            {subtitle}
          </span>
        )}
      </div>

      {/* Canto superior direito: Espaçador equilibrado */}
      <div className="w-full flex justify-end" />
    </header>
  );
};

