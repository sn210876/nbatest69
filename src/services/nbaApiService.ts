import { Team, Game } from '../types/nbaTypes';

interface GameResult {
  opponent: string;
  result: 'W' | 'L';
  score: number;
  opponentScore: number;
  pointDifferential: number;
  wasFavorite?: boolean;
  wasHome?: boolean;
  opponentQuality?: 'over' | 'under';
}

export interface ESPNGame {
  id: string;
  date: string;
  competitions: Array<{
    competitors: Array<{
      id: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
      };
      homeAway: 'home' | 'away';
      score: string;
      records: Array<{
        summary: string;
      }>;
    }>;
    status: {
      type: {
        description: string;
        state: string;
      };
    };
    odds?: Array<{
      details: string;
      overUnder: number;
      spread: number;
      homeTeamOdds?: {
        moneyLine?: number;
        spreadOdds?: number;
      };
      awayTeamOdds?: {
        moneyLine?: number;
        spreadOdds?: number;
      };
    }>;
  }>;
}

export interface ESPNScoreboardResponse {
  events: ESPNGame[];
}

export interface BallDontLieTeam {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  name: string;
}

export interface ESPNTeamStats {
  team: {
    id: string;
    displayName: string;
  };
  statistics: Array<{
    name: string;
    displayValue: string;
  }>;
}

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ESPN_TEAM_SCHEDULE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds';
const ODDS_API_KEY = '7c326dbb1b236e8bfbd9724db3d9dfb2';
const BALLDONTLIE_TEAMS_URL = 'https://www.balldontlie.io/api/v1/teams';
const BALLDONTLIE_GAMES_URL = 'https://www.balldontlie.io/api/v1/games';

const CACHE_DURATION = 5 * 60 * 1000;

