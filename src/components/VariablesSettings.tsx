import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Target,
  Home,
  TrendingDown,
  Users,
  Info,
  TestTube,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { scoringVariables } from '../utils/scoringEngine';
import { testAllAPIs, APITestResult } from '../services/nbaApiService';

interface VariablesSettingsProps {
  onBack: () => void;
}

export function VariablesSettings({ onBack }: VariablesSettingsProps) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<APITestResult[] | null>(null);

  const handleTestAPIs = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const results = await testAllAPIs();
      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Target className="w-5 h-5 text-orange-400" />;
      case 'situation':
        return <Home className="w-5 h-5 text-blue-400" />;
      case 'streak':
        return <TrendingDown className="w-5 h-5 text-purple-400" />;
      case 'opponent':
        return <Users className="w-5 h-5 text-green-400" />;
      default:
        return <Target className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'situation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'streak':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'opponent':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const groupedVariables = scoringVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, typeof scoringVariables>);

  const categoryLabels: Record<string, string> = {
    performance: 'Performance Metrics',
    situation: 'Game Situation',
    streak: 'Momentum & Streaks',
    opponent: 'Opponent Analysis'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3">
            Research Scoring System
          </h1>
          <p className="text-slate-400 text-lg mb-6">
            Our proprietary 13-variable system analyzes key factors to generate Research Scores for each team
          </p>

          <Card className="p-6 bg-purple-500/10 border-purple-500/30 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <TestTube className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">API Connection Status</h3>
                  <p className="text-slate-300 mb-4">
                    Test the connection to ESPN API and The Odds API to verify real-time data integration.
                  </p>
                  <Button
                    onClick={handleTestAPIs}
                    disabled={testing}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing APIs...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test APIs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {testResults && (
              <div className="mt-6 space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                          {result.service}
                        </span>
                      </div>
                      <Badge className={result.success ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                        {result.success ? 'Connected' : 'Failed'}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{result.message}</p>
                    {result.gamesCount !== undefined && result.gamesCount > 0 && (
                      <p className="text-slate-400 text-xs">Found {result.gamesCount} games</p>
                    )}
                    {result.oddsCount !== undefined && result.oddsCount > 0 && (
                      <p className="text-slate-400 text-xs">Found odds for {result.oddsCount} games</p>
                    )}
                    {result.remainingQuota !== undefined && (
                      <p className="text-slate-400 text-xs mt-1">
                        API Quota: {result.remainingQuota}/500 requests remaining
                      </p>
                    )}
                    {result.error && (
                      <div className="mt-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-blue-500/10 border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">How It Works</h3>
                <p className="text-slate-300 leading-relaxed mb-3">
                  Each team receives a Research Score based on 13 data-driven variables. The system analyzes recent performance,
                  game situations, team momentum, and opponent strength to identify betting value.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span><strong className="text-green-400">High Confidence (15+):</strong> Strong betting edge identified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span><strong className="text-yellow-400">Medium Confidence (10-14):</strong> Moderate betting value</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span><strong className="text-gray-400">Low Confidence (&lt;10):</strong> Limited edge or avoid</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedVariables).map(([category, variables]) => (
            <Card key={category} className="p-6 bg-slate-900/50 border-slate-700/50">
              <div className="flex items-center gap-3 mb-6">
                {getCategoryIcon(category)}
                <h2 className="text-2xl font-bold text-white">
                  {categoryLabels[category] || category}
                </h2>
                <Badge className={getCategoryColor(category)}>
                  {variables.length} {variables.length === 1 ? 'variable' : 'variables'}
                </Badge>
              </div>

              <div className="space-y-3">
                {variables.map((variable) => (
                  <div
                    key={variable.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {variable.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {variable.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                        variable.points > 0
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {variable.points > 0 ? '+' : ''}{variable.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-slate-900/50 border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4">Score Interpretation</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Positive Scores</h3>
              <p className="text-slate-400">
                Variables with positive point values indicate factors that historically correlate with improved betting value and
                team performance. Higher scores suggest better opportunities.
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Negative Scores</h3>
              <p className="text-slate-400">
                Negative point values represent factors that may detract from a team's value proposition, such as playing
                on the road or being on a back-to-back schedule.
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Score Differential</h3>
              <p className="text-slate-400">
                The difference between two teams' Research Scores indicates the strength of betting value. A 10+ point
                differential represents our "Best Bets" with high confidence.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
