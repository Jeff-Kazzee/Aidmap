/*
  # Community Chat System Migration

  1. New Tables
    - `neighborhoods` - Geographic community boundaries with location data
    - `user_verifications` - Identity verification tracking system
    - `community_messages` - Public neighborhood discussions and aid requests
    - `direct_messages` - Private conversations between verified users
    - `message_reports` - Safety reporting system for inappropriate content

  2. Profile Enhancements
    - Add neighborhood association
    - Add verification status
    - Add location coordinates
    - Add bio and skills for community matching

  3. Security
    - Enable RLS on all new tables
    - Add policies for neighborhood-based access control
    - Restrict direct messaging to verified users only
    - Allow users to manage their own data

  4. Performance
    - Add indexes for location queries and message filtering
    - Optimize for real-time chat performance
*/

-- Create neighborhoods table
CREATE TABLE IF NOT EXISTS neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  city text,
  zip_code text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  radius_miles numeric DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Create user verifications table
CREATE TABLE IF NOT EXISTS user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('phone', 'address', 'id_document', 'community_voucher')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  verification_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, verification_type)
);

-- Create community messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  neighborhood_id uuid REFERENCES neighborhoods(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('help_needed', 'help_offered', 'general_discussion')),
  title text,
  content text NOT NULL,
  urgency text DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  category text CHECK (category IN ('errands', 'repairs', 'advice', 'transportation', 'childcare', 'medical', 'food', 'housing', 'other')),
  compensation_offered text,
  time_frame text,
  skills_needed text[],
  location_lat numeric,
  location_lng numeric,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create message reports table
CREATE TABLE IF NOT EXISTS message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid,
  message_type text NOT NULL CHECK (message_type IN ('community', 'direct')),
  report_reason text NOT NULL CHECK (report_reason IN ('spam', 'harassment', 'inappropriate_content', 'scam', 'safety_concern', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Update profiles table to include neighborhood and verification info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'neighborhood_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN neighborhood_id uuid REFERENCES neighborhoods(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lat numeric;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lng'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lng numeric;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills text[];
  END IF;
END $$;

-- Enable RLS
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Neighborhoods policies
CREATE POLICY "Anyone can read neighborhoods"
  ON neighborhoods
  FOR SELECT
  TO authenticated
  USING (true);

-- User verifications policies
CREATE POLICY "Users can read own verifications"
  ON user_verifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own verifications"
  ON user_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Community messages policies
CREATE POLICY "Users can read messages in their neighborhood"
  ON community_messages
  FOR SELECT
  TO authenticated
  USING (
    neighborhood_id IN (
      SELECT neighborhood_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their neighborhood"
  ON community_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    neighborhood_id IN (
      SELECT neighborhood_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON community_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Direct messages policies
CREATE POLICY "Users can read their direct messages"
  ON direct_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Verified users can send direct messages"
  ON direct_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_verified = true)
  );

-- Message reports policies
CREATE POLICY "Users can create reports"
  ON message_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can read own reports"
  ON message_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Create indexes for performance (without PostGIS functions)
CREATE INDEX IF NOT EXISTS neighborhoods_lat_lng_idx ON neighborhoods (lat, lng);
CREATE INDEX IF NOT EXISTS neighborhoods_state_idx ON neighborhoods (state);
CREATE INDEX IF NOT EXISTS community_messages_neighborhood_idx ON community_messages (neighborhood_id);
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON community_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS community_messages_type_idx ON community_messages (message_type);
CREATE INDEX IF NOT EXISTS community_messages_user_idx ON community_messages (user_id);
CREATE INDEX IF NOT EXISTS direct_messages_sender_idx ON direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS direct_messages_receiver_idx ON direct_messages (receiver_id);
CREATE INDEX IF NOT EXISTS direct_messages_created_at_idx ON direct_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS user_verifications_user_idx ON user_verifications (user_id);
CREATE INDEX IF NOT EXISTS user_verifications_status_idx ON user_verifications (status);
CREATE INDEX IF NOT EXISTS profiles_neighborhood_idx ON profiles (neighborhood_id);
CREATE INDEX IF NOT EXISTS profiles_verified_idx ON profiles (is_verified);

-- Insert some sample neighborhoods
INSERT INTO neighborhoods (name, state, city, zip_code, lat, lng, radius_miles) VALUES
  ('Downtown Manhattan', 'NY', 'New York', '10001', 40.7505, -73.9934, 2),
  ('Brooklyn Heights', 'NY', 'Brooklyn', '11201', 40.6962, -73.9936, 3),
  ('Mission District', 'CA', 'San Francisco', '94110', 37.7599, -122.4148, 2),
  ('Capitol Hill', 'WA', 'Seattle', '98102', 47.6205, -122.3212, 2),
  ('South Beach', 'FL', 'Miami', '33139', 25.7907, -80.1300, 3),
  ('Austin Downtown', 'TX', 'Austin', '78701', 30.2672, -97.7431, 3),
  ('Denver LoDo', 'CO', 'Denver', '80202', 39.7539, -105.0178, 2),
  ('Portland Pearl District', 'OR', 'Portland', '97209', 45.5272, -122.6819, 2),
  ('Chicago Loop', 'IL', 'Chicago', '60601', 41.8781, -87.6298, 2),
  ('Boston Back Bay', 'MA', 'Boston', '02116', 42.3505, -71.0759, 2)
ON CONFLICT DO NOTHING;