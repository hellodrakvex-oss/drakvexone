-- Diagnostics Query for Supabase SQL Editor
-- Run these to verify your database state.

-- 1. Check all users
SELECT id, email, created_at
FROM auth.users;

-- 2. Check all profiles
SELECT *
FROM profiles;

-- 3. Check all shops
SELECT *
FROM shops;

-- Verify:
-- * Every auth.users row has exactly one profiles row
-- * Every completed onboarding user has exactly one shop row
-- * No duplicate profile records
-- * No duplicate shop records
