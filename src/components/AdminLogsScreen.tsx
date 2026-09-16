import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  FileText,
  Table,
  RefreshCw,
  Search,
  Users,
  Smartphone,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Filter,
  UserCheck,
  KeyRound,
  UserPlus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { AccessLogEntry, ScreenId } from '../types';
import {
  fetchServerLogs,
  downloadLogsTxt,
  downloadLogsCsv,
  clearAdminSession,
  fetchAdminList,
  addAdminEmail,
  removeAdminEmail,
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
  const [tab, setTab] = useState<'logs' | 'users' | 'admins'>('logs');
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<string[]>(['paulo.matos@rttshop.com.br']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('todos');
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [resetModalUser, setResetModalUser] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('rtt2026');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Estados de gestão de administradores
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
    } catch (e) {
      console.warn('Erro ao carregar logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        setResetSuccessMsg(`Senha de ${targetEmail} redefinida para "${newPasswordInput}" com sucesso!`);
        setResetModalUser(null);
        setTimeout(() => setResetSuccessMsg(''), 6000);
      } else {
        alert(data.message || 'Erro ao redefinir senha');
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
    }
  };

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

  // Métricas rápidas
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
              <span className="text-xs font-bold tracking-tight">Painel de Rastreio Online</span>
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
          title="Voltar"
          className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cartões com Métricas de Acesso */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Usos
          </span>
          <span className="text-lg font-black text-slate-800">{logs.length}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Técnicos
          </span>
          <span className="text-lg font-black text-[#8b0000]">{uniqueUsers}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hoje
          </span>
          <span className="text-lg font-black text-emerald-700">{todayLogsCount}</span>
        </div>
      </div>

      {/* Botões de Alternância entre Logs, Operadores e Admins */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('logs')}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 truncate ${
            tab === 'logs'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#8b0000] shrink-0" />
          <span className="truncate">Acessos ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('users')}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 truncate ${
            tab === 'users'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Operadores ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('admins')}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 truncate ${
            tab === 'admins'
              ? 'bg-white text-slate-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Admins ({adminsList.length})</span>
        </button>
      </div>

      {tab === 'logs' && (
        <>
          {/* Botões de Ação para Download do Arquivo de Rastreio */}
          <div className="bg-red-50/50 border border-red-200/80 rounded-xl p-3 flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#8b0000]" />
              <span>Exportar Histórico de Rastreio</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Baixe o arquivo de texto sempre atualizado com data, hora, técnico, função e ações.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                id="btn-download-txt-admin"
                type="button"
                disabled={downloading || logs.length === 0}
                onClick={handleDownloadTxt}
                className="py-2.5 px-3 bg-[#8b0000] hover:bg-[#720000] active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{downloading ? 'Baixando...' : 'Baixar .TXT'}</span>
              </button>

              <button
                id="btn-download-csv-admin"
                type="button"
                disabled={logs.length === 0}
                onClick={handleDownloadCsv}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilha .CSV</span>
              </button>
            </div>
          </div>

          {/* Barra de Busca e Filtro */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Registros Recentes ({filteredLogs.length})</span>
              </span>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold p-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8b0000]' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail, ação..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-hidden focus:border-[#8b0000]"
                />
              </div>

              <div className="relative">
                <select
                  value={filterCargo}
                  onChange={(e) => setFilterCargo(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold outline-hidden focus:border-[#8b0000] cursor-pointer"
                >
                  <option value="todos">Todos Cargos</option>
                  <option value="Controle de Qualidade">Qualidade</option>
                  <option value="Liderança">Liderança</option>
                  <option value="Supervisão">Supervisão</option>
                  <option value="Gerência">Gerência</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
            {loading && logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                Carregando registros do servidor...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-8 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-400 font-medium">
                Nenhum registro encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-2.5 text-xs flex flex-col gap-1 shadow-2xs transition-all"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-bold text-slate-800 truncate text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8b0000]"></span>
                      <span>{log.nome}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {log.dataHora}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[190px] text-slate-600 font-medium">
                      {log.email}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md shrink-0">
                      {log.cargo}
                    </span>
                  </div>

                  <div className="pt-1 mt-0.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#8b0000] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {log.acao}
                    </span>
                    {log.dispositivo && (
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Smartphone className="w-3 h-3" />
                        {log.dispositivo}
                      </span>
                    )}
                  </div>

                  {log.detalhes && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-md mt-0.5 border border-slate-100/80">
                      {log.detalhes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ABA DE OPERADORES CADASTRADOS & GESTÃO DE SENHAS */}
      {tab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-snug">
            <p className="font-bold mb-0.5">Operadores com Acesso Cadastrado</p>
            <p className="text-[11px] text-blue-700">
              Cada operador cria sua senha pessoal no primeiro acesso ao aplicativo. Se alguém esquecer, você pode redefinir a senha abaixo.
            </p>
          </div>

          {resetSuccessMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
            {usersList.length === 0 ? (
              <div className="py-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Nenhum operador cadastrado ainda além do administrador.
              </div>
            ) : (
              usersList.map((usr: any) => (
                <div
                  key={usr.email}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="truncate max-w-[210px]">
                    <p className="font-bold text-slate-800 truncate">{usr.nome}</p>
                    <p className="text-[11px] text-slate-500 truncate">{usr.email}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded-md">
                      {usr.cargo}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(usr.email);
                      setNewPasswordInput('rtt2026');
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-300 flex items-center gap-1 transition-all shrink-0"
                  >
                    <KeyRound className="w-3 h-3 text-[#8b0000]" />
                    <span>Redefinir Senha</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Modal de Redefinição de Senha */}
          {resetModalUser && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col gap-2.5 mt-1 animate-fade-in">
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

      {/* ABA DE GESTÃO DE ADMINISTRADORES */}
      {tab === 'admins' && (
        <div className="flex flex-col gap-3">
          {/* Aviso informativo / Permissão */}
          {isSuperAdmin ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-slate-800">Super Administrador Master</span>
                <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-800 px-1.5 py-0.5 rounded-full">Exclusivo</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Você está autenticado como <strong>paulo.matos@rttshop.com.br</strong>. Apenas a sua conta possui autorização para conceder ou revogar o acesso de administrador a outros e-mails corporativos.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold text-slate-800 mb-0.5">Acesso de Administrador Delegado</p>
                <p className="text-slate-500">
                  Apenas o gestor principal <strong>paulo.matos@rttshop.com.br</strong> pode adicionar ou remover permissões de administradores.
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de Feedback de Ação */}
          {adminActionMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                adminActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {adminActionMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{adminActionMsg.text}</span>
            </div>
          )}

          {/* Formulário para Conceder Acesso Admin (Apenas Super Admin) */}
          {isSuperAdmin && (
            <form
              onSubmit={handleAddAdmin}
              className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col gap-2"
            >
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#8b0000]" />
                <span>Autorizar Novo Administrador</span>
              </span>
              <p className="text-[10px] text-slate-400">
                Informe o e-mail que passará a ter permissão para entrar na Área do Administrador usando a senha mestra configurada no sistema.
              </p>

              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="email"
                  required
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  placeholder="ex: lideranca@rttshop.com.br"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#8b0000] rounded-lg text-xs font-medium text-slate-800 outline-hidden transition-all"
                />
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-3 py-2 bg-[#8b0000] hover:bg-[#720000] active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{adminActionLoading ? 'Salvando...' : 'Conceder'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Lista de Administradores Autorizados */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              E-mails Autorizados ({adminsList.length})
            </span>

            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
              {adminsList.map((email) => {
                const isOwner = email.toLowerCase() === 'paulo.matos@rttshop.com.br';
                return (
                  <div
                    key={email}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isOwner ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOwner ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {email}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          {isOwner ? (
                            <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                              • Administrador Principal (Super Admin)
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              • Administrador Autorizado
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Revogar Permissão (Apenas Super Admin e não para si mesmo) */}
                    {isSuperAdmin && !isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(email)}
                        disabled={adminActionLoading}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shrink-0"
                        title="Revogar permissão de administrador"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Revogar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
        RTT Check • Sistema de Auditoria Interna REMA TIP TOP
      </div>
    </div>
  );
};
