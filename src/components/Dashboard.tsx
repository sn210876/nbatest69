import { useState, useEffect } from 'react';
import { analyzeGame, GameAnalysis } from '../utils/scoringEngine';
import { GameCard } from './GameCard';
import { Flame, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { fetchNBAData, refreshData, DataServiceResult } from '../services/dataService';
import { Team } from '../types/nbaTypes';
import { logGamePrediction } from '../services/historyService';

interface DashboardProps {
  onGameClick: (analysis: GameAnalysis) => void;
}

type GameAnalysisWithTeams = GameAnalysis & { homeTeam: Team; awayTeam: Team; game: any };

export function Dashboard({ onGameClick }: DashboardProps) {
  const [data, setData] = useState<DataServiceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameAnalyses, setGameAnalyses] = useState<GameAnalysisWithTeams[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Dashboard: Loading NBA data...');
      const result = await fetchNBAData();
      console.log('📊 Dashboard: Received result:', {
        gamesCount: result.games?.length || 0,
        teamsCount: Object.keys(result.teams || {}).length,
        error: result.error
      });
      setData(result);

      if (result.error) {
        console.error('❌ Dashboard: Error in result:', result.error);
        setError(result.error);
      }

      if (!result.games || result.games.length === 0) {
        console.warn('⚠️ Dashboard: No games found!');
        setGameAnalyses([]);
        setLoading(false);
        return;
      }

      console.log('📋 Dashboard: Processing', result.games.length, 'games...');

      const analyses = result.games.map(game => {
        let homeTeam = result.teams[game.homeTeam];
        let awayTeam = result.teams[game.awayTeam];

        if (!homeTeam) {
          console.warn('Missing home team data for game:', game.id, 'Creating fallback');
          homeTeam = {
            id: game.homeTeam,
            name: game.homeTeam,
            city: '',
            abbreviation: game.homeTeam,
            wins: 0,
            losses: 0,
            winPercentage: 0.5,
            streak: { type: 'W', count: 0 },
            avgPointsScored: 110,
            avgPointsAllowed: 110,
            pointsPerGame: 110,
            last5Games: [],
            homeRecord: { wins: 0, losses: 0 },
            awayRecord: { wins: 0, losses: 0 },
            currentStreak: { type: 'W', count: 0 }
          };
        }

        if (!awayTeam) {
          console.warn('Missing away team data for game:', game.id, 'Creating fallback');
          awayTeam = {
            id: game.awayTeam,
            name: game.awayTeam,
            city: '',
            abbreviation: game.awayTeam,
            wins: 0,
            losses: 0,
            winPercentage: 0.5,
            streak: { type: 'W', count: 0 },
            avgPointsScored: 110,
            avgPointsAllowed: 110,
            pointsPerGame: 110,
            last5Games: [],
            homeRecord: { wins: 0, losses: 0 },
            awayRecord: { wins: 0, losses: 0 },
            currentStreak: { type: 'W', count: 0 }
          };
        }

        const analysis = analyzeGame(
          game.id,
          homeTeam,
          awayTeam,
          game.homeBackToBack,
          game.awayBackToBack
        );

        return {
          ...analysis,
          game,
          homeTeam,
          awayTeam
        } as GameAnalysisWithTeams;
      });

      console.log('✅ Dashboard: Created', analyses.length, 'analyses');
      setGameAnalyses(analyses);

      console.log('💾 Auto-logging predictions to database...');
      for (const analysis of analyses) {
        await logGamePrediction(
          analysis.game,
          analysis,
          `${analysis.homeTeam.city} ${analysis.homeTeam.name}`,
          `${analysis.awayTeam.city} ${analysis.awayTeam.name}`
        );
      }
      console.log('✅ All predictions logged');
    } catch (err) {
      console.error('❌ Dashboard: Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      console.log('🏁 Dashboard: Loading complete, setting loading=false');
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      const result = await refreshData();
      setData(result);

      if (result.error) {
        setError(result.error);
      }

      const analyses = result.games.map(game => {
        const homeTeam = result.teams[game.homeTeam];
        const awayTeam = result.teams[game.awayTeam];
        const analysis = analyzeGame(
          game.id,
          homeTeam,
          awayTeam,
          game.homeBackToBack,
          game.awayBackToBack
        );
        return {
          ...analysis,
          game,
          homeTeam,
          awayTeam
        };
      });

      setGameAnalyses(analyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading NBA Data...</h2>
          <p className="text-slate-400">Fetching live data from ESPN API</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Data</h2>
          <Button onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  console.log('🎮 Dashboard Render: gameAnalyses =', gameAnalyses.length);

  const sortedGames = gameAnalyses
    .map(analysis => ({
      game: analysis.game,
      analysis
    }))
    .sort((a, b) => {
      const aMaxScore = Math.max(a.analysis.homeAnalysis.totalScore, a.analysis.awayAnalysis.totalScore);
      const bMaxScore = Math.max(b.analysis.homeAnalysis.totalScore, b.analysis.awayAnalysis.totalScore);
      return bMaxScore - aMaxScore;
    });

  console.log('🎮 Dashboard Render: sortedGames =', sortedGames.length);

  const bestBets = sortedGames.filter(({ analysis }) =>
    analysis && Math.abs(analysis.scoreDifferential) >= 10
  );

  console.log('🎮 Dashboard Render: bestBets =', bestBets.length);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                NBA Booky Sniper
              </h1>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                 size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white text-black border-white hover:bg-slate-100 hover:text-                        black"
>
  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
  Refresh
</Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400">
              Data-driven betting research powered by 13-variable scoring system
            </p>
            <div className="text-right">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Live ESPN Data
              </Badge>
              <p className="text-xs text-slate-500 mt-1">
                Updated: {data.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {error && (
            <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <AlertDescription className="text-yellow-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-400">High Confidence (15+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-400">Medium Confidence (10-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-slate-400">Low Confidence (&lt;10)</span>
            </div>
          </div>
        </div>

        {bestBets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-white">Best Bets Today</h2>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {bestBets.length} {bestBets.length === 1 ? 'game' : 'games'}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {bestBets.map(({ game, analysis }) => (
                <GameCard
                  key={game.id}
                  game={game}
                  homeTeam={analysis.homeTeam}
                  awayTeam={analysis.awayTeam}
                  analysis={analysis}
                  onClick={() => onGameClick(analysis)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            All Games Today
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            {sortedGames.length} games sorted by Research Score advantage
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {sortedGames.map(({ game, analysis }) => (
            <GameCard
              key={game.id}
              game={game}
              homeTeam={analysis.homeTeam}
              awayTeam={analysis.awayTeam}
              analysis={analysis}
              onClick={() => onGameClick(analysis)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
