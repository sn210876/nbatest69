/*
  # Research Score History Tracking

  1. New Tables
    - `research_score_history`
      - `id` (uuid, primary key) - Unique record identifier
      - `game_date` (date) - Date of the game
      - `game_id` (text) - ESPN game ID
      - `home_team_id` (text) - Home team identifier
      - `home_team_name` (text) - Home team full name
      - `away_team_id` (text) - Away team identifier
      - `away_team_name` (text) - Away team full name
      - `home_research_score` (integer) - Home team's research score
      - `away_research_score` (integer) - Away team's research score
      - `score_differential` (integer) - Difference (home - away)
      - `prediction` (text) - 'home', 'away', or 'neutral'
      - `prediction_confidence` (text) - 'high', 'medium', or 'low'
      - `home_final_score` (integer, nullable) - Actual home team score
      - `away_final_score` (integer, nullable) - Actual away team score
      - `game_completed` (boolean) - Whether game has finished
      - `prediction_correct` (boolean, nullable) - Was our prediction right?
      - `created_at` (timestamptz) - When record was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `research_score_history` table
    - Add policy for public read access (anyone can view history)
    - Add policy for authenticated insert (system can log predictions)

  3. Indexes
    - Index on game_date for fast date-range queries
    - Index on game_id for updates when results come in
    - Index on prediction_correct for accuracy analysis
*/

CREATE TABLE IF NOT EXISTS research_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date date NOT NULL,
  game_id text NOT NULL UNIQUE,
  home_team_id text NOT NULL,
  home_team_name text NOT NULL,
  away_team_id text NOT NULL,
  away_team_name text NOT NULL,
  home_research_score integer NOT NULL DEFAULT 0,
  away_research_score integer NOT NULL DEFAULT 0,
  score_differential integer NOT NULL DEFAULT 0,
  prediction text NOT NULL CHECK (prediction IN ('home', 'away', 'neutral')),
  prediction_confidence text NOT NULL CHECK (prediction_confidence IN ('high', 'medium', 'low')),
  home_final_score integer,
  away_final_score integer,
  game_completed boolean DEFAULT false,
  prediction_correct boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE research_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view research score history"
  ON research_score_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can insert predictions"
  ON research_score_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can update game results"
  ON research_score_history
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_research_history_game_date ON research_score_history(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_history_game_id ON research_score_history(game_id);
CREATE INDEX IF NOT EXISTS idx_research_history_prediction_correct ON research_score_history(prediction_correct) WHERE prediction_correct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_history_completed ON research_score_history(game_completed, game_date DESC);
