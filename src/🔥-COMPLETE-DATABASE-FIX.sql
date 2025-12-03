-- =====================================================
-- 🔥 COMPLETE DATABASE FIX - نظام تسجيل المقررات
-- جامعة الملك خالد - كلية إدارة الأعمال
-- =====================================================
-- 🎯 شغل هذا السكريبت في Supabase SQL Editor
-- ⚠️ هذا السكريبت سيحذف ويعيد إنشاء كل شيء!
-- =====================================================

-- 🧹 الخطوة 1: تنظيف كامل
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- حذف جميع الـ Policies القديمة
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Service role full access to users" ON users;
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Advisors can read all students" ON students;
DROP POLICY IF EXISTS "Service role full access to students" ON students;
DROP POLICY IF EXISTS "Supervisors can read own data" ON supervisors;
DROP POLICY IF EXISTS "Service role full access to supervisors" ON supervisors;
DROP POLICY IF EXISTS "Anyone can read active courses" ON courses;
DROP POLICY IF EXISTS "Service role full access to courses" ON courses;
DROP POLICY IF EXISTS "Students can read own registrations" ON registrations;
DROP POLICY IF EXISTS "Advisors can read all registrations" ON registrations;
DROP POLICY IF EXISTS "Service role full access to registrations" ON registrations;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role full access to notifications" ON notifications;

-- =====================================================
-- 📊 الخطوة 2: إنشاء جدول المستخدمين (USERS)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'advisor', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- 🎓 الخطوة 3: إنشاء جدول الطلاب (STUDENTS)
-- =====================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  major TEXT NOT NULL DEFAULT 'نظم المعلومات الإدارية',
  major_en TEXT DEFAULT 'Management Information Systems',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 5),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
  enrollment_year INTEGER DEFAULT 2024,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_level ON students(level);

-- =====================================================
-- 👨‍🏫 الخطوة 4: إنشاء جدول المشرفين (SUPERVISORS)
-- =====================================================
CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'قسم المعلوماتية الإدارية',
  department_en TEXT DEFAULT 'MIS Department',
  specialization TEXT,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);

-- =====================================================
-- 📚 الخطوة 5: إنشاء جدول المقررات (COURSES)
-- =====================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  department TEXT NOT NULL DEFAULT 'نظم المعلومات الإدارية',
  department_en TEXT DEFAULT 'MIS',
  prerequisites TEXT[],
  instructor_name TEXT,
  schedule_time TEXT,
  schedule_days TEXT,
  room TEXT,
  capacity INTEGER DEFAULT 30,
  enrolled_count INTEGER DEFAULT 0,
  semester TEXT DEFAULT 'Fall 2025',
  is_active BOOLEAN DEFAULT true,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_active ON courses(is_active);

-- =====================================================
-- 📝 الخطوة 6: إنشاء جدول التسجيلات (REGISTRATIONS)
-- =====================================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL DEFAULT 'Fall 2025',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'withdrawn')),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'IP', 'W')),
  grade_points DECIMAL(3,2),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester)
);

