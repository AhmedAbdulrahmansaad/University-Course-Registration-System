# 🔧 Supabase Integration - Complete Fix Guide

## ✅ WHAT HAS BEEN FIXED

### 1. **Supabase Client Setup**
- ✅ Created `/utils/supabase/client.ts` - Singleton Supabase client
- ✅ Proper authentication configuration with session persistence
- ✅ Auto token refresh enabled

### 2. **Database Operations Layer**
- ✅ Created `/utils/supabase/operations.ts` - All database operations
- ✅ Functions for:
  - User operations (getUserById, getUserByAuthId)
  - Course operations (getAllCourses, getCoursesByLevel, getCourseByCode)
  - Registration operations (getStudentRegistrations, registerCourse, dropCourse)
  - Registration requests (getPendingRegistrationRequests, approveRegistration, rejectRegistration)
  - Student operations (getAllStudents, getStudentGPA)
  - Notification operations (getUserNotifications, markNotificationAsRead, createNotification)

### 3. **Server Configuration**
- ✅ Server already properly configured in `/supabase/functions/server/index.tsx`
- ✅ Using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment
- ✅ CORS and logging middleware enabled

### 4. **LocalStorage Changes**
- ✅ **REMOVED**: Saving courses to localStorage
- ✅ **REMOVED**: Loading courses from localStorage on init
- ✅ **KEPT**: Session management (auth tokens, user info for session persistence)
- ✅ **KEPT**: UI preferences (language, theme, agreement acceptance)

### 5. **Server Enabled**
- ✅ Re-enabled server fetch in `/utils/fetchHelper.ts` (SERVER_AVAILABLE = true)
- ✅ Re-enabled init-courses in HomePage

---

## 📋 WHAT STILL NEEDS TO BE DONE

### Critical Fixes Needed:

1. **Fix AppContext.tsx - Missing allCourses**
   - The `allCourses` variable is referenced but not defined
   - Need to either:
     - Option A: Fetch all courses from Supabase on app init
     - Option B: Remove availableCourses from context and fetch on-demand in pages

2. **Update StudentDashboard**
   - Fetch registered courses from Supabase instead of AppContext
   - Use `getStudentRegistrations()` from operations.ts

3. **Update CoursesPage**
   - Fetch available courses from Supabase
   - Use `getAllCourses()` or `getCoursesByLevel()` from operations.ts

4. **Update SchedulePage**
   - Fetch schedule data from Supabase
   - Use `getStudentRegistrations()` from operations.ts

5. **Update Course Registration Flow**
   - Use `registerCourse()` function from operations.ts
   - Ensure data is saved to `registrations` table in Supabase

---

## 🗄️ DATABASE SCHEMA REQUIREMENTS

Make sure these tables exist in Supabase:

### **users** table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **students** table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  student_id TEXT UNIQUE NOT NULL,
  major TEXT,
  level INTEGER,
  gpa DECIMAL(3,2),
  completed_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **courses** table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL,
  instructor TEXT,
  time TEXT,
  room TEXT,
  department TEXT,
  level INTEGER,
  capacity INTEGER DEFAULT 30,
  enrolled INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  prerequisite TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **registrations** table
```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(user_id),
  course_code TEXT REFERENCES courses(code),
  semester TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  registered_at TIMESTAMP DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  note TEXT
);
```

### **notifications** table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 ROW LEVEL SECURITY (RLS) POLICIES

### Enable RLS on all tables:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### **users** table policies:
```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = auth_id);
```

### **students** table policies:
```sql
-- Students can read own data
CREATE POLICY "Students can read own data" ON students
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

### **courses** table policies:
```sql
-- Everyone can read active courses
CREATE POLICY "Everyone can read active courses" ON courses
  FOR SELECT USING (active = TRUE);

-- Only admins can insert/update/delete courses
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
```

### **registrations** table policies:
```sql
-- Students can read their own registrations
CREATE POLICY "Students can read own registrations" ON registrations
  FOR SELECT USING (
    student_id IN (
      SELECT user_id FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Students can insert registrations
CREATE POLICY "Students can create registrations" ON registrations
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT user_id FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Supervisors and admins can read all registrations
CREATE POLICY "Supervisors can read all registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- Supervisors and admins can update registrations
CREATE POLICY "Supervisors can update registrations" ON registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );
```

### **notifications** table policies:
```sql
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

---

## 🧪 TESTING THE CONNECTION

### 1. Test Signup Flow
```typescript
// Should create:
// 1. Auth user in auth.users
// 2. User record in users table
// 3. Student record in students table (if role = student)
```

### 2. Test Login Flow
```typescript
// Should return:
// 1. Session with access_token
// 2. User data from users table
// 3. Student data (if applicable)
```

### 3. Test Course Fetching
```typescript
import { getAllCourses } from './utils/supabase/operations';

const courses = await getAllCourses();
console.log('Courses from Supabase:', courses);
```

### 4. Test Registration
```typescript
import { registerCourse } from './utils/supabase/operations';

const result = await registerCourse(
  studentId,
  'MIS200',
  'Fall 2025'
);
console.log('Registration result:', result);
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Supabase tables created
- [ ] RLS policies enabled and configured
- [ ] Server deployed and running
- [ ] AppContext.tsx fixed (allCourses defined or removed)
- [ ] StudentDashboard fetches from Supabase
- [ ] CoursesPage fetches from Supabase
- [ ] SchedulePage fetches from Supabase
- [ ] Course registration saves to Supabase
- [ ] Signup flow tested (creates all required records)
- [ ] Login flow tested (retrieves all data)
- [ ] Course fetching tested
- [ ] Registration tested
- [ ] NO data saved to localStorage except session/UI preferences

---

## 🚀 NEXT STEPS

1. **Fix AppContext.tsx** - Either fetch courses or remove from context
2. **Deploy the server** to Supabase Edge Functions
3. **Test each flow** with real Supabase data
4. **Remove any remaining localStorage** data operations
5. **Verify all CRUD operations** work with Supabase

---

**Everything is now properly set up for Supabase integration. The system will work with REAL online data once the final fixes are applied!** ✅
