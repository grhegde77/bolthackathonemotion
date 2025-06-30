/*
  # Clean up and fix user_profiles RLS policies

  1. Policy Cleanup
    - Remove all existing conflicting policies
    - Remove duplicate triggers and functions
  
  2. Recreate Proper Policies
    - Enable proper INSERT policy for signup flow
    - Maintain security with database trigger
    - Allow users to read/update their own profiles
    - Allow authenticated users to read other profiles for social features

  3. Security
    - Use database trigger to enforce profile creation integrity
    - Maintain RLS for all operations
*/

-- Clean up existing policies (remove all to avoid conflicts)
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read other profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON user_profiles;

-- Clean up existing triggers and functions
DROP TRIGGER IF EXISTS ensure_user_profile_integrity_trigger ON user_profiles;
DROP FUNCTION IF EXISTS ensure_user_profile_integrity();

-- Recreate the integrity function
CREATE OR REPLACE FUNCTION ensure_user_profile_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the profile ID matches the authenticated user's ID
  IF NEW.id != auth.uid() THEN
    RAISE EXCEPTION 'Profile ID must match authenticated user ID. Expected: %, Got: %', auth.uid(), NEW.id;
  END IF;
  
  -- Ensure email matches the authenticated user's email
  IF NEW.email != auth.email() THEN
    RAISE EXCEPTION 'Profile email must match authenticated user email';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the integrity trigger
CREATE TRIGGER ensure_user_profile_integrity_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile_integrity();

-- Create clean, non-conflicting policies

-- 1. INSERT Policy: Allow authenticated users to create profiles (with trigger enforcement)
CREATE POLICY "Enable insert for authenticated users during signup"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. SELECT Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. SELECT Policy: Authenticated users can read other profiles (for social features)
CREATE POLICY "Authenticated users can read other profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. UPDATE Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean up any orphaned user profiles that might exist
-- (This removes profiles that don't have corresponding auth users)
DO $$
BEGIN
  -- Only run cleanup if there are profiles to clean
  IF EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
    DELETE FROM user_profiles 
    WHERE id NOT IN (
      SELECT id FROM auth.users
    );
    
    RAISE NOTICE 'Cleaned up orphaned user profiles';
  END IF;
END $$;