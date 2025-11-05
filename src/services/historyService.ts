import { createClient } from '@supabase/supabase-js';
import { GameAnalysis, analyzeGame } from '../utils/scoringEngine';
import { Game, Team } from '../types/nbaTypes';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface HistoryRecord {
  id: string;
  game_date: string;
  game_id: string;
  home_team_id: string;
  home_team_name: string;
  away_team_id: string;
  away_team_name: string;
  home_research_score: number;
  away_research_score: number;
  score_differential: number;
  prediction: 'home' | 'away' | 'neutral';
  prediction_confidence: 'high' | 'medium' | 'low';
  home_final_score: number | null;
  away_final_score: number | null;
  game_completed: boolean;
  prediction_correct: boolean | null;
  home_analysis_breakdown?: any;
  away_analysis_breakdown?: any;
  created_at: string;
  updated_at: string;
}

export interface AccuracyStats {
  totalPredictions: number;
  completedGames: number;
  correctPredictions: number;
  accuracyRate: number;
  highConfidenceAccuracy: number;
  mediumConfidenceAccuracy: number;
  lowConfidenceAccuracy: number;
}

export async function logGamePrediction(
  game: Game,
  analysis: GameAnalysis,
  homeTeamName: string,
  awayTeamName: string
): Promise<void> {
  try {
    const record = {
      game_date: new Date().toISOString().split('T')[0],
      game_id: game.id,
      home_team_id: game.homeTeam,
      home_team_name: homeTeamName,
      away_team_id: game.awayTeam,
      away_team_name: awayTeamName,
      home_research_score: analysis.homeAnalysis.totalScore,
      away_research_score: analysis.awayAnalysis.totalScore,
      score_differential: analysis.scoreDifferential,
      prediction: analysis.recommendation.team,
      prediction_confidence: analysis.recommendation.confidence,
      game_completed: false,
      prediction_correct: null
    };

    const { error } = await supabase
      .from('research_score_history')
      .upsert(record, { onConflict: 'game_id' });

    if (error) {
      console.error('Error logging prediction:', error);
    } else {
      console.log(`✅ Logged prediction for ${awayTeamName} @ ${homeTeamName}`);
    }
  } catch (error) {
    console.error('Error in logGamePrediction:', error);
  }
}

export async function updateGameResult(
  gameId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('research_score_history')
      .select('prediction')
      .eq('game_id', gameId)
      .maybeSingle();

    if (fetchError || !existing) {
      console.error('Could not find prediction for game:', gameId);
      return;
    }

    const actualWinner = homeScore > awayScore ? 'home' : 'away';
    const predictionCorrect = existing.prediction === actualWinner ||
                              (existing.prediction === 'neutral' ? null : false);

    const { error } = await supabase
      .from('research_score_history')
      .update({
        home_final_score: homeScore,
        away_final_score: awayScore,
        game_completed: true,
        prediction_correct: predictionCorrect,
        updated_at: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (error) {
      console.error('Error updating game result:', error);
    } else {
      console.log(`✅ Updated result for game ${gameId}: ${homeScore}-${awayScore}`);
    }
  } catch (error) {
    console.error('Error in updateGameResult:', error);
  }
}

export async function fetchHistory(limit = 100): Promise<HistoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from('research_score_history')
      .select('*')
      .order('game_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

export async function fetchHistoryByDateRange(
  startDate: string,
  endDate: string
): Promise<HistoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from('research_score_history')
      .select('*')
      .gte('game_date', startDate)
      .lte('game_date', endDate)
      .order('game_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching history by date range:', error);
    return [];
  }
}

