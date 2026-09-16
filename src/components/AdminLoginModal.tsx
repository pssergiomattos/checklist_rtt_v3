import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { verifyAdminCredentials, saveAdminSession } from '../utils/auditLogger';

interface AdminLoginModalProps {
  initialEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, pass: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  initialEmail = '',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState(initialEmail || 'paulo.matos@rttshop.com.br');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor, informe o e-mail do administrador.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Por favor, digite a senha mestre.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyAdminCredentials(email.trim(), password.trim());
      if (res.success) {
        saveAdminSession(email.trim(), password.trim());
        onSuccess(email.trim(), password.trim());
        onClose();
      } else {
        setErrorMsg(res.message || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setErrorMsg('Falha ao autenticar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Topo do Modal */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Área do Administrador</h2>
              <p className="text-[10px] text-slate-400">Acesso ao Rastreio de Acessos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              E-mail de Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: paulo.matos@rttshop.com.br"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Acesso exclusivo a paulo.matos@rttshop.com.br e administradores autorizados.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#8b0000] hover:bg-[#720000] active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verificando...' : 'Acessar Rastreio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
