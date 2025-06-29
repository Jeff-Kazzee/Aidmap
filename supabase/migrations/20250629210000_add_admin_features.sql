/*
  # Add Admin Features and Edit Capabilities

  1. Changes
    - Add is_admin flag to profiles table
    - Set jeffkazzee@gmail.com as admin
    - Add edit tracking columns to aid_requests
    - Create edit history table
    - Update RLS policies for admin access

  2. Security
    - Only admins can access all requests
    - Users can only edit their own requests
    - Full audit trail for edits
*/

-- Add is_admin column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set jeffkazzee@gmail.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jeffkazzee@gmail.com'
);

-- Add edit tracking columns to aid_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aid_requests' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE aid_requests ADD COLUMN last_edited_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aid_requests' AND column_name = 'edit_count'
  ) THEN
    ALTER TABLE aid_requests ADD COLUMN edit_count integer DEFAULT 0;
  END IF;
END $$;

-- Create edit history table for audit trail
CREATE TABLE IF NOT EXISTS aid_request_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES aid_requests(id) ON DELETE CASCADE,
  edited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  edited_at timestamptz DEFAULT now()
);

-- Enable RLS on edit history table
ALTER TABLE aid_request_edits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can do anything" ON aid_requests;
DROP POLICY IF EXISTS "Users can delete their own aid requests" ON aid_requests;

-- Create new comprehensive policies for aid_requests
CREATE POLICY "Admins can view all requests"
  ON aid_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR status = 'open' 
    OR user_id = auth.uid() 
    OR donor_id = auth.uid()
  );

CREATE POLICY "Admins can update any request"
  ON aid_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can delete any request"
  ON aid_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR (user_id = auth.uid() AND status = 'open')
  );

-- Policies for edit history
CREATE POLICY "Users can view edit history for their requests"
  ON aid_request_edits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM aid_requests 
      WHERE id = request_id 
      AND (user_id = auth.uid() OR donor_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Anyone can insert edit history"
  ON aid_request_edits
  FOR INSERT
  TO authenticated
  WITH CHECK (edited_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles (is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS aid_request_edits_request_id_idx ON aid_request_edits (request_id);
CREATE INDEX IF NOT EXISTS aid_request_edits_edited_by_idx ON aid_request_edits (edited_by);
CREATE INDEX IF NOT EXISTS aid_request_edits_edited_at_idx ON aid_request_edits (edited_at DESC);

-- Create function to automatically track edits
CREATE OR REPLACE FUNCTION track_aid_request_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    -- Insert edit history
    INSERT INTO aid_request_edits (request_id, edited_by, old_values, new_values)
    VALUES (
      NEW.id,
      auth.uid(),
      to_jsonb(OLD) - 'updated_at' - 'last_edited_at' - 'edit_count',
      to_jsonb(NEW) - 'updated_at' - 'last_edited_at' - 'edit_count'
    );
    
    -- Update edit tracking columns
    NEW.last_edited_at = now();
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for edit tracking
DROP TRIGGER IF EXISTS track_aid_request_edits ON aid_requests;
CREATE TRIGGER track_aid_request_edits
  BEFORE UPDATE ON aid_requests
  FOR EACH ROW
  EXECUTE FUNCTION track_aid_request_edit();