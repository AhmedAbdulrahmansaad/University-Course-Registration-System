# 🔧 How to Fix Orphaned User Error

## 🔴 The Problem

You're seeing this error:
```
❌ [Login] User data not found in database: PGRST116
❌ [Login] Searched for auth_id: 93c26484-b929-443e-827a-9d0bdc681642
```

**What this means:**
- ✅ Your user EXISTS in Supabase Auth (`auth.users` table)
- ❌ But DOESN'T exist in your custom `users` table
- This is called an **"orphaned user"**

**Why it happened:**
You signed up BEFORE the database tables were created, so:
1. Supabase Auth created your account ✅
2. But the `users` table didn't exist, so no record was created ❌

---

## ✅ Solution - Choose ONE Option

### 🎯 OPTION 1: Delete and Re-register (RECOMMENDED)

This is the cleanest and easiest solution.

#### Step 1: Delete the orphaned auth user

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm
2. Click **"Authentication"** in left sidebar
3. Click **"Users"** tab
4. Find your email in the list
5. Click the **"..."** menu → **"Delete user"**

#### Step 2: Sign up again

1. Go back to your app
2. Click **"إنشاء حساب جديد"** (Create New Account)
3. Fill in the form with the SAME email
4. Submit

✅ **This time it will work correctly!** Your account will be created in both Auth AND the users table.

---

### 🛠️ OPTION 2: Manually Fix in Database (ADVANCED)

If you want to keep the existing auth user, manually create the database records.

#### Step 1: Run the diagnostic query

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query to see your orphaned user:

```sql
-- Check for orphaned users
SELECT 
  au.id as auth_id,
  au.email,
  au.created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ ORPHANED'
    ELSE '✅ OK'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.auth_id = au.id
ORDER BY au.created_at DESC;
```

#### Step 2: Create the users table record

Replace the values with YOUR actual information:

```sql
-- Insert your user record
INSERT INTO users (auth_id, email, name, name_ar, name_en, role, student_id)
VALUES (
  '93c26484-b929-443e-827a-9d0bdc681642',  -- Your auth_id from error message
  'YOUR-EMAIL@kku.edu.sa',                  -- Your actual email
  'اسمك الكامل',                            -- Your name in Arabic
  'اسمك الكامل',                            -- Your name in Arabic
  'Your Full Name',                         -- Your name in English
  'student',                                -- Your role
  '441234567'                               -- Your student ID (if student)
)
ON CONFLICT (auth_id) DO NOTHING;
```

#### Step 3: Create the students table record (if you're a student)

```sql
-- Insert student record
INSERT INTO students (user_id, major, major_en, level, gpa)
SELECT 
  u.id,
  'نظم المعلومات الإدارية',
  'Management Information Systems',
  1,                                        -- Your level (1-8)
  0.00                                      -- Your GPA
FROM users u
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642'
ON CONFLICT (user_id) DO NOTHING;
```

#### Step 4: Verify the fix

```sql
-- Check if your user is now complete
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
```

**Expected result:** 1 row with all your data ✅

Now try logging in again - it should work!

---

### 🧹 OPTION 3: Auto-Fix ALL Orphaned Users (NUCLEAR)

If you have multiple orphaned users, you can auto-fix them all:

```sql
-- WARNING: This creates basic records for ALL orphaned auth users
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

-- Create student records for all new users
INSERT INTO students (user_id, major, major_en, level, gpa)
SELECT 
  u.id,
  'نظم المعلومات الإدارية',
  'Management Information Systems',
  1,
  0.00
FROM users u
LEFT JOIN students s ON s.user_id = u.id
WHERE s.id IS NULL AND u.role = 'student'
ON CONFLICT (user_id) DO NOTHING;
```

---

## 🧪 Testing After Fix

### Test Login:

1. Go to your app
2. Click "تسجيل الدخول" (Login)
3. Enter your email and password
4. Click login

