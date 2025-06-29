/*
  # Add reputation score to profiles

  1. Changes
    - Add reputation_score column to profiles table with default value of 0
    - Update existing profiles to have reputation_score of 0
    - Add index for reputation_score for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add reputation_score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reputation_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reputation_score integer DEFAULT 0;
  END IF;
END $$;

-- Update existing profiles to have reputation_score of 0 if null
UPDATE profiles SET reputation_score = 0 WHERE reputation_score IS NULL;

-- Add index for reputation_score
CREATE INDEX IF NOT EXISTS profiles_reputation_idx ON profiles (reputation_score);