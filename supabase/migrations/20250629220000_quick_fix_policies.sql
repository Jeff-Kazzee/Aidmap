/*
  # Quick Fix for Delete and Update Policies

  This migration adds the missing policies for delete operations
  and ensures users can manage their own requests properly.
*/

-- Drop any existing delete policy
DROP POLICY IF EXISTS "Users can delete their own aid requests" ON aid_requests;

-- Create a new delete policy that allows users to delete their own open requests
CREATE POLICY "Users can delete their own open requests"
  ON aid_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'open');

-- Ensure update policy exists
DROP POLICY IF EXISTS "Users can update their own aid requests" ON aid_requests;

CREATE POLICY "Users can update their own aid requests"
  ON aid_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- For immediate use, ensure aid_requests table has proper RLS
ALTER TABLE aid_requests ENABLE ROW LEVEL SECURITY;