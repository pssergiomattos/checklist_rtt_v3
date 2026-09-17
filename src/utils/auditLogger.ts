import { AccessLogEntry, UserProfile } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

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

  saveLocalCachedLog(entry);

  try {
    await addDoc(collection(db, 'logs'), entry);
  } catch (err) {
    console.warn('Não foi possível sincronizar o log com o Firebase no momento:', err);
  }
}

export async function verifyAdminCredentials(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    const adminDoc = await getDoc(doc(db, 'config', 'admins'));
    let isSuper = email.toLowerCase() === 'paulo.matos@rttshop.com.br';
    let isAdmin = isSuper;
    
    if (adminDoc.exists()) {
      const list = adminDoc.data().list || [];
      if (list.includes(email.toLowerCase())) isAdmin = true;
    }
    
    if (!isAdmin) {
      await auth.signOut();
      return { success: false, message: 'Usuário não tem permissão de administrador.' };
    }

    if (isSuper && !adminDoc.exists()) {
      await setDoc(doc(db, 'config', 'admins'), { list: [email.toLowerCase()] });
    }

    return { success: true, isSuperAdmin: isSuper };
  } catch (err: any) {
    return { success: false, message: 'Credenciais inválidas ou erro de conexão.' };
  }
}

export async function fetchAdminList(email: string, password: string) {
  try {
    const adminDoc = await getDoc(doc(db, 'config', 'admins'));
    let admins = ['paulo.matos@rttshop.com.br'];
    if (adminDoc.exists()) {
      admins = adminDoc.data().list || admins;
    }
    return { success: true, admins, isSuperAdmin: email.toLowerCase() === 'paulo.matos@rttshop.com.br' };
  } catch (e) {
    return { success: false, admins: ['paulo.matos@rttshop.com.br'], isSuperAdmin: false };
  }
}

