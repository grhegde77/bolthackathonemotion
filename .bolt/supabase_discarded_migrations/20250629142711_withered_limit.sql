/*
  # Create posts table with RLS policies

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `emotions` (text array, default empty array)
      - `hearts` (integer, default 0)
      - `comments` (integer, default 0)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `posts` table
    - Add policies for anonymous and authenticated users to read, create, and update posts

  3. Indexes
    - Add index on created_at for efficient ordering

  4. Triggers
    - Add trigger to automatically update updated_at column
*/

-- Create the posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  emotions text[] DEFAULT '{}'::text[] NOT NULL,
  hearts integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
  DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
  DROP POLICY IF EXISTS "Anyone can update posts" ON posts;
  
  -- Create new policies
  CREATE POLICY "Anyone can read posts"
    ON posts
    FOR SELECT
    TO anon, authenticated
    USING (true);

  CREATE POLICY "Anyone can create posts"
    ON posts
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

  CREATE POLICY "Anyone can update posts"
    ON posts
    FOR UPDATE
    TO anon, authenticated
    USING (true);
END $$;

-- Create index for efficient ordering by created_at
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();