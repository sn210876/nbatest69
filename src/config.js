export const config = {
  // API Keys
  oddsApiKey: '7c326dbb1b236e8bfbd9724db3d9dfb2',
  
  // API Base URLs
  espnApiBaseUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
  oddsApiBaseUrl: 'https://api.the-odds-api.com/v4',
  
  // CORS Proxy (use if needed)
  corsProxy: 'https://api.allorigins.win/raw?url=',
  useCorsProxy: false, // toggle if CORS issues occur
  
  // Cache settings
  cacheTimeout: 30 * 60 * 1000, // 30 minutes
  
  // API endpoints
  endpoints: {
    espnScoreboard: '/scoreboard',
    oddsNBA: '/sports/basketball_nba/odds/',
  },
};

// Helper function to build full URLs
export const buildUrl = (service, endpoint, params = {}) => {
  const baseUrl = service === 'espn' ? config.espnApiBaseUrl : config.oddsApiBaseUrl;
  const url = new URL(baseUrl + endpoint);
  
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });
  
  return config.useCorsProxy ? config.corsProxy + encodeURIComponent(url.toString()) : url.toString();
};

2. Update dataService.js to import and use this config:

import { config, buildUrl } from './config';

// Example fetch for ESPN:
const espnUrl = buildUrl('espn', config.endpoints.espnScoreboard);
const response = await fetch(espnUrl);

// Example fetch for Odds API:
const oddsUrl = buildUrl('odds', config.endpoints.oddsNBA, {
  apiKey: config.oddsApiKey,
  regions: 'us',
  markets: 'spreads,h2h',
  oddsFormat: 'american'
});
const oddsResponse = await fetch(oddsUrl);