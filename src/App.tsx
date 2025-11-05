import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { GameAnalysis } from './components/GameAnalysis';
import { History } from './components/History';
import { GameAnalysis as GameAnalysisType } from './utils/scoringEngine';
import { Button } from './components/ui/button';
import { Home, History as HistoryIcon, TrendingUp } from 'lucide-react';

type View = 'dashboard' | 'analysis' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedGame, setSelectedGame] = useState<GameAnalysisType | null>(null);

  const handleGameClick = (analysis: GameAnalysisType) => {
    setSelectedGame(analysis);
    setCurrentView('analysis');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedGame(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold text-white">NBA Booky Sniper</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className={currentView === 'dashboard' ? 'bg-orange-500 hover:bg-orange-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('history')}
              className={currentView === 'history' ? 'bg-orange-500 hover:bg-orange-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </nav>

      {currentView === 'dashboard' && (
        <Dashboard onGameClick={handleGameClick} />
      )}

      {currentView === 'history' && (
        <History />
      )}

      {currentView === 'analysis' && selectedGame && selectedGame.game && selectedGame.homeTeam && selectedGame.awayTeam && (
        <GameAnalysis
          analysis={selectedGame}
          game={selectedGame.game}
          homeTeam={selectedGame.homeTeam}
          awayTeam={selectedGame.awayTeam}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default App;
