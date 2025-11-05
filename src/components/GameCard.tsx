import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { CalendarClock, TrendingDown, TrendingUp, Flame } from 'lucide-react';
import { Team, Game } from '../types/nbaTypes';
import { GameAnalysis } from '../utils/scoringEngine';

interface GameCardProps {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  analysis: GameAnalysis;
  onClick: () => void;
}

export function GameCard({ game, homeTeam, awayTeam, analysis, onClick }: GameCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-green-400';
    if (score >= 10) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 15) return 'bg-green-500/20 border-green-500/30';
    if (score >= 10) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-gray-500/20 border-gray-500/30';
  };

  const formatMoneyline = (moneyline: number) => {
    return moneyline > 0 ? `+${moneyline}` : moneyline.toString();
  };

  const getSpreadDisplay = () => {
    if (game.spreadTeam === 'home') {
      return {
        home: `-${game.spread}`,
        away: `+${game.spread}`
      };
    } else {
      return {
        home: `+${game.spread}`,
        away: `-${game.spread}`
      };
    }
  };

  const spreadDisplay = getSpreadDisplay();

  return (
    <Card
      className="p-6 bg-slate-900/50 border-slate-700/50 hover:border-orange-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/10"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">{game.time}</span>
        {Math.abs(analysis.scoreDifferential) >= 10 && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Flame className="w-3 h-3 mr-1" />
            Best Bet
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">
                  {awayTeam.city ? `${awayTeam.city} ${awayTeam.name}` : awayTeam.name}
                </span>
                {game.awayBackToBack && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    <CalendarClock className="w-3 h-3 mr-1" />
                    B2B
                  </Badge>
                )}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {awayTeam.wins}-{awayTeam.losses} ({(awayTeam.winPercentage * 100).toFixed(1)}%)
              </div>
              <div className="flex gap-2 mt-1 text-xs text-slate-500">
                <span>{spreadDisplay.away}</span>
                <span>|</span>
                <span>{game.awayMoneyline ? formatMoneyline(game.awayMoneyline) : '-'}</span>
              </div>
            </div>
          </div>

          <div className={`px-6 py-3 rounded-lg border-2 ${getScoreBgColor(analysis.awayAnalysis.totalScore)}`}>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Research Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.awayAnalysis.totalScore)}`}>
                {analysis.awayAnalysis.totalScore}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    {homeTeam.city ? `${homeTeam.city} ${homeTeam.name}` : homeTeam.name}
                  </span>
                  {game.homeBackToBack && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      <CalendarClock className="w-3 h-3 mr-1" />
                      B2B
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {homeTeam.wins}-{homeTeam.losses} ({(homeTeam.winPercentage * 100).toFixed(1)}%)
                </div>
                <div className="flex gap-2 mt-1 text-xs text-slate-500">
                  <span>{spreadDisplay.home}</span>
                  <span>|</span>
                  <span>{game.homeMoneyline ? formatMoneyline(game.homeMoneyline) : '-'}</span>
                </div>
              </div>
            </div>

            <div className={`px-6 py-3 rounded-lg border-2 ${getScoreBgColor(analysis.homeAnalysis.totalScore)}`}>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Research Score</div>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.homeAnalysis.totalScore)}`}>
                  {analysis.homeAnalysis.totalScore}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {analysis.scoreDifferential > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Edge: Home (+{analysis.scoreDifferential})</span>
              </>
            ) : analysis.scoreDifferential < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-slate-300">Edge: Away (+{Math.abs(analysis.scoreDifferential)})</span>
              </>
            ) : (
              <span className="text-slate-400">Even Match</span>
            )}
          </div>
          <span className="text-orange-400 hover:text-orange-300 transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </Card>
  );
}
