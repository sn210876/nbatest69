import { Team } from '../types/nbaTypes';

export interface ScoringVariable {
  id: string;
  name: string;
  description: string;
  points: number;
  category: 'performance' | 'situation' | 'streak' | 'opponent';
}

export const scoringVariables: ScoringVariable[] = [
  {
    id: 'closeGame',
    name: 'Close Game Yesterday',
    description: "Yesterday's game was within 5 points",
    points: 3,
    category: 'performance'
  },
  {
    id: 'favoriteLost',
    name: 'Favorite Lost',
    description: 'Favorite lost last game',
    points: 5,
    category: 'performance'
  },
  {
    id: 'favoriteWon',
    name: 'Favorite Won',
    description: 'Favorite won last game',
    points: 2,
    category: 'performance'
  },
  {
    id: 'homeGame',
    name: 'Home Game',
    description: 'Playing at home',
    points: 3,
    category: 'situation'
  },
  {
    id: 'awayGame',
    name: 'Away Game',
    description: 'Playing away',
    points: -2,
    category: 'situation'
  },
  {
    id: 'scoredOver',
    name: 'Scored Over Average',
    description: 'Scored over season average last game',
    points: 2,
    category: 'performance'
  },
  {
    id: 'scoredUnder',
    name: 'Scored Under Average',
    description: 'Scored under season average last game',
    points: -2,
    category: 'performance'
  },
  {
    id: 'lost2',
    name: '2-Game Losing Streak',
    description: 'Lost 2 games in a row',
    points: 4,
    category: 'streak'
  },
  {
    id: 'lost3Plus',
    name: '3+ Game Losing Streak',
    description: 'Lost 3 or more games in a row',
    points: 6,
    category: 'streak'
  },
  {
    id: 'opponentUnder',
    name: 'Weak Opponent',
    description: 'Opponent is under .500',
    points: 3,
    category: 'opponent'
  },
  {
    id: 'opponentOver',
    name: 'Strong Opponent',
    description: 'Opponent is over .500',
    points: -1,
    category: 'opponent'
  },
  {
    id: 'backToBack',
    name: 'Back-to-Back Game',
    description: 'Team is on a back-to-back',
    points: -4,
    category: 'situation'
  },
  {
    id: 'opponentBackToBack',
    name: 'Opponent Back-to-Back',
    description: 'Opponent is on a back-to-back',
    points: 4,
    category: 'situation'
  }
];

export interface ScoreBreakdown {
  variableId: string;
  variableName: string;
  points: number;
  triggered: boolean;
  reason?: string;
}

export interface TeamAnalysis {
  teamId: string;
  totalScore: number;
  breakdown: ScoreBreakdown[];
  confidence: 'high' | 'medium' | 'low';
}

