import { fetchCompleteGameData, EnrichedGame } from './dataService';
import { fetchOddsAPI, OddsAPIResponse } from './nbaApiService';

export interface ResearchScoreBreakdown {
  id: string;
  name: string;
  points: number;
  triggered: boolean;
  reason?: string;
}

export interface TeamResearchScore {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  totalScore: number;
  confidence: 'high' | 'medium' | 'low';
  breakdown: ResearchScoreBreakdown[];
}

export interface EnhancedGameAnalysis {
  gameId: string;
  date: string;
  time: string;
  status: string;
  homeTeam: TeamResearchScore;
  awayTeam: TeamResearchScore;
  scoreDifferential: number;
  recommendation: {
    team: 'home' | 'away' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  spread?: {
    favorite: 'home' | 'away';
    line: number;
    homeOdds: number;
    awayOdds: number;
  };
}

function getConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

function getWinPercentage(record: string): number {
  const [wins, losses] = record.split('-').map(Number);
  return wins / (wins + losses) || 0;
}

function matchOddsToGame(game: EnrichedGame, oddsData: OddsAPIResponse[] | null) {
  if (!oddsData) return null;

  const homeTeamNorm = game.homeTeam.name.toLowerCase().replace(/\s+/g, '');
  const awayTeamNorm = game.awayTeam.name.toLowerCase().replace(/\s+/g, '');

  return oddsData.find(odds => {
    const oddsHomeNorm = odds.home_team.toLowerCase().replace(/\s+/g, '');
    const oddsAwayNorm = odds.away_team.toLowerCase().replace(/\s+/g, '');

    return (
      (homeTeamNorm.includes(oddsHomeNorm) || oddsHomeNorm.includes(homeTeamNorm)) &&
      (awayTeamNorm.includes(oddsAwayNorm) || oddsAwayNorm.includes(awayTeamNorm))
    );
  });
}

function calculateTeamResearchScore(
  team: EnrichedGame['homeTeam'] | EnrichedGame['awayTeam'],
  opponent: EnrichedGame['homeTeam'] | EnrichedGame['awayTeam'],
  isHome: boolean,
  _isFavorite: boolean,
  opponentBackToBack: boolean
): TeamResearchScore {
  const breakdown: ResearchScoreBreakdown[] = [];
  let totalScore = 0;

  // 1. Close Game Yesterday (+3)
  if (team.lastGameClose) {
    breakdown.push({
      id: 'closeGame',
      name: 'Close Game Yesterday',
      points: 3,
      triggered: true,
      reason: "Last game decided by 5 points or less"
    });
    totalScore += 3;
  } else {
    breakdown.push({
      id: 'closeGame',
      name: 'Close Game Yesterday',
      points: 3,
      triggered: false
    });
  }

  // 2 & 3. Favorite performance
  const lastGame = team.recentGames[team.recentGames.length - 1];
  if (lastGame) {
    const wasFavorite = lastGame.isHome; // Simplified: home team usually favorite

    if (wasFavorite && !lastGame.won) {
      breakdown.push({
        id: 'favoriteLost',
        name: 'Favorite Lost',
        points: 5,
        triggered: true,
        reason: `Lost as favorite ${lastGame.teamScore}-${lastGame.opponentScore}`
      });
      totalScore += 5;
    } else {
      breakdown.push({
        id: 'favoriteLost',
        name: 'Favorite Lost',
        points: 5,
        triggered: false
      });
    }

    if (wasFavorite && lastGame.won) {
      breakdown.push({
        id: 'favoriteWon',
        name: 'Favorite Won',
        points: 2,
        triggered: true,
        reason: `Won as favorite ${lastGame.teamScore}-${lastGame.opponentScore}`
      });
      totalScore += 2;
    } else {
      breakdown.push({
        id: 'favoriteWon',
        name: 'Favorite Won',
        points: 2,
        triggered: false
      });
    }
  }

  // 4 & 5. Home/Away
  if (isHome) {
    breakdown.push({
      id: 'homeGame',
      name: 'Home Game',
      points: 3,
      triggered: true,
      reason: `Playing at home (${team.record})`
    });
    totalScore += 3;
    breakdown.push({
      id: 'awayGame',
      name: 'Away Game',
      points: -2,
      triggered: false
    });
  } else {
    breakdown.push({
      id: 'homeGame',
      name: 'Home Game',
      points: 3,
      triggered: false
    });
    breakdown.push({
      id: 'awayGame',
      name: 'Away Game',
      points: -2,
      triggered: true,
      reason: `Playing on the road (${team.record})`
    });
    totalScore -= 2;
  }

  // 6 & 7. Scored over/under average
  if (lastGame) {
    if (lastGame.teamScore > team.seasonAverage) {
      breakdown.push({
        id: 'scoredOver',
        name: 'Scored Over Average',
        points: 2,
        triggered: true,
        reason: `Scored ${lastGame.teamScore} (avg: ${team.seasonAverage})`
      });
      totalScore += 2;
      breakdown.push({
        id: 'scoredUnder',
        name: 'Scored Under Average',
        points: -2,
        triggered: false
      });
    } else {
      breakdown.push({
        id: 'scoredOver',
        name: 'Scored Over Average',
        points: 2,
        triggered: false
      });
      breakdown.push({
        id: 'scoredUnder',
        name: 'Scored Under Average',
        points: -2,
        triggered: true,
        reason: `Scored ${lastGame.teamScore} (avg: ${team.seasonAverage})`
      });
      totalScore -= 2;
    }
  }

  // 8 & 9. Losing streak
  if (team.streak.type === 'L') {
    if (team.streak.count >= 3) {
      breakdown.push({
        id: 'lost3Plus',
        name: '3+ Game Losing Streak',
        points: 6,
        triggered: true,
        reason: `On ${team.streak.count}-game losing streak`
      });
      totalScore += 6;
      breakdown.push({
        id: 'lost2',
        name: '2-Game Losing Streak',
        points: 4,
        triggered: false
      });
    } else if (team.streak.count === 2) {
      breakdown.push({
        id: 'lost2',
        name: '2-Game Losing Streak',
        points: 4,
        triggered: true,
        reason: 'Lost last 2 games'
      });
      totalScore += 4;
      breakdown.push({
        id: 'lost3Plus',
        name: '3+ Game Losing Streak',
        points: 6,
        triggered: false
      });
    } else {
      breakdown.push({
        id: 'lost2',
        name: '2-Game Losing Streak',
        points: 4,
        triggered: false
      });
      breakdown.push({
        id: 'lost3Plus',
        name: '3+ Game Losing Streak',
        points: 6,
        triggered: false
      });
    }
  } else {
    breakdown.push({
      id: 'lost2',
      name: '2-Game Losing Streak',
      points: 4,
      triggered: false
    });
    breakdown.push({
      id: 'lost3Plus',
      name: '3+ Game Losing Streak',
      points: 6,
      triggered: false
    });
  }

  // 10 & 11. Opponent strength
  const opponentWinPct = getWinPercentage(opponent.record);
  if (opponentWinPct < 0.500) {
    breakdown.push({
      id: 'opponentUnder',
      name: 'Weak Opponent',
      points: 3,
      triggered: true,
      reason: `Opponent is ${opponent.record} (under .500)`
    });
    totalScore += 3;
    breakdown.push({
      id: 'opponentOver',
      name: 'Strong Opponent',
      points: -1,
      triggered: false
    });
  } else {
    breakdown.push({
      id: 'opponentUnder',
      name: 'Weak Opponent',
      points: 3,
      triggered: false
    });
    breakdown.push({
      id: 'opponentOver',
      name: 'Strong Opponent',
      points: -1,
      triggered: true,
      reason: `Opponent is ${opponent.record} (over .500)`
    });
    totalScore -= 1;
  }

  // 12 & 13. Back-to-back
  if (team.isBackToBack) {
    breakdown.push({
      id: 'backToBack',
      name: 'Back-to-Back Game',
      points: -4,
      triggered: true,
      reason: 'Team played yesterday'
    });
    totalScore -= 4;
  } else {
    breakdown.push({
      id: 'backToBack',
      name: 'Back-to-Back Game',
      points: -4,
      triggered: false
    });
  }

  if (opponentBackToBack) {
    breakdown.push({
      id: 'opponentBackToBack',
      name: 'Opponent Back-to-Back',
      points: 4,
      triggered: true,
      reason: 'Opponent played yesterday'
    });
    totalScore += 4;
  } else {
    breakdown.push({
      id: 'opponentBackToBack',
      name: 'Opponent Back-to-Back',
      points: 4,
      triggered: false
    });
  }

  return {
    teamId: team.id,
    teamName: team.name,
    teamAbbr: team.abbreviation,
    totalScore,
    confidence: getConfidence(totalScore),
    breakdown
  };
}

export async function fetchEnhancedGameData(): Promise<EnhancedGameAnalysis[]> {
  console.log('\n====== DATE DIAGNOSTIC START (fetchEnhancedGameData) ======');
  const today = new Date();
  console.log('🔍 RAW SYSTEM DATE:', today);
  console.log('🔍 ISO String:', today.toISOString());
  console.log('🔍 toLocaleDateString():', today.toLocaleDateString());
  console.log('🔍 toDateString():', today.toDateString());
  console.log('🔍 Year:', today.getFullYear());
  console.log('🔍 Month (0-indexed):', today.getMonth(), '(Should be 10 for November)');
  console.log('🔍 Date:', today.getDate());
  console.log('🔍 Timezone Offset:', today.getTimezoneOffset());
  console.log('====== DATE DIAGNOSTIC END ======\n');

  console.log('🎯 Fetching enhanced game data with Research Scores...');
  console.log(`📅 Using current date: ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (2025-26 Season)`);

  try {
    // Fetch ESPN data and odds in parallel
    const [espnGames, oddsData] = await Promise.all([
      fetchCompleteGameData(),
      fetchOddsAPI()
    ]);

    console.log(`✅ ESPN: ${espnGames.length} games`);
    console.log(`✅ Odds: ${oddsData ? oddsData.length : 0} games`);

    const enhancedGames: EnhancedGameAnalysis[] = espnGames.map(game => {
      console.log(`\n📊 Analyzing: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);

      // Match odds
      const odds = matchOddsToGame(game, oddsData);
      let spread = undefined;

      if (odds && odds.bookmakers.length > 0) {
        const book = odds.bookmakers[0];
        const spreadMarket = book.markets.find(m => m.key === 'spreads');
        const h2hMarket = book.markets.find(m => m.key === 'h2h');

        if (spreadMarket && h2hMarket) {
          const homeSpread = spreadMarket.outcomes.find(o => o.name === odds.home_team);
          const awaySpread = spreadMarket.outcomes.find(o => o.name === odds.away_team);
          const homeH2H = h2hMarket.outcomes.find(o => o.name === odds.home_team);
          const awayH2H = h2hMarket.outcomes.find(o => o.name === odds.away_team);

          if (homeSpread && awaySpread && homeH2H && awayH2H) {
            const fav: 'home' | 'away' = (homeSpread.point || 0) < 0 ? 'home' : 'away';
            spread = {
              favorite: fav,
              line: Math.abs(homeSpread.point || 0),
              homeOdds: homeH2H.price,
              awayOdds: awayH2H.price
            };
            console.log(`  💰 Spread: ${spread.favorite === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} -${spread.line}`);
          }
        }
      }

      // Calculate Research Scores
      const homeScore = calculateTeamResearchScore(
        game.homeTeam,
        game.awayTeam,
        true,
        spread?.favorite === 'home',
        game.awayTeam.isBackToBack
      );

      const awayScore = calculateTeamResearchScore(
        game.awayTeam,
        game.homeTeam,
        false,
        spread?.favorite === 'away',
        game.homeTeam.isBackToBack
      );

      console.log(`  🏠 ${game.homeTeam.abbreviation}: ${homeScore.totalScore} points (${homeScore.confidence})`);
      console.log(`  ✈️  ${game.awayTeam.abbreviation}: ${awayScore.totalScore} points (${awayScore.confidence})`);

      const differential = homeScore.totalScore - awayScore.totalScore;

      let recommendation: EnhancedGameAnalysis['recommendation'];
      if (Math.abs(differential) < 5) {
        recommendation = {
          team: 'neutral',
          confidence: 'low',
          reasoning: 'Scores are too close to make a strong recommendation'
        };
      } else if (differential > 0) {
        recommendation = {
          team: 'home',
          confidence: homeScore.confidence,
          reasoning: `${game.homeTeam.name} has ${differential} more research points`
        };
      } else {
        recommendation = {
          team: 'away',
          confidence: awayScore.confidence,
          reasoning: `${game.awayTeam.name} has ${Math.abs(differential)} more research points`
        };
      }

      return {
        gameId: game.id,
        date: game.date,
        time: game.time,
        status: game.status,
        homeTeam: homeScore,
        awayTeam: awayScore,
        scoreDifferential: differential,
        recommendation,
        spread
      };
    });

    // Sort by differential (best bets first)
    enhancedGames.sort((a, b) => Math.abs(b.scoreDifferential) - Math.abs(a.scoreDifferential));

    console.log(`\n✅ Enhanced ${enhancedGames.length} games with Research Scores`);

    const bestBets = enhancedGames.filter(g => Math.abs(g.scoreDifferential) >= 10);
    console.log(`🎯 Found ${bestBets.length} high-confidence bets (10+ differential)`);

    return enhancedGames;
  } catch (error) {
    console.error('❌ Error fetching enhanced data:', error);
    throw error;
  }
}