-- Indexes
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_course ON registrations(course_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- =====================================================
-- 🔔 الخطوة 7: إنشاء جدول الإشعارات (NOTIFICATIONS)
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'approval', 'rejection', 'announcement', 'reminder', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_registration_id UUID REFERENCES registrations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- =====================================================
-- 🔒 الخطوة 8: تعطيل RLS مؤقتاً للاختبار
-- =====================================================
-- ⚠️ في البداية سنعطل RLS لتسهيل الاختبار
-- بعد التأكد من عمل النظام، يمكن تفعيل RLS

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- إذا أردت تفعيل RLS لاحقاً، استخدم:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- وأضف الـ policies المناسبة

-- =====================================================
-- 🎓 الخطوة 9: إضافة بيانات المقررات (49 مقرر)
-- =====================================================

-- المستوى الأول
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS101', 'مقدمة في نظم المعلومات', 'Introduction to Information Systems', 3, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ECON101', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics', 3, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MATH101', 'الرياضيات للأعمال', 'Mathematics for Business', 3, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ENG101', 'اللغة الإنجليزية', 'English Language', 3, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ARAB101', 'اللغة العربية', 'Arabic Language', 2, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ISLM101', 'الثقافة الإسلامية', 'Islamic Culture', 2, 1, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى الثاني
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS102', 'برمجة الحاسب', 'Computer Programming', 3, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ACCT101', 'مبادئ المحاسبة', 'Principles of Accounting', 3, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('STAT101', 'مبادئ الإحصاء', 'Principles of Statistics', 3, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MGT101', 'مبادئ الإدارة', 'Principles of Management', 3, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ENG102', 'اللغة الإنجليزية المتقدمة', 'Advanced English', 3, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ISLM102', 'الفقه الإسلامي', 'Islamic Jurisprudence', 2, 2, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى الثالث
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS201', 'قواعد البيانات', 'Database Management', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS202', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS203', 'شبكات الحاسب', 'Computer Networks', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ECON201', 'مبادئ الاقتصاد الكلي', 'Principles of Macroeconomics', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('FIN101', 'مبادئ المالية', 'Principles of Finance', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MKT101', 'مبادئ التسويق', 'Principles of Marketing', 3, 3, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى الرابع
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS301', 'برمجة تطبيقات الويب', 'Web Application Development', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS302', 'إدارة قواعد البيانات المتقدمة', 'Advanced Database Management', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS303', 'أمن المعلومات', 'Information Security', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS304', 'نظم دعم القرار', 'Decision Support Systems', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('STAT201', 'الإحصاء التطبيقي', 'Applied Statistics', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('HRM101', 'إدارة الموارد البشرية', 'Human Resource Management', 3, 4, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى الخامس
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS401', 'نظم المعلومات الإدارية المتقدمة', 'Advanced MIS', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS402', 'إدارة المشاريع', 'Project Management', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS403', 'التجارة الإلكترونية', 'E-Commerce', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS404', 'تخطيط موارد المؤسسة', 'Enterprise Resource Planning', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS405', 'ذكاء الأعمال', 'Business Intelligence', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MGT301', 'إدارة العمليات', 'Operations Management', 3, 5, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى السادس
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS501', 'تطبيقات الهاتف المحمول', 'Mobile Application Development', 3, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS502', 'الحوسبة السحابية', 'Cloud Computing', 3, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS503', 'تحليل البيانات الضخمة', 'Big Data Analytics', 3, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS504', 'إدارة المعرفة', 'Knowledge Management', 3, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS505', 'نظم إدارة المحتوى', 'Content Management Systems', 3, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('LAW101', 'القانون التجاري', 'Business Law', 2, 6, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى السابع
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS601', 'الذكاء الاصطناعي', 'Artificial Intelligence', 3, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS602', 'التعلم الآلي', 'Machine Learning', 3, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS603', 'إنترنت الأشياء', 'Internet of Things', 3, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS604', 'تقنيات البلوك تشين', 'Blockchain Technology', 3, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS605', 'أخلاقيات تقنية المعلومات', 'IT Ethics', 2, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('ENTR101', 'ريادة الأعمال', 'Entrepreneurship', 3, 7, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- المستوى الثامن
INSERT INTO courses (course_code, name_ar, name_en, credits, level, department, semester, is_active) VALUES
('MIS701', 'مشروع التخرج 1', 'Graduation Project 1', 3, 8, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS702', 'مشروع التخرج 2', 'Graduation Project 2', 3, 8, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS703', 'التدريب التعاوني', 'Cooperative Training', 3, 8, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS704', 'حلقة بحث', 'Research Seminar', 2, 8, 'نظم المعلومات الإدارية', 'Fall 2025', true),
('MIS705', 'موضوعات متقدمة في نظم المعلومات', 'Advanced Topics in MIS', 3, 8, 'نظم المعلومات الإدارية', 'Fall 2025', true);

-- =====================================================
-- ✅ الخطوة 10: التحقق من إنشاء الجداول
-- =====================================================

-- عرض جميع الجداول
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- عرض عدد المقررات
SELECT 
  level,
  COUNT(*) as course_count,
  SUM(credits) as total_credits
FROM courses
GROUP BY level
ORDER BY level;

-- =====================================================
-- 🎉 تم الإعداد بنجاح!
-- =====================================================
-- الآن يمكنك:
-- 1. إنشاء حساب جديد من صفحة التسجيل
-- 2. تسجيل الدخول بالحساب الجديد
-- 3. البيانات ستُربط تلقائياً بين Auth وجدول Users
-- =====================================================
