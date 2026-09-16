import React, { useState } from 'react';
import { ClipboardCheck, Droplets, Gauge, User, LogOut, Shield } from 'lucide-react';
import { ScreenId, UserProfile } from '../types';
import { AdminLoginModal } from './AdminLoginModal';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onOpenAdmin?: (email: string, pass: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  currentUser,
  onLogout,
  onOpenAdmin,
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  return (
    <div id="tela-inicial" className="flex flex-col items-center text-center w-full pt-2 pb-2">
      {/* Logo REMA TIP TOP Centralizada */}
      <div className="w-44 h-24 flex items-center justify-center mb-1">
        <img
          src="./logo-192.png"
          alt="REMA TIP TOP"
          className="max-w-full max-h-full object-contain select-none"
        />
      </div>

      {/* Título do App */}
      <h1 className="text-3xl font-black text-[#8b0000] tracking-tight mb-0.5">
        RTT Check
      </h1>
      <p className="text-xs font-bold text-slate-500 mb-4 tracking-wide uppercase">
        Controle de Qualidade
      </p>

      {/* Barra do Operador Conectado */}
      {currentUser && (
        <div className="w-full max-w-[340px] bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 mb-5 flex items-center justify-between text-left shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#8b0000] flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4 text-[#8b0000]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {currentUser.cargo || 'Operador Ativo'}
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {currentUser.nome}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              id="btn-trocar-operador"
              type="button"
              onClick={onLogout}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#8b0000] active:scale-95 px-2 py-1 rounded-md border border-slate-200 hover:border-red-200 hover:bg-white transition-all flex items-center gap-1 shrink-0"
              title="Trocar de operador"
            >
              <LogOut className="w-3 h-3" />
              <span>Trocar</span>
            </button>
          )}
        </div>
      )}

      {/* Menu Principal */}
      <div className="flex flex-col w-full max-w-[280px] gap-3.5 mb-6">
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
      <div className="mt-5 text-center text-xs text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-4 w-full">
        <p className="text-slate-600 font-semibold">Desenvolvido por Paulo Matos</p>
        <p>Técnico de Controle de Qualidade</p>

        {/* Acesso Restrito do Administrador (Rastreio de Acessos) */}
        <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-center">
          <button
            id="btn-abrir-admin"
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="text-[11px] font-semibold text-slate-400 hover:text-[#8b0000] flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-50 active:scale-95"
            title="Acesso restrito de auditoria (requer e-mail e senha)"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Rastreio de Acessos (Admin)</span>
          </button>
        </div>
      </div>

      {/* Modal de Autenticação do Administrador */}
      <AdminLoginModal
        isOpen={showAdminModal}
        initialEmail={currentUser?.email || ''}
        onClose={() => setShowAdminModal(false)}
        onSuccess={(email, pass) => {
          if (onOpenAdmin) {
            onOpenAdmin(email, pass);
          }
        }}
      />
    </div>
  );
};
