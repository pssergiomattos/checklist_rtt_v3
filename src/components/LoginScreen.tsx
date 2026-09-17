import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  ArrowRight,
  UserCheck,
  Briefcase,
  ChevronDown,
  Lock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, CARGOS_DISPONIVEIS } from '../types';
import { getRecentUsers, setActiveUser } from '../utils/authStorage';
import { logAccessEvent, fetchEmailRules, checkUserRegistration } from '../utils/auditLogger';

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
  const [cargo, setCargo] = useState<string>('Controle de Qualidade');
  const [lembrar, setLembrar] = useState(true);
  const [recentUsers] = useState<UserProfile[]>(() => getRecentUsers());
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Regras de e-mail e exceções autorizadas
  const [defaultDomains, setDefaultDomains] = useState<string[]>([
    '@rttshop.com.br',
    '@rematiptop.com.br',
  ]);
  const [emailExceptions, setEmailExceptions] = useState<string[]>([]);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const checkTimerRef = useRef<any>(null);

  // Carrega regras de e-mail ao montar a tela
  useEffect(() => {
    let mounted = true;
    fetchEmailRules().then((rules) => {
      if (mounted) {
        if (rules.defaultDomains?.length) setDefaultDomains(rules.defaultDomains);
        if (rules.exceptions) setEmailExceptions(rules.exceptions);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Valida se o e-mail pertence aos domínios corporativos ou exceções
  const checkEmailAllowed = (cleanEmail: string): { allowed: boolean; isException: boolean } => {
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { allowed: false, isException: false };
    }

    // 1. Checa os domínios corporativos padrão
    for (const dom of defaultDomains) {
      if (cleanEmail.endsWith(dom)) {
        return { allowed: true, isException: false };
      }
    }

    // 2. Checa as exceções cadastradas pelo admin
    for (const exc of emailExceptions) {
      if (exc.startsWith('@')) {
        if (cleanEmail.endsWith(exc)) {
          return { allowed: true, isException: true };
        }
      } else if (cleanEmail === exc) {
        return { allowed: true, isException: true };
      }
    }

    return { allowed: false, isException: false };
  };

  // Quando o usuário digita o e-mail
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errorMsg) setErrorMsg('');

    const clean = val.trim().toLowerCase();
    const extracted = extractNameFromEmail(clean);
    setNome(extracted);

    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    if (!clean || !clean.includes('@')) {
      setEmailNotice(null);
      setIsExistingUser(false);
      setIsNewRegistration(false);
      return;
    }

    // Validação de extensão
    const { allowed, isException } = checkEmailAllowed(clean);

    if (!allowed) {
      setEmailNotice({
        type: 'error',
        text: 'Acesso restrito para este e-mail. Caso necessite de liberação, solicite ao Administrador.',
      });
      setIsExistingUser(false);
      setIsNewRegistration(false);
      return;
    }

    if (isException) {
      setEmailNotice({
        type: 'info',
        text: 'E-mail com exceção autorizada pelo Administrador.',
      });
    } else {
      setEmailNotice({
        type: 'success',
        text: 'E-mail corporativo válido.',
      });
    }

    // Consulta no servidor para identificar se o operador já tem cadastro
    setCheckingUser(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkUserRegistration(clean);
        if (res.exists) {
          setIsExistingUser(true);
          setIsNewRegistration(false);
          if (res.nome) setNome(res.nome);
          if (res.cargo) setCargo(res.cargo);
        } else {
          // NOVO USUÁRIO: apenas aqui a lista de função fica selecionável!
          setIsExistingUser(false);
          setIsNewRegistration(true);
        }
      } catch (err) {
        console.warn('Erro ao checar cadastro do operador:', err);
      } finally {
        setCheckingUser(false);
      }
    }, 350);
  };

  // Selecionar operador recente
  const handleSelectRecent = async (user: UserProfile) => {
    if (user.email) {
      const clean = user.email.trim().toLowerCase();
      setEmail(clean);
      const extracted = extractNameFromEmail(clean);
      setNome(user.nome || extracted);
      
      const { allowed, isException } = checkEmailAllowed(clean);
      if (!allowed) {
        setEmailNotice({
          type: 'error',
          text: 'Acesso restrito para este e-mail corporativo.',
        });
      } else if (isException) {
        setEmailNotice({
          type: 'info',
          text: 'E-mail com exceção autorizada pelo Administrador.',
        });
      } else {
        setEmailNotice({
          type: 'success',
          text: 'E-mail corporativo válido.',
        });
      }

      setCheckingUser(true);
      try {
        const res = await checkUserRegistration(clean);
        if (res.exists) {
          setIsExistingUser(true);
          setIsNewRegistration(false);
          if (res.nome) setNome(res.nome);
          if (res.cargo) setCargo(res.cargo);
        } else {
          setIsExistingUser(false);
          setIsNewRegistration(true);
          if (user.cargo) setCargo(user.cargo);
        }
      } catch {
        setIsExistingUser(true);
        setIsNewRegistration(false);
        if (user.cargo) setCargo(user.cargo);
      } finally {
        setCheckingUser(false);
      }
    } else {
      setNome(user.nome);
      if (user.cargo) setCargo(user.cargo);
      setIsExistingUser(true);
      setIsNewRegistration(false);
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Por favor, informe seu e-mail corporativo.');
      return;
    }

    const { allowed } = checkEmailAllowed(cleanEmail);
    if (!allowed) {
      setErrorMsg(
        'Acesso não autorizado para este e-mail. Caso necessite de liberação, solicite ao Administrador.'
      );
      return;
    }

    const cleanNome = nome.trim() || extractNameFromEmail(cleanEmail);
    if (!cleanNome) {
      setErrorMsg('Não foi possível identificar o nome a partir do e-mail. Ex: paulo.matos@rttshop.com.br');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { auth, db } = await import('../firebase');
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, getDoc, setDoc } = await import('firebase/firestore');

      const pass = 'rema' + new Date().getFullYear();
      let userRecord;
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        userRecord = userCred.user;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          userRecord = userCred.user;
        } else {
          throw err;
        }
      }

      const userRef = doc(db, 'userProfiles', cleanEmail);
      const userSnap = await getDoc(userRef);
      let finalCargo = cargo.trim() || 'Controle de Qualidade';
      let finalNome = cleanNome;

      if (userSnap.exists()) {
        const data = userSnap.data();
        finalCargo = data.cargo || finalCargo;
        finalNome = data.nome || finalNome;
        await setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
      } else {
        await setDoc(userRef, {
          nome: finalNome,
          cargo: finalCargo,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      }

      const finalUser: UserProfile = { nome: finalNome, email: cleanEmail, cargo: finalCargo };

      if (lembrar) {
        setActiveUser(finalUser);
      }

      logAccessEvent('Login no App', finalUser, isExistingUser ? 'Operador Cadastrado' : 'Primeiro Acesso');
      onLoginSuccess(finalUser);
    } catch (err: any) {
      console.warn('Erro ao autenticar online, operando com perfil local:', err);
      // Fallback gracioso caso o servidor esteja inacessível
      const fallbackUser: UserProfile = {
        nome: cleanNome,
        email: cleanEmail,
        cargo: cargo.trim() || 'Controle de Qualidade',
      };
      if (lembrar) {
        setActiveUser(fallbackUser);
      }
      logAccessEvent('Login no App', fallbackUser, 'Acesso offline');
      onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const isEmailAllowedStatus = checkEmailAllowed(email.trim().toLowerCase()).allowed;

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
      <p className="text-xs font-bold text-slate-500 mb-5 tracking-wide uppercase">
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1º Campo: E-mail Corporativo (SEM os domínios ao lado) */}
          <div>
            <label
              htmlFor="input-login-email"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              E-mail Corporativo <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-login-email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Informe seu e-mail corporativo"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden transition-all"
                autoFocus
              />
            </div>

            {/* Alerta de Validação */}
            {emailNotice && (
              <div
                className={`mt-1.5 p-2 rounded-lg text-[11px] font-medium flex items-start gap-1.5 ${
                  emailNotice.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : emailNotice.type === 'info'
                    ? 'bg-blue-50 border border-blue-200 text-blue-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {emailNotice.type === 'error' && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                )}
                {emailNotice.type === 'info' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                )}
                {emailNotice.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{emailNotice.text}</span>
              </div>
            )}
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

          {/* 3º Campo: Função / Setor - BLOQUEADA POR PADRÃO, SELECIONÁVEL APENAS NO ATO DE NOVO CADASTRO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor={isNewRegistration ? 'select-login-cargo' : 'select-login-cargo-locked'}
                className="block text-xs font-bold text-slate-700"
              >
                Função / Setor <span className="text-red-600">*</span>
              </label>
              {isNewRegistration ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Novo Cadastro
                </span>
              ) : isExistingUser ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Cadastro Corporativo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  Bloqueado
                </span>
              )}
            </div>

            {isNewRegistration ? (
              // SELECIONÁVEL APENAS NO ATO DE CADASTRO DE NOVO USUÁRIO
              <div className="relative animate-fade-in">
                <Briefcase className="w-4 h-4 text-[#8b0000] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-login-cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-emerald-600/70 rounded-lg text-sm text-slate-800 font-bold focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-hidden transition-all appearance-none cursor-pointer shadow-2xs"
                >
                  {CARGOS_DISPONIVEIS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              // MOSTRA A LISTA BLOQUEADA (NÃO SELECIONÁVEL) EM QUALQUER OUTRO CASO
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-login-cargo-locked"
                  value={cargo}
                  disabled
                  tabIndex={-1}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-bold outline-hidden appearance-none cursor-not-allowed select-none opacity-90 shadow-2xs"
                >
                  {CARGOS_DISPONIVEIS.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Aviso sobre permissão de alteração de função */}
            <div className="mt-1.5 text-[10px] text-slate-500 leading-tight">
              {isNewRegistration ? (
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  Novo operador detectado: selecione sua função oficial no ato do cadastro.
                </span>
              ) : isExistingUser ? (
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  Função identificada no seu cadastro corporativo. Apenas o administrador pode alterá-la.
                </span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  Lista bloqueada. Ficará selecionável apenas no ato de cadastro de novo usuário.
                </span>
              )}
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
            disabled={loading || (Boolean(email) && !isEmailAllowedStatus)}
            className={`w-full mt-2 py-3.5 px-4 text-white font-bold text-sm tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150 ${
              loading || (Boolean(email) && !isEmailAllowedStatus)
                ? 'bg-slate-400 cursor-not-allowed opacity-75'
                : 'bg-[#8b0000] hover:bg-[#720000] active:bg-[#5a0000] active:scale-[0.98] shadow-red-950/20'
            }`}
          >
            {loading ? (
              <span>VALIDANDO ACESSO...</span>
            ) : (
              <>
                <span>ACESSAR O APP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
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
