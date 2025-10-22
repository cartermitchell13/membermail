-- Seed test members for local development and testing
-- Run this in your Supabase SQL editor or via the CLI

-- First, ensure you have a test community
-- Replace 'biz_testcompany123' with your actual test Whop company ID
INSERT INTO communities (whop_community_id, name, user_id, member_count, last_sync_at, created_at, updated_at)
VALUES (
  'biz_testcompany123',
  'Test Community',
  (SELECT id FROM profiles LIMIT 1), -- Uses first profile, or create one manually
  50,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (whop_community_id) DO UPDATE
SET member_count = 50, updated_at = NOW()
RETURNING id;

-- Now insert 50 test members
-- Get the community_id from the result above and replace in the query below
WITH test_community AS (
  SELECT id FROM communities WHERE whop_community_id = 'biz_testcompany123'
)
INSERT INTO members (
  community_id,
  whop_member_id,
  email,
  name,
  membership_tier,
  status,
  joined_at,
  last_active_at,
  engagement_score,
  created_at,
  updated_at
)
SELECT
  (SELECT id FROM test_community),
  'mem_test_' || generate_series,
  'testuser' || generate_series || '@example.com',
  'Test User ' || generate_series,
  CASE 
    WHEN generate_series % 3 = 0 THEN 'premium'
    WHEN generate_series % 3 = 1 THEN 'basic'
    ELSE 'vip'
  END,
  CASE 
    WHEN generate_series % 10 = 0 THEN 'cancelled'
    WHEN generate_series % 15 = 0 THEN 'paused'
    ELSE 'active'
  END,
  NOW() - (generate_series || ' days')::interval,
  NOW() - (generate_series % 7 || ' days')::interval,
  random() * 100,
  NOW(),
  NOW()
FROM generate_series(1, 50);

-- Verify the data
SELECT 
  c.name as community_name,
  c.member_count,
  COUNT(m.id) as actual_members,
  COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_members,
  COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as cancelled_members,
  COUNT(CASE WHEN m.status = 'paused' THEN 1 END) as paused_members
FROM communities c
LEFT JOIN members m ON m.community_id = c.id
WHERE c.whop_community_id = 'biz_testcompany123'
GROUP BY c.id, c.name, c.member_count;
