import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { GameAnalysis as GameAnalysisType, ScoreBreakdown } from '../utils/scoringEngine';
import { Game, Team } from '../types/nbaTypes';

interface GameAnalysisProps {
  analysis: GameAnalysisType;
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  onBack: () => void;
}

export function GameAnalysis({ analysis, game, homeTeam, awayTeam, onBack }: GameAnalysisProps) {

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium Confidence</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Low Confidence</Badge>;
    }
  };

  const renderTeamBreakdown = (teamName: string, breakdown: ScoreBreakdown[], totalScore: number, isBackToBack: boolean) => (
    <Card className="p-6 bg-slate-900/50 border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold text-white">{teamName}</h3>
          {isBackToBack && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <CalendarClock className="w-4 h-4 mr-1" />
              Back-to-Back
            </Badge>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400 mb-1">Total Research Score</div>
          <div className={`text-4xl font-bold ${totalScore >= 15 ? 'text-green-400' : totalScore >= 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {totalScore}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {breakdown.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              item.triggered
                ? 'bg-slate-800/50 border-slate-600/50'
                : 'bg-slate-900/30 border-slate-800/30 opacity-40'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {item.triggered ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex-shrink-0"></div>
              )}
              <div className="flex-1">
                <div className="font-medium text-white">{item.variableName}</div>
                {item.triggered && item.reason && (
                  <div className="text-sm text-slate-400 mt-1">{item.reason}</div>
                )}
              </div>
            </div>
            <div className={`text-lg font-bold px-3 py-1 rounded ${
              item.triggered
                ? item.points > 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                : 'text-slate-600'
            }`}>
              {item.points > 0 ? '+' : ''}{item.points}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderLast5Games = (teamName: string, team: typeof homeTeam) => (
    <Card className="p-6 bg-slate-900/50 border-slate-700/50">
      <h4 className="text-lg font-semibold text-white mb-4">
        {teamName} - Last 5 Games
      </h4>
      <div className="space-y-2">
        {team.last5Games.map((g: any, index: number) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              g.result === 'W' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <Badge className={g.result === 'W' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                {g.result}
              </Badge>
              <span className="text-white font-medium">
                {g.score} - {g.opponentScore}
              </span>
              <span className="text-slate-400 text-sm">
                vs {g.opponent}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={g.result === 'W' ? 'text-green-400' : 'text-red-400'}>
                {g.pointDifferential > 0 ? '+' : ''}{g.pointDifferential}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Game Analysis</h1>
              <p className="text-slate-400">{game.date} at {game.time}</p>
            </div>
            {getConfidenceBadge(analysis.recommendation.confidence)}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="text-center p-6 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2">Away</div>
              <div className="text-2xl font-bold text-white mb-2">
                {awayTeam.city} {awayTeam.name}
              </div>
              <div className="text-slate-400 mb-4">
                {awayTeam.wins}-{awayTeam.losses} ({(awayTeam.winPercentage * 100).toFixed(1)}%)
              </div>
              <div className={`text-5xl font-bold ${
                analysis.awayAnalysis.totalScore >= 15 ? 'text-green-400' :
                analysis.awayAnalysis.totalScore >= 10 ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {analysis.awayAnalysis.totalScore}
              </div>
              <div className="text-sm text-slate-400 mt-2">Research Score</div>
            </div>

            <div className="text-center p-6 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2">Home</div>
              <div className="text-2xl font-bold text-white mb-2">
                {homeTeam.city} {homeTeam.name}
              </div>
              <div className="text-slate-400 mb-4">
                {homeTeam.wins}-{homeTeam.losses} ({(homeTeam.winPercentage * 100).toFixed(1)}%)
              </div>
              <div className={`text-5xl font-bold ${
                analysis.homeAnalysis.totalScore >= 15 ? 'text-green-400' :
                analysis.homeAnalysis.totalScore >= 10 ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {analysis.homeAnalysis.totalScore}
              </div>
              <div className="text-sm text-slate-400 mt-2">Research Score</div>
            </div>
          </div>

          <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-2">
                  Recommendation - {analysis.recommendation.confidence.toUpperCase()} Confidence
                </h3>
                <p className="text-white leading-relaxed">{analysis.recommendation.reasoning}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderTeamBreakdown(
            `${awayTeam.city} ${awayTeam.name}`,
            analysis.awayAnalysis.breakdown,
            analysis.awayAnalysis.totalScore,
            game.awayBackToBack
          )}
          {renderTeamBreakdown(
            `${homeTeam.city} ${homeTeam.name}`,
            analysis.homeAnalysis.breakdown,
            analysis.homeAnalysis.totalScore,
            game.homeBackToBack
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderLast5Games(`${awayTeam.city} ${awayTeam.name}`, awayTeam)}
          {renderLast5Games(`${homeTeam.city} ${homeTeam.name}`, homeTeam)}
        </div>

        <Card className="p-6 bg-slate-900/50 border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Betting Lines</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-3">
                {awayTeam.city} {awayTeam.name}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-400">Spread</span>
                  <span className="text-white font-medium">
                    {game.spreadTeam === 'away' ? `-${game.spread}` : `+${game.spread}`}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-400">Moneyline</span>
                  <span className="text-white font-medium">
                    {game.awayMoneyline ? (game.awayMoneyline > 0 ? `+${game.awayMoneyline}` : game.awayMoneyline) : '-'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-3">
                {homeTeam.city} {homeTeam.name}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-400">Spread</span>
                  <span className="text-white font-medium">
                    {game.spreadTeam === 'home' ? `-${game.spread}` : `+${game.spread}`}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-800/50 rounded">
                  <span className="text-slate-400">Moneyline</span>
                  <span className="text-white font-medium">
                    {game.homeMoneyline ? (game.homeMoneyline > 0 ? `+${game.homeMoneyline}` : game.homeMoneyline) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