**Expected result:**
```
✅ [Login] Supabase auth successful
✅ [Login] User data fetched successfully
✅ مرحباً {your name}!
→ Redirected to dashboard
```

**Console should show:**
```
🔐 [Login] Attempting login for: your@email.com
✅ [Login] Supabase auth successful, auth_id: abc-123
✅ [Login] User data fetched successfully: {
  id: 'user-xyz',
  email: 'your@email.com',
  role: 'student',
  hasStudents: true
}
```

---

## 🔍 Verify in Supabase

After fixing, check these tables:

### 1. Check auth.users table:
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'YOUR-EMAIL@kku.edu.sa';
```

### 2. Check users table:
```sql
SELECT id, auth_id, email, name, role
FROM users
WHERE email = 'YOUR-EMAIL@kku.edu.sa';
```

### 3. Check students table:
```sql
SELECT s.*, u.email
FROM students s
JOIN users u ON u.id = s.user_id
WHERE u.email = 'YOUR-EMAIL@kku.edu.sa';
```

All three should return data! ✅

---

## 📊 Preventing This in the Future

### The Correct Signup Flow:

```
1. User fills signup form
   ↓
2. Server receives request at /auth/signup
   ↓
3. Server creates auth user (auth.users) ✅
   ↓
4. Server creates users table record ✅
   ↓
5. Server creates students table record ✅
   ↓
6. Frontend auto-login
   ↓
7. Frontend fetches complete user data ✅
   ↓
8. Success! User logged in
```

### What Was Happening Before:

```
1. User fills signup form
   ↓
2. Server creates auth user ✅
   ↓
3. Server tries to create users record
   ↓
4. ❌ FAIL - Table doesn't exist!
   ↓
5. Frontend auto-login succeeds (auth only)
   ↓
6. Frontend tries to fetch user data
   ↓
7. ❌ PGRST116 - No rows found
```

---

## ⚠️ Important Notes

### About Database Setup:

1. **You MUST run `/database-setup.sql` first!**
   - This creates all 6 tables
   - Without this, nothing works

2. **The tables must exist BEFORE signup**
   - If you sign up before tables exist → orphaned user
   - If you sign up after tables exist → works perfectly

### About Your Current Situation:

Based on the error, you have:
- ✅ Supabase project created
- ✅ Auth user created (auth_id: 93c26484-b929-443e-827a-9d0bdc681642)
- ❓ Tables status unknown

**Check if tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output:**
- courses
- notifications
- registrations
- students
- supervisors
- users

**If you DON'T see these 6 tables:**
→ Run `/database-setup.sql` first!

**If you DO see these 6 tables:**
→ Use Option 1 or Option 2 above to fix your orphaned user

---

## 🎯 Quick Decision Tree

```
Do the 6 tables exist in Supabase?
│
├─ NO → Run /database-setup.sql first!
│         Then delete auth user and re-register
│
└─ YES → Choose one:
          │
          ├─ Easy way: Delete auth user → Re-register
          │
          └─ Keep existing: Manually create users/students records
```

---

## 📞 Need More Help?

### Files to Check:

1. **`/database-setup.sql`** - Creates all tables
2. **`/fix-orphaned-users.sql`** - SQL queries for fixing
3. **`/🚀-DATABASE-SETUP-INSTRUCTIONS.md`** - Setup guide

### Common Questions:

**Q: Will I lose my data if I delete and re-register?**
A: No, because there's no data yet! The orphaned user has no profile data.

**Q: Can I use the same email after deleting?**
A: Yes! Once deleted, the email is available again.

**Q: How do I know if it's fixed?**
A: You'll be able to login without PGRST116 error, and you'll see your dashboard.

---

## ✅ Success Checklist

After fixing, you should be able to:

- [ ] Login without PGRST116 error
- [ ] See your name in dashboard
- [ ] See your student info (major, level, GPA)
- [ ] Access all pages without errors
- [ ] View available courses
- [ ] Register for courses

---

**🎉 Once fixed, your system will work perfectly!**

**Choose Option 1 for fastest results! 🚀**
