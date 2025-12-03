# 🚨 URGENT: DATABASE SETUP REQUIRED!

## ❌ THE ROOT CAUSE OF ALL YOUR ERRORS

Your errors:
```
❌ PGRST116: Cannot coerce the result to a single JSON object
❌ The result contains 0 rows
```

**What this means:**
# **THE DATABASE TABLES DON'T EXIST!** 

You **MUST** run the database setup script **BEFORE** anything else will work.

---

## ✅ THE SOLUTION (3 Steps - 5 Minutes)

### Step 1: Check If Tables Exist

**Option A: Use the Database Check Page** (Easy!)

1. Go to your app
2. Click on Login page
3. Look for the **RED BOX** that says "PGRST116 error"
4. Click the button: **"🔧 فحص قاعدة البيانات"** (Check Database)
5. It will show you which tables are missing

**Option B: Check Manually in Supabase**

1. Go to: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/editor
2. Click "SQL Editor"
3. Run this:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected result:** You should see these 6 tables:
- ✅ courses
- ✅ notifications
- ✅ registrations
- ✅ students
- ✅ supervisors
- ✅ users

**If you DON'T see all 6 tables** → Continue to Step 2

---

### Step 2: Run the Database Setup Script

1. **Open Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/editor

2. **Open the setup file in your code editor:**
   - File: `/database-setup.sql`
   - This file contains ALL the SQL to create tables, insert courses, etc.

3. **Copy the ENTIRE file contents**
   - Select all (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

4. **Paste into Supabase SQL Editor:**
   - Click "New query" in Supabase
   - Paste the contents
   - Click **"Run"** button

5. **Wait for completion:**
   - Takes 30-60 seconds
   - You'll see success messages in green

6. **Verify:**
   - Run the check query from Step 1
   - You should now see all 6 tables ✅

---

### Step 3: Clean Up Orphaned User & Re-register

Now that tables exist, fix your orphaned user:

**Option A: Use Cleanup Page** (Easy!)

1. Go to your app
2. Login page → Click orange link "إصلاح المشكلة"
3. Enter: `mohammed5@kku.edu.sa`
4. Click "تنظيف الحساب"
5. Go to Signup page
6. Register again with same email

**Option B: Manual Delete in Supabase**

1. Go to: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/auth/users
2. Find `mohammed5@kku.edu.sa`
3. Click "..." → "Delete user"
4. Go back to app → Signup page
5. Register with same email

**Option C: SQL Fix** (Keep existing auth user)

```sql
-- Create missing users record
INSERT INTO users (auth_id, email, name, name_ar, name_en, role, student_id)
VALUES (
  '93c26484-b929-443e-827a-9d0bdc681642',
  'mohammed5@kku.edu.sa',
  'محمد',
  'محمد',
  'Mohammed',
  'student',
  '441234567'  -- Change to your actual student ID
)
ON CONFLICT (auth_id) DO NOTHING;

-- Create missing students record
INSERT INTO students (user_id, major, major_en, level, gpa)
SELECT 
  u.id,
  'نظم المعلومات الإدارية',
  'Management Information Systems',
  1,  -- Change to your actual level
  0.00
FROM users u 
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642'
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.*, s.* 
FROM users u 
LEFT JOIN students s ON s.user_id = u.id
WHERE u.auth_id = '93c26484-b929-443e-827a-9d0bdc681642';
```

---

## 🎯 Complete Flow (Start to Finish)

```
START
│
├─ STEP 1: Check if tables exist
│  │
│  ├─ Tables DON'T exist? (PGRST116 error)
│  │  └─► Run /database-setup.sql in Supabase
│  │
│  └─ Tables exist?
│     └─► Continue to Step 2
│
├─ STEP 2: Fix orphaned user
│  │
│  ├─ Use cleanup page OR
│  ├─ Delete in Supabase Dashboard OR
│  └─ Create records with SQL
│
├─ STEP 3: Register/Login
│  │
│  ├─ If deleted: Signup again
│  └─ If created records: Login directly
│
└─► SUCCESS! System works! 🎉
```

---

## 📊 What the Database Setup Script Does

The `/database-setup.sql` file creates:

### 1. **6 Tables:**
- `users` - All system users (students, advisors, admins)
- `students` - Student-specific data (major, level, GPA)
- `supervisors` - Advisor-specific data (department, max students)
- `courses` - All 49 courses from MIS curriculum
- `registrations` - Course enrollment records
- `notifications` - System notifications

### 2. **49 Courses:**
- Level 1: 7 courses (متطلبات إعداد)
- Level 2: 7 courses (متطلبات جامعة)
- Level 3: 6 courses (متطلبات جامعة)
- Level 4: 6 courses (متطلبات كلية)
- Level 5: 6 courses (متطلبات تخصص)
- Level 6: 6 courses (متطلبات تخصص)
- Level 7: 6 courses (متطلبات تخصص)
- Level 8: 5 courses (متطلبات تخصص + مشروع تخرج)

### 3. **RLS Policies:**
- Row Level Security for all tables
- Secure access control
- Role-based permissions

### 4. **Sample Data:**
- Admin account (admin@kku.edu.sa / Admin123!)
- Advisor account (advisor@kku.edu.sa / Advisor123!)
- Student account (student@kku.edu.sa / Student123!)

---

## 🧪 Testing After Setup

### 1. Verify Tables Exist:
```sql
SELECT 
  schemaname, 
  tablename, 
  (SELECT COUNT(*) FROM courses) as course_count,
  (SELECT COUNT(*) FROM users) as user_count
FROM pg_tables 
WHERE schemaname = 'public';
```

**Expected:**
- 6 tables visible
- 49 courses
- 3 users (admin, advisor, student)

### 2. Test Login with Sample Account:
```
Email: student@kku.edu.sa
Password: Student123!
```

Should work! ✅

### 3. Test Your New Account:
```
1. Signup with your email
2. Fill in details
3. Submit
4. Auto-login
5. See dashboard
```

Should work! ✅

---

## 🔍 Troubleshooting

### Error: "permission denied for schema public"
**Solution:** You need database admin access. Use the Supabase service role key.

### Error: "relation already exists"
**Solution:** Tables already exist. Just verify data:
```sql
SELECT COUNT(*) FROM courses;  -- Should be 49
SELECT COUNT(*) FROM users;    -- Should be at least 3
```

### Error: Still getting PGRST116 after running script
**Solution:** 
1. Refresh your browser
2. Clear localStorage
3. Try signup again

### Signup still fails with "email already registered"
**Solution:** Delete the orphaned auth user first (Step 3)

---

## 📱 Quick Access Links

### Supabase Dashboard:
https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm

### SQL Editor:
https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/editor

### Auth Users:
https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/auth/users

### Table Editor:
https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/editor

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] All 6 tables exist in Supabase
- [ ] 49 courses are in courses table
- [ ] 3 sample users exist (admin, advisor, student)
- [ ] RLS policies are enabled
- [ ] Your orphaned user is deleted or fixed
- [ ] You can signup with your email
- [ ] You can login successfully
- [ ] Dashboard loads correctly
- [ ] You can see courses
- [ ] You can register for courses