export async function addAdminEmail(superAdminEmail: string, superAdminPassword: string, newAdminEmail: string) {
  try {
    const adminDocRef = doc(db, 'config', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    let admins = ['paulo.matos@rttshop.com.br'];
    if (adminDoc.exists()) admins = adminDoc.data().list || admins;
    
    if (!admins.includes(newAdminEmail.toLowerCase())) {
      admins.push(newAdminEmail.toLowerCase());
      await setDoc(adminDocRef, { list: admins }, { merge: true });
    }
    return { success: true, message: 'Administrador adicionado.', admins };
  } catch (e) {
    return { success: false, message: 'Erro ao adicionar admin.' };
  }
}

export async function removeAdminEmail(superAdminEmail: string, superAdminPassword: string, targetAdminEmail: string) {
  try {
    const adminDocRef = doc(db, 'config', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    let admins = ['paulo.matos@rttshop.com.br'];
    if (adminDoc.exists()) admins = adminDoc.data().list || admins;
    
    admins = admins.filter(e => e !== targetAdminEmail.toLowerCase());
    await setDoc(adminDocRef, { list: admins }, { merge: true });
    
    return { success: true, message: 'Administrador removido.', admins };
  } catch (e) {
    return { success: false, message: 'Erro ao remover admin.' };
  }
}

export async function fetchEmailRules() {
  try {
    const rulesDoc = await getDoc(doc(db, 'config', 'emailRules'));
    if (rulesDoc.exists()) {
      return rulesDoc.data() as { defaultDomains: string[]; exceptions: string[] };
    } else {
      const defaultRules = { defaultDomains: ['@rttshop.com.br', '@rematiptop.com.br'], exceptions: [] };
      setDoc(doc(db, 'config', 'emailRules'), defaultRules).catch(() => {});
      return defaultRules;
    }
  } catch (e) {
    return { defaultDomains: ['@rttshop.com.br', '@rematiptop.com.br'], exceptions: [] };
  }
}

export async function addEmailException(adminEmail: string, adminPassword: string, exception: string) {
  try {
    const rulesDocRef = doc(db, 'config', 'emailRules');
    const rulesDoc = await getDoc(rulesDocRef);
    let exceptions: string[] = [];
    if (rulesDoc.exists()) exceptions = rulesDoc.data().exceptions || [];
    
    if (!exceptions.includes(exception.toLowerCase())) {
      exceptions.push(exception.toLowerCase());
      await setDoc(rulesDocRef, { exceptions }, { merge: true });
    }
    return { success: true, message: 'Exceção adicionada.', exceptions };
  } catch (e) {
    return { success: false, message: 'Erro ao adicionar exceção.' };
  }
}

export async function removeEmailException(adminEmail: string, adminPassword: string, exception: string) {
  try {
    const rulesDocRef = doc(db, 'config', 'emailRules');
    const rulesDoc = await getDoc(rulesDocRef);
    let exceptions: string[] = [];
    if (rulesDoc.exists()) exceptions = rulesDoc.data().exceptions || [];
    
    exceptions = exceptions.filter(e => e !== exception.toLowerCase());
    await setDoc(rulesDocRef, { exceptions }, { merge: true });
    
    return { success: true, message: 'Exceção removida.', exceptions };
  } catch (e) {
    return { success: false, message: 'Erro ao remover exceção.' };
  }
}

export async function updateOperatorCargo(adminEmail: string, adminPassword: string, targetEmail: string, newCargo: string) {
  try {
    const userRef = doc(db, 'userProfiles', targetEmail.toLowerCase());
    await setDoc(userRef, { cargo: newCargo }, { merge: true });
    return { success: true, message: 'Cargo atualizado com sucesso.' };
  } catch (e) {
    return { success: false, message: 'Erro ao atualizar cargo.' };
  }
}

export async function createOperatorByAdmin(adminEmail: string, adminPassword: string, userData: { email: string; nome: string; cargo: string; password?: string }) {
  try {
    const userRef = doc(db, 'userProfiles', userData.email.toLowerCase());
    const snap = await getDoc(userRef);
    if (snap.exists()) {
       return { success: false, message: 'Operador já cadastrado.' };
    }
    await setDoc(userRef, {
      nome: userData.nome,
      cargo: userData.cargo,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    return { success: true, message: 'Operador pré-cadastrado com sucesso.', user: userData };
  } catch (e) {
    return { success: false, message: 'Erro ao cadastrar operador.' };
  }
}

export async function removeOperatorByAdmin(adminEmail: string, adminPassword: string, targetEmail: string) {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'userProfiles', targetEmail.toLowerCase());
    await deleteDoc(userRef);
    return { success: true, message: 'Operador excluído com sucesso.' };
  } catch (e) {
    return { success: false, message: 'Erro ao excluir operador.' };
  }
}

export async function checkUserRegistration(email: string) {
  try {
    const userRef = doc(db, 'userProfiles', email.toLowerCase());
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return { exists: true, allowed: true, nome: data.nome, cargo: data.cargo };
    }
    return { exists: false, allowed: true };
  } catch (e) {
    return { exists: false, allowed: true };
  }
}

export async function fetchServerLogs(email: string, password: string) {
  try {
    const logsQuery = query(collection(db, 'logs'), orderBy('dataHora', 'desc'), limit(1000));
    const snapshot = await getDocs(logsQuery);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLogEntry));
    
    const usersQuery = query(collection(db, 'userProfiles'), limit(1000));
    const usersSnapshot = await getDocs(usersQuery);
    const usersList = usersSnapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));

    return { success: true, logs, usersList };
  } catch (e) {
    return { success: false, logs: getLocalCachedLogs(), usersList: [], message: 'Erro ao buscar dados.' };
  }
}

export async function sendResetPasswordEmail(targetEmail: string) {
  try {
    await sendPasswordResetEmail(auth, targetEmail.toLowerCase());
    return { success: true, message: `E-mail de redefinição enviado para ${targetEmail}.` };
  } catch (e) {
    return { success: false, message: 'Erro ao enviar e-mail de redefinição.' };
  }
}

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

export async function downloadLogsTxt(email: string, password: string, fallbackLogs: AccessLogEntry[] = []): Promise<void> {
  const logsToExport = fallbackLogs.length > 0 ? fallbackLogs : getLocalCachedLogs();
  const lines = [
    '================================================================================',
    'RTT CHECK - RELATÓRIO DE AUDITORIA E RASTREIO DE ACESSOS ONLINE (FIREBASE)',
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
