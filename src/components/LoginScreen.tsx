import React, { useState } from 'react';
import { User, Mail, ArrowRight, UserCheck, Briefcase, ChevronDown, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { getRecentUsers, setActiveUser } from '../utils/authStorage';
import { logAccessEvent } from '../utils/auditLogger';

const CARGOS_DISPONIVEIS = [
  'Controle de Qualidade',
  'Liderança',
  'Supervisão',
  'Gerência',
] as const;

export function extractNameFromEmail(emailStr: string): string {
  if (!emailStr) return '';
  const userPart = emailStr.trim().split('@')[0];
  if (!userPart) return '';

  const words = userPart
    .replace(/[0-9]/g, '')
    .split(/[\.\_\-]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return '';

  const preposicoes = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && preposicoes.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Controle de Qualidade');
  const [lembrar, setLembrar] = useState(true);
  const [recentUsers] = useState<UserProfile[]>(() => getRecentUsers());
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const extracted = extractNameFromEmail(val);
    setNome(extracted);
    if (errorMsg) setErrorMsg('');
  };

  const handleSelectRecent = (user: UserProfile) => {
    if (user.email) {
      setEmail(user.email);
      const extracted = extractNameFromEmail(user.email);
      setNome(extracted || user.nome);
    } else {
      setNome(user.nome);
    }
    if (user.cargo && (CARGOS_DISPONIVEIS as readonly string[]).includes(user.cargo)) {
      setCargo(user.cargo);
    } else {
      setCargo('Controle de Qualidade');
    }
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMsg('Por favor, informe seu e-mail corporativo da REMA.');
      return;
    }

    const cleanNome = nome.trim() || extractNameFromEmail(cleanEmail);

    if (!cleanNome) {
      setErrorMsg('Não foi possível identificar o nome a partir do e-mail. Ex: paulo.matos@rttshop.com.br');
      return;
    }

    const profile: UserProfile = {
      nome: cleanNome,
      email: cleanEmail,
      cargo: cargo.trim() || 'Controle de Qualidade',
    };

    if (lembrar) {
      setActiveUser(profile);
    }
    // Registra o evento de login no rastreio online
    logAccessEvent('Login no App', profile, 'Início de sessão');
    onLoginSuccess(profile);
  };

  return (
    <div id="tela-login" className="flex flex-col items-center text-center w-full pt-2 pb-2">
      {/* Logo REMA TIP TOP Centralizada */}
      <div className="w-44 h-24 flex items-center justify-center mb-2">
        <img
          src="./logo-192.png"
          alt="REMA TIP TOP"
          className="max-w-full max-h-full object-contain select-none"
        />
      </div>

      {/* Título */}
      <h1 className="text-2xl font-black text-[#8b0000] tracking-tight mb-1">
        RTT Check
      </h1>
      <p className="text-xs font-bold text-slate-500 mb-6 tracking-wide uppercase">
        Identificação do Operador
      </p>

      {/* Formulário de Identificação */}
      <div className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-left shadow-sm mb-4">
        {recentUsers.length > 0 && (
          <div className="mb-4 pb-3 border-b border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Operadores Recentes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {recentUsers.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRecent(u)}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 active:scale-95 border border-slate-300 hover:border-red-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#8b0000] flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#8b0000]" />
                  <span>{u.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1º Campo: E-mail Corporativo */}
          <div>
            <label
              htmlFor="input-login-email"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              E-mail Corporativo (REMA) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-login-email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Ex: seu.nome@rttshop.com.br"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden transition-all"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Informe seu e-mail para identificação.
            </p>
          </div>

          {/* 2º Campo: Nome do Técnico */}
          <div>
            <label
              htmlFor="input-login-nome"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Nome do Técnico / Inspetor
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-login-nome"
                type="text"
                value={nome}
                readOnly
                tabIndex={-1}
                placeholder="Preenchido automaticamente pelo e-mail"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold cursor-not-allowed outline-hidden select-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              {nome ? (
                <>
                  <span className="text-emerald-600 font-bold">Identificado:</span>
                  <span className="font-semibold text-slate-700">{nome}</span>
                </>
              ) : (
                'O nome será extraído automaticamente assim que você digitar o e-mail.'
              )}
            </p>
          </div>

          {/* 3º Campo: Função / Setor */}
          <div>
            <label
              htmlFor="select-login-cargo"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Função / Setor <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="select-login-cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden transition-all appearance-none cursor-pointer"
              >
                {CARGOS_DISPONIVEIS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="chk-lembrar"
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
              className="w-4 h-4 text-[#8b0000] rounded-sm border-slate-300 focus:ring-[#8b0000]"
            />
            <label htmlFor="chk-lembrar" className="text-xs text-slate-600 font-medium cursor-pointer">
              Manter conectado neste dispositivo
            </label>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full mt-2 py-3.5 px-4 bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] active:scale-[0.98] text-white font-bold text-sm tracking-wider rounded-xl shadow-md shadow-red-950/20 flex items-center justify-center gap-2 transition-all duration-150"
          >
            <span>ACESSAR O APP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Rodapé institucional com o crédito do desenvolvedor mantido intacto */}
      <div className="mt-4 text-center text-xs text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-4 w-full">
        <p className="text-slate-600 font-semibold">Desenvolvido por Paulo Matos</p>
        <p>Técnico de Controle de Qualidade</p>
      </div>
    </div>
  );
};