---

## 🎓 FOR YOUR GRADUATION PROJECT

This is ESSENTIAL for your project to work:

✅ **Database must be set up** before demo  
✅ **All tables must exist** before presentation  
✅ **Sample data** should be present for testing  
✅ **Your account** must be working  

**Don't skip this step!** Without the database setup, nothing will work.

---

## 🚀 THE BOTTOM LINE

**You have 2 problems:**

1. ❌ **Database tables don't exist** (PGRST116 error)
   → **Solution:** Run `/database-setup.sql` in Supabase

2. ❌ **Orphaned auth user exists** (mohammed5@kku.edu.sa)
   → **Solution:** Delete and re-register OR create database records

**Do them IN ORDER:**
1. First: Setup database ← **THIS IS CRITICAL!**
2. Second: Fix orphaned user
3. Third: Test signup/login

---

## 📞 Need Help?

### Files to check:
- `/database-setup.sql` - The setup script (MUST RUN THIS!)
- `/🚀-DATABASE-SETUP-INSTRUCTIONS.md` - Detailed setup guide
- `/⚡-FINAL-FIX-GUIDE.md` - Complete fix instructions

### In Your App:
- Click "🔧 Check Database" button on login page
- It will diagnose the exact problem

---

**🎯 START WITH STEP 1: CHECK IF TABLES EXIST**

**If they don't → RUN THE DATABASE SETUP SCRIPT!**

**Everything else depends on this! 🚨**

---

**Good luck with your graduation project! 🎓**

**تم بحمد الله ✨**
