/*
  # Fix user profile RLS policy for signup

  1. Policy Changes
    - Drop the existing restrictive INSERT policy that prevents signup
    - Create a new INSERT policy that allows profile creation during signup
    - The policy will allow INSERT when the user ID matches the authenticated user ID
    - This handles both authenticated users and the signup process correctly

  2. Security
    - Maintains security by ensuring users can only create profiles for themselves
    - Uses auth.uid() to verify the user identity
    - Keeps existing SELECT and UPDATE policies intact
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create a new INSERT policy that works during signup
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the policy for reading own profile exists and is correct
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the policy for updating own profile exists and is correct
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep the policy that allows authenticated users to read other profiles
-- This is already in place according to the schema