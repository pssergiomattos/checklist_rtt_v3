import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { DewPointScreen } from './components/DewPointScreen';
import { ShellWearScreen } from './components/ShellWearScreen';
import { LoginScreen } from './components/LoginScreen';
import { AdminLogsScreen } from './components/AdminLogsScreen';
import { ScreenId, UserProfile } from './types';
import { getActiveUser, setActiveUser } from './utils/authStorage';
import { getAdminSession } from './utils/auditLogger';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getActiveUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [adminAuth, setAdminAuth] = useState<{ email: string; pass: string } | null>(() => getAdminSession());

  // Suporte à navegação do botão Voltar do Android / Navegador
  useEffect(() => {
    // Configurar estado inicial
    window.history.replaceState({ screen: 'home' }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setCurrentScreen(event.state.screen);
      } else {
        setCurrentScreen('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.history.pushState({ screen }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setActiveUser(null);
    setCurrentUser(null);
    setCurrentScreen('home');
  };

  const getScreenSubtitle = () => {
    switch (currentScreen) {
      case 'checklist':
        return 'Checklist de Inspeção';
      case 'orvalho':
        return 'Ponto de Orvalho';
      case 'carcaca':
        return 'Medição de Carcaça';
      case 'admin-logs':
        return 'Rastreio de Acessos';
      default:
        return 'Controle de Qualidade';
    }
  };

  const subtitle = getScreenSubtitle();

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-5">
      <div
        id="app-card-container"
        className="w-full max-w-[430px] bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/60 p-5 flex flex-col relative my-auto transition-all duration-200"
      >
        {!currentUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentScreen !== 'home' && (
              <Header
                currentScreen={currentScreen}
                onNavigate={navigateTo}
                subtitle={subtitle}
                currentUser={currentUser}
              />
            )}

            <div className="w-full">
              {currentScreen === 'home' && (
                <HomeScreen
                  onNavigate={navigateTo}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onOpenAdmin={(email, pass) => {
                    setAdminAuth({ email, pass });
                    navigateTo('admin-logs');
                  }}
                />
              )}
              {currentScreen === 'checklist' && (
                <ChecklistScreen
                  onNavigate={navigateTo}
                  currentUser={currentUser}
                />
              )}
              {currentScreen === 'orvalho' && (
                <DewPointScreen
                  onNavigate={navigateTo}
                  currentUser={currentUser}
                />
              )}
              {currentScreen === 'carcaca' && (
                <ShellWearScreen
                  onNavigate={navigateTo}
                  currentUser={currentUser}
                />
              )}
              {currentScreen === 'admin-logs' && adminAuth && (
                <AdminLogsScreen
                  adminEmail={adminAuth.email}
                  adminPass={adminAuth.pass}
                  onNavigate={navigateTo}
                />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
