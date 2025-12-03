-- =====================================================
-- FIX ORPHANED USERS
-- =====================================================
-- This script fixes users that exist in auth.users
-- but don't have records in the users table
-- =====================================================

-- 1️⃣ CHECK FOR ORPHANED USERS
-- =====================================================
-- This query shows auth users without matching users table records

SELECT 
  au.id as auth_id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ ORPHANED - No users table record'
    ELSE '✅ OK - Has users table record'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id
ORDER BY au.created_at DESC;

-- 2️⃣ FIX SPECIFIC ORPHANED USER (Your Current User)
-- =====================================================
-- Replace the auth_id and email with YOUR actual values

-- OPTION A: If you know the user details, insert manually
-- Uncomment and modify this:

/*
INSERT INTO users (auth_id, email, name, name_ar, name_en, role, student_id)
VALUES (
  '93c26484-b929-443e-827a-9d0bdc681642',  -- Your auth_id from the error
  'YOUR-EMAIL@kku.edu.sa',                  -- Your actual email
  'اسمك الكامل',                            -- Your name in Arabic
  'اسمك الكامل',                            -- Your name in Arabic
  'Your Full Name',                         -- Your name in English  
  'student',                                -- Or 'advisor' or 'admin'
  '441234567'                               -- Your student ID (if student)
)
ON CONFLICT (auth_id) DO NOTHING;

-- If student, also create student record:
INSERT INTO students (user_id, major, major_en, level, gpa)
SELECT 
  u.id,
  'نظم المعلومات الإدارية',
  'Management Information Systems',
  1,
  0.00
FROM users u
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642'
ON CONFLICT (user_id) DO NOTHING;
*/

-- OPTION B: Automatically fix ALL orphaned users
-- This creates basic records for all orphaned auth users
-- ⚠️ USE WITH CAUTION - Only if you want to auto-fix everyone

/*
INSERT INTO users (auth_id, email, name, name_ar, name_en, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'student'
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id
WHERE u.id IS NULL
ON CONFLICT (auth_id) DO NOTHING;
*/

-- 3️⃣ DELETE ORPHANED AUTH USERS (Nuclear Option)
-- =====================================================
-- ⚠️ DANGEROUS: This deletes auth users that don't have users table records
-- Only use if you want to start fresh

/*
-- First, check which users will be deleted:
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id
WHERE u.id IS NULL;

-- If you're sure, uncomment this to delete:
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN users u ON u.auth_id = au.id
--   WHERE u.id IS NULL
-- );
*/

-- 4️⃣ VERIFY THE FIX
-- =====================================================
-- Run this after fixing to confirm all users are linked

SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as linked_users,
  COUNT(*) - COUNT(u.id) as orphaned_users
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id;

-- Should show: orphaned_users = 0

-- 5️⃣ VIEW YOUR SPECIFIC USER
-- =====================================================
-- Check if your user is now properly linked

SELECT 
  u.id,
  u.auth_id,
  u.email,
  u.name,
  u.role,
  s.major,
  s.level,
  s.gpa
FROM users u
LEFT JOIN students s ON s.user_id = u.id
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642';

-- If this returns 1 row, you're fixed! ✅
-- If this returns 0 rows, use OPTION A above to create the record
