# 🚀 Database Setup Instructions

## ⚠️ CRITICAL: You Must Complete These Steps!

The errors you're seeing are because **the database tables don't exist yet** in your Supabase project.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm
2. Click on **"SQL Editor"** in the left sidebar (database icon)
3. Click **"New Query"**

### Step 2: Run the Database Setup Script

1. Open the file `/database-setup.sql` in this project
2. **Copy ALL the SQL code** from that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Wait for Completion

You should see:
```
✅ Success. No rows returned
```

And at the bottom, you'll see two result tables:
1. **List of 6 tables created:** users, students, supervisors, courses, registrations, notifications
2. **List of RLS policies** (Row Level Security)

---

## 🎯 What This Script Does

### Creates 6 Tables:

1. **`users`** - Main user table (linked to Supabase Auth)
2. **`students`** - Extended student information (major, level, GPA)
3. **`supervisors`** - Extended supervisor/advisor information
4. **`courses`** - Course catalog (49 courses)
5. **`registrations`** - Student course registrations
6. **`notifications`** - System notifications

### Sets Up Security:

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Students can only see their own data
- ✅ Advisors can see all students
- ✅ Service role (your server) has full access

### Creates Indexes:

- Fast lookups by email, student ID, course code, etc.

---

## 🧪 After Setup - Test Your System

### Test 1: Sign Up
1. Go to your app
2. Click "إنشاء حساب" (Sign Up)
3. Fill in the form:
   - Email: `test@kku.edu.sa`
   - Password: `Test123!`
   - Full Name: `اختبار طالب`
   - Student ID: `441234567`
   - Role: `Student`
   - Major: `نظم المعلومات الإدارية`
   - Level: `1`
4. Click "إنشاء حساب"

**Expected Result:**
```
✅ تم إنشاء الحساب بنجاح!
✅ You should be automatically logged in
✅ Redirected to Student Dashboard
```

**If it works:** The database is set up correctly! 🎉

**If it still fails:** Check the browser console for detailed error messages.

---

### Test 2: Verify in Supabase

After signup, check your Supabase tables:

1. Go to **Table Editor** in Supabase
2. Check **`users`** table - should have 1 row with your email
3. Check **`students`** table - should have 1 row linked to your user

---

## 🔍 Troubleshooting

### Error: "relation users does not exist"
**Solution:** You didn't run the SQL script. Go back to Step 1.

### Error: "permission denied for table users"
**Solution:** RLS policies are blocking. The server should use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS.

### Error: "duplicate key value violates unique constraint"
**Solution:** You're trying to sign up with an email that already exists. Either:
- Use a different email
- Or delete the existing user from Supabase Auth and users table

---

## 📊 Verify Tables Exist

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output:**
```
users
students
supervisors
courses
registrations
notifications
```

---

## 🎓 Understanding the Database Schema

### Users Flow:
```
1. User signs up → Creates record in auth.users (Supabase Auth)
2. Server creates record in users table (with auth_id reference)
3. If student → Creates record in students table (with user_id reference)
4. If advisor → Creates record in supervisors table (with user_id reference)
```

### Login Flow:
```
1. User logs in → Supabase Auth validates credentials
2. Gets session token
3. Uses token to fetch user data from users table (joined with students/supervisors)
4. Stores in localStorage
```

### Course Registration Flow:
```
1. Student selects course → Creates record in registrations table (status='pending')
2. Creates notification for advisor
3. Advisor approves/rejects → Updates registration status
4. Creates notification for student
```

---

## ⚡ Quick Reference

### Table Relationships:
```
auth.users (Supabase Auth)
    ↓ (auth_id)
users (your table)
    ↓ (user_id)
    ├── students (if role='student')
    └── supervisors (if role='advisor')

courses
    ↓ (course_id)
registrations ← (student_id) ← users
```

---

## 🚀 Next Steps After Setup

1. ✅ Run the SQL script (this creates all tables)
2. ✅ Test signup with a KKU email
3. ✅ Test login with your new account
4. 🔄 Initialize course data (happens automatically on first homepage load)
5. 📝 Test course registration
6. 👨‍🏫 Create a supervisor account to test approval workflow

---

## 📞 Need Help?

### Check These Files:
- `/database-setup.sql` - The SQL script to run
- `/SUPABASE_INTEGRATION_GUIDE.md` - Complete integration guide
- `/utils/supabase/operations.ts` - Database operation functions

### Common Issues:

**"Cannot coerce result to single JSON object"**
→ This means the query worked but returned 0 rows
→ **Solution:** Run the SQL setup script!

**"relation does not exist"**
→ Table doesn't exist in database
→ **Solution:** Run the SQL setup script!

**"permission denied"**
→ RLS policy blocking access
→ **Solution:** Make sure server uses SERVICE_ROLE_KEY

---

## ✅ Success Criteria

You'll know it's working when:

- ✅ You can sign up without errors
- ✅ Auto-login works after signup
- ✅ You see user data in Supabase tables
- ✅ Student dashboard loads correctly
- ✅ No "PGRST116" errors in console

---

**🎉 Once this is done, your entire system will work perfectly!**

**مع أطيب التمنيات بالتوفيق في مشروع التخرج! 🎓**
