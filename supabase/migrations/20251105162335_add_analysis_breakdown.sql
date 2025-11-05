/*
  # Add Analysis Breakdown to History

  1. Changes
    - Add `home_analysis_breakdown` (jsonb) - Stores home team's detailed scoring breakdown
    - Add `away_analysis_breakdown` (jsonb) - Stores away team's detailed scoring breakdown

  2. Purpose
    - Allow viewing the detailed point-by-point breakdown that led to research scores
    - Store which variables contributed to each team's score for historical analysis
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_score_history' AND column_name = 'home_analysis_breakdown'
  ) THEN
    ALTER TABLE research_score_history ADD COLUMN home_analysis_breakdown jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_score_history' AND column_name = 'away_analysis_breakdown'
  ) THEN
    ALTER TABLE research_score_history ADD COLUMN away_analysis_breakdown jsonb;
  END IF;
END $$;
