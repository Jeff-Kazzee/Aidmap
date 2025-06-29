/*
  # Aid Requests Table with Closure Features

  1. New Tables
    - `aid_requests` - Main table for aid requests with closure tracking
    - `messages` - Messages between users about aid requests

  2. Changes
    - Add fulfillment_status column for tracking fulfilled/unfulfilled
    - Add closed_at timestamp for closure tracking
    - Add closure_notes for user feedback
    - Add completed_at for completion tracking

  3. Security
    - Enable RLS on all tables
    - Add policies for user access control
*/

-- Create aid_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS aid_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  amount_algo numeric NOT NULL CHECK (amount_algo > 0),
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  address text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'funded', 'in_progress', 'completed', 'cancelled')),
  donor_id uuid REFERENCES profiles(id),
  proof_of_delivery_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  -- New columns for closure feature
  fulfillment_status text CHECK (fulfillment_status IN ('fulfilled', 'unfulfilled')),
  closed_at timestamptz,
  closure_notes text
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  post_id uuid REFERENCES aid_requests(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to existing aid_requests table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aid_requests' AND column_name = 'fulfillment_status'
  ) THEN
    ALTER TABLE aid_requests ADD COLUMN fulfillment_status text CHECK (fulfillment_status IN ('fulfilled', 'unfulfilled'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aid_requests' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE aid_requests ADD COLUMN closed_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aid_requests' AND column_name = 'closure_notes'
  ) THEN
    ALTER TABLE aid_requests ADD COLUMN closure_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE aid_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Aid requests policies
CREATE POLICY "Anyone can read open aid requests"
  ON aid_requests
  FOR SELECT
  TO authenticated
  USING (status = 'open' OR user_id = auth.uid() OR donor_id = auth.uid());

CREATE POLICY "Users can create their own aid requests"
  ON aid_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own aid requests"
  ON aid_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR donor_id = auth.uid());

CREATE POLICY "Users can delete their own aid requests"
  ON aid_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'open');

-- Messages policies
CREATE POLICY "Users can read messages for their aid requests"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM aid_requests 
      WHERE id = post_id AND (user_id = auth.uid() OR donor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS aid_requests_user_id_idx ON aid_requests (user_id);
CREATE INDEX IF NOT EXISTS aid_requests_donor_id_idx ON aid_requests (donor_id);
CREATE INDEX IF NOT EXISTS aid_requests_status_idx ON aid_requests (status);
CREATE INDEX IF NOT EXISTS aid_requests_created_at_idx ON aid_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS aid_requests_lat_lng_idx ON aid_requests (lat, lng);
CREATE INDEX IF NOT EXISTS aid_requests_fulfillment_status_idx ON aid_requests (fulfillment_status);
CREATE INDEX IF NOT EXISTS messages_post_id_idx ON messages (post_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);