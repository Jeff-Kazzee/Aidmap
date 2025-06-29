-- Demo Data for AidMap Hackathon Presentation
-- Run this in your Supabase SQL Editor to create mock aid requests

-- First, ensure you have some test users
-- You'll need to sign up with these emails first:
-- 1. jeffkazzee@gmail.com (admin)
-- 2. sarah.demo@example.com (requester)
-- 3. john.demo@example.com (helper)

-- After signing up, get the user IDs and replace these placeholders:
-- Replace 'YOUR_USER_ID' with the actual user ID from auth.users table
-- Replace 'SARAH_USER_ID' with Sarah's user ID
-- Replace 'JOHN_USER_ID' with John's user ID

-- To find user IDs, run:
-- SELECT id, email FROM auth.users WHERE email IN ('jeffkazzee@gmail.com', 'sarah.demo@example.com', 'john.demo@example.com');

-- Create demo aid requests
INSERT INTO aid_requests (
  user_id,
  title,
  description,
  category,
  urgency,
  amount_algo,
  lat,
  lng,
  address,
  status,
  created_at
) VALUES
-- NYC - Times Square area
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Insulin needed urgently for diabetic neighbor',
  'My elderly neighbor ran out of insulin and can''t get to pharmacy until Monday. Need help covering cost. This is time-sensitive as they need it today.',
  'medical',
  'critical',
  85.00,
  40.7580,
  -73.9855,
  '1515 Broadway, New York, NY',
  'open',
  NOW() - INTERVAL '2 hours'
),

-- Brooklyn
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Groceries for family of 5 after job loss',
  'Lost my job last week, need help feeding my kids until unemployment kicks in. Any help appreciated. We just need basics - milk, bread, eggs, and some vegetables.',
  'food',
  'high',
  120.00,
  40.6782,
  -73.9442,
  'Atlantic Avenue, Brooklyn, NY',
  'open',
  NOW() - INTERVAL '4 hours'
),

-- Queens
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Gas money to get to new job',
  'Just got hired but need gas money to get to work until first paycheck. Will pay it forward! The job is in Manhattan and I live in Queens.',
  'transportation',
  'medium',
  40.00,
  40.7282,
  -73.7949,
  'Queens Boulevard, Queens, NY',
  'open',
  NOW() - INTERVAL '6 hours'
),

-- Bronx
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'School supplies for 3 kids',
  'Single mom, kids need notebooks and supplies for school starting Monday. They''re excited about school but I can''t afford all the supplies on the list.',
  'other',
  'high',
  65.00,
  40.8448,
  -73.8648,
  'Grand Concourse, Bronx, NY',
  'open',
  NOW() - INTERVAL '1 day'
),

-- Manhattan - Upper East Side
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Emergency hotel for family after apartment fire',
  'Apartment had electrical fire, need help with hotel for 2 nights while finding new place. Red Cross helped first night but we need 2 more nights.',
  'housing',
  'critical',
  200.00,
  40.7736,
  -73.9566,
  'East 86th Street, Manhattan, NY',
  'open',
  NOW() - INTERVAL '3 hours'
),

-- Additional requests for demo variety
(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Baby formula for newborn twins',
  'Running low on formula for my twins. WIC doesn''t cover enough for two babies. Need help until next month''s benefits.',
  'food',
  'high',
  95.00,
  40.7614,
  -73.9776,
  'Columbus Circle, Manhattan, NY',
  'open',
  NOW() - INTERVAL '5 hours'
),

(
  'SARAH_USER_ID', -- Replace with actual user ID
  'Metro card for job interviews',
  'Have 3 job interviews next week but no money for subway. Need weekly metro card to get to interviews.',
  'transportation',
  'medium',
  33.00,
  40.7031,
  -73.9897,
  'Downtown Brooklyn, NY',
  'funded',
  NOW() - INTERVAL '2 days'
);

-- Create a funded request to show the flow
UPDATE aid_requests 
SET 
  status = 'funded',
  donor_id = 'JOHN_USER_ID' -- Replace with John's actual user ID
WHERE title = 'Metro card for job interviews';

-- Create some messages for the funded request
INSERT INTO messages (
  post_id,
  sender_id,
  receiver_id,
  content,
  created_at
)
SELECT 
  ar.id,
  'JOHN_USER_ID', -- Replace with John's user ID
  ar.user_id,
  'Hi! I can help with the metro card. When would you like to meet?',
  NOW() - INTERVAL '1 day'
FROM aid_requests ar
WHERE ar.title = 'Metro card for job interviews'
LIMIT 1;

INSERT INTO messages (
  post_id,
  sender_id,
  receiver_id,
  content,
  created_at
)
SELECT 
  ar.id,
  ar.user_id,
  'JOHN_USER_ID', -- Replace with John's user ID
  'Thank you so much! I can meet tomorrow morning at Grand Central if that works?',
  NOW() - INTERVAL '23 hours'
FROM aid_requests ar
WHERE ar.title = 'Metro card for job interviews'
LIMIT 1;

-- Update user profiles to have neighborhoods
-- First create a demo neighborhood if it doesn't exist
INSERT INTO neighborhoods (name, city, state, lat, lng, radius_miles)
VALUES ('Manhattan Community', 'New York', 'NY', 40.7831, -73.9712, 5)
ON CONFLICT DO NOTHING;

-- Update profiles to be in this neighborhood
UPDATE profiles
SET neighborhood_id = (SELECT id FROM neighborhoods WHERE name = 'Manhattan Community' LIMIT 1)
WHERE id IN ('YOUR_USER_ID', 'SARAH_USER_ID', 'JOHN_USER_ID'); -- Replace with actual IDs

-- Make admin user verified
UPDATE profiles
SET is_verified = true
WHERE id = 'YOUR_USER_ID'; -- Replace with your actual user ID