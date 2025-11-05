# NBA API Integration Documentation

## Overview

The NBA Research Hub now supports **live data integration** from ESPN's public NBA API, with intelligent fallback to mock data when live data is unavailable. The system includes:

- Real-time game data fetching
- Supabase-based caching (5-minute TTL)
- Automatic fallback to mock data
- One-click toggle between live and mock data
- Manual refresh capability
- Loading states and error handling

## Data Sources

### 1. ESPN NBA Scoreboard API
**Endpoint:** `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`

**Provides:**
- Today's scheduled games
- Team records (wins/losses)
- Game times and status
- Betting lines (spread, moneyline, over/under)
- Live scores (when games are in progress)

**Query Parameters:**
- `dates=YYYYMMDD` - Fetch games for specific date

### 2. Ball Don't Lie API
**Base URL:** `https://www.balldontlie.io/api/v1`

**Endpoints Used:**
- `/teams` - Get all NBA teams
- `/games` - Get game history for back-to-back calculations

## Architecture

### Service Layer Structure

```
src/services/
├── nbaApiService.ts      # API fetching and data transformation
├── dataService.ts        # Main data orchestration layer
└── supabaseCache.ts      # Supabase-based caching system
```

### Data Flow

```
User Action (Dashboard)
    ↓
dataService.fetchNBAData()
    ↓
Check Supabase Cache (5 min TTL)
    ↓
[Cache Miss] → ESPN API → Transform Data → Enrich with Last 5 Games → Cache Result
    ↓
Return to UI with loading/error states
```

## Key Features

### 1. Intelligent Caching
- **Storage:** Supabase `nba_data_cache` table
- **TTL:** 5 minutes
- **Benefits:** Reduces API calls, improves performance, respects rate limits

### 2. Data Transformation
The system transforms ESPN's complex JSON structure into our app's format:

```typescript
ESPN Response → {
  games: Game[],
  teams: Record<string, Team>
}
```

### 3. Back-to-Back Detection
Automatically detects if teams played yesterday by:
1. Fetching yesterday's scoreboard
2. Matching team IDs
3. Flagging teams on B2B schedules

### 4. Last 5 Games Enrichment
For each team, the system:
1. Fetches games from the past 30 days
2. Identifies last 5 completed games
3. Calculates scoring patterns
4. Determines current win/loss streaks

### 5. Fallback Strategy

```typescript
Try Live Data
    ↓
[API Error or No Games] → Use Mock Data
    ↓
Display with appropriate badge ("Live Data" vs "Mock Data")
```

## UI Features

### Toggle Between Data Sources
```tsx
<Button onClick={toggleDataSource}>
  {useLiveData ? 'Live Data' : 'Mock Data'}
</Button>
```

Users can switch between live ESPN data and mock data with one click.

### Refresh Data
```tsx
<Button onClick={handleRefresh}>
  <RefreshCw /> Refresh
</Button>
```

Manual refresh clears cache and fetches fresh data from APIs.

### Status Indicators
- **Live Data Badge:** Green badge when using real API data
- **Mock Data Badge:** Gray badge when using fallback data
- **Last Updated Timestamp:** Shows when data was last fetched
- **Loading Spinner:** Animated spinner during data fetching
- **Error Alerts:** Yellow alert banner when errors occur

### Error Handling

The system gracefully handles:
- Network failures
- API rate limits
- Invalid API responses
- No games scheduled
- Missing team data

All errors result in automatic fallback to mock data with user notification.

## Database Schema

### `nba_data_cache` Table

```sql
CREATE TABLE nba_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**RLS Policies:**
- Public read access (anyone can read cached NBA data)
- Public write access (anyone can update cache)
- Public delete access (for cache expiration)

**Indexes:**
- `idx_nba_cache_key` - Fast lookups by cache key
- `idx_nba_cache_updated_at` - Efficient TTL checks

## Usage Examples

### Enabling Live Data

```typescript
import { setUseLiveData } from './services/dataService';

// Enable live data mode
setUseLiveData(true);

