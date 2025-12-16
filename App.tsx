import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);

  return (
    // Conditional styling:
    // - Dashboard needs 'h-screen overflow-hidden' to manage its own internal scrolling panels.
    // - Landing Page needs 'min-h-screen' (no overflow hidden) to let the window scroll naturally.
    <div className={`font-sans text-slate-900 bg-slate-50 ${appState === AppState.DASHBOARD ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {appState === AppState.LANDING && (
        <LandingPage onGetStarted={() => setAppState(AppState.AUTH)} />
      )}
      
      {appState === AppState.AUTH && (
        <AuthModal onSuccess={() => setAppState(AppState.DASHBOARD)} />
      )}
      
      {appState === AppState.DASHBOARD && (
        <Dashboard />
      )}
    </div>
  );
};

export default App;