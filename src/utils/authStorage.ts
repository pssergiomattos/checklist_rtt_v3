import { UserProfile } from '../types';

const ACTIVE_USER_KEY = 'rtt_active_operator_v1';
const RECENT_USERS_KEY = 'rtt_recent_operators_v1';

const DEFAULT_USERS: UserProfile[] = [
  { nome: 'Paulo Matos', email: 'paulo.matos@rttshop.com.br', cargo: 'Controle de Qualidade' },
];

export function getActiveUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } else {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
      saveUserToHistory(user);
    }
  } catch (e) {
    console.warn('Erro ao salvar operador:', e);
  }
}

export function getRecentUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(RECENT_USERS_KEY);
    if (!raw) return DEFAULT_USERS;
    const list: UserProfile[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return DEFAULT_USERS;
    return list;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUserToHistory(user: UserProfile): void {
  try {
    const list = getRecentUsers();
    // Evita duplicatas pelo nome
    const filtered = list.filter((u) => u.nome.trim().toLowerCase() !== user.nome.trim().toLowerCase());
    const updated = [user, ...filtered].slice(0, 5); // guarda até 5 recentes
    localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao salvar histórico de operadores:', e);
  }
}