// Season availability tester
export async function testSeasonAvailability(): Promise<void> {
  console.log('\n====== SEASON AVAILABILITY TEST ======');
  const tests = [
    { season: 2025, desc: '2024-25 Season' },
    { season: 2026, desc: '2025-26 Season (Future)' },
  ];

  for (const test of tests) {
    const testDate = '20241104'; // November 4, 2024
    const url = `${ESPN_SCOREBOARD_URL}?dates=${testDate}&season=${test.season}&seasontype=2`;
    console.log(`\n🧪 Testing ${test.desc}:`);
    console.log(`   URL: ${url}`);

    try {
      const response = await fetch(url);
      const data = await response.json();

      console.log(`   Games found: ${data.events?.length || 0}`);
      if (data.events?.[0]) {
        const firstGame = data.events[0];
        const homeComp = firstGame.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
        const homeRecord = homeComp?.records?.[0]?.summary;
        console.log(`   Sample Team: ${homeComp?.team?.abbreviation}`);
        console.log(`   Sample Record: ${homeRecord}`);
        console.log(`   Game Date: ${firstGame.date}`);
      }
    } catch (error) {
      console.error(`   ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  console.log('\n====== END SEASON TEST ======\n');
}

export interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export interface APITestResult {
  service: string;
  success: boolean;
  message: string;
  data?: any;
  gamesCount?: number;
  oddsCount?: number;
  remainingQuota?: number;
  error?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();

function getCurrentNBASeason(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  console.log('🔍 DIAGNOSTIC - Date Info:', {
    currentDate: now.toISOString(),
    month,
    year
  });

  if (month >= 10) {
    return year + 1;
  } else if (month <= 6) {
    return year;
  } else {
    return year + 1;
  }
}

function getPacificDateString(): string {
  const now = new Date();

  const pacificFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = pacificFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';

  const dateString = `${year}${month}${day}`;

  console.log('📅 Date:', dateString, `(${month}/${day}/${year})`);

  return dateString;
}


async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  console.log('🌐 EXACT API URL CALLED:', url);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      console.log('📡 Response Status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Response Data Summary:', {
        eventsCount: data.events?.length || 0,
        hasLeagues: !!data.leagues,
        hasSeason: !!data.season
      });

      return data;
    } catch (error) {
      console.error(`❌ Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export async function fetchTodaysGames(dateParam?: string): Promise<ESPNScoreboardResponse | null> {
  const dateStr = dateParam || getPacificDateString();
  console.log('📅 Fetching games for:', dateStr);

  const cacheKey = `scoreboard-${dateStr}`;
  const cached = apiCache.get<ESPNScoreboardResponse>(cacheKey);

  if (cached) {
    console.log('✅ Cached:', cached.events?.length, 'games');
    return cached;
  }

  try {
    const url = `${ESPN_SCOREBOARD_URL}?dates=${dateStr}`;
    console.log('🌐 Calling:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('✅ ESPN API returned:', data.events?.length || 0, 'games');

    if (!data.events || data.events.length === 0) {
      console.log('ℹ️  No games today');
      apiCache.set(cacheKey, data);
      return data;
    }

    console.log('✅ Games:', data.events.map((e: any) => e.name || e.shortName).join(', '));

    apiCache.set(cacheKey, data);
    return data;

  } catch (error) {
    console.error('❌ ESPN API is fucking up:', error);
    return null;
  }
}
export async function fetchTeamGames(teamId: number, season: number = 2024): Promise<any> {
  const cacheKey = `team-games-${teamId}-${season}`;
  const cached = apiCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BALLDONTLIE_GAMES_URL}?seasons[]=${season}&team_ids[]=${teamId}&per_page=100`;
    const data = await fetchWithRetry(url);
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching games for team ${teamId}:`, error);
    return null;
  }
}

export async function fetchBallDontLieTeams(): Promise<BallDontLieTeam[]> {
  const cacheKey = 'balldontlie-teams';
  const cached = apiCache.get<BallDontLieTeam[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(BALLDONTLIE_TEAMS_URL);
    const teams = response.data || [];
    apiCache.set(cacheKey, teams);
    return teams;
  } catch (error) {
    console.error('Error fetching BallDontLie teams:', error);
    return [];
  }
}

function parseRecord(recordString: string): { wins: number; losses: number } {
  const match = recordString.match(/(\d+)-(\d+)/);
  if (match) {
    return {
      wins: parseInt(match[1]),
      losses: parseInt(match[2])
    };
  }
  return { wins: 0, losses: 0 };
}

function calculateBackToBack(games: ESPNGame[], teamId: string, currentGameDate: string): boolean {
  const currentDate = new Date(currentGameDate);
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return games.some(game => {
    const gameDate = game.date.split('T')[0];
    if (gameDate !== yesterdayStr) return false;

    return game.competitions[0].competitors.some(
      comp => comp.team.id === teamId
    );
  });
}

function mapTeamAbbreviation(espnAbbr: string): string {
  const mapping: Record<string, string> = {
    'LAL': 'lakers',
    'BOS': 'celtics',
    'GSW': 'warriors',
    'MIA': 'heat',
    'DEN': 'nuggets',
    'PHX': 'suns',
    'PHI': 'sixers',
    'MIL': 'bucks',
    'DAL': 'mavericks',
    'NY': 'knicks',
    'NYK': 'knicks',
    'LAC': 'clippers',
    'BKN': 'nets',
    'CHI': 'bulls',
    'CLE': 'cavaliers',
    'NO': 'pelicans',
    'NOP': 'pelicans',
    'SAC': 'kings',
    'MEM': 'grizzlies',
    'OKC': 'thunder',
    'WSH': 'wizards',
    'WAS': 'wizards',
    'ATL': 'hawks',
    'CHA': 'hornets',
    'CHO': 'hornets'
  };

  return mapping[espnAbbr] || espnAbbr.toLowerCase();
}

export async function fetchTeamSchedule(teamId: string): Promise<any> {
  const cacheKey = `team-schedule-${teamId}`;
  const cached = apiCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const currentSeason = getCurrentNBASeason();
    const url = `${ESPN_TEAM_SCHEDULE_URL}/${teamId}/schedule?season=${currentSeason}`;
    console.log(`📆 Fetching schedule for team ${teamId} - season ${currentSeason}`);
    const data = await fetchWithRetry(url);
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching schedule for team ${teamId}:`, error);
    return null;
  }
}

export async function fetchTeamRecentGames(teamId: string, limit: number = 10): Promise<any[]> {
  try {
    const scheduleData = await fetchTeamSchedule(teamId);
    if (!scheduleData || !scheduleData.events) return [];

    const completedGames = scheduleData.events
      .filter((event: any) => event.competitions?.[0]?.status?.type?.completed)
      .slice(-limit)
      .map((event: any) => {
        const competition = event.competitions[0];
        const teamComp = competition.competitors.find((c: any) => c.id === teamId);
        const opponentComp = competition.competitors.find((c: any) => c.id !== teamId);

        if (!teamComp || !opponentComp) return null;

        const teamScore = parseInt(teamComp.score || '0');
        const oppScore = parseInt(opponentComp.score || '0');

        return {
          date: event.date,
          opponent: opponentComp.team.displayName,
          opponentAbbr: opponentComp.team.abbreviation,
          opponentRecord: opponentComp.records?.[0]?.summary || '',
          teamScore,
          opponentScore: oppScore,
          won: teamScore > oppScore,
          isHome: teamComp.homeAway === 'home',
          margin: teamScore - oppScore,
          wasFavorite: teamComp.homeAway === 'home',
        };
      })
      .filter((game: any) => game !== null);

    return completedGames;
  } catch (error) {
    console.error(`Error fetching recent games for team ${teamId}:`, error);
    return [];
  }
}

export function calculateStreak(recentGames: any[]): { type: 'W' | 'L'; count: number } {
  if (!recentGames || recentGames.length === 0) {
    return { type: 'W', count: 0 };
  }

  let streak = 1;
  const lastResult = recentGames[recentGames.length - 1].won;

  for (let i = recentGames.length - 2; i >= 0; i--) {
    if (recentGames[i].won === lastResult) {
      streak++;
    } else {
      break;
    }
  }

  return { type: lastResult ? 'W' : 'L', count: streak };
}

export function calculateSeasonAverage(recentGames: any[]): number {
  if (!recentGames || recentGames.length === 0) return 110;

  const total = recentGames.reduce((sum, game) => sum + game.teamScore, 0);
  return Math.round((total / recentGames.length) * 10) / 10;
}

export function wasLastGameClose(recentGames: any[]): boolean {
  if (!recentGames || recentGames.length === 0) return false;
  return Math.abs(recentGames[recentGames.length - 1].margin) <= 5;
}

export async function fetchLast5Games(teamAbbr: string): Promise<GameResult[]> {
  try {
    console.log(`\n====== fetchLast5Games(${teamAbbr}) CALLED ======`);
    const rawYesterday = new Date();
    console.log('🔍 System Date for yesterday calc:', rawYesterday.toISOString());
    console.log('🔍 Year:', rawYesterday.getFullYear(), 'Month:', rawYesterday.getMonth(), 'Day:', rawYesterday.getDate());

    const yesterday = new Date();
    console.log('🔍 Before setDate(-1):', yesterday.toISOString());
    yesterday.setDate(yesterday.getDate() - 1);
    console.log('🔍 After setDate(-1):', yesterday.toISOString());
    console.log('🔍 Expected for Nov 3, 2025: 2025-11-03T...');

    const results: GameResult[] = [];

    for (let i = 0; i < 30 && results.length < 5; i++) {
      const checkDate = new Date(yesterday);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0].replace(/-/g, '');

      if (i === 0) {
        console.log(`🔍 First iteration (i=0): checkDate = ${checkDate.toISOString()}, dateStr = ${dateStr}`);
        console.log('🔍 Should be 20251103 for Nov 3, 2025');
      }
      if (i === 29) {
        console.log(`🔍 Last iteration (i=29): checkDate = ${checkDate.toISOString()}, dateStr = ${dateStr}`);
      }

      const data = await fetchTodaysGames(dateStr);
      if (!data) continue;

      for (const event of data.events) {
        const comp = event.competitions[0];
        const teamComp = comp.competitors.find(
          c => c.team.abbreviation === teamAbbr.toUpperCase()
        );

        if (teamComp) {
          const opponentComp = comp.competitors.find(c => c !== teamComp);
          if (!opponentComp) continue;

          const teamScore = parseInt(teamComp.score || '0');
          const oppScore = parseInt(opponentComp.score || '0');

          if (teamScore === 0 && oppScore === 0) continue;

          const opponentRecordStr = opponentComp.records?.[0]?.summary || '0-0';
          const [oppWins, oppLosses] = opponentRecordStr.split('-').map(Number);
          const opponentWinPct = oppWins / (oppWins + oppLosses) || 0;

          const result: GameResult = {
            opponent: opponentComp.team.abbreviation,
            result: teamScore > oppScore ? 'W' : 'L',
            score: teamScore,
            opponentScore: oppScore,
            pointDifferential: teamScore - oppScore,
            wasFavorite: teamComp.homeAway === 'home',
            wasHome: teamComp.homeAway === 'home',
            opponentQuality: opponentWinPct >= 0.500 ? 'over' : 'under'
          };

          results.push(result);
          if (results.length >= 5) break;
        }
      }
    }

    return results.slice(0, 5);
  } catch (error) {
    console.error(`Error fetching last 5 games for ${teamAbbr}:`, error);
    return [];
  }
}

export function transformESPNDataToAppFormat(
  espnData: ESPNScoreboardResponse,
  allGames: ESPNGame[]
): { games: Game[]; teams: Record<string, Team> } {
  const games: Game[] = [];
  const teamsMap: Record<string, Team> = {};

  espnData.events.forEach((event, index) => {
    const competition = event.competitions[0];
    const homeComp = competition.competitors.find(c => c.homeAway === 'home');
    const awayComp = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeComp || !awayComp) return;

    const homeTeamId = mapTeamAbbreviation(homeComp.team.abbreviation);
    const awayTeamId = mapTeamAbbreviation(awayComp.team.abbreviation);

    const homeRecordStr = homeComp.records?.[0]?.summary || '0-0';
    const awayRecordStr = awayComp.records?.[0]?.summary || '0-0';

    console.log(`  📊 ${homeComp.team.abbreviation} Record: ${homeRecordStr}`);
    console.log(`  📊 ${awayComp.team.abbreviation} Record: ${awayRecordStr}`);

    const homeRecord = parseRecord(homeRecordStr);
    const awayRecord = parseRecord(awayRecordStr);

    const homeBackToBack = calculateBackToBack(allGames, homeComp.team.id, event.date);
    const awayBackToBack = calculateBackToBack(allGames, awayComp.team.id, event.date);

    const odds = competition.odds?.[0];
    const spread = odds?.spread || 0;
    const spreadTeam = spread < 0 ? 'home' : 'away';

    const game: Game = {
      id: `game${index + 1}`,
      homeTeam: homeTeamId,
      awayTeam: awayTeamId,
      date: event.date.split('T')[0],
      time: new Date(event.date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
        hour12: true
      }) + ' ET',
      spread: Math.abs(spread),
      spreadTeam,
      homeMoneyline: odds?.homeTeamOdds?.moneyLine || 0,
      awayMoneyline: odds?.awayTeamOdds?.moneyLine || 0,
      homeBackToBack,
      awayBackToBack
    };

    games.push(game);

    if (!teamsMap[homeTeamId]) {
      const displayName = homeComp.team?.displayName || homeTeamId;
      teamsMap[homeTeamId] = {
        id: homeTeamId,
        name: displayName.split(' ').pop() || homeTeamId,
        city: displayName.split(' ').slice(0, -1).join(' ') || '',
        abbreviation: homeComp.team?.abbreviation || homeTeamId,
        wins: homeRecord.wins || 0,
        losses: homeRecord.losses || 0,
        winPercentage: (homeRecord.wins && homeRecord.losses !== undefined)
          ? homeRecord.wins / (homeRecord.wins + homeRecord.losses) || 0
          : 0.5,
        streak: { type: 'W', count: 0 },
        avgPointsScored: 110,
        avgPointsAllowed: 110,
        pointsPerGame: 110,
        last5Games: [],
        homeRecord: { wins: 0, losses: 0 },
        awayRecord: { wins: 0, losses: 0 },
        currentStreak: { type: 'W', count: 0 }
      };
    }

    if (!teamsMap[awayTeamId]) {
      const displayName = awayComp.team?.displayName || awayTeamId;
      teamsMap[awayTeamId] = {
        id: awayTeamId,
        name: displayName.split(' ').pop() || awayTeamId,
        city: displayName.split(' ').slice(0, -1).join(' ') || '',
        abbreviation: awayComp.team?.abbreviation || awayTeamId,
        wins: awayRecord.wins || 0,
        losses: awayRecord.losses || 0,
        winPercentage: (awayRecord.wins && awayRecord.losses !== undefined)
          ? awayRecord.wins / (awayRecord.wins + awayRecord.losses) || 0
          : 0.5,
        streak: { type: 'W', count: 0 },
        avgPointsScored: 110,
        avgPointsAllowed: 110,
        pointsPerGame: 110,
        last5Games: [],
        homeRecord: { wins: 0, losses: 0 },
        awayRecord: { wins: 0, losses: 0 },
        currentStreak: { type: 'W', count: 0 }
      };
    }
  });

  return { games, teams: teamsMap };
}

export async function enrichTeamsWithLast5Games(teams: Record<string, Team>): Promise<void> {
  console.log('🎯 enrichTeamsWithLast5Games: Starting enrichment for', Object.keys(teams).length, 'teams');

  const enrichmentPromises = Object.entries(teams).map(async ([teamId, team]) => {
    const abbr = team.abbreviation || teamId.substring(0, 3).toUpperCase();
    console.log(`   🔄 Enriching ${teamId} (${team.name}) with abbr: ${abbr}`);

    const last5 = await fetchLast5Games(abbr);
    console.log(`   📊 ${abbr}: Got ${last5.length} games`);

    if (last5.length > 0) {
      team.last5Games = last5;
      console.log(`   ✅ ${abbr}: Set last5Games`);
    } else {
      console.warn(`   ⚠️ ${abbr}: No last 5 games found!`);
    }

    if (last5.length > 0) {

      let currentStreakCount = 0;
      const firstResult = last5[0]?.result;

      for (const game of last5) {
        if (game.result === firstResult) {
          currentStreakCount++;
        } else {
          break;
        }
      }

      team.currentStreak = {
        type: firstResult || 'W',
        count: currentStreakCount
      };
    }
  });

  await Promise.all(enrichmentPromises);
}

export function clearCache(): void {
  apiCache.clear();
}

export async function fetchOddsAPI(): Promise<OddsAPIResponse[] | null> {
  const cacheKey = 'odds-api-nba';
  const cached = apiCache.get<OddsAPIResponse[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ODDS_API_URL}?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,h2h&oddsFormat=american`;
    console.log('🎲 Fetching odds from The Odds API...');
    console.log('📍 URL:', url.replace(ODDS_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const remainingQuota = response.headers.get('x-requests-remaining');
    const usedQuota = response.headers.get('x-requests-used');

    console.log('📊 Odds API Quota:', {
      remaining: remainingQuota,
      used: usedQuota
    });

    const data = await response.json();
    console.log(`✅ Received odds for ${data.length} games`);

    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching odds:', error);
    return null;
  }
}

export function normalizeTeamName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('losangeles', 'la')
    .replace('newyork', 'ny')
    .replace('goldstate', 'golden state')
    .replace('portlandtrail', 'portland');

  const mapping: Record<string, string> = {
    'lalakers': 'lakers',
    'laclippers': 'clippers',
    'nykni': 'knicks',
    'brooklynnets': 'nets',
    'goldenstatewarriors': 'warriors',
  };

  return mapping[normalized] || normalized;
}

export async function testESPNAPI(): Promise<APITestResult> {
  try {
    console.log('\n🏀 Testing ESPN API...');
    const data = await fetchTodaysGames();

    if (!data || !data.events || data.events.length === 0) {
      return {
        service: 'ESPN',
        success: false,
        message: 'No games found for today',
        gamesCount: 0,
        error: 'Empty response or no games scheduled'
      };
    }

    console.log(`✅ ESPN API: Found ${data.events.length} games`);
    data.events.forEach((event, i) => {
      const comp = event.competitions[0];
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      console.log(`  ${i + 1}. ${away?.team.abbreviation} @ ${home?.team.abbreviation}`);
    });

    return {
      service: 'ESPN',
      success: true,
      message: `Found ${data.events.length} games`,
      gamesCount: data.events.length,
      data: data.events
    };
  } catch (error) {
    console.error('❌ ESPN API Error:', error);
    return {
      service: 'ESPN',
      success: false,
      message: 'Failed to connect',
      error: error instanceof Error ? error.message : 'Unknown error',
      gamesCount: 0
    };
  }
}

export async function testOddsAPI(): Promise<APITestResult> {
  try {
    console.log('\n🎲 Testing The Odds API...');
    const url = `${ODDS_API_URL}?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,h2h&oddsFormat=american`;

    const response = await fetch(url);
    const remainingQuota = response.headers.get('x-requests-remaining');

    if (!response.ok) {
      return {
        service: 'The Odds API',
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        error: response.statusText,
        oddsCount: 0,
        remainingQuota: remainingQuota ? parseInt(remainingQuota) : undefined
      };
    }

    const data = await response.json();
    console.log(`✅ Odds API: Found odds for ${data.length} games`);
    console.log(`📊 Remaining quota: ${remainingQuota}/${500}`);

    data.forEach((game: OddsAPIResponse, i: number) => {
      console.log(`  ${i + 1}. ${game.away_team} @ ${game.home_team}`);
      if (game.bookmakers.length > 0) {
        const spread = game.bookmakers[0].markets.find(m => m.key === 'spreads');
        if (spread) {
          console.log(`     Spread: ${spread.outcomes[0].name} ${spread.outcomes[0].point}`);
        }
      }
    });

    return {
      service: 'The Odds API',
      success: true,
      message: `Found odds for ${data.length} games`,
      oddsCount: data.length,
      remainingQuota: remainingQuota ? parseInt(remainingQuota) : undefined,
      data
    };
  } catch (error) {
    console.error('❌ Odds API Error:', error);
    return {
      service: 'The Odds API',
      success: false,
      message: 'Failed to connect',
      error: error instanceof Error ? error.message : 'Unknown error',
      oddsCount: 0
    };
  }
}

export async function testAllAPIs(): Promise<APITestResult[]> {
  console.log('🧪 Starting API Connection Tests...\n');

  const [espnResult, oddsResult] = await Promise.all([
    testESPNAPI(),
    testOddsAPI()
  ]);

  console.log('\n📋 Test Results Summary:');
  console.log(`  ESPN: ${espnResult.success ? '✅' : '❌'} ${espnResult.message}`);
  console.log(`  Odds API: ${oddsResult.success ? '✅' : '❌'} ${oddsResult.message}`);

  if (oddsResult.remainingQuota !== undefined) {
    console.log(`  Remaining API calls: ${oddsResult.remainingQuota}/500`);
  }

  return [espnResult, oddsResult];
}
