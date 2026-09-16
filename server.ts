import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const TXT_LOG_PATH = path.join(DATA_DIR, 'rastreio_acessos.txt');
const JSON_LOG_PATH = path.join(DATA_DIR, 'logs.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const ADMINS_PATH = path.join(DATA_DIR, 'admins.json');
const EMAIL_EXCEPTIONS_PATH = path.join(DATA_DIR, 'email_exceptions.json');

// Extensões de e-mail corporativo aceitas por padrão
export const DEFAULT_ALLOWED_DOMAINS = ['@rttshop.com.br', '@rematiptop.com.br'];

function loadEmailExceptions(): string[] {
  try {
    if (fs.existsSync(EMAIL_EXCEPTIONS_PATH)) {
      const content = fs.readFileSync(EMAIL_EXCEPTIONS_PATH, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        return Array.from(new Set(list.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean)));
      }
    }
  } catch (err) {
    console.warn('Erro ao ler email_exceptions.json:', err);
  }
  return [];
}

function saveEmailExceptions(list: string[]): void {
  try {
    const unique = Array.from(new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean)));
    fs.writeFileSync(EMAIL_EXCEPTIONS_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar email_exceptions.json:', err);
  }
}

export function isEmailAllowed(email: string): { allowed: boolean; reason?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { allowed: false, reason: 'Informe um endereço de e-mail corporativo válido.' };
  }

  // 1. Checa os domínios corporativos padrão (@rttshop.com.br e @rematiptop.com.br)
  for (const domain of DEFAULT_ALLOWED_DOMAINS) {
    if (cleanEmail.endsWith(domain)) {
      return { allowed: true };
    }
  }

  // 2. Checa as exceções autorizadas pelo administrador
  const exceptions = loadEmailExceptions();
  for (const item of exceptions) {
    if (item.startsWith('@')) {
      if (cleanEmail.endsWith(item)) {
        return { allowed: true };
      }
    } else if (cleanEmail === item) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason:
      'Acesso restrito: O aplicativo aceita apenas e-mails corporativos @rttshop.com.br ou @rematiptop.com.br. Caso precise de acesso com outra extensão, solicite autorização ao Administrador.',
  };
}

