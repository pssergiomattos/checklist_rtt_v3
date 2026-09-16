import React from 'react';
import { ClipboardCheck, Droplets, Gauge, ShieldCheck } from 'lucide-react';
import { ScreenId } from '../types';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div id="tela-inicial" className="flex flex-col items-center text-center w-full pt-4 pb-2">
      {/* Logo REMA TIP TOP Centralizada */}
      <div className="w-44 h-28 flex items-center justify-center mb-3">
        <img
          src="./logo-192.png"
          alt="REMA TIP TOP"
          className="max-w-full max-h-full object-contain select-none"
        />
      </div>

      {/* Título do App */}
      <h1 className="text-3xl font-black text-[#8b0000] tracking-tight mb-1">
        RTT Check
      </h1>
      <p className="text-sm font-semibold text-slate-500 mb-8 tracking-wide uppercase">
        Controle de Qualidade
      </p>

      {/* Menu Principal */}
      <div className="flex flex-col w-full max-w-[280px] gap-3.5 mb-8">
        <button
          id="btn-nav-checklist"
          type="button"
          onClick={() => onNavigate('checklist')}
          className="w-full py-4 px-5 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] active:scale-[0.98] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-3 transition-all duration-150"
        >
          <ClipboardCheck className="w-5 h-5 text-white/90" />
          <span>CHECKLIST</span>
        </button>

        <button
          id="btn-nav-orvalho"
          type="button"
          onClick={() => onNavigate('orvalho')}
          className="w-full py-4 px-5 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] active:scale-[0.98] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-3 transition-all duration-150"
        >
          <Droplets className="w-5 h-5 text-white/90" />
          <span>PONTO DE ORVALHO</span>
        </button>

        <button
          id="btn-nav-carcaca"
          type="button"
          onClick={() => onNavigate('carcaca')}
          className="w-full py-4 px-5 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] active:scale-[0.98] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-3 transition-all duration-150"
        >
          <Gauge className="w-5 h-5 text-white/90" />
          <span>MEDIÇÃO DE CARCAÇA</span>
        </button>
      </div>

      {/* Rodapé institucional */}
      <div className="mt-6 text-center text-xs text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-5 w-full">
        <p className="text-slate-600 font-semibold">Desenvolvido por Paulo Matos</p>
        <p>Téc. Controle de Qualidade</p>
      </div>
    </div>
  );
};
