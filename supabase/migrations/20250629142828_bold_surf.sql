/*
  # Create emotional_posts table

  1. New Tables
    - `emotional_posts`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `emotions` (text array, default empty array)
      - `hearts` (integer, default 0)
      - `comments` (integer, default 0)
      - `created_at` (timestamp with timezone, default now)
      - `updated_at` (timestamp with timezone, default now)

  2. Security
    - Enable RLS on `emotional_posts` table
    - Add policies for anonymous read, create, and update access

  3. Performance
    - Add index on created_at for efficient ordering
    - Add trigger for automatic updated_at timestamp updates
*/

-- Create the emotional_posts table
CREATE TABLE IF NOT EXISTS emotional_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  emotions text[] DEFAULT '{}'::text[] NOT NULL,
  hearts integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE emotional_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anonymous emotional sharing)
CREATE POLICY "Anyone can read emotional posts"
  ON emotional_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create emotional posts"
  ON emotional_posts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update emotional posts"
  ON emotional_posts
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create index for efficient ordering by created_at
CREATE INDEX IF NOT EXISTS emotional_posts_created_at_idx ON emotional_posts (created_at DESC);

-- Create function to update updated_at column (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_emotional_posts_updated_at
  BEFORE UPDATE ON emotional_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();