export interface GameAnalysis {
  gameId: string;
  homeAnalysis: TeamAnalysis;
  awayAnalysis: TeamAnalysis;
  scoreDifferential: number;
  recommendation: {
    team: 'home' | 'away' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  game?: any;
  homeTeam?: Team;
  awayTeam?: Team;
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

export function calculateTeamScore(
  team: Team,
  isHome: boolean,
  opponent: Team,
  teamBackToBack: boolean,
  opponentBackToBack: boolean
): TeamAnalysis {
  const breakdown: ScoreBreakdown[] = [];
  let totalScore = 0;

  console.log(`   📝 ${team.abbreviation}: last5Games count = ${team.last5Games?.length || 0}`);

  const lastGame = team.last5Games?.[0];

  if (!lastGame) {
    console.warn(`   ⚠️ ${team.abbreviation}: No last5Games data, returning minimal score`);
    return {
      teamId: team.id,
      totalScore: isHome ? 3 : -2,
      breakdown: [],
      confidence: 'low'
    };
  }

  const closeGame: ScoreBreakdown = {
    variableId: 'closeGame',
    variableName: 'Close Game Yesterday',
    points: 3,
    triggered: false
  };
  if (lastGame.score !== undefined && lastGame.opponentScore !== undefined &&
      Math.abs(lastGame.score - lastGame.opponentScore) <= 5) {
    closeGame.triggered = true;
    closeGame.reason = `Last game: ${lastGame.score}-${lastGame.opponentScore}`;
    totalScore += 3;
  }
  breakdown.push(closeGame);

  const favoriteLost: ScoreBreakdown = {
    variableId: 'favoriteLost',
    variableName: 'Favorite Lost',
    points: 5,
    triggered: false
  };
  if (lastGame.wasFavorite && lastGame.result === 'L') {
    favoriteLost.triggered = true;
    favoriteLost.reason = `Lost as favorite: ${lastGame.score}-${lastGame.opponentScore}`;
    totalScore += 5;
  }
  breakdown.push(favoriteLost);

  const favoriteWon: ScoreBreakdown = {
    variableId: 'favoriteWon',
    variableName: 'Favorite Won',
    points: 2,
    triggered: false
  };
  if (lastGame.wasFavorite && lastGame.result === 'W') {
    favoriteWon.triggered = true;
    favoriteWon.reason = `Won as favorite: ${lastGame.score}-${lastGame.opponentScore}`;
    totalScore += 2;
  }
  breakdown.push(favoriteWon);

  const homeGame: ScoreBreakdown = {
    variableId: 'homeGame',
    variableName: 'Home Game',
    points: 3,
    triggered: false
  };
  if (isHome && team.homeRecord) {
    homeGame.triggered = true;
    homeGame.reason = `Home record: ${team.homeRecord.wins}-${team.homeRecord.losses}`;
    totalScore += 3;
  }
  breakdown.push(homeGame);

  const awayGame: ScoreBreakdown = {
    variableId: 'awayGame',
    variableName: 'Away Game',
    points: -2,
    triggered: false
  };
  if (!isHome && team.awayRecord) {
    awayGame.triggered = true;
    awayGame.reason = `Away record: ${team.awayRecord.wins}-${team.awayRecord.losses}`;
    totalScore -= 2;
  }
  breakdown.push(awayGame);

  const scoredOver: ScoreBreakdown = {
    variableId: 'scoredOver',
    variableName: 'Scored Over Average',
    points: 2,
    triggered: false
  };
  if (team.pointsPerGame && lastGame.score !== undefined && lastGame.score > team.pointsPerGame) {
    scoredOver.triggered = true;
    scoredOver.reason = `Scored ${lastGame.score} vs ${team.pointsPerGame.toFixed(1)} avg`;
    totalScore += 2;
  }
  breakdown.push(scoredOver);

  const scoredUnder: ScoreBreakdown = {
    variableId: 'scoredUnder',
    variableName: 'Scored Under Average',
    points: -2,
    triggered: false
  };
  if (team.pointsPerGame && lastGame.score !== undefined && lastGame.score < team.pointsPerGame) {
    scoredUnder.triggered = true;
    scoredUnder.reason = `Scored ${lastGame.score} vs ${team.pointsPerGame.toFixed(1)} avg`;
    totalScore -= 2;
  }
  breakdown.push(scoredUnder);

  const lost2: ScoreBreakdown = {
    variableId: 'lost2',
    variableName: '2-Game Losing Streak',
    points: 4,
    triggered: false
  };
  if (team.currentStreak && team.currentStreak.type === 'L' && team.currentStreak.count === 2) {
    lost2.triggered = true;
    lost2.reason = `Lost last 2 games`;
    totalScore += 4;
  }
  breakdown.push(lost2);

  const lost3Plus: ScoreBreakdown = {
    variableId: 'lost3Plus',
    variableName: '3+ Game Losing Streak',
    points: 6,
    triggered: false
  };
  if (team.currentStreak && team.currentStreak.type === 'L' && team.currentStreak.count >= 3) {
    lost3Plus.triggered = true;
    lost3Plus.reason = `Lost last ${team.currentStreak.count} games`;
    totalScore += 6;
  }
  breakdown.push(lost3Plus);

  const opponentUnder: ScoreBreakdown = {
    variableId: 'opponentUnder',
    variableName: 'Weak Opponent',
    points: 3,
    triggered: false
  };
  if (opponent.winPercentage < 0.500) {
    opponentUnder.triggered = true;
    opponentUnder.reason = `Opponent ${opponent.city} is ${opponent.wins}-${opponent.losses}`;
    totalScore += 3;
  }
  breakdown.push(opponentUnder);

  const opponentOver: ScoreBreakdown = {
    variableId: 'opponentOver',
    variableName: 'Strong Opponent',
    points: -1,
    triggered: false
  };
  if (opponent.winPercentage > 0.500) {
    opponentOver.triggered = true;
    opponentOver.reason = `Opponent ${opponent.city} is ${opponent.wins}-${opponent.losses}`;
    totalScore -= 1;
  }
  breakdown.push(opponentOver);

  const backToBack: ScoreBreakdown = {
    variableId: 'backToBack',
    variableName: 'Back-to-Back Game',
    points: -4,
    triggered: false
  };
  if (teamBackToBack) {
    backToBack.triggered = true;
    backToBack.reason = `Playing on consecutive days (fatigue factor)`;
    totalScore -= 4;
  }
  breakdown.push(backToBack);

  const opponentB2B: ScoreBreakdown = {
    variableId: 'opponentBackToBack',
    variableName: 'Opponent Back-to-Back',
    points: 4,
    triggered: false
  };
  if (opponentBackToBack) {
    opponentB2B.triggered = true;
    opponentB2B.reason = `Opponent playing on consecutive days`;
    totalScore += 4;
  }
  breakdown.push(opponentB2B);

  return {
    teamId: team.id,
    totalScore,
    breakdown,
    confidence: getConfidenceLevel(totalScore)
  };
}

export function analyzeGame(
  gameId: string,
  homeTeam: Team,
  awayTeam: Team,
  homeBackToBack: boolean,
  awayBackToBack: boolean
): GameAnalysis {
  console.log(`\n🎯 ANALYZING GAME: ${awayTeam.city} ${awayTeam.name} @ ${homeTeam.city} ${homeTeam.name}`);

  const homeAnalysis = calculateTeamScore(homeTeam, true, awayTeam, homeBackToBack, awayBackToBack);
  const awayAnalysis = calculateTeamScore(awayTeam, false, homeTeam, awayBackToBack, homeBackToBack);

  const scoreDifferential = homeAnalysis.totalScore - awayAnalysis.totalScore;

  console.log(`   🏠 ${homeTeam.abbreviation} Score: ${homeAnalysis.totalScore} points`);
  console.log(`   ✈️  ${awayTeam.abbreviation} Score: ${awayAnalysis.totalScore} points`);
  console.log(`   📊 Differential: ${scoreDifferential > 0 ? '+' : ''}${scoreDifferential}`);

  let recommendedTeam: 'home' | 'away' | 'neutral' = 'neutral';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reasoning = '';

  if (Math.abs(scoreDifferential) >= 10) {
    confidence = 'high';
    recommendedTeam = scoreDifferential > 0 ? 'home' : 'away';
    reasoning = `Strong ${Math.abs(scoreDifferential)}-point advantage in Research Score suggests ${recommendedTeam === 'home' ? homeTeam.city : awayTeam.city} ${recommendedTeam === 'home' ? homeTeam.name : awayTeam.name} has significantly better betting value.`;
  } else if (Math.abs(scoreDifferential) >= 5) {
    confidence = 'medium';
    recommendedTeam = scoreDifferential > 0 ? 'home' : 'away';
    reasoning = `Moderate ${Math.abs(scoreDifferential)}-point advantage suggests leaning toward ${recommendedTeam === 'home' ? homeTeam.city : awayTeam.city} ${recommendedTeam === 'home' ? homeTeam.name : awayTeam.name}.`;
  } else {
    confidence = 'low';
    reasoning = `Research Scores are close (${Math.abs(scoreDifferential)}-point difference). This game doesn't present a clear betting edge.`;
  }

  return {
    gameId,
    homeAnalysis,
    awayAnalysis,
    scoreDifferential,
    recommendation: {
      team: recommendedTeam,
      confidence,
      reasoning
    }
  };
}