export async function calculateAccuracyStats(): Promise<AccuracyStats> {
  try {
    const { data, error } = await supabase
      .from('research_score_history')
      .select('*')
      .eq('game_completed', true);

    if (error) throw error;

    const records = data || [];
    const totalPredictions = records.length;
    const correctPredictions = records.filter(r => r.prediction_correct === true).length;

    const highConfidence = records.filter(r => r.prediction_confidence === 'high');
    const mediumConfidence = records.filter(r => r.prediction_confidence === 'medium');
    const lowConfidence = records.filter(r => r.prediction_confidence === 'low');

    const highCorrect = highConfidence.filter(r => r.prediction_correct === true).length;
    const mediumCorrect = mediumConfidence.filter(r => r.prediction_correct === true).length;
    const lowCorrect = lowConfidence.filter(r => r.prediction_correct === true).length;

    return {
      totalPredictions: records.length,
      completedGames: records.length,
      correctPredictions,
      accuracyRate: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
      highConfidenceAccuracy: highConfidence.length > 0 ? (highCorrect / highConfidence.length) * 100 : 0,
      mediumConfidenceAccuracy: mediumConfidence.length > 0 ? (mediumCorrect / mediumConfidence.length) * 100 : 0,
      lowConfidenceAccuracy: lowConfidence.length > 0 ? (lowCorrect / lowConfidence.length) * 100 : 0
    };
  } catch (error) {
    console.error('Error calculating accuracy stats:', error);
    return {
      totalPredictions: 0,
      completedGames: 0,
      correctPredictions: 0,
      accuracyRate: 0,
      highConfidenceAccuracy: 0,
      mediumConfidenceAccuracy: 0,
      lowConfidenceAccuracy: 0
    };
  }
}

function createMockTeam(
  id: string,
  city: string,
  name: string,
  wins: number,
  losses: number,
  avgPoints: number,
  lastGameScore: number,
  lastGameOpponentScore: number,
  streakCount: number,
  opponentWinPct: number
): Team {
  const streakType = streakCount > 0 ? 'W' : 'L';
  const lastGameResult = lastGameScore > lastGameOpponentScore ? 'W' : 'L';
  const lastGameWasFavorite = opponentWinPct < 0.50;

  return {
    id,
    city,
    name,
    abbreviation: id,
    wins,
    losses,
    winPercentage: wins / (wins + losses),
    streak: {
      type: streakType,
      count: Math.abs(streakCount)
    },
    avgPointsScored: avgPoints,
    avgPointsAllowed: 110,
    last5Games: [
      {
        opponent: 'Opponent',
        result: lastGameResult,
        score: lastGameScore,
        opponentScore: lastGameOpponentScore,
        pointDifferential: lastGameScore - lastGameOpponentScore,
        wasFavorite: lastGameWasFavorite
      }
    ],
    lastGameClose: Math.abs(lastGameScore - lastGameOpponentScore) <= 5,
    seasonAverage: avgPoints,
    pointsPerGame: avgPoints,
    homeRecord: { wins: Math.floor(wins / 2), losses: Math.floor(losses / 2) },
    awayRecord: { wins: Math.ceil(wins / 2), losses: Math.ceil(losses / 2) },
    currentStreak: {
      type: streakType,
      count: Math.abs(streakCount)
    }
  };
}