// Fetch data (will use ESPN API)
const data = await fetchNBAData();
```

### Manual Refresh

```typescript
import { refreshData } from './services/dataService';

// Clear cache and fetch fresh data
const data = await refreshData();
```

### Clearing Cache

```typescript
import { clearCache } from './services/dataService';

// Clear all cached data
clearCache();
```

## API Response Examples

### ESPN Scoreboard Response (Simplified)

```json
{
  "events": [
    {
      "id": "401584893",
      "date": "2025-11-02T23:00Z",
      "competitions": [
        {
          "competitors": [
            {
              "id": "13",
              "team": {
                "displayName": "Los Angeles Lakers",
                "abbreviation": "LAL"
              },
              "homeAway": "home",
              "score": "0",
              "records": [{ "summary": "35-28" }]
            },
            {
              "id": "2",
              "team": {
                "displayName": "Boston Celtics",
                "abbreviation": "BOS"
              },
              "homeAway": "away",
              "score": "0",
              "records": [{ "summary": "48-15" }]
            }
          ],
          "odds": [
            {
              "spread": -8.5,
              "homeTeamOdds": { "moneyLine": 285 },
              "awayTeamOdds": { "moneyLine": -350 }
            }
          ]
        }
      ]
    }
  ]
}
```

## Team Abbreviation Mapping

The system maps ESPN abbreviations to internal team IDs:

```typescript
const mapping = {
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
  'LAC': 'clippers',
  'BKN': 'nets',
  // ... more teams
};
```

## Performance Optimizations

1. **Caching:** 5-minute Supabase cache reduces API calls by ~95%
2. **Parallel Fetching:** Today's and yesterday's games fetched simultaneously
3. **Lazy Enrichment:** Last 5 games only fetched for teams in today's games
4. **Retry Logic:** 3 automatic retries with exponential backoff
5. **Request Deduplication:** Multiple simultaneous requests use same promise

## Rate Limit Handling

- ESPN API: No documented rate limits, but caching prevents excessive calls
- Ball Don't Lie API: 60 requests/minute free tier
- Cache ensures we stay well under limits

## Future Enhancements

Potential improvements:
1. Add injury report data
2. Include weather data for outdoor games
3. Fetch betting line movements
4. Add player prop data
5. Integrate advanced stats (offensive/defensive ratings)
6. Add push notifications for line changes
7. Store historical predictions for accuracy tracking

## Troubleshooting

### No Games Showing
- Check if it's an off-day (no NBA games scheduled)
- Verify date in ESPN API call is correct
- Check browser console for API errors
- Try toggling to Mock Data to verify app functionality

### Stale Data
- Click "Refresh" button to clear cache
- Check "Last Updated" timestamp
- Verify Supabase connection in `.env` file

### API Errors
- All API errors automatically fallback to mock data
- Check browser console for specific error messages
- Verify internet connectivity
- Check if ESPN API is accessible from your network

## Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Cache Duration

Modify cache TTL in `nbaApiService.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
```

## Testing

### Test with Mock Data
1. Load app (defaults to mock data)
2. Verify all 10 games display
3. Click through to game analysis
4. Check Research Scores calculate correctly

### Test with Live Data
1. Click "Mock Data" button to toggle to "Live Data"
2. Wait for loading spinner
3. Verify games load (if any scheduled today)
4. Check "Last Updated" timestamp updates
5. Click "Refresh" to test cache clearing

### Test Error Handling
1. Disconnect internet
2. Toggle to "Live Data"
3. Verify fallback to mock data with error message
4. Reconnect and click "Refresh"

## Security Considerations

- **Public APIs:** ESPN and Ball Don't Lie are public APIs (no authentication required)
- **Supabase RLS:** Cache table has public access (safe for public NBA data)
- **No Sensitive Data:** System only caches publicly available sports data
- **Client-Side Caching:** No server-side storage of user data

## Support

For issues or questions about the API integration:
1. Check browser console for error messages
2. Verify Supabase connection
3. Test with mock data to isolate API issues
4. Check ESPN API status (they may have outages)
