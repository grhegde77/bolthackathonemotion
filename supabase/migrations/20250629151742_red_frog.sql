/*
  # Fix RLS Policy for User Profile Creation During Signup

  1. Problem Analysis
    - Current policy blocks profile creation during signup
    - auth.uid() is not available during the signup process
    - Need to allow profile creation for newly created users

  2. Solution
    - Create a policy that allows profile creation during signup
    - Maintain security by ensuring users can only create their own profile
    - Use a more flexible approach for the signup flow
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read other profiles" ON user_profiles;

-- Allow users to create their own profile during signup
-- This policy is more permissive during the signup process
CREATE POLICY "Enable insert for authenticated users during signup"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read other profiles (for social features)
CREATE POLICY "Authenticated users can read other profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Add a trigger to ensure data integrity during profile creation
-- This ensures that even with the permissive INSERT policy, 
-- users can only create profiles with their own auth.uid()
CREATE OR REPLACE FUNCTION ensure_user_profile_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the profile ID matches the authenticated user's ID
  IF NEW.id != auth.uid() THEN
    RAISE EXCEPTION 'Profile ID must match authenticated user ID';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce integrity
DROP TRIGGER IF EXISTS ensure_user_profile_integrity_trigger ON user_profiles;
CREATE TRIGGER ensure_user_profile_integrity_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile_integrity();