export async function loadTestData(): Promise<void> {
  const testGames = [
    { date: '2025-11-04', homeCity: 'Boston', homeName: 'Celtics', homeWins: 52, homeLosses: 8, homeAvg: 118, homeLastScore: 122, homeLastOpp: 108, homeStreak: 5, homeOppPct: 0.58, awayCity: 'Miami', awayName: 'Heat', awayWins: 38, awayLosses: 22, awayAvg: 108, awayLastScore: 102, awayLastOpp: 110, awayStreak: -2, awayOppPct: 0.52, homeFinal: 118, awayFinal: 105, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Golden State', homeName: 'Warriors', homeWins: 42, homeLosses: 18, homeAvg: 116, homeLastScore: 105, homeLastOpp: 112, homeStreak: -1, homeOppPct: 0.55, awayCity: 'Phoenix', awayName: 'Suns', awayWins: 45, awayLosses: 15, awayAvg: 115, awayLastScore: 120, awayLastOpp: 108, awayStreak: 3, awayOppPct: 0.57, homeFinal: 110, awayFinal: 115, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Los Angeles', homeName: 'Lakers', homeWins: 35, homeLosses: 25, homeAvg: 112, homeLastScore: 98, homeLastOpp: 104, homeStreak: -3, homeOppPct: 0.50, awayCity: 'Denver', awayName: 'Nuggets', awayWins: 48, awayLosses: 12, awayAvg: 118, awayLastScore: 125, awayLastOpp: 110, awayStreak: 4, awayOppPct: 0.60, homeFinal: 102, awayFinal: 112, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Milwaukee', homeName: 'Bucks', homeWins: 50, homeLosses: 10, homeAvg: 120, homeLastScore: 128, homeLastOpp: 115, homeStreak: 6, homeOppPct: 0.58, awayCity: 'Atlanta', awayName: 'Hawks', awayWins: 32, awayLosses: 28, awayAvg: 110, awayLastScore: 105, awayLastOpp: 115, awayStreak: -2, awayOppPct: 0.48, homeFinal: 125, awayFinal: 108, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Dallas', homeName: 'Mavericks', homeWins: 44, homeLosses: 16, homeAvg: 115, homeLastScore: 118, homeLastOpp: 112, homeStreak: 2, homeOppPct: 0.54, awayCity: 'Memphis', awayName: 'Grizzlies', awayWins: 40, awayLosses: 20, awayAvg: 113, awayLastScore: 108, awayLastOpp: 110, awayStreak: -1, awayOppPct: 0.52, homeFinal: 116, awayFinal: 114, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Philadelphia', homeName: '76ers', homeWins: 38, homeLosses: 22, homeAvg: 111, homeLastScore: 102, homeLastOpp: 108, homeStreak: -1, homeOppPct: 0.51, awayCity: 'New York', awayName: 'Knicks', awayWins: 46, awayLosses: 14, awayAvg: 116, awayLastScore: 122, awayLastOpp: 105, awayStreak: 4, awayOppPct: 0.57, homeFinal: 98, awayFinal: 109, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Brooklyn', homeName: 'Nets', homeWins: 36, homeLosses: 24, homeAvg: 110, homeLastScore: 112, homeLastOpp: 108, homeStreak: 2, homeOppPct: 0.50, awayCity: 'Toronto', awayName: 'Raptors', awayWins: 30, awayLosses: 30, awayAvg: 106, awayLastScore: 98, awayLastOpp: 105, awayStreak: -2, awayOppPct: 0.47, homeFinal: 107, awayFinal: 103, homeB2B: false, awayB2B: false },
    { date: '2025-11-04', homeCity: 'Cleveland', homeName: 'Cavaliers', homeWins: 48, homeLosses: 12, homeAvg: 118, homeLastScore: 125, homeLastOpp: 110, homeStreak: 5, homeOppPct: 0.59, awayCity: 'Indiana', awayName: 'Pacers', awayWins: 34, awayLosses: 26, awayAvg: 112, awayLastScore: 108, awayLastOpp: 115, awayStreak: -1, awayOppPct: 0.49, homeFinal: 122, awayFinal: 98, homeB2B: false, awayB2B: true },
    { date: '2025-11-05', homeCity: 'Chicago', homeName: 'Bulls', homeWins: 28, homeLosses: 32, homeAvg: 108, homeLastScore: 95, homeLastOpp: 105, homeStreak: -3, homeOppPct: 0.46, awayCity: 'Charlotte', awayName: 'Hornets', awayWins: 38, awayLosses: 22, awayAvg: 114, awayLastScore: 118, awayLastOpp: 110, awayStreak: 3, awayOppPct: 0.53, homeFinal: 95, awayFinal: 108, homeB2B: false, awayB2B: false },
    { date: '2025-11-05', homeCity: 'Minnesota', homeName: 'Timberwolves', homeWins: 46, homeLosses: 14, homeAvg: 116, homeLastScore: 122, homeLastOpp: 108, homeStreak: 4, homeOppPct: 0.57, awayCity: 'Portland', awayName: 'Trail Blazers', awayWins: 25, awayLosses: 35, awayAvg: 105, awayLastScore: 98, awayLastOpp: 112, awayStreak: -4, awayOppPct: 0.44, homeFinal: 119, awayFinal: 92, homeB2B: false, awayB2B: false },
    { date: '2025-11-05', homeCity: 'Sacramento', homeName: 'Kings', homeWins: 40, homeLosses: 20, homeAvg: 115, homeLastScore: 118, homeLastOpp: 115, homeStreak: 2, homeOppPct: 0.53, awayCity: 'Utah', awayName: 'Jazz', awayWins: 32, awayLosses: 28, awayAvg: 110, awayLastScore: 105, awayLastOpp: 108, awayStreak: -1, awayOppPct: 0.48, homeFinal: 112, awayFinal: 108, homeB2B: false, awayB2B: false },
    { date: '2025-11-05', homeCity: 'Houston', homeName: 'Rockets', homeWins: 42, homeLosses: 18, homeAvg: 114, homeLastScore: 118, homeLastOpp: 108, homeStreak: 3, homeOppPct: 0.55, awayCity: 'San Antonio', awayName: 'Spurs', awayWins: 30, awayLosses: 30, awayAvg: 108, awayLastScore: 102, awayLastOpp: 110, awayStreak: -2, awayOppPct: 0.47, homeFinal: 121, awayFinal: 105, homeB2B: false, awayB2B: false },
    { date: '2025-11-05', homeCity: 'Oklahoma City', homeName: 'Thunder', homeWins: 50, homeLosses: 10, homeAvg: 120, homeLastScore: 128, homeLastOpp: 112, homeStreak: 6, homeOppPct: 0.60, awayCity: 'New Orleans', awayName: 'Pelicans', awayWins: 28, awayLosses: 32, awayAvg: 106, awayLastScore: 98, awayLastOpp: 115, awayStreak: -3, awayOppPct: 0.45, homeFinal: 128, awayFinal: 95, homeB2B: false, awayB2B: false },
  ];

  try {
    console.log('🎲 Loading test data with real scoring engine...');

    for (const gameData of testGames) {
      const homeTeam = createMockTeam(
        gameData.homeCity.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
        gameData.homeCity,
        gameData.homeName,
        gameData.homeWins,
        gameData.homeLosses,
        gameData.homeAvg,
        gameData.homeLastScore,
        gameData.homeLastOpp,
        gameData.homeStreak,
        gameData.homeOppPct
      );

      const awayTeam = createMockTeam(
        gameData.awayCity.replace(/\s+/g, '').substring(0, 3).toUpperCase(),
        gameData.awayCity,
        gameData.awayName,
        gameData.awayWins,
        gameData.awayLosses,
        gameData.awayAvg,
        gameData.awayLastScore,
        gameData.awayLastOpp,
        gameData.awayStreak,
        gameData.awayOppPct
      );

      const gameId = `test-${gameData.date}-${gameData.homeCity}-${gameData.homeName}-vs-${gameData.awayCity}-${gameData.awayName}`.replace(/\s+/g, '-');

      const analysis = analyzeGame(
        gameId,
        homeTeam,
        awayTeam,
        gameData.homeB2B,
        gameData.awayB2B
      );

      const actualWinner = gameData.homeFinal > gameData.awayFinal ? 'home' : 'away';
      const predictionCorrect = analysis.recommendation.team === 'neutral' ? null : analysis.recommendation.team === actualWinner;

      const record = {
        game_date: gameData.date,
        game_id: gameId,
        home_team_id: homeTeam.id.toLowerCase(),
        home_team_name: `${homeTeam.city} ${homeTeam.name}`,
        away_team_id: awayTeam.id.toLowerCase(),
        away_team_name: `${awayTeam.city} ${awayTeam.name}`,
        home_research_score: analysis.homeAnalysis.totalScore,
        away_research_score: analysis.awayAnalysis.totalScore,
        score_differential: analysis.scoreDifferential,
        prediction: analysis.recommendation.team,
        prediction_confidence: analysis.recommendation.confidence,
        home_final_score: gameData.homeFinal,
        away_final_score: gameData.awayFinal,
        game_completed: true,
        prediction_correct: predictionCorrect,
        home_analysis_breakdown: analysis.homeAnalysis.breakdown,
        away_analysis_breakdown: analysis.awayAnalysis.breakdown
      };

      const { error } = await supabase
        .from('research_score_history')
        .upsert(record, { onConflict: 'game_id' });

      if (error) {
        console.error('Error inserting test game:', error);
      } else {
        console.log(`✅ Logged: ${record.away_team_name} @ ${record.home_team_name} (${record.away_research_score}-${record.home_research_score})`);
      }
    }

    console.log('✅ Test data loaded successfully with real scoring engine!');
  } catch (error) {
    console.error('Error loading test data:', error);
    throw error;
  }
}
