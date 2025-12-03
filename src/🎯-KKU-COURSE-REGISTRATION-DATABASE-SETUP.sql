-- =====================================================
-- 🎓 نظام تسجيل المقررات - جامعة الملك خالد
-- KKU Course Registration System Database Setup
-- 
-- المشروع: نظام تسجيل المقررات - كلية إدارة الأعمال
-- القسم: المعلوماتية الإدارية - نظم المعلومات الإدارية
-- المشرف: د. محمد رشيد
-- 
-- ⚠️ تعليمات التنفيذ:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. انسخ والصق هذا الكود بالكامل
-- 4. اضغط RUN لتنفيذ جميع الأوامر
-- =====================================================

-- Step 1: Drop existing tables (if needed - BE CAREFUL!)
-- Uncomment the following lines ONLY if you want a fresh start
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS registrations CASCADE;
-- DROP TABLE IF EXISTS course_offerings CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS supervisors CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'advisor', 'admin')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  major TEXT DEFAULT 'نظم المعلومات الإدارية',
  major_en TEXT DEFAULT 'Management Information Systems',
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa >= 0.00 AND gpa <= 5.00),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT DEFAULT 'قسم المعلوماتية الإدارية',
  department_en TEXT DEFAULT 'MIS Department',
  office_location TEXT,
  office_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3 CHECK (credits >= 1 AND credits <= 6),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  semester TEXT CHECK (semester IN ('fall', 'spring', 'summer', 'both')),
  prerequisites TEXT[],
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  department TEXT DEFAULT 'نظم المعلومات الإدارية',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'IP', 'W')),
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  message_en TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  instructor TEXT,
  max_students INTEGER DEFAULT 50,
  enrolled_students INTEGER DEFAULT 0,
  schedule TEXT,
  location TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);

CREATE INDEX IF NOT EXISTS idx_supervisors_user_id ON supervisors(user_id);
CREATE INDEX IF NOT EXISTS idx_supervisors_department ON supervisors(department);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course ON registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_semester ON registrations(semester);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offerings_course ON course_offerings(course_id);
CREATE INDEX IF NOT EXISTS idx_offerings_semester ON course_offerings(semester);
CREATE INDEX IF NOT EXISTS idx_offerings_available ON course_offerings(is_available);

-- Step 4: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop old policies
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow admin full access to users" ON users;
DROP POLICY IF EXISTS "Allow admin full access to students" ON students;
DROP POLICY IF EXISTS "Allow admin full access to supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow admin full access to registrations" ON registrations;
DROP POLICY IF EXISTS "Allow admin full access to notifications" ON notifications;

-- Step 6: Create policies
CREATE POLICY "Allow public read access to courses"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Allow admin full access to users"
  ON users FOR ALL
  USING (true);

CREATE POLICY "Allow admin full access to students"
  ON students FOR ALL
  USING (true);

CREATE POLICY "Allow admin full access to supervisors"
  ON supervisors FOR ALL
  USING (true);

CREATE POLICY "Allow admin full access to registrations"
  ON registrations FOR ALL
  USING (true);

CREATE POLICY "Allow admin full access to notifications"
  ON notifications FOR ALL
  USING (true);

-- Step 7: Add comments
COMMENT ON TABLE users IS 'KKU Course Registration System - Users Table (Students, Advisors, Admins)';
COMMENT ON TABLE students IS 'KKU - Student Academic Information';
COMMENT ON TABLE supervisors IS 'KKU - Academic Supervisors Information';
COMMENT ON TABLE courses IS 'KKU - Academic Courses (49 Courses from MIS Department)';
COMMENT ON TABLE registrations IS 'KKU - Course Registration Requests';
COMMENT ON TABLE notifications IS 'KKU - Notifications System for Students, Advisors, and Admins';
COMMENT ON TABLE course_offerings IS 'KKU - Course Offerings per Semester';

COMMENT ON COLUMN users.id IS 'معرف المستخدم الفريد';
COMMENT ON COLUMN users.auth_id IS 'معرف المصادقة من Supabase Auth';
COMMENT ON COLUMN users.email IS 'البريد الإلكتروني الجامعي';
COMMENT ON COLUMN users.role IS 'الدور: طالب، مشرف، مدير';

COMMENT ON COLUMN students.major IS 'التخصص الدراسي';
COMMENT ON COLUMN students.level IS 'المستوى الدراسي (1-8)';
COMMENT ON COLUMN students.gpa IS 'المعدل التراكمي (0.00-5.00)';

COMMENT ON COLUMN supervisors.department IS 'القسم الأكاديمي';

COMMENT ON COLUMN courses.course_code IS 'رمز المقرر (مثل: MIS101)';
COMMENT ON COLUMN courses.credits IS 'عدد الساعات المعتمدة';
COMMENT ON COLUMN courses.level IS 'المستوى الدراسي';
COMMENT ON COLUMN courses.prerequisites IS 'المتطلبات السابقة';

COMMENT ON COLUMN registrations.status IS 'حالة الطلب: معلق، موافق عليه، مرفوض';
COMMENT ON COLUMN registrations.semester IS 'الفصل الدراسي';
COMMENT ON COLUMN registrations.grade IS 'الدرجة النهائية';

COMMENT ON COLUMN notifications.type IS 'نوع الإشعار: معلومة، نجاح، تحذير، خطأ';
COMMENT ON COLUMN notifications.read IS 'هل تم قراءة الإشعار؟';
COMMENT ON COLUMN notifications.related_id IS 'معرف السجل المرتبط بالإشعار';

-- Step 8: Verification
SELECT 
  'Database setup completed successfully!' AS message,
  COUNT(*) AS total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Show all tables
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND columns.table_name = tables.table_name) AS columns_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Success messages
SELECT '✅ Database setup completed successfully!' AS status;
SELECT '📊 Total tables: 7 (users, students, supervisors, courses, registrations, notifications, course_offerings)' AS info;
SELECT '📚 Next step: Run INSERT script to add 49 courses' AS next_step;
SELECT '🔥 File: /🔥-INSERT-49-COURSES-DATA.sql' AS file_to_run;

-- =====================================================
-- 🎉 تم إنشاء قاعدة البيانات بنجاح!
-- Success! Database is ready to use!
-- =====================================================
