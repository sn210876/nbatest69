import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Home,
  Plane,
  TrendingDown,
  AlertTriangle,
  Target,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { EnhancedGameAnalysis } from '../services/enhancedDataService';

interface EnhancedGameCardProps {
  analysis: EnhancedGameAnalysis;
  onClick: () => void;
}

export function EnhancedGameCard({ analysis, onClick }: EnhancedGameCardProps) {
  const { homeTeam, awayTeam, scoreDifferential, recommendation, spread } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 10) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      default: return 'Low Confidence';
    }
  };

  const getActiveConditions = (team: typeof homeTeam | typeof awayTeam) => {
    return team.breakdown.filter(b => b.triggered && b.points > 0);
  };

  const isBestBet = Math.abs(scoreDifferential) >= 10;

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
        isBestBet
          ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/50 shadow-lg shadow-orange-500/20'
          : 'bg-slate-900/50 border-slate-700/50 hover:border-orange-500/30'
      }`}
    >
      {isBestBet && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold flex items-center gap-1 rounded-bl-lg">
          <Trophy className="w-3 h-3" />
          BEST BET
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-slate-400">
            {analysis.time}
          </div>
          {spread && (
            <div className="text-xs text-slate-500">
              Spread: {spread.favorite === 'home' ? homeTeam.teamAbbr : awayTeam.teamAbbr} -{spread.line}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <Plane className="w-5 h-5 text-slate-500" />
              <div>
                <div className="text-lg font-bold text-white">{awayTeam.teamName}</div>
                <div className="text-sm text-slate-400">{awayTeam.teamAbbr}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(awayTeam.totalScore)}`}>
                {awayTeam.totalScore}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {getConfidenceText(awayTeam.confidence)}
              </div>
            </div>
          </div>

          {/* Active Conditions */}
          <div className="flex flex-wrap gap-1 ml-8">
            {getActiveConditions(awayTeam).slice(0, 3).map((condition, i) => (
              <Badge key={i} className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {condition.name} +{condition.points}
              </Badge>
            ))}
            {getActiveConditions(awayTeam).length > 3 && (
              <Badge className="text-xs bg-slate-500/20 text-slate-400">
                +{getActiveConditions(awayTeam).length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50 my-4"></div>

        {/* Home Team */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <Home className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-lg font-bold text-white">{homeTeam.teamName}</div>
                <div className="text-sm text-slate-400">{homeTeam.teamAbbr}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(homeTeam.totalScore)}`}>
                {homeTeam.totalScore}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {getConfidenceText(homeTeam.confidence)}
              </div>
            </div>
          </div>

          {/* Active Conditions */}
          <div className="flex flex-wrap gap-1 ml-8">
            {getActiveConditions(homeTeam).slice(0, 3).map((condition, i) => (
              <Badge key={i} className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {condition.name} +{condition.points}
              </Badge>
            ))}
            {getActiveConditions(homeTeam).length > 3 && (
              <Badge className="text-xs bg-slate-500/20 text-slate-400">
                +{getActiveConditions(homeTeam).length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Score Differential */}
        {Math.abs(scoreDifferential) >= 5 && (
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">
                  {recommendation.team === 'home' ? homeTeam.teamName : awayTeam.teamName} Edge
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-400">
                  +{Math.abs(scoreDifferential)}
                </span>
                <span className="text-xs text-slate-500">points</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{recommendation.reasoning}</p>
          </div>
        )}

        {/* Warning Icons */}
        <div className="mt-4 flex gap-2">
          {homeTeam.breakdown.find(b => b.id === 'backToBack' && b.triggered) && (
            <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {homeTeam.teamAbbr} B2B
            </Badge>
          )}
          {awayTeam.breakdown.find(b => b.id === 'backToBack' && b.triggered) && (
            <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {awayTeam.teamAbbr} B2B
            </Badge>
          )}
          {homeTeam.breakdown.find(b => b.id === 'lost3Plus' && b.triggered) && (
            <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
              <TrendingDown className="w-3 h-3 mr-1" />
              {homeTeam.teamAbbr} {homeTeam.breakdown.find(b => b.id === 'lost3Plus')?.reason?.match(/\d+/)?.[0]}L streak
            </Badge>
          )}
          {awayTeam.breakdown.find(b => b.id === 'lost3Plus' && b.triggered) && (
            <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
              <TrendingDown className="w-3 h-3 mr-1" />
              {awayTeam.teamAbbr} {awayTeam.breakdown.find(b => b.id === 'lost3Plus')?.reason?.match(/\d+/)?.[0]}L streak
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
