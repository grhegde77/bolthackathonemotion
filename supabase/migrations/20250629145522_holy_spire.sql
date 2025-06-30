/*
  # Create companion conversation and reaction system

  1. New Tables
    - `companion_conversations`
      - `id` (uuid, primary key)
      - `session_id` (text, to group messages in a conversation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `companion_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to companion_conversations)
      - `content` (text, message content)
      - `is_user` (boolean, true if user message, false if AI)
      - `message_type` (text, 'normal', 'warning', 'resource')
      - `created_at` (timestamp)
    
    - `companion_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, foreign key to companion_messages)
      - `reaction_type` (text, 'helpful', 'not_helpful', 'heart', 'thumbs_up', 'thumbs_down')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous read/write access

  3. Performance
    - Add indexes for efficient querying
    - Add triggers for automatic timestamp updates
*/

-- Create companion_conversations table
CREATE TABLE IF NOT EXISTS companion_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companion_messages table
CREATE TABLE IF NOT EXISTS companion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES companion_conversations(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_user boolean NOT NULL DEFAULT false,
  message_type text DEFAULT 'normal' CHECK (message_type IN ('normal', 'warning', 'resource')),
  created_at timestamptz DEFAULT now()
);

-- Create companion_reactions table
CREATE TABLE IF NOT EXISTS companion_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES companion_messages(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('helpful', 'not_helpful', 'heart', 'thumbs_up', 'thumbs_down')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companion_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Anyone can create conversations"
  ON companion_conversations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read conversations"
  ON companion_conversations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update conversations"
  ON companion_conversations
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON companion_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
  ON companion_messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create reactions"
  ON companion_reactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read reactions"
  ON companion_reactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update reactions"
  ON companion_reactions
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete reactions"
  ON companion_reactions
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS companion_conversations_session_id_idx ON companion_conversations(session_id);
CREATE INDEX IF NOT EXISTS companion_messages_conversation_id_idx ON companion_messages(conversation_id);
CREATE INDEX IF NOT EXISTS companion_messages_created_at_idx ON companion_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS companion_reactions_message_id_idx ON companion_reactions(message_id);

-- Create trigger to update updated_at on conversations
CREATE TRIGGER update_companion_conversations_updated_at
  BEFORE UPDATE ON companion_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();