// Garante que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializa o arquivo de texto se não existir
if (!fs.existsSync(TXT_LOG_PATH)) {
  const header = [
    '================================================================================',
    'RTT CHECK - RELATÓRIO DE AUDITORIA E RASTREIO DE ACESSOS ONLINE',
    'REMA TIP TOP Brasil - Controle de Qualidade',
    `Arquivo inicializado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    '================================================================================',
    '',
  ].join('\n');
  fs.writeFileSync(TXT_LOG_PATH, header, 'utf-8');
}

export interface StoredUser {
  email: string;
  nome: string;
  cargo: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
}

function loadUsers(): Record<string, StoredUser> {
  try {
    if (fs.existsSync(USERS_PATH)) {
      const content = fs.readFileSync(USERS_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Erro ao ler users.json:', err);
  }
  const defaults: Record<string, StoredUser> = {
    'paulo.matos@rttshop.com.br': {
      email: 'paulo.matos@rttshop.com.br',
      nome: 'Paulo Matos',
      cargo: 'Controle de Qualidade',
      passwordHash: 'rema2026',
      createdAt: new Date().toISOString(),
    },
  };
  saveUsers(defaults);
  return defaults;
}

function saveUsers(users: Record<string, StoredUser>): void {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar users.json:', err);
  }
}

export interface ServerAccessLog {
  id: string;
  dataHora: string;
  nome: string;
  email: string;
  cargo: string;
  acao: string;
  detalhes?: string;
  dispositivo?: string;
  ip?: string;
}

function loadLogs(): ServerAccessLog[] {
  try {
    if (fs.existsSync(JSON_LOG_PATH)) {
      const content = fs.readFileSync(JSON_LOG_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Erro ao ler logs.json:', err);
  }
  return [];
}

function saveLogs(logs: ServerAccessLog[]): void {
  try {
    fs.writeFileSync(JSON_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar logs.json:', err);
  }
}

function appendToTxtFile(entry: ServerAccessLog): void {
  try {
    const line = `[${entry.dataHora}] ${entry.acao.toUpperCase()} | Técnico: ${entry.nome} <${entry.email}> | Função: ${entry.cargo} | Disp: ${entry.dispositivo || 'N/A'}${entry.detalhes ? ` | Obs: ${entry.detalhes}` : ''}\n`;
    fs.appendFileSync(TXT_LOG_PATH, line, 'utf-8');
  } catch (err) {
    console.warn('Erro ao escrever no rastreio_acessos.txt:', err);
  }
}

// Super Administrador com permissão exclusiva de gerenciar outros administradores
export const SUPER_ADMIN_EMAIL = 'paulo.matos@rttshop.com.br';

function loadAdminEmails(): string[] {
  try {
    if (fs.existsSync(ADMINS_PATH)) {
      const content = fs.readFileSync(ADMINS_PATH, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        const unique = Array.from(new Set([SUPER_ADMIN_EMAIL, ...list.map((e: string) => String(e).trim().toLowerCase())]));
        return unique;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler admins.json:', err);
  }
  const initial = [SUPER_ADMIN_EMAIL];
  saveAdminEmails(initial);
  return initial;
}

function saveAdminEmails(list: string[]): void {
  try {
    const unique = Array.from(new Set([SUPER_ADMIN_EMAIL, ...list.map((e) => String(e).trim().toLowerCase())]));
    fs.writeFileSync(ADMINS_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar admins.json:', err);
  }
}

function getMasterPassword(): string {
  // Apenas a senha definida na variável de ambiente ADMIN_PASSWORD
  return (process.env.ADMIN_PASSWORD || 'Rema@2026#').trim();
}

function isValidAdminPassword(pass: string): boolean {
  const cleanPass = (pass || '').trim();
  const targetPass = getMasterPassword();
  return cleanPass === targetPass;
}

function isAuthorizedAdmin(email: string, pass: string): boolean {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!isValidAdminPassword(pass)) {
    return false;
  }
  const admins = loadAdminEmails();
  return admins.includes(cleanEmail);
}

function isSuperAdmin(email: string, pass: string): boolean {
  const cleanEmail = (email || '').trim().toLowerCase();
  return cleanEmail === SUPER_ADMIN_EMAIL && isValidAdminPassword(pass);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ROTA: Regras de e-mail corporativo e exceções
  app.get('/api/email-rules', (_req, res) => {
    res.json({
      defaultDomains: DEFAULT_ALLOWED_DOMAINS,
      exceptions: loadEmailExceptions(),
    });
  });

  // ROTA: Verificar status de cadastro de um e-mail (se já possui senha e função definida)
  app.get('/api/user/check', (req, res) => {
    const email = (req.query.email as string || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'E-mail obrigatório' });
      return;
    }

    const emailCheck = isEmailAllowed(email);
    const users = loadUsers();
    const user = users[email];

    if (user) {
      res.json({
        exists: true,
        allowed: true,
        nome: user.nome,
        cargo: user.cargo,
      });
    } else {
      res.json({
        exists: false,
        allowed: emailCheck.allowed,
        reason: emailCheck.reason,
      });
    }
  });

  // ROTA: Autenticação ou Primeiro Cadastro do Operador
  app.post('/api/user/auth', (req, res) => {
    try {
      const { email, password, nome, cargo } = req.body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();
      const cleanNome = (nome || '').trim();
      const cleanCargo = (cargo || 'Controle de Qualidade').trim();

      if (!cleanEmail) {
        res.status(400).json({ success: false, message: 'Informe o e-mail corporativo.' });
        return;
      }

      // Validação estrita de extensão de e-mail ou exceção autorizada
      const emailCheck = isEmailAllowed(cleanEmail);
      if (!emailCheck.allowed) {
        res.status(403).json({ success: false, message: emailCheck.reason });
        return;
      }

      if (!cleanPass || cleanPass.length < 4) {
        res.status(400).json({ success: false, message: 'A senha deve conter no mínimo 4 dígitos/caracteres.' });
        return;
      }

      const users = loadUsers();
      const existing = users[cleanEmail];

      if (existing) {
        // Usuário já cadastrado -> valida senha
        if (existing.passwordHash !== cleanPass) {
          res.status(401).json({ success: false, message: 'Senha incorreta para este e-mail corporativo.' });
          return;
        }
        // Atualiza apenas nome e último login.
        // A FUNÇÃO (CARGO) É TRAVADA A PARTIR DO CADASTRO: apenas o administrador pode alterar!
        existing.nome = cleanNome || existing.nome;
        existing.lastLoginAt = new Date().toISOString();
        users[cleanEmail] = existing;
        saveUsers(users);

        res.json({
          success: true,
          isNew: false,
          user: { email: cleanEmail, nome: existing.nome, cargo: existing.cargo },
        });
      } else {
        // Novo usuário -> cadastra dados e fixa a função inicial
        if (!cleanNome) {
          res.status(400).json({ success: false, message: 'Informe o nome do técnico para o primeiro acesso.' });
          return;
        }

        const newUser: StoredUser = {
          email: cleanEmail,
          nome: cleanNome,
          cargo: cleanCargo,
          passwordHash: cleanPass,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        users[cleanEmail] = newUser;
        saveUsers(users);

        // Registra evento especial de criação de senha
        const entry: ServerAccessLog = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
          nome: cleanNome,
          email: cleanEmail,
          cargo: cleanCargo,
          acao: 'NOVO CADASTRO DE SENHA',
          detalhes: 'Operador realizou o primeiro acesso e definiu sua senha pessoal',
          dispositivo: req.headers['user-agent'] || '',
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
        };
        appendToTxtFile(entry);
        const logs = loadLogs();
        logs.unshift(entry);
        saveLogs(logs);

        res.json({
          success: true,
          isNew: true,
          message: 'Senha cadastrada com sucesso! Bem-vindo(a) ao RTT Check.',
          user: { email: cleanEmail, nome: newUser.nome, cargo: newUser.cargo },
        });
      }
    } catch (err: any) {
      console.error('Erro em /api/user/auth:', err);
      res.status(500).json({ success: false, message: 'Erro interno ao autenticar usuário.' });
    }
  });

  // ROTA: Registrar evento de acesso/rastreio
  app.post('/api/logs', (req, res) => {
    try {
      const { nome, email, cargo, acao, detalhes, dispositivo } = req.body || {};
      
      const now = new Date();
      const dataHora = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      const entry: ServerAccessLog = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        dataHora,
        nome: (nome || 'Desconhecido').trim(),
        email: (email || 'sem-email').trim(),
        cargo: (cargo || 'Controle de Qualidade').trim(),
        acao: (acao || 'Acesso ao App').trim(),
        detalhes: detalhes ? String(detalhes).trim() : undefined,
        dispositivo: dispositivo ? String(dispositivo).trim() : undefined,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
      };

      // Adiciona ao arquivo de texto e ao banco JSON
      appendToTxtFile(entry);
      const logs = loadLogs();
      logs.unshift(entry); // Mais recente primeiro
      // Mantém até 5000 registros
      if (logs.length > 5000) logs.length = 5000;
      saveLogs(logs);

      res.status(200).json({ success: true, id: entry.id });
    } catch (err: any) {
      console.error('Erro em /api/logs:', err);
      res.status(500).json({ success: false, error: err?.message || 'Erro ao registrar log' });
    }
  });

  // ROTA: Verificar credenciais de administrador
  app.post('/api/admin/verify', (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!isValidAdminPassword(cleanPass)) {
      res.status(401).json({
        success: false,
        message: 'Senha de administrador incorreta. Verifique a senha configurada no sistema.',
      });
      return;
    }

    if (!isAuthorizedAdmin(cleanEmail, cleanPass)) {
      res.status(403).json({
        success: false,
        message: `Acesso negado. O e-mail ${cleanEmail || 'informado'} não está autorizado a acessar a Área do Administrador. Apenas paulo.matos@rttshop.com.br pode autorizar acessos.`,
      });
      return;
    }

    res.json({
      success: true,
      isSuperAdmin: cleanEmail === SUPER_ADMIN_EMAIL,
      message: 'Autenticado com sucesso no Painel Administrativo.',
    });
  });

  // ROTA: Listar administradores autorizados
  app.post('/api/admin/admins/list', (req, res) => {
    const { email, password } = req.body || {};
    if (!isAuthorizedAdmin(email, password)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const admins = loadAdminEmails();
    res.json({
      success: true,
      admins,
      isSuperAdmin: cleanEmail === SUPER_ADMIN_EMAIL,
      superAdminEmail: SUPER_ADMIN_EMAIL,
    });
  });

  // ROTA: Conceder permissão de administrador (Exclusivo paulo.matos@rttshop.com.br)
  app.post('/api/admin/admins/add', (req, res) => {
    const { superAdminEmail, superAdminPassword, newAdminEmail } = req.body || {};
    const cleanSuper = (superAdminEmail || '').trim().toLowerCase();
    const cleanTarget = (newAdminEmail || '').trim().toLowerCase();

    if (!isSuperAdmin(cleanSuper, superAdminPassword)) {
      res.status(403).json({
        success: false,
        message: 'Apenas o administrador principal (paulo.matos@rttshop.com.br) pode conceder permissões de administrador.',
      });
      return;
    }

    if (!cleanTarget || !cleanTarget.includes('@') || !cleanTarget.includes('.')) {
      res.status(400).json({ success: false, message: 'Informe um e-mail válido para conceder acesso.' });
      return;
    }

    const currentAdmins = loadAdminEmails();
    if (currentAdmins.includes(cleanTarget)) {
      res.status(400).json({ success: false, message: 'Este e-mail já possui permissão de administrador.' });
      return;
    }

    currentAdmins.push(cleanTarget);
    saveAdminEmails(currentAdmins);

    // Registra no arquivo de rastreio de auditoria
    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: 'Paulo Matos (Super Admin)',
      email: SUPER_ADMIN_EMAIL,
      cargo: 'Super Administrador',
      acao: 'CONCESSÃO DE ACESSO ADMIN',
      detalhes: `Novo administrador autorizado: ${cleanTarget}`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Permissão de administrador concedida com sucesso para ${cleanTarget}.`,
      admins: currentAdmins,
    });
  });

  // ROTA: Revogar permissão de administrador (Exclusivo paulo.matos@rttshop.com.br)
  app.post('/api/admin/admins/remove', (req, res) => {
    const { superAdminEmail, superAdminPassword, targetAdminEmail } = req.body || {};
    const cleanSuper = (superAdminEmail || '').trim().toLowerCase();
    const cleanTarget = (targetAdminEmail || '').trim().toLowerCase();

    if (!isSuperAdmin(cleanSuper, superAdminPassword)) {
      res.status(403).json({
        success: false,
        message: 'Apenas o administrador principal (paulo.matos@rttshop.com.br) pode revogar permissões de administrador.',
      });
      return;
    }

    if (cleanTarget === SUPER_ADMIN_EMAIL) {
      res.status(400).json({
        success: false,
        message: 'O e-mail principal paulo.matos@rttshop.com.br não pode ser removido da lista de administradores.',
      });
      return;
    }

    const currentAdmins = loadAdminEmails();
    const filtered = currentAdmins.filter((e) => e !== cleanTarget);
    saveAdminEmails(filtered);

    // Registra no arquivo de rastreio de auditoria
    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: 'Paulo Matos (Super Admin)',
      email: SUPER_ADMIN_EMAIL,
      cargo: 'Super Administrador',
      acao: 'REVOGAÇÃO DE ACESSO ADMIN',
      detalhes: `Acesso revogado do e-mail: ${cleanTarget}`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Acesso de administrador revogado de ${cleanTarget}.`,
      admins: filtered,
    });
  });

  // ROTA: Consultar histórico de acessos (apenas Admin)
  app.post('/api/admin/logs', (req, res) => {
    const { email, password } = req.body || {};
    if (!isAuthorizedAdmin(email, password)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }

    const logs = loadLogs();
    const users = loadUsers();
    let txtPreview = '';
    try {
      if (fs.existsSync(TXT_LOG_PATH)) {
        txtPreview = fs.readFileSync(TXT_LOG_PATH, 'utf-8');
      }
    } catch (e) {
      console.warn('Erro ao ler TXT_LOG_PATH:', e);
    }

    res.json({
      success: true,
      total: logs.length,
      usersCount: Object.keys(users).length,
      usersList: Object.values(users).map((u) => ({
        email: u.email,
        nome: u.nome,
        cargo: u.cargo,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      logs,
      txtPreview,
    });
  });

  // ROTA: Redefinir senha de um operador (Admin)
  app.post('/api/admin/reset-operator-password', (req, res) => {
    const { adminEmail, adminPassword, targetEmail, newPassword } = req.body || {};
    if (!isAuthorizedAdmin(adminEmail, adminPassword)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const cleanTarget = (targetEmail || '').trim().toLowerCase();
    const users = loadUsers();
    if (!users[cleanTarget]) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      return;
    }
    users[cleanTarget].passwordHash = (newPassword || 'rtt2026').trim();
    saveUsers(users);
    res.json({
      success: true,
      message: `Senha do usuário ${cleanTarget} redefinida com sucesso para "${newPassword || 'rtt2026'}".`,
    });
  });

  // ROTA: Alterar Função (Cargo) do Operador (Exclusivo Admin)
  app.post('/api/admin/update-operator-cargo', (req, res) => {
    const { adminEmail, adminPassword, targetEmail, newCargo } = req.body || {};
    if (!isAuthorizedAdmin(adminEmail, adminPassword)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const cleanTarget = (targetEmail || '').trim().toLowerCase();
    const cleanCargo = (newCargo || '').trim();

    if (!cleanCargo) {
      res.status(400).json({ success: false, message: 'Selecione ou informe a nova função/cargo.' });
      return;
    }

    const users = loadUsers();
    if (!users[cleanTarget]) {
      res.status(404).json({ success: false, message: 'Operador não encontrado no sistema.' });
      return;
    }

    const oldCargo = users[cleanTarget].cargo;
    users[cleanTarget].cargo = cleanCargo;
    saveUsers(users);

    // Registra no rastreio de auditoria
    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: adminEmail,
      email: adminEmail,
      cargo: 'Administrador',
      acao: 'ALTERAÇÃO DE FUNÇÃO DE OPERADOR',
      detalhes: `Função de ${cleanTarget} (${users[cleanTarget].nome}) alterada de "${oldCargo}" para "${cleanCargo}"`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Função de ${users[cleanTarget].nome} atualizada para "${cleanCargo}" com sucesso.`,
      user: {
        email: cleanTarget,
        nome: users[cleanTarget].nome,
        cargo: cleanCargo,
      },
    });
  });

  // ROTA: Cadastrar Novo Operador Diretamente pelo Admin
  app.post('/api/admin/create-operator', (req, res) => {
    const { adminEmail, adminPassword, email, nome, cargo, password } = req.body || {};
    if (!isAuthorizedAdmin(adminEmail, adminPassword)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanNome = (nome || '').trim();
    const cleanCargo = (cargo || 'Controle de Qualidade').trim();
    const cleanPass = (password || 'rema2026').trim();

    if (!cleanEmail || !cleanNome) {
      res.status(400).json({ success: false, message: 'Preencha o e-mail e o nome completo do operador.' });
      return;
    }

    const check = isEmailAllowed(cleanEmail);
    if (!check.allowed) {
      res.status(400).json({ success: false, message: check.reason });
      return;
    }

    const users = loadUsers();
    if (users[cleanEmail]) {
      res.status(400).json({ success: false, message: 'Este operador já está cadastrado no sistema.' });
      return;
    }

    const newUser: StoredUser = {
      email: cleanEmail,
      nome: cleanNome,
      cargo: cleanCargo,
      passwordHash: cleanPass,
      createdAt: new Date().toISOString(),
      lastLoginAt: undefined,
    };
    users[cleanEmail] = newUser;
    saveUsers(users);

    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: adminEmail,
      email: adminEmail,
      cargo: 'Administrador',
      acao: 'CADASTRO DE OPERADOR PELO ADMIN',
      detalhes: `Novo operador pré-cadastrado: ${cleanNome} <${cleanEmail}> com a função "${cleanCargo}"`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Operador ${cleanNome} cadastrado com sucesso com a função "${cleanCargo}".`,
      user: { email: cleanEmail, nome: cleanNome, cargo: cleanCargo },
    });
  });

  // ROTA: Gerenciar Exceções de E-mail (Admin)
  app.post('/api/admin/email-exceptions/list', (req, res) => {
    const { email, password } = req.body || {};
    if (!isAuthorizedAdmin(email, password)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    res.json({
      success: true,
      defaultDomains: DEFAULT_ALLOWED_DOMAINS,
      exceptions: loadEmailExceptions(),
    });
  });

  app.post('/api/admin/email-exceptions/add', (req, res) => {
    const { adminEmail, adminPassword, exception } = req.body || {};
    if (!isAuthorizedAdmin(adminEmail, adminPassword)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const clean = (exception || '').trim().toLowerCase();
    if (!clean || (!clean.startsWith('@') && !clean.includes('@'))) {
      res.status(400).json({
        success: false,
        message: 'Informe um e-mail completo (ex: nome@empresa.com.br) ou uma extensão de domínio iniciando com @ (ex: @parceiro.com.br).',
      });
      return;
    }

    if (DEFAULT_ALLOWED_DOMAINS.includes(clean)) {
      res.status(400).json({ success: false, message: 'Este domínio já é aceito por padrão no aplicativo.' });
      return;
    }

    const current = loadEmailExceptions();
    if (current.includes(clean)) {
      res.status(400).json({ success: false, message: 'Esta exceção já está na lista de autorizações.' });
      return;
    }

    current.push(clean);
    saveEmailExceptions(current);

    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: adminEmail,
      email: adminEmail,
      cargo: 'Administrador',
      acao: 'AUTORIZAÇÃO DE EXCEÇÃO DE E-MAIL',
      detalhes: `Exceção liberada pelo admin: ${clean}`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Exceção "${clean}" autorizada com sucesso!`,
      defaultDomains: DEFAULT_ALLOWED_DOMAINS,
      exceptions: current,
    });
  });

  app.post('/api/admin/email-exceptions/remove', (req, res) => {
    const { adminEmail, adminPassword, exception } = req.body || {};
    if (!isAuthorizedAdmin(adminEmail, adminPassword)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }
    const clean = (exception || '').trim().toLowerCase();
    const current = loadEmailExceptions();
    const filtered = current.filter((item) => item !== clean);
    saveEmailExceptions(filtered);

    const entry: ServerAccessLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: adminEmail,
      email: adminEmail,
      cargo: 'Administrador',
      acao: 'REMOÇÃO DE EXCEÇÃO DE E-MAIL',
      detalhes: `Exceção removida pelo admin: ${clean}`,
    };
    appendToTxtFile(entry);

    res.json({
      success: true,
      message: `Exceção "${clean}" removida com sucesso.`,
      defaultDomains: DEFAULT_ALLOWED_DOMAINS,
      exceptions: filtered,
    });
  });

  // ROTA: Download direto do arquivo rastreio_acessos.txt
  app.get('/api/admin/download-txt', (req, res) => {
    const email = req.query.email as string;
    const password = req.query.password as string;

    if (!isAuthorizedAdmin(email, password)) {
      res.status(401).send('Não autorizado. E-mail ou senha inválidos.');
      return;
    }

    if (!fs.existsSync(TXT_LOG_PATH)) {
      res.status(404).send('Arquivo de rastreio ainda não contém registros.');
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rastreio_acessos_rtt.txt"');
    const fileStream = fs.createReadStream(TXT_LOG_PATH);
    fileStream.pipe(res);
  });

  // ROTA: Limpar logs (Admin)
  app.post('/api/admin/clear-logs', (req, res) => {
    const { email, password } = req.body || {};
    if (!isAuthorizedAdmin(email, password)) {
      res.status(401).json({ success: false, message: 'Não autorizado.' });
      return;
    }

    saveLogs([]);
    const resetHeader = [
      '================================================================================',
      'RTT CHECK - RELATÓRIO DE AUDITORIA E RASTREIO DE ACESSOS ONLINE',
      'REMA TIP TOP Brasil - Controle de Qualidade',
      `Arquivo resetado por ${email} em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      '================================================================================',
      '',
    ].join('\n');
    fs.writeFileSync(TXT_LOG_PATH, resetHeader, 'utf-8');

    res.json({ success: true, message: 'Logs resetados com sucesso.' });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor RTT Check rodando na porta ${PORT}`);
  });
}

startServer();
