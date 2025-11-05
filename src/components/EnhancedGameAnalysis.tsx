import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Home,
  Plane,
  TrendingUp,
  Trophy,
  BarChart3
} from 'lucide-react';
import { EnhancedGameAnalysis as GameAnalysisType } from '../services/enhancedDataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EnhancedGameAnalysisProps {
  analysis: GameAnalysisType;
  onBack: () => void;
}

export function EnhancedGameAnalysis({ analysis, onBack }: EnhancedGameAnalysisProps) {
  const { homeTeam, awayTeam, recommendation, spread } = analysis;

  const chartData = [
    {
      name: awayTeam.teamAbbr,
      score: awayTeam.totalScore,
      color: awayTeam.totalScore >= 15 ? '#4ade80' : awayTeam.totalScore >= 10 ? '#fbbf24' : '#94a3b8'
    },
    {
      name: homeTeam.teamAbbr,
      score: homeTeam.totalScore,
      color: homeTeam.totalScore >= 15 ? '#4ade80' : homeTeam.totalScore >= 10 ? '#fbbf24' : '#94a3b8'
    }
  ];

  const renderBreakdown = (team: typeof homeTeam | typeof awayTeam, isHome: boolean) => {
    const triggeredConditions = team.breakdown.filter(b => b.triggered);
    const untriggeredConditions = team.breakdown.filter(b => !b.triggered);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          {isHome ? (
            <Home className="w-6 h-6 text-orange-500" />
          ) : (
            <Plane className="w-6 h-6 text-blue-500" />
          )}
          <h3 className="text-2xl font-bold text-white">{team.teamName}</h3>
          <Badge className={`ml-auto text-lg ${
            team.confidence === 'high'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : team.confidence === 'medium'
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
          }`}>
            {team.totalScore} Points
          </Badge>
        </div>

        {/* Triggered Conditions */}
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Active Conditions ({triggeredConditions.length})
          </h4>
          <div className="space-y-2">
            {triggeredConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="font-semibold text-white">{condition.name}</span>
                  </div>
                  {condition.reason && (
                    <p className="text-sm text-slate-400 ml-6">{condition.reason}</p>
                  )}
                </div>
                <div className={`text-lg font-bold ml-4 ${
                  condition.points > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {condition.points > 0 ? '+' : ''}{condition.points}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Untriggered Conditions */}
        <div>
          <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Inactive Conditions ({untriggeredConditions.length})
          </h4>
          <div className="space-y-1">
            {untriggeredConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-slate-500 text-sm"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{condition.name}</span>
                </div>
                <span className="text-xs">
                  {condition.points > 0 ? '+' : ''}{condition.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Point Calculation */}
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Point Calculation:</h4>
          <div className="text-sm text-slate-400 space-y-1">
            {triggeredConditions.map((condition, index) => (
              <div key={index} className="flex justify-between">
                <span>{condition.name}</span>
                <span className={condition.points > 0 ? 'text-green-400' : 'text-red-400'}>
                  {condition.points > 0 ? '+' : ''}{condition.points}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-bold text-white">
              <span>Total Research Score:</span>
              <span className="text-orange-400">{team.totalScore}</span>
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">
                Detailed Analysis
              </h1>
              <p className="text-slate-400 text-lg">
                {analysis.time} • {analysis.status}
              </p>
            </div>
            {Math.abs(analysis.scoreDifferential) >= 10 && (
              <Badge className="text-lg bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500">
                <Trophy className="w-5 h-5 mr-2" />
                Best Bet
              </Badge>
            )}
          </div>

          {spread && (
            <Card className="p-4 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-400">Betting Line:</span>
                  <span className="ml-2 font-semibold text-white">
                    {spread.favorite === 'home' ? homeTeam.teamAbbr : awayTeam.teamAbbr} -{spread.line}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">{homeTeam.teamAbbr}:</span>
                    <span className="ml-1 font-semibold text-white">{spread.homeOdds > 0 ? '+' : ''}{spread.homeOdds}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{awayTeam.teamAbbr}:</span>
                    <span className="ml-1 font-semibold text-white">{spread.awayOdds > 0 ? '+' : ''}{spread.awayOdds}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Recommendation Card */}
        <Card className={`p-6 mb-8 ${
          recommendation.confidence === 'high'
            ? 'bg-green-500/10 border-green-500/30'
            : recommendation.confidence === 'medium'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-slate-500/10 border-slate-500/30'
        }`}>
          <div className="flex items-start gap-4">
            <TrendingUp className={`w-8 h-8 ${
              recommendation.confidence === 'high' ? 'text-green-400' :
              recommendation.confidence === 'medium' ? 'text-yellow-400' : 'text-slate-400'
            }`} />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {recommendation.team === 'neutral' ? 'No Clear Edge' : `Lean: ${
                  recommendation.team === 'home' ? homeTeam.teamName : awayTeam.teamName
                }`}
              </h3>
              <p className="text-slate-300">{recommendation.reasoning}</p>
              <div className="mt-3">
                <Badge className={
                  recommendation.confidence === 'high'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : recommendation.confidence === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }>
                  {recommendation.confidence.toUpperCase()} CONFIDENCE
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Score Comparison Chart */}
        <Card className="p-6 bg-slate-900/50 border-slate-700/50 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Research Score Comparison
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-slate-400">High (15+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-slate-400">Medium (10-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-400 rounded"></div>
              <span className="text-slate-400">Low (&lt;10)</span>
            </div>
          </div>
        </Card>

        {/* Team Breakdowns */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-900/50 border-slate-700/50">
            {renderBreakdown(awayTeam, false)}
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/50">
            {renderBreakdown(homeTeam, true)}
          </Card>
        </div>
      </div>
    </div>
  );
}
