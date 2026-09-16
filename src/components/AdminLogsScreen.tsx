import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  UserCheck,
  Shield,
  ArrowLeft,
  KeyRound,
  Trash2,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Crown,
  Briefcase,
  Globe,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { AccessLogEntry, ScreenId, CARGOS_DISPONIVEIS } from '../types';
import {
  fetchServerLogs,
  downloadLogsTxt,
  downloadLogsCsv,
  clearAdminSession,
  fetchAdminList,
  addAdminEmail,
  removeAdminEmail,
  fetchEmailRules,
  addEmailException,
  removeEmailException,
  updateOperatorCargo,
  createOperatorByAdmin,
} from '../utils/auditLogger';

interface AdminLogsScreenProps {
  adminEmail: string;
  adminPass: string;
  onNavigate: (screen: ScreenId) => void;
}

export const AdminLogsScreen: React.FC<AdminLogsScreenProps> = ({
  adminEmail,
  adminPass,
  onNavigate,
}) => {
  const [tab, setTab] = useState<'logs' | 'users' | 'domains' | 'admins'>('logs');
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<string[]>(['paulo.matos@rttshop.com.br']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('todos');
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Modais e ações de operadores
  const [resetModalUser, setResetModalUser] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('rtt2026');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Alteração de função (cargo) de operador
  const [editCargoUser, setEditCargoUser] = useState<{ email: string; nome: string; cargo: string } | null>(null);
  const [selectedNewCargo, setSelectedNewCargo] = useState<string>('Controle de Qualidade');
  const [updatingCargo, setUpdatingCargo] = useState(false);

  // Novo operador pré-cadastrado
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newOpEmail, setNewOpEmail] = useState('');
  const [newOpNome, setNewOpNome] = useState('');
  const [newOpCargo, setNewOpCargo] = useState<string>('Controle de Qualidade');
  const [creatingOp, setCreatingOp] = useState(false);

  // Gestão de e-mails e domínios
  const [defaultDomains, setDefaultDomains] = useState<string[]>(['@rttshop.com.br', '@rematiptop.com.br']);
  const [emailExceptions, setEmailExceptions] = useState<string[]>([]);
  const [newExceptionInput, setNewExceptionInput] = useState('');
  const [exceptionLoading, setExceptionLoading] = useState(false);

  // Gestão de administradores
  const [newAdminInput, setNewAdminInput] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = adminEmail.trim().toLowerCase() === 'paulo.matos@rttshop.com.br';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchServerLogs(adminEmail, adminPass);
      setLogs(res.logs || []);
      if (res.usersList) {
        setUsersList(res.usersList);
      }
      if (res.message) setStatusMsg(res.message);

      const adminRes = await fetchAdminList(adminEmail, adminPass);
      if (adminRes.admins) {
        setAdminsList(adminRes.admins);
      }

      const emailRules = await fetchEmailRules();
      if (emailRules.defaultDomains) setDefaultDomains(emailRules.defaultDomains);
      if (emailRules.exceptions) setEmailExceptions(emailRules.exceptions);
    } catch (e) {
      console.warn('Erro ao carregar dados do admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccessMsg = (msg: string) => {
    setActionSuccessMsg(msg);
    setActionErrorMsg('');
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const triggerErrorMsg = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(''), 5000);
  };

  // Redefinir senha de operador
  const handleResetPassword = async (targetEmail: string) => {
    try {
      const res = await fetch('/api/admin/reset-operator-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          adminPassword: adminPass,
          targetEmail,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessMsg(`Senha de ${targetEmail} redefinida para "${newPasswordInput}" com sucesso!`);
        setResetModalUser(null);
      } else {
        triggerErrorMsg(data.message || 'Erro ao redefinir senha.');
      }
    } catch {
      triggerErrorMsg('Erro ao se comunicar com o servidor.');
    }
  };

  // Alterar função (cargo) do operador
  const handleUpdateCargo = async () => {
    if (!editCargoUser) return;
    setUpdatingCargo(true);
    try {
      const res = await updateOperatorCargo(adminEmail, adminPass, editCargoUser.email, selectedNewCargo);
      if (res.success) {
        triggerSuccessMsg(`Função de ${editCargoUser.nome} alterada para "${selectedNewCargo}" com sucesso!`);
        setUsersList((prev) =>
          prev.map((u) => (u.email === editCargoUser.email ? { ...u, cargo: selectedNewCargo } : u))
        );
        setEditCargoUser(null);
      } else {
        triggerErrorMsg(res.message || 'Erro ao atualizar função do operador.');
      }
    } finally {
      setUpdatingCargo(false);
    }
  };

  // Cadastrar novo operador diretamente pelo admin
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpEmail.trim() || !newOpNome.trim()) {
      triggerErrorMsg('Informe o e-mail e o nome do operador.');
      return;
    }
    setCreatingOp(true);
    try {
      const res = await createOperatorByAdmin(adminEmail, adminPass, {
        email: newOpEmail.trim().toLowerCase(),
        nome: newOpNome.trim(),
        cargo: newOpCargo,
        password: 'rema' + new Date().getFullYear(),
      });
      if (res.success) {
        triggerSuccessMsg(`Operador ${newOpNome} cadastrado com sucesso com a função "${newOpCargo}"!`);
        setNewOpEmail('');
        setNewOpNome('');
        setShowCreateUserModal(false);
        loadData();
      } else {
        triggerErrorMsg(res.message || 'Erro ao cadastrar operador.');
      }
    } finally {
      setCreatingOp(false);
    }
  };

  // Adicionar exceção de e-mail
  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newExceptionInput.trim().toLowerCase();
    if (!clean) return;
    setExceptionLoading(true);
    try {
      const res = await addEmailException(adminEmail, adminPass, clean);
      if (res.success) {
        triggerSuccessMsg(`Exceção "${clean}" autorizada com sucesso!`);
        setNewExceptionInput('');
        if (res.exceptions) setEmailExceptions(res.exceptions);
      } else {
        triggerErrorMsg(res.message || 'Erro ao autorizar exceção.');
      }
    } finally {
      setExceptionLoading(false);
    }
  };

  // Remover exceção de e-mail
  const handleRemoveException = async (exc: string) => {
    if (!confirm(`Deseja revogar a permissão para "${exc}"? Usuários com esta extensão não poderão mais acessar.`)) {
      return;
    }
    setExceptionLoading(true);
    try {
      const res = await removeEmailException(adminEmail, adminPass, exc);
      if (res.success) {
        triggerSuccessMsg(`Exceção "${exc}" removida.`);
        if (res.exceptions) setEmailExceptions(res.exceptions);
      } else {
        triggerErrorMsg(res.message || 'Erro ao remover exceção.');
      }
    } finally {
      setExceptionLoading(false);
    }
  };

  // Gestão de administradores
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminInput.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setAdminActionMsg({ type: 'error', text: 'Informe um e-mail corporativo válido.' });
      return;
    }
    setAdminActionLoading(true);
    setAdminActionMsg(null);
    const res = await addAdminEmail(adminEmail, adminPass, clean);
    setAdminActionLoading(false);
    if (res.success) {
      setAdminActionMsg({ type: 'success', text: res.message });
      setNewAdminInput('');
      if (res.admins) setAdminsList(res.admins);
    } else {
      setAdminActionMsg({ type: 'error', text: res.message });
    }
  };

  const handleRemoveAdmin = async (targetEmail: string) => {
    if (!confirm(`Confirma a revogação de permissão de administrador para ${targetEmail}?`)) {
      return;
    }
    setAdminActionLoading(true);
    setAdminActionMsg(null);
    const res = await removeAdminEmail(adminEmail, adminPass, targetEmail);
    setAdminActionLoading(false);
    if (res.success) {
      setAdminActionMsg({ type: 'success', text: res.message });
      if (res.admins) setAdminsList(res.admins);
    } else {
      setAdminActionMsg({ type: 'error', text: res.message });
    }
  };

  const handleDownloadTxt = async () => {
    setDownloading(true);
    try {
      await downloadLogsTxt(adminEmail, adminPass, logs);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCsv = () => {
    downloadLogsCsv(filteredLogs);
  };

  const handleExitAdmin = () => {
    clearAdminSession();
    onNavigate('home');
  };

  // Filtragem dos logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.acao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.detalhes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCargo =
      filterCargo === 'todos' ||
      (log.cargo || '').toLowerCase() === filterCargo.toLowerCase();

    return matchesSearch && matchesCargo;
  });

  const uniqueUsers = new Set(logs.map((l) => (l.email || l.nome).toLowerCase())).size;
  const todayStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const todayLogsCount = logs.filter((l) => l.dataHora.includes(todayStr)).length;

  return (
    <div id="tela-admin-logs" className="flex flex-col gap-4 animate-fade-in w-full text-left">
      {/* Barra de Status do Administrador */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-xs">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight">Painel de Controle Admin</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Ativo
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
              Admin: <span className="text-slate-300 font-semibold">{adminEmail}</span>
            </div>
          </div>
        </div>

        <button
          id="btn-admin-voltar"
          type="button"
          onClick={handleExitAdmin}
          aria-label="Voltar"
          title="Voltar ao App"
          className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Alertas Globais */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Cartões com Métricas de Acesso */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Usos
          </span>
          <span className="text-lg font-black text-slate-800">{logs.length}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Técnicos
          </span>
          <span className="text-lg font-black text-[#8b0000]">{uniqueUsers}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hoje
          </span>
          <span className="text-lg font-black text-emerald-700">{todayLogsCount}</span>
        </div>
      </div>

      {/* 4 Botões de Alternância entre Abas */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('logs')}
          className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 truncate ${
            tab === 'logs'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#8b0000]" />
          <span className="truncate">Acessos</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('users')}
          className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 truncate ${
            tab === 'users'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="truncate">Operadores ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('domains')}
          className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 truncate ${
            tab === 'domains'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span className="truncate">E-mails ({emailExceptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('admins')}
          className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 truncate ${
            tab === 'admins'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate">Admins ({adminsList.length})</span>
        </button>
      </div>

      {/* ABA 1: HISTÓRICO DE ACESSOS / LOGS */}
      {tab === 'logs' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden focus:border-[#8b0000]"
              />
            </div>

            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="todos">Todos os Cargos</option>
              {CARGOS_DISPONIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={downloading}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Baixando...' : 'Baixar TXT'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Excel / CSV</span>
            </button>
          </div>

          {/* Lista de Logs */}
          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-0.5">
            {filteredLogs.length === 0 ? (
              <div className="py-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Nenhum registro encontrado.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex flex-col gap-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#8b0000]">{log.acao}</span>
                    <span className="text-[10px] text-slate-400">{log.dataHora}</span>
                  </div>
                  <div className="text-slate-700 font-semibold">
                    {log.nome} <span className="text-slate-400 font-normal">({log.email})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span>{log.cargo}</span>
                  </div>
                  {log.detalhes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-md mt-1">
                      {log.detalhes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: OPERADORES CADASTRADOS & GESTÃO DE FUNÇÃO / CARGO */}
      {tab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-700" />
                Função do Operador (Controle Exclusivo Admin)
              </span>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[10px] rounded-md flex items-center gap-1 transition-all"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Novo Operador</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              O operador não pode alterar a sua função na tela inicial. Se a função for cadastrada errada, selecione o operador abaixo e clique em <strong>Alterar Função</strong>.
            </p>
          </div>

          {/* Lista de Operadores Cadastrados */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
            {usersList.length === 0 ? (
              <div className="py-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Nenhum operador cadastrado no sistema ainda.
              </div>
            ) : (
              usersList.map((usr: any) => (
                <div
                  key={usr.email}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex flex-col gap-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate text-sm">{usr.nome}</p>
                      <p className="text-[11px] text-slate-500 truncate">{usr.email}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-red-50 text-[#8b0000] border border-red-200 text-[10px] font-bold rounded-md shrink-0">
                      {usr.cargo || 'Controle de Qualidade'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditCargoUser({
                          email: usr.email,
                          nome: usr.nome,
                          cargo: usr.cargo || 'Controle de Qualidade',
                        });
                        setSelectedNewCargo(usr.cargo || 'Controle de Qualidade');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-200 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                      title="Alterar Função / Cargo deste operador"
                    >
                      <Briefcase className="w-3 h-3 text-amber-700" />
                      <span>Alterar Função</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResetModalUser(usr.email);
                        setNewPasswordInput('rtt2026');
                      }}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 font-semibold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                    >
                      <KeyRound className="w-3 h-3 text-[#8b0000]" />
                      <span>Redefinir Senha</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal / Painel de Alteração de Cargo */}
          {editCargoUser && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col gap-2.5 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-700" />
                  <span>Alterar Função de: {editCargoUser.nome}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditCargoUser(null)}
                  className="text-xs text-amber-800 hover:text-amber-950 font-bold px-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-amber-900">
                Selecione a nova função oficial para <strong>{editCargoUser.email}</strong>. Esta alteração será refletida em todos os dispositivos.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={selectedNewCargo}
                  onChange={(e) => setSelectedNewCargo(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 outline-hidden"
                >
                  {CARGOS_DISPONIVEIS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleUpdateCargo}
                  disabled={updatingCargo}
                  className="px-3.5 py-1.5 bg-[#8b0000] hover:bg-[#720000] text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50"
                >
                  {updatingCargo ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* Modal de Cadastro de Novo Operador */}
          {showCreateUserModal && (
            <form
              onSubmit={handleCreateOperator}
              className="p-3.5 bg-blue-50 border border-blue-300 rounded-xl flex flex-col gap-2.5 animate-fade-in shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-700" />
                  <span>Pré-cadastrar Novo Operador</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-xs text-blue-800 hover:text-blue-950 font-bold px-1"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  E-mail Corporativo:
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: joao.silva@rttshop.com.br"
                  value={newOpEmail}
                  onChange={(e) => setNewOpEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newOpNome}
                  onChange={(e) => setNewOpNome(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Função / Cargo Oficial:
                </label>
                <select
                  value={newOpCargo}
                  onChange={(e) => setNewOpCargo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800 outline-hidden"
                >
                  {CARGOS_DISPONIVEIS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingOp}
                className="w-full mt-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                {creatingOp ? 'Cadastrando...' : 'Salvar Operador'}
              </button>
            </form>
          )}

          {/* Modal de Redefinição de Senha */}
          {resetModalUser && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Nova senha para: {resetModalUser}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nova senha temporária"
                  className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleResetPassword(resetModalUser)}
                  className="px-3 py-1.5 bg-[#8b0000] hover:bg-[#720000] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: DOMÍNIOS & REGRAS DE E-MAIL (NOVA SOLICITAÇÃO) */}
      {tab === 'domains' && (
        <div className="flex flex-col gap-3">
          {/* Card: Domínios Oficiais REMA TIP TOP */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">
                Domínios Oficiais (Liberados por Padrão)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Todos os e-mails que terminam com estas extensões têm acesso corporativo autorizado automaticamente:
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              {defaultDomains.map((dom) => (
                <div
                  key={dom}
                  className="px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <span className="font-mono font-bold text-emerald-900">{dom}</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Padrão de Fábrica
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Exceções Autorizadas pelo Administrador */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-xs text-slate-800">
                  Exceções Autorizadas pelo Admin
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {emailExceptions.length} ativa(s)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Permite liberar o acesso de consultores externos, parceiros ou extensões terceiras sem comprometer a segurança.
            </p>

            {/* Formulário para Adicionar Exceção */}
            <form onSubmit={handleAddException} className="flex flex-col gap-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-600">
                Nova Exceção (E-mail individual ou domínio @extensao):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: consultor@gmail.com ou @parceiro.com"
                  value={newExceptionInput}
                  onChange={(e) => setNewExceptionInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 outline-hidden focus:border-indigo-600 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={exceptionLoading || !newExceptionInput.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Liberar</span>
                </button>
              </div>
            </form>

            {/* Lista de Exceções Ativas */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 max-h-[220px] overflow-y-auto">
              {emailExceptions.length === 0 ? (
                <div className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                  Nenhuma exceção cadastrada. Apenas os e-mails @rttshop e @rematiptop podem acessar.
                </div>
              ) : (
                emailExceptions.map((exc) => (
                  <div
                    key={exc}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                      <span className="font-mono font-semibold text-slate-800 truncate">{exc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveException(exc)}
                      disabled={exceptionLoading}
                      className="text-red-500 hover:text-red-700 active:scale-95 p-1 rounded-md hover:bg-red-50 transition-all shrink-0"
                      title="Revogar esta exceção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: GESTÃO DE ADMINISTRADORES */}
      {tab === 'admins' && (
        <div className="flex flex-col gap-3">
          {isSuperAdmin ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-slate-800">Super Administrador Master</span>
                <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-800 px-1.5 py-0.5 rounded-full">
                  Exclusivo
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Você é o administrador principal do RTT Check. Apenas você pode conceder ou revogar o acesso de outros administradores à área restrita.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Visualização de Administradores Autorizados. Apenas o Super Admin pode gerenciar este grupo.
              </span>
            </div>
          )}

          {adminActionMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                adminActionMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {adminActionMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{adminActionMsg.text}</span>
            </div>
          )}

          {isSuperAdmin && (
            <form
              onSubmit={handleAddAdmin}
              className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs"
            >
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#8b0000]" />
                <span>Autorizar Novo Administrador:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Ex: novo.admin@rttshop.com.br"
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-hidden focus:border-[#8b0000] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={adminActionLoading || !newAdminInput.trim()}
                  className="px-3 py-2 bg-[#8b0000] hover:bg-[#720000] active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Autorizar</span>
                </button>
              </div>
            </form>
          )}

          {/* Lista de Administradores */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Administradores com Acesso ({adminsList.length}):
            </span>
            {adminsList.map((adm) => {
              const isMaster = adm.toLowerCase() === 'paulo.matos@rttshop.com.br';
              return (
                <div
                  key={adm}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {isMaster ? (
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{adm}</p>
                      <span className="text-[10px] text-slate-400">
                        {isMaster ? 'Super Administrador (Fundador)' : 'Administrador Autorizado'}
                      </span>
                    </div>
                  </div>

                  {isSuperAdmin && !isMaster && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(adm)}
                      disabled={adminActionLoading}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Revogar permissão de administrador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão de Atualizar Dados */}
      <button
        type="button"
        onClick={loadData}
        disabled={loading}
        className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all mt-1"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8b0000]' : ''}`} />
        <span>Atualizar Dados do Servidor</span>
      </button>
    </div>
  );
};
