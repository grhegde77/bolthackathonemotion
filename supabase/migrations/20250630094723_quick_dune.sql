/*
  # Create comments table for emotional posts

  1. New Tables
    - `post_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to emotional_posts)
      - `content` (text, comment content)
      - `user_name` (text, commenter name)
      - `user_email` (text, commenter email)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `post_comments` table
    - Add policies for anonymous read/write access

  3. Performance
    - Add indexes for efficient querying by post_id
    - Add trigger for automatic updated_at timestamp
*/

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES emotional_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous User',
  user_email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can create comments"
  ON post_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read comments"
  ON post_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update comments"
  ON post_comments
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete comments"
  ON post_comments
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_created_at_idx ON post_comments(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();