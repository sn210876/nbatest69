export interface Team {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  winPercentage: number;
  streak: {
    type: 'W' | 'L';
    count: number;
  };
  avgPointsScored: number;
  avgPointsAllowed: number;
  last5Games: Array<{
    opponent: string;
    result: 'W' | 'L';
    score: number;
    opponentScore: number;
    pointDifferential: number;
    wasFavorite?: boolean;
  }>;
  lastGameClose?: boolean;
  seasonAverage?: number;
  pointsPerGame?: number;
  homeRecord?: { wins: number; losses: number };
  awayRecord?: { wins: number; losses: number };
  currentStreak?: { type: 'W' | 'L'; count: number };
}

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  homeBackToBack: boolean;
  awayBackToBack: boolean;
  spread?: number;
  spreadTeam?: string;
  awayMoneyline?: number;
  homeMoneyline?: number;
}
