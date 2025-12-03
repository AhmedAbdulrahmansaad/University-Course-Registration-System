-- ======================================
-- 🎓 نظام تسجيل المقررات - جامعة الملك خالد
-- SQL لإنشاء الجداول في Supabase
-- ======================================

-- ⚠️ هام: قم بتنفيذ هذا الملف في Supabase SQL Editor
-- 📍 Dashboard > SQL Editor > New Query > الصق الكود أدناه > Run

-- ========================================
-- 1️⃣ جدول المستخدمين (users)
-- ========================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  student_id TEXT UNIQUE, -- ✅ تغيير: إزالة NOT NULL لأن المشرفين والإداريين لا يحتاجون student_id
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'supervisor', 'admin')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 2️⃣ جدول الطلاب (students)
-- ========================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  major TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 5),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);

-- ========================================
-- 3️⃣ جدول المشرفين (supervisors)
-- ========================================

CREATE TABLE IF NOT EXISTS supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_supervisors_user_id ON supervisors(user_id);

-- ========================================
-- 4️⃣ جدول المقررات (courses)
-- ========================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  major TEXT NOT NULL,
  prerequisites TEXT[], -- Array of course codes
  is_elective BOOLEAN DEFAULT FALSE,
  max_students INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_major ON courses(major);

-- ========================================
-- 5️⃣ جدول التسجيلات (enrollments)
-- ========================================

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL, -- e.g., "1445-1", "1445-2"
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled', 'completed', 'dropped')),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', NULL)),
  grade_points DECIMAL(3,2),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approval_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester)
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ========================================
-- 6️⃣ جدول طلبات التسجيل (registration_requests)
-- ========================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  response_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_registration_requests_student_id ON registration_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);

-- ========================================
-- 7️⃣ جدول الإعلانات (announcements)
-- ========================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'academic', 'administrative')),
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- ========================================
-- 8️⃣ Row Level Security (RLS)
-- ========================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ✅ سياسة القراءة العامة للمقررات (الكل يمكنه القراءة)
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);

-- ✅ سياسة القراءة العامة للإعلانات النشطة (الكل يمكنه القراءة)
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- ✅ سياسة الطلاب - يمكنهم قراءة بياناتهم فقط
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- ✅ سياسة التسجيلات - الطلاب يمكنهم قراءة تسجيلاتهم فقط
CREATE POLICY "Students can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = student_id));

-- ✅ سياسة طلبات التسجيل - الطلاب يمكنهم قراءة طلباتهم فقط
CREATE POLICY "Students can view their own requests" ON registration_requests
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = student_id));

-- ⚠️ ملاحظة: السياسات الأخرى يمكن إضافتها حسب الحاجة
-- في الوقت الحالي، سنستخدم Service Role Key من الـ Edge Functions
-- مما يسمح بالوصول الكامل للبيانات

-- ========================================
-- 9️⃣ Functions & Triggers
-- ========================================

-- ✅ Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ تطبيق Trigger على جميع الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_requests_updated_at BEFORE UPDATE ON registration_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 🎉 تم إنشاء الجداول بنجاح!
-- ========================================

-- ✅ الخطوات التالية:
-- 1. تحقق من أن جميع الجداول تم إنشاؤها بنجاح
-- 2. يمكنك الآن استخدام النظام من خلال Vercel
-- 3. يمكن إضافة بيانات اختبارية إذا أردت

SELECT 
  'تم إنشاء الجداول بنجاح! ✅' as message,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';