import { AccessLogEntry, UserProfile } from '../types';

const LOGS_STORAGE_KEY = 'rtt_audit_logs_cache_v1';
const ADMIN_AUTH_KEY = 'rtt_admin_session_v1';

export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Desconhecido';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android (Mobile)';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS (iPhone/iPad)';
  if (/windows/i.test(ua)) return 'Windows (PC)';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS (PC)';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Navegador Web';
}

export function getLocalCachedLogs(): AccessLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCachedLog(entry: AccessLogEntry): void {
  try {
    const list = getLocalCachedLogs();
    list.unshift(entry);
    if (list.length > 500) list.length = 500;
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar log local:', e);
  }
}

/**
 * Registra um evento de auditoria / rastreio no servidor e em cache local
 */
export async function logAccessEvent(
  acao: string,
  user: UserProfile,
  detalhes?: string
): Promise<void> {
  const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dispositivo = getDeviceInfo();

  const entry: AccessLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    dataHora,
    nome: user.nome || 'Técnico',
    email: user.email || 'sem-email',
    cargo: user.cargo || 'Controle de Qualidade',
    acao,
    detalhes,
    dispositivo,
  };

  // Salva no cache local imediatamente
  saveLocalCachedLog(entry);

  // Envia para o servidor Express em background
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    // Se estiver sem conexão ou rota falhar, o cache local já protegeu o registro
    console.warn('Não foi possível sincronizar o log com o servidor no momento:', err);
  }
}

/**
 * Verifica credenciais de Administrador
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string; isSuperAdmin?: boolean }> {
  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, isSuperAdmin: data.isSuperAdmin };
    }
    return { success: false, message: data.message || 'Credenciais inválidas.' };
  } catch (err: any) {
    return { success: false, message: 'Erro de conexão com o servidor de autenticação.' };
  }
}

/**
 * Busca lista de administradores autorizados
 */
export async function fetchAdminList(
  email: string,
  password: string
): Promise<{ success: boolean; admins: string[]; isSuperAdmin: boolean }> {
  try {
    const res = await fetch('/api/admin/admins/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, admins: data.admins || [], isSuperAdmin: !!data.isSuperAdmin };
    }
  } catch (e) {
    console.warn('Erro ao buscar lista de administradores:', e);
  }
  return {
    success: false,
    admins: ['paulo.matos@rttshop.com.br'],
    isSuperAdmin: email.trim().toLowerCase() === 'paulo.matos@rttshop.com.br',
  };
}

/**
 * Concede permissão de administrador a um novo e-mail (apenas Paulo Matos)
 */
export async function addAdminEmail(
  superAdminEmail: string,
  superAdminPassword: string,
  newAdminEmail: string
): Promise<{ success: boolean; message: string; admins?: string[] }> {
  try {
    const res = await fetch('/api/admin/admins/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superAdminEmail, superAdminPassword, newAdminEmail }),
    });
    const data = await res.json();
    return { success: !!data.success, message: data.message || '', admins: data.admins };
  } catch (e: any) {
    return { success: false, message: 'Erro de conexão com o servidor.' };
  }
}

/**
 * Revoga permissão de administrador de um e-mail (apenas Paulo Matos)
 */
export async function removeAdminEmail(
  superAdminEmail: string,
  superAdminPassword: string,
  targetAdminEmail: string
): Promise<{ success: boolean; message: string; admins?: string[] }> {
  try {
    const res = await fetch('/api/admin/admins/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superAdminEmail, superAdminPassword, targetAdminEmail }),
    });
    const data = await res.json();
    return { success: !!data.success, message: data.message || '', admins: data.admins };
  } catch (e: any) {
    return { success: false, message: 'Erro de conexão com o servidor.' };
  }
}

/**
 * Busca histórico completo de acessos do servidor
 */
export async function fetchServerLogs(
  email: string,
  password: string
): Promise<{ success: boolean; logs: AccessLogEntry[]; usersList?: any[]; txtPreview?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        logs: data.logs || [],
        usersList: data.usersList || [],
        txtPreview: data.txtPreview || '',
      };
    }
    return { success: false, logs: getLocalCachedLogs(), message: 'Não autorizado no servidor.' };
  } catch (err) {
    // Fallback para logs locais se servidor estiver offline
    return {
      success: true,
      logs: getLocalCachedLogs(),
      usersList: [],
      message: 'Exibindo logs locais salvos neste dispositivo (servidor offline).',
    };
  }
}

/**
 * Gera e dispara o download do arquivo .txt
 */
export function triggerTxtDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dispara o download oficial do rastreio_acessos.txt
 */
export async function downloadLogsTxt(
  email: string,
  password: string,
  fallbackLogs: AccessLogEntry[] = []
): Promise<void> {
  try {
    const downloadUrl = `/api/admin/download-txt?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(downloadUrl);
    if (res.ok) {
      const text = await res.text();
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerTxtDownload(`rastreio_acessos_rtt_${dateStr}.txt`, text);
      return;
    }
  } catch (e) {
    console.warn('Download direto falhou, gerando a partir dos logs disponíveis:', e);
  }

  // Geração de fallback caso o endpoint direto não responda
  const logsToExport = fallbackLogs.length > 0 ? fallbackLogs : getLocalCachedLogs();
  const lines = [
    '================================================================================',
    'RTT CHECK - RELATÓRIO DE AUDITORIA E RASTREIO DE ACESSOS ONLINE',
    'REMA TIP TOP Brasil - Controle de Qualidade',
    `Exportado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    `Total de Registros: ${logsToExport.length}`,
    '================================================================================',
    '',
    ...logsToExport.map(
      (entry) =>
        `[${entry.dataHora}] ${entry.acao.toUpperCase()} | Técnico: ${entry.nome} <${entry.email}> | Função: ${entry.cargo} | Disp: ${entry.dispositivo || 'N/A'}${entry.detalhes ? ` | Obs: ${entry.detalhes}` : ''}`
    ),
  ];

  const dateStr = new Date().toISOString().slice(0, 10);
  triggerTxtDownload(`rastreio_acessos_rtt_${dateStr}.txt`, lines.join('\n'));
}

/**
 * Dispara o download no formato .CSV para Excel ou Google Planilhas
 */
export function downloadLogsCsv(logs: AccessLogEntry[]): void {
  const headers = ['Data e Hora', 'Ação', 'Técnico', 'E-mail', 'Função / Setor', 'Dispositivo', 'Detalhes'];
  const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = logs.map((log) => [
    escapeCsv(log.dataHora),
    escapeCsv(log.acao),
    escapeCsv(log.nome),
    escapeCsv(log.email),
    escapeCsv(log.cargo),
    escapeCsv(log.dispositivo || ''),
    escapeCsv(log.detalhes || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `rastreio_acessos_rtt_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Armazenamento da sessão ativa de admin na memória do navegador
export function saveAdminSession(email: string, pass: string): void {
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ email, pass, ts: Date.now() }));
  } catch {}
}

export function getAdminSession(): { email: string; pass: string } | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {}
}
