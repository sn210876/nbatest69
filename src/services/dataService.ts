import { Team, Game } from '../types/nbaTypes';
import {
  fetchTodaysGames,
  transformESPNDataToAppFormat,
  enrichTeamsWithLast5Games,
  clearCache as clearAPICache,
  fetchOddsAPI,
  normalizeTeamName,
  ESPNGame,
  fetchTeamRecentGames,
  calculateStreak,
  calculateSeasonAverage,
  wasLastGameClose
} from './nbaApiService';

export interface DataServiceResult {
  games: Game[];
  teams: Record<string, Team>;
  isLiveData: boolean;
  lastUpdated: Date;
  error?: string;
}

let cachedData: DataServiceResult | null = null;

export async function fetchNBAData(forceRefresh = false): Promise<DataServiceResult> {
  if (cachedData && !forceRefresh) {
    return cachedData;
  }

  try {
    console.log('🏀 Fetching live NBA data from ESPN API for today...');

    const todayData = await fetchTodaysGames();

    if (!todayData) {
      throw new Error('ESPN API is not responding');
    }

    console.log(`📊 ESPN returned ${todayData.events?.length || 0} games`);

    if (!todayData.events || todayData.events.length === 0) {
      throw new Error('No NBA games scheduled today');
    }

    const allGames = todayData.events;

    console.log('\n🔧 TRANSFORMING ESPN DATA TO APP FORMAT...');
    const { games, teams } = transformESPNDataToAppFormat(todayData, allGames);

    console.log('\n📊 TRANSFORMATION RESULTS:');
    console.log(`   Games created: ${games.length}`);
    console.log(`   Teams created: ${Object.keys(teams).length}`);

    if (games.length > 0) {
      console.log('   Sample game:', games[0]);
    }
    if (Object.keys(teams).length > 0) {
      const firstTeamKey = Object.keys(teams)[0];
      console.log('   Sample team:', firstTeamKey, teams[firstTeamKey]);
    }

    // Log sample team data
    const firstTeamId = Object.keys(teams)[0];
    if (firstTeamId) {
      const firstTeam = teams[firstTeamId];
      console.log('\n🔍 SAMPLE TEAM DATA:');
      console.log('   Team ID:', firstTeamId);
      console.log('   Team Name:', firstTeam.name);
      console.log('   Record:', `${firstTeam.wins}-${firstTeam.losses}`);
      console.log('   Win %:', firstTeam.winPercentage.toFixed(3));
    }

    console.log(`\n🎯 Enriching ${Object.keys(teams).length} teams with last 5 games...`);
    await enrichTeamsWithLast5Games(teams);
    console.log('✅ Enrichment complete');

    console.log('\n🎲 Fetching odds from The Odds API...');
    let oddsData = null;
    try {
      oddsData = await fetchOddsAPI();
    } catch (oddsError) {
      console.warn('⚠️ Odds API is fucking up (non-critical):', oddsError);
    }

    if (oddsData && oddsData.length > 0) {
      console.log(`✅ Received odds for ${oddsData.length} games, merging with game data...`);

      games.forEach(game => {
        const homeTeamObj = teams[game.homeTeam];
        const awayTeamObj = teams[game.awayTeam];

        if (!homeTeamObj || !awayTeamObj) return;

        const matchingOdds = oddsData.find(oddsGame => {
          const homeMatch = normalizeTeamName(oddsGame.home_team).includes(normalizeTeamName(homeTeamObj.name)) ||
                           normalizeTeamName(homeTeamObj.name).includes(normalizeTeamName(oddsGame.home_team));
          const awayMatch = normalizeTeamName(oddsGame.away_team).includes(normalizeTeamName(awayTeamObj.name)) ||
                           normalizeTeamName(awayTeamObj.name).includes(normalizeTeamName(oddsGame.away_team));
          return homeMatch && awayMatch;
        });

        if (matchingOdds && matchingOdds.bookmakers.length > 0) {
          const bookmaker = matchingOdds.bookmakers[0];
          const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
          const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');

          if (h2hMarket) {
            const homeOdds = h2hMarket.outcomes.find(o => o.name === matchingOdds.home_team);
            const awayOdds = h2hMarket.outcomes.find(o => o.name === matchingOdds.away_team);
            if (homeOdds) game.homeMoneyline = homeOdds.price;
            if (awayOdds) game.awayMoneyline = awayOdds.price;
          }

          if (spreadsMarket) {
            const homeSpread = spreadsMarket.outcomes.find(o => o.name === matchingOdds.home_team);
            if (homeSpread && homeSpread.point !== undefined) {
              game.spread = Math.abs(homeSpread.point);
              game.spreadTeam = homeSpread.point < 0 ? 'home' : 'away';
            }
          }
        }
      });
      console.log('✅ Odds merged successfully');
    } else {
      console.log('⚠️ No odds data available, using ESPN odds');
    }

    console.log('\n====== FETCH NBA DATA COMPLETE ======\n');

    const result: DataServiceResult = {
      games,
      teams,
      isLiveData: true,
      lastUpdated: new Date()
    };

    cachedData = result;
    return result;

  } catch (error) {
    console.error('❌ API ERROR:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('ESPN API')) {
      console.error('🚨 ESPN API is fucking up');
    } else if (errorMessage.includes('Odds API')) {
      console.error('🚨 Odds API is fucking up (non-critical)');
    }

    throw error;
  }
}

