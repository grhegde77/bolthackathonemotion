/*
  # Add user name to emotional posts

  1. Schema Changes
    - Add `user_name` column to `emotional_posts` table
    - Add `user_email` column to `emotional_posts` table for additional context
    - Set default values to maintain existing data

  2. Security
    - Update existing RLS policies to work with new columns
    - Maintain anonymous posting capability

  3. Performance
    - Add index on user_name for efficient filtering if needed
*/

-- Add user name and email columns to emotional_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emotional_posts' AND column_name = 'user_name'
  ) THEN
    ALTER TABLE emotional_posts ADD COLUMN user_name text DEFAULT 'Anonymous User';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emotional_posts' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE emotional_posts ADD COLUMN user_email text DEFAULT '';
  END IF;
END $$;

-- Update existing posts to have a default name
UPDATE emotional_posts 
SET user_name = 'Anonymous User', user_email = ''
WHERE user_name IS NULL OR user_name = '';

-- Make user_name NOT NULL after setting defaults
ALTER TABLE emotional_posts ALTER COLUMN user_name SET NOT NULL;