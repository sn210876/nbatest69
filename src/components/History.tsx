import { useState, useEffect } from 'react';
import { fetchHistory, calculateAccuracyStats, loadTestData, HistoryRecord, AccuracyStats } from '../services/historyService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, TrendingUp, CheckCircle, XCircle, Calendar, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function History() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [selectedGame, setSelectedGame] = useState<HistoryRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        fetchHistory(100),
        calculateAccuracyStats()
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleLoadTestData() {
    setLoadingTestData(true);
    try {
      await loadTestData();
      await loadData();
    } catch (error) {
      console.error('Error loading test data:', error);
    } finally {
      setLoadingTestData(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading History...</h2>
          <p className="text-slate-400">Fetching prediction records</p>
        </div>
      </div>
    );
  }

  const groupedByDate = history.reduce((acc, record) => {
    const date = record.game_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, HistoryRecord[]>);

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const groupedByMonth = dates.reduce((acc, date) => {
    const monthKey = date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(date);
    return acc;
  }, {} as Record<string, string[]>);

  const months = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  if (!selectedMonth && months.length > 0) {
    setSelectedMonth(months[0]);
  }

  const currentMonthDates = selectedMonth ? groupedByMonth[selectedMonth] || [] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Prediction History
              </h1>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadTestData}
                disabled={loadingTestData}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                <Database className={`w-4 h-4 mr-2 ${loadingTestData ? 'animate-pulse' : ''}`} />
                <span className="font-bold text-black">Load Test Data</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="font-bold text-black">Refresh</span>
              </Button>
            </div>
          </div>
          <p className="text-slate-400">
            Track research score accuracy and analyze historical predictions
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Total Predictions</CardDescription>
                <CardTitle className="text-3xl text-white">{stats.totalPredictions}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Completed Games</CardDescription>
                <CardTitle className="text-3xl text-white">{stats.completedGames}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Overall Accuracy</CardDescription>
                <CardTitle className="text-3xl text-green-400">
                  {stats.accuracyRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Correct Picks</CardDescription>
                <CardTitle className="text-3xl text-white">
                  {stats.correctPredictions}/{stats.completedGames}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {stats && stats.completedGames > 0 && (
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Accuracy by Confidence Level</CardTitle>
              <CardDescription className="text-slate-400">
                Confidence based on Research Score differential: High (15+), Medium (10-14), Low (&lt;10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">High Confidence</p>
                    <p className="text-2xl font-bold text-green-400">
                      {stats.highConfidenceAccuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Medium Confidence</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {stats.mediumConfidenceAccuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Low Confidence</p>
                    <p className="text-2xl font-bold text-gray-400">
                      {stats.lowConfidenceAccuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {months.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No predictions logged yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Click "Load Test Data" or wait for today's games to be analyzed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-slate-400">Select Month:</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {months.map(month => {
                    const monthDate = new Date(month + '-01');
                    return (
                      <SelectItem key={month} value={month} className="hover:bg-slate-800">
                        {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue={currentMonthDates[0] || 'none'} className="w-full">
              <TabsList className="bg-slate-900 border-slate-800 mb-6 flex-wrap h-auto">
                {currentMonthDates.length === 0 ? (
                  <TabsTrigger value="none" className="data-[state=active]:bg-slate-800">
                    No Games This Month
                  </TabsTrigger>
                ) : (
                  currentMonthDates.map(date => (
                    <TabsTrigger
                      key={date}
                      value={date}
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TabsTrigger>
                  ))
                )}
              </TabsList>

              {currentMonthDates.length === 0 ? (
                <TabsContent value="none">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-12 text-center">
                      <p className="text-slate-400">No games for this month</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              ) : (
                currentMonthDates.map(date => (
                  <TabsContent key={date} value={date}>
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h2>
                      <p className="text-slate-400">
                        {groupedByDate[date].length} game{groupedByDate[date].length !== 1 ? 's' : ''} on this date
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {groupedByDate[date].map(record => (
                        <HistoryGameCard key={record.id} record={record} onClick={() => setSelectedGame(record)} />
                      ))}
                    </div>
                  </TabsContent>
                ))
              )}
            </Tabs>
          </div>
        )}

        <Dialog open={selectedGame !== null} onOpenChange={(open) => !open && setSelectedGame(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedGame && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {selectedGame.away_team_name} @ {selectedGame.home_team_name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {new Date(selectedGame.game_date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                      {selectedGame.away_team_name} (Away)
                    </h3>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-center mb-4">
                        <p className="text-sm text-slate-400">Research Score</p>
                        <p className="text-4xl font-bold text-orange-400">{selectedGame.away_research_score}</p>
                      </div>
                      {selectedGame.away_analysis_breakdown && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-300 mb-2">Score Breakdown:</p>
                          {selectedGame.away_analysis_breakdown.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                              <span className="text-slate-300">{item.variable}</span>
                              <span className={`font-semibold ${item.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.points > 0 ? '+' : ''}{item.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                      {selectedGame.home_team_name} (Home)
                    </h3>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-center mb-4">
                        <p className="text-sm text-slate-400">Research Score</p>
                        <p className="text-4xl font-bold text-orange-400">{selectedGame.home_research_score}</p>
                      </div>
                      {selectedGame.home_analysis_breakdown && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-300 mb-2">Score Breakdown:</p>
                          {selectedGame.home_analysis_breakdown.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                              <span className="text-slate-300">{item.variable}</span>
                              <span className={`font-semibold ${item.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.points > 0 ? '+' : ''}{item.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedGame.game_completed && (
                  <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                    <h3 className="text-lg font-bold mb-2">Final Result</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-slate-400">{selectedGame.away_team_name}</p>
                        <p className="text-3xl font-bold">{selectedGame.away_final_score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl text-slate-500">-</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-400">{selectedGame.home_team_name}</p>
                        <p className="text-3xl font-bold">{selectedGame.home_final_score}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedGame.prediction_correct !== null && (
                          selectedGame.prediction_correct ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="w-12 h-12 text-green-500" />
                              <p className="text-sm font-bold text-green-500">CORRECT</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <XCircle className="w-12 h-12 text-red-500" />
                              <p className="text-sm font-bold text-red-500">INCORRECT</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function HistoryGameCard({ record, onClick }: { record: HistoryRecord; onClick: () => void }) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPredictionText = () => {
    if (record.prediction === 'neutral') return 'No Clear Edge';
    const teamName = record.prediction === 'home' ? record.home_team_name : record.away_team_name;
    return teamName;
  };

  return (
    <Card
      className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              <div className="flex-1 text-right">
                <p className="text-xs text-slate-500 mb-1">AWAY</p>
                <p className="text-lg font-bold text-white mb-1">{record.away_team_name}</p>
                <div className="flex items-center justify-end gap-2">
                  <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-400">Research Score</p>
                    <p className="text-2xl font-bold text-orange-400">{record.away_research_score}</p>
                  </div>
                  {record.game_completed && (
                    <div className="bg-slate-800/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-400">Final</p>
                      <p className="text-2xl font-bold text-slate-300">{record.away_final_score}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center px-4 flex flex-col items-center gap-2">
                <p className="text-lg text-slate-500 font-bold">VS</p>
                <Badge className={getConfidenceColor(record.prediction_confidence)}>
                  {record.prediction_confidence.toUpperCase()}
                </Badge>
                <div className="text-xs text-slate-400">
                  Diff: <span className={`font-semibold ${
                    record.score_differential > 0 ? 'text-green-400' :
                    record.score_differential < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {record.score_differential > 0 ? '+' : ''}{record.score_differential}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">HOME</p>
                <p className="text-lg font-bold text-white mb-1">{record.home_team_name}</p>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-400">Research Score</p>
                    <p className="text-2xl font-bold text-orange-400">{record.home_research_score}</p>
                  </div>
                  {record.game_completed && (
                    <div className="bg-slate-800/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-400">Final</p>
                      <p className="text-2xl font-bold text-slate-300">{record.home_final_score}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {record.game_completed && record.prediction_correct !== null && (
            <div className="flex flex-col items-center gap-2">
              {record.prediction_correct ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-500" />
                  <p className="text-xs font-bold text-green-500">CORRECT</p>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10 text-red-500" />
                  <p className="text-xs font-bold text-red-500">INCORRECT</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-400">Predicted Winner: </span>
            <span className="text-white font-semibold">{getPredictionText()}</span>
          </div>

          {!record.game_completed && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Game Pending
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
