import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { fetchCompleteGameData, EnrichedGame } from '../services/dataService';

export function TestESPN() {
  const [games, setGames] = useState<EnrichedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('🎯 Test ESPN component mounted');
  }, []);

  const testFetchData = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);

    addLog('🚀 Starting ESPN API test...');

    try {
      addLog('📡 Calling fetchCompleteGameData()...');
      const enrichedGames = await fetchCompleteGameData();

      addLog(`✅ SUCCESS! Received ${enrichedGames.length} games`);
      setGames(enrichedGames);

      enrichedGames.forEach((game, index) => {
        addLog(`\n📊 Game ${index + 1}: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);
        addLog(`   📅 Date: ${new Date(game.date).toLocaleString()}`);
        addLog(`   ⏰ Time: ${game.time}`);
        addLog(`   📈 Status: ${game.status}`);
        addLog(`   🏠 Home (${game.homeTeam.abbreviation}): ${game.homeTeam.record}`);
        addLog(`      - Season Avg: ${game.homeTeam.seasonAverage} pts`);
        addLog(`      - Streak: ${game.homeTeam.streak.type}${game.homeTeam.streak.count}`);
        addLog(`      - Back-to-Back: ${game.homeTeam.isBackToBack ? 'YES ⚠️' : 'NO'}`);
        addLog(`      - Last Game Close: ${game.homeTeam.lastGameClose ? 'YES' : 'NO'}`);
        addLog(`      - Recent Games: ${game.homeTeam.recentGames.length} loaded`);
        addLog(`   ✈️ Away (${game.awayTeam.abbreviation}): ${game.awayTeam.record}`);
        addLog(`      - Season Avg: ${game.awayTeam.seasonAverage} pts`);
        addLog(`      - Streak: ${game.awayTeam.streak.type}${game.awayTeam.streak.count}`);
        addLog(`      - Back-to-Back: ${game.awayTeam.isBackToBack ? 'YES ⚠️' : 'NO'}`);
        addLog(`      - Last Game Close: ${game.awayTeam.lastGameClose ? 'YES' : 'NO'}`);
        addLog(`      - Recent Games: ${game.awayTeam.recentGames.length} loaded`);
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`❌ ERROR: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
      addLog('✅ Test complete!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-400 mb-2">
            ESPN API Integration Test
          </h1>
          <p className="text-slate-400">
            Test the comprehensive ESPN API integration with real NBA data
          </p>
        </div>

        <div className="mb-6">
          <Button
            onClick={testFetchData}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-500"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Fetching Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Test ESPN API
              </>
            )}
          </Button>
        </div>

        {error && (
          <Card className="p-6 bg-red-500/10 border-red-500/30 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">Error</h3>
                <p className="text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-900/50 border-slate-700/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Console Logs
            </h2>
            <div className="bg-slate-950 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-500">No logs yet. Click "Test ESPN API" to start.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-slate-300 mb-1 whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700/50">
            <h2 className="text-xl font-bold mb-4">
              Games Found: {games.length}
            </h2>
            <div className="space-y-3">
              {games.map((game, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        Game {index + 1}
                      </Badge>
                      <span className="text-sm text-slate-400">{game.time}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {game.awayTeam.name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {game.awayTeam.record}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2 items-center">
                          <Badge className={`text-xs ${
                            game.awayTeam.streak.type === 'W'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {game.awayTeam.streak.type}{game.awayTeam.streak.count}
                          </Badge>
                          {game.awayTeam.isBackToBack && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              B2B
                            </Badge>
                          )}
                          {game.awayTeam.lastGameClose && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {game.awayTeam.seasonAverage} ppg
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-700/50 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">
                            {game.homeTeam.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {game.homeTeam.record}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 items-center">
                            <Badge className={`text-xs ${
                              game.homeTeam.streak.type === 'W'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {game.homeTeam.streak.type}{game.homeTeam.streak.count}
                            </Badge>
                            {game.homeTeam.isBackToBack && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                B2B
                              </Badge>
                            )}
                            {game.homeTeam.lastGameClose && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {game.homeTeam.seasonAverage} ppg
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6 bg-slate-900/50 border-slate-700/50">
          <h2 className="text-xl font-bold mb-4">What This Test Does</h2>
          <div className="space-y-2 text-slate-300">
            <p>✅ Fetches today's NBA games from ESPN API</p>
            <p>✅ Fetches yesterday's games for back-to-back detection</p>
            <p>✅ Retrieves last 10 games for each team</p>
            <p>✅ Calculates current win/loss streaks</p>
            <p>✅ Determines season scoring averages</p>
            <p>✅ Identifies close games (within 5 points)</p>
            <p>✅ Flags teams playing back-to-back</p>
            <p>✅ All data logged to browser console with detailed emojis</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
