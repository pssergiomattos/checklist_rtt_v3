import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { DewPointScreen } from './components/DewPointScreen';
import { ShellWearScreen } from './components/ShellWearScreen';
import { ScreenId } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');

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

  const getScreenSubtitle = () => {
    switch (currentScreen) {
      case 'checklist':
        return 'Checklist de Inspeção';
      case 'orvalho':
        return 'Ponto de Orvalho';
      case 'carcaca':
        return 'Medição de Carcaça';
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
        {currentScreen !== 'home' && (
          <Header
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            subtitle={subtitle}
          />
        )}

        <div className="w-full">
          {currentScreen === 'home' && <HomeScreen onNavigate={navigateTo} />}
          {currentScreen === 'checklist' && (
            <ChecklistScreen onNavigate={navigateTo} />
          )}
          {currentScreen === 'orvalho' && (
            <DewPointScreen onNavigate={navigateTo} />
          )}
          {currentScreen === 'carcaca' && (
            <ShellWearScreen onNavigate={navigateTo} />
          )}
        </div>
      </div>
    </main>
  );
}
