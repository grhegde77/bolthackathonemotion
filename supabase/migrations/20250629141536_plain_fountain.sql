/*
  # Create posts table for emotional support app

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `content` (text, the post content)
      - `emotions` (text array, selected emotions)
      - `hearts` (integer, number of hearts/likes)
      - `comments` (integer, number of comments)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `posts` table
    - Add policy for anyone to read posts (anonymous sharing)
    - Add policy for anyone to create posts (anonymous posting)
    - Add policy for anyone to update posts (for hearts/likes)
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  emotions text[] NOT NULL DEFAULT '{}',
  hearts integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts (anonymous sharing)
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to create posts (anonymous posting)
CREATE POLICY "Anyone can create posts"
  ON posts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update posts (for hearts/likes)
CREATE POLICY "Anyone can update posts"
  ON posts
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();