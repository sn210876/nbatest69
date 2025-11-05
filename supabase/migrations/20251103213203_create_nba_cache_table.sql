/*
  # Create NBA Data Cache Table

  1. New Tables
    - `nba_data_cache`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Cache key identifier
      - `data` (jsonb) - Cached JSON data
      - `created_at` (timestamptz) - When cache entry was created
      - `updated_at` (timestamptz) - When cache entry was last updated

  2. Security
    - Enable RLS on `nba_data_cache` table
    - Add policy for public read access (anyone can read cached data)
    - Add policy for public write access (anyone can update cache)
    
  3. Notes
    - This table stores API responses to reduce external API calls
    - Cache entries expire after 5 minutes (handled in application layer)
    - Public access is safe since this only contains publicly available NBA data
*/

CREATE TABLE IF NOT EXISTS nba_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nba_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached NBA data"
  ON nba_data_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert cached NBA data"
  ON nba_data_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update cached NBA data"
  ON nba_data_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete cached NBA data"
  ON nba_data_cache
  FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_nba_cache_key ON nba_data_cache(key);
CREATE INDEX IF NOT EXISTS idx_nba_cache_updated_at ON nba_data_cache(updated_at);
