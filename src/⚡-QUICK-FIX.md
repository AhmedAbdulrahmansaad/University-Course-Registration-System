# ⚡ QUICK FIX - 2 Minutes!

## 🔴 Your Error
```
❌ User data not found - PGRST116
❌ auth_id: 93c26484-b929-443e-827a-9d0bdc681642
```

---

## ✅ FASTEST FIX (Recommended)

### Step 1: Delete Old Account
1. Go to: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/auth/users
2. Find your email
3. Click "..." → "Delete user"

### Step 2: Re-register
1. Go to your app
2. Click "إنشاء حساب جديد"
3. Sign up again with SAME email

**Done! ✅**

---

## 🛠️ ALTERNATIVE: Manual Fix

### Run in Supabase SQL Editor:

```sql
-- 1. Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- If you see 6 tables (users, students, courses, etc), continue:

-- 2. Fix your orphaned user (CHANGE THE VALUES!)
INSERT INTO users (auth_id, email, name, name_ar, name_en, role, student_id)
VALUES (
  '93c26484-b929-443e-827a-9d0bdc681642',
  'your@kku.edu.sa',        -- Change this
  'اسمك',                    -- Change this
  'اسمك',                    -- Change this
  'Your Name',               -- Change this
  'student',
  '441234567'                -- Change this
);

-- 3. Create student record
INSERT INTO students (user_id, major, major_en, level, gpa)
SELECT u.id, 'نظم المعلومات الإدارية', 'MIS', 1, 0.00
FROM users u WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642';

-- 4. Verify
SELECT u.*, s.* FROM users u 
LEFT JOIN students s ON s.user_id = u.id
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642';
```

**If this returns 1 row, you're fixed!** ✅

---

## ⚠️ If Tables Don't Exist

**Run this FIRST:**

1. Open `/database-setup.sql`
2. Copy ALL the code
3. Paste in Supabase SQL Editor
4. Click "Run"

**Then use Option 1 above (delete and re-register)**

---

## 🧪 Test
After fixing:
1. Login with your email
2. Should work! ✅

---

## 📖 Full Guide
See `/🔧-FIX-ORPHANED-USER-GUIDE.md` for detailed instructions.

---

**🎯 Bottom Line:**

**TABLES DON'T EXIST?** → Run `/database-setup.sql` first!

**TABLES EXIST?** → Delete auth user and re-register (2 minutes!)

**🎉 That's it!**