export function clearCache(): void {
  cachedData = null;
  clearAPICache();
}

export async function refreshData(): Promise<DataServiceResult> {
  clearCache();
  return fetchNBAData(true);
}

export interface EnrichedGame {
  id: string;
  date: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    record: string;
    score: string;
    recentGames: any[];
    isBackToBack: boolean;
    streak: { type: 'W' | 'L'; count: number };
    seasonAverage: number;
    lastGameClose: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    record: string;
    score: string;
    recentGames: any[];
    isBackToBack: boolean;
    streak: { type: 'W' | 'L'; count: number };
    seasonAverage: number;
    lastGameClose: boolean;
  };
  status: string;
  time: string;
}

function isTeamBackToBack(teamId: string, yesterdaysGames: ESPNGame[]): boolean {
  return yesterdaysGames.some(game => {
    const competition = game.competitions[0];
    return competition.competitors.some(comp => comp.team.id === teamId);
  });
}

export async function fetchCompleteGameData(): Promise<EnrichedGame[]> {
  try {
    console.log('🏀 Fetching complete NBA game data from ESPN API...');

    // Get Pacific Time dates
    const now = new Date();
    const pacificDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    const yesterdayPacific = new Date(pacificDate);
    yesterdayPacific.setDate(yesterdayPacific.getDate() - 1);
    const yesterdayYear = yesterdayPacific.getFullYear();
    const yesterdayMonth = String(yesterdayPacific.getMonth() + 1).padStart(2, "0");
    const yesterdayDay = String(yesterdayPacific.getDate()).padStart(2, "0");
    const yesterdayStr = `${yesterdayYear}${yesterdayMonth}${yesterdayDay}`;

    const [todayData, yesterdayData] = await Promise.all([
      fetchTodaysGames(),
      fetchTodaysGames(yesterdayStr)
    ]);

    if (!todayData || !todayData.events || todayData.events.length === 0) {
      console.warn('⚠️ No games found for today');
      throw new Error('No games scheduled for today');
    }

    console.log(`✅ Found ${todayData.events.length} games today`);

    const enrichedGames = await Promise.all(
      todayData.events.map(async (event) => {
        const competition = event.competitions[0];
        const homeComp = competition.competitors.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors.find(c => c.homeAway === 'away');

        if (!homeComp || !awayComp) {
          throw new Error('Missing home or away team data');
        }

        console.log(`📊 Enriching game: ${awayComp.team.abbreviation} @ ${homeComp.team.abbreviation}`);

        const [homeRecentGames, awayRecentGames] = await Promise.all([
          fetchTeamRecentGames(homeComp.team.id, 10),
          fetchTeamRecentGames(awayComp.team.id, 10)
        ]);

        const enrichedGame: EnrichedGame = {
          id: event.id,
          date: event.date,
          homeTeam: {
            id: homeComp.team.id,
            name: homeComp.team.displayName,
            abbreviation: homeComp.team.abbreviation,
            record: homeComp.records?.[0]?.summary || '0-0',
            score: homeComp.score || '0',
            recentGames: homeRecentGames,
            isBackToBack: isTeamBackToBack(homeComp.team.id, yesterdayData?.events || []),
            streak: calculateStreak(homeRecentGames),
            seasonAverage: calculateSeasonAverage(homeRecentGames),
            lastGameClose: wasLastGameClose(homeRecentGames),
          },
          awayTeam: {
            id: awayComp.team.id,
            name: awayComp.team.displayName,
            abbreviation: awayComp.team.abbreviation,
            record: awayComp.records?.[0]?.summary || '0-0',
            score: awayComp.score || '0',
            recentGames: awayRecentGames,
            isBackToBack: isTeamBackToBack(awayComp.team.id, yesterdayData?.events || []),
            streak: calculateStreak(awayRecentGames),
            seasonAverage: calculateSeasonAverage(awayRecentGames),
            lastGameClose: wasLastGameClose(awayRecentGames),
          },
          status: competition.status.type.description,
          time: new Date(event.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York',
            hour12: true
          }) + ' ET'
        };

        console.log(`  ✓ Home: ${homeComp.team.abbreviation} - ${enrichedGame.homeTeam.streak.type}${enrichedGame.homeTeam.streak.count}, B2B: ${enrichedGame.homeTeam.isBackToBack ? 'YES' : 'NO'}`);
        console.log(`  ✓ Away: ${awayComp.team.abbreviation} - ${enrichedGame.awayTeam.streak.type}${enrichedGame.awayTeam.streak.count}, B2B: ${enrichedGame.awayTeam.isBackToBack ? 'YES' : 'NO'}`);

        return enrichedGame;
      })
    );

    console.log(`\n✅ Successfully enriched ${enrichedGames.length} games with complete data`);
    console.log('====== FETCH COMPLETE GAME DATA COMPLETE ======\n');
    return enrichedGames;

  } catch (error) {
    console.error('❌ ESPN API Error:', error);
    throw error;
  }
}
