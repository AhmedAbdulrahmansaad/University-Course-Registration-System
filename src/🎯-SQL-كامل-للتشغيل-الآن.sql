-- ======================================
-- 🎓 نظام تسجيل المقررات - جامعة الملك خالد
-- SQL كامل 100% - الجداول + المقررات + كل شيء
-- ======================================

-- ⚠️ تعليمات التشغيل:
-- 1. اذهب إلى: https://supabase.com/dashboard/project/kcbxyonombsqamwsmmqz
-- 2. من القائمة الجانبية → SQL Editor
-- 3. اضغط "New Query"
-- 4. انسخ هذا الكود بالكامل والصقه
-- 5. اضغط "Run" (أو Ctrl + Enter)
-- 6. انتظر رسالة "Success"

-- ========================================
-- 1️⃣ حذف الجداول القديمة (إذا وجدت)
-- ========================================

DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS registration_requests CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- 2️⃣ جدول المستخدمين (users)
-- ========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- 3️⃣ جدول الطلاب (students)
-- ========================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  major TEXT NOT NULL,
  major_en TEXT,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 5),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_major ON students(major);
CREATE INDEX idx_students_level ON students(level);

-- ========================================
-- 4️⃣ جدول المشرفين (supervisors)
-- ========================================

CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department TEXT,
  department_en TEXT,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);

-- ========================================
-- 5️⃣ جدول المقررات (courses)
-- ========================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  major TEXT NOT NULL,
  prerequisites TEXT[],
  is_elective BOOLEAN DEFAULT FALSE,
  max_students INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_major ON courses(major);

-- ========================================
-- 6️⃣ جدول التسجيلات (enrollments)
-- ========================================

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
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

-- Indexes
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_semester ON enrollments(semester);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ========================================
-- 7️⃣ جدول طلبات التسجيل (registration_requests)
-- ========================================

CREATE TABLE registration_requests (
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

-- Indexes
CREATE INDEX idx_registration_requests_student_id ON registration_requests(student_id);
CREATE INDEX idx_registration_requests_status ON registration_requests(status);

-- ========================================
-- 8️⃣ جدول الإعلانات (announcements)
-- ========================================

CREATE TABLE announcements (
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

-- Indexes
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- ========================================
-- 9️⃣ Row Level Security (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Anyone can view active announcements" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Students can view their own data" ON students FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "Students can view their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = student_id));
CREATE POLICY "Students can view their own requests" ON registration_requests FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = student_id));

-- ========================================
-- 🔟 Functions & Triggers
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registration_requests_updated_at BEFORE UPDATE ON registration_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 1️⃣1️⃣ إدخال 49 مقرراً من خطة نظم المعلومات الإدارية
-- ========================================

-- المستوى الأول (8 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('ARAB101', 'اللغة العربية (1)', 'Arabic Language (1)', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('ENGL101', 'اللغة الإنجليزية (1)', 'English Language (1)', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('ISLM101', 'الثقافة الإسلامية (1)', 'Islamic Culture (1)', 2, 1, 'نظم المعلومات الإدارية', '{}', false),
('MATH101', 'الرياضيات للإدارة', 'Mathematics for Management', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('STAT101', 'مبادئ الإحصاء', 'Principles of Statistics', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('MGMT101', 'مبادئ الإدارة', 'Principles of Management', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('ACCT101', 'مبادئ المحاسبة (1)', 'Principles of Accounting (1)', 3, 1, 'نظم المعلومات الإدارية', '{}', false),
('COMM101', 'مهارات الاتصال', 'Communication Skills', 2, 1, 'نظم المعلومات الإدارية', '{}', false);

-- المستوى الثاني (8 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('ARAB102', 'اللغة العربية (2)', 'Arabic Language (2)', 3, 2, 'نظم المعلومات الإدارية', '{ARAB101}', false),
('ENGL102', 'اللغة الإنجليزية (2)', 'English Language (2)', 3, 2, 'نظم المعلومات الإدارية', '{ENGL101}', false),
('ISLM102', 'الثقافة الإسلامية (2)', 'Islamic Culture (2)', 2, 2, 'نظم المعلومات الإدارية', '{ISLM101}', false),
('CS101', 'مقدمة في الحاسب الآلي', 'Introduction to Computer Science', 3, 2, 'نظم المعلومات الإدارية', '{}', false),
('ECON101', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics', 3, 2, 'نظم المعلومات الإدارية', '{}', false),
('ACCT102', 'مبادئ المحاسبة (2)', 'Principles of Accounting (2)', 3, 2, 'نظم المعلومات الإدارية', '{ACCT101}', false),
('LAW101', 'مبادئ القانون التجاري', 'Principles of Commercial Law', 2, 2, 'نظم المعلومات الإدارية', '{}', false),
('MIS101', 'مقدمة في نظم المعلومات', 'Introduction to Information Systems', 3, 2, 'نظم المعلومات الإدارية', '{}', false);

-- المستوى الثالث (7 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('ENGL201', 'اللغة الإنجليزية (3)', 'English Language (3)', 3, 3, 'نظم المعلومات الإدارية', '{ENGL102}', false),
('ECON201', 'مبادئ الاقتصاد الكلي', 'Principles of Macroeconomics', 3, 3, 'نظم المعلومات الإدارية', '{ECON101}', false),
('MIS201', 'برمجة الحاسب (1)', 'Computer Programming (1)', 4, 3, 'نظم المعلومات الإدارية', '{CS101}', false),
('STAT201', 'الإحصاء التطبيقي', 'Applied Statistics', 3, 3, 'نظم المعلومات الإدارية', '{STAT101}', false),
('MGMT201', 'السلوك التنظيمي', 'Organizational Behavior', 3, 3, 'نظم المعلومات الإدارية', '{MGMT101}', false),
('ACCT201', 'المحاسبة الإدارية', 'Managerial Accounting', 3, 3, 'نظم المعلومات الإدارية', '{ACCT102}', false),
('MIS202', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, 'نظم المعلومات الإدارية', '{MIS101}', false);

-- المستوى الرابع (6 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('MIS301', 'برمجة الحاسب (2)', 'Computer Programming (2)', 4, 4, 'نظم المعلومات الإدارية', '{MIS201}', false),
('MIS302', 'قواعد البيانات', 'Database Management Systems', 4, 4, 'نظم المعلومات الإدارية', '{MIS202}', false),
('MGMT301', 'إدارة العمليات', 'Operations Management', 3, 4, 'نظم المعلومات الإدارية', '{MGMT201}', false),
('FIN301', 'الإدارة المالية', 'Financial Management', 3, 4, 'نظم المعلومات الإدارية', '{ACCT201}', false),
('MKT301', 'مبادئ التسويق', 'Principles of Marketing', 3, 4, 'نظم المعلومات الإدارية', '{MGMT101}', false),
('MIS303', 'شبكات الحاسب', 'Computer Networks', 3, 4, 'نظم المعلومات الإدارية', '{CS101}', false);

-- المستوى الخامس (6 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('MIS401', 'إدارة قواعد البيانات المتقدمة', 'Advanced Database Management', 3, 5, 'نظم المعلومات الإدارية', '{MIS302}', false),
('MIS402', 'تطوير تطبيقات الويب', 'Web Application Development', 4, 5, 'نظم المعلومات الإدارية', '{MIS301}', false),
('MIS403', 'أمن المعلومات', 'Information Security', 3, 5, 'نظم المعلومات الإدارية', '{MIS303}', false),
('MIS404', 'نظم دعم القرار', 'Decision Support Systems', 3, 5, 'نظم المعلومات الإدارية', '{MIS302, STAT201}', false),
('MGMT401', 'الإدارة الاستراتيجية', 'Strategic Management', 3, 5, 'نظم المعلومات الإدارية', '{MGMT301}', false),
('MIS405', 'إدارة المشاريع', 'Project Management', 3, 5, 'نظم المعلومات الإدارية', '{MGMT301}', false);

-- المستوى السادس (5 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('MIS501', 'نظم المعلومات الإدارية المتقدمة', 'Advanced MIS', 3, 6, 'نظم المعلومات الإدارية', '{MIS404}', false),
('MIS502', 'إدارة موارد تقنية المعلومات', 'IT Resource Management', 3, 6, 'نظم المعلومات الإدارية', '{MIS405}', false),
('MIS503', 'نظم التجارة الإلكترونية', 'E-Commerce Systems', 3, 6, 'نظم المعلومات الإدارية', '{MIS402}', false),
('MIS504', 'تنقيب البيانات', 'Data Mining', 3, 6, 'نظم المعلومات الإدارية', '{MIS401, STAT201}', false),
('MIS505', 'حوكمة تقنية المعلومات', 'IT Governance', 3, 6, 'نظم المعلومات الإدارية', '{MIS403}', false);

-- المستوى السابع (5 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('MIS601', 'ذكاء الأعمال', 'Business Intelligence', 3, 7, 'نظم المعلومات الإدارية', '{MIS504}', false),
('MIS602', 'إدارة علاقات العملاء', 'Customer Relationship Management', 3, 7, 'نظم المعلومات الإدارية', '{MIS503}', false),
('MIS603', 'نظم تخطيط موارد المؤسسات', 'Enterprise Resource Planning (ERP)', 3, 7, 'نظم المعلومات الإدارية', '{MIS501}', false),
('MIS604', 'إدارة المعرفة', 'Knowledge Management', 3, 7, 'نظم المعلومات الإدارية', '{MIS501}', false),
('MIS605', 'مقرر اختياري (1)', 'Elective Course (1)', 3, 7, 'نظم المعلومات الإدارية', '{}', true);

-- المستوى الثامن (4 مقررات)
INSERT INTO courses (code, name_ar, name_en, credits, level, major, prerequisites, is_elective) VALUES
('MIS701', 'مشروع التخرج', 'Graduation Project', 4, 8, 'نظم المعلومات الإدارية', '{MIS601, MIS603}', false),
('MIS702', 'حلقة البحث', 'Research Seminar', 2, 8, 'نظم المعلومات الإدارية', '{}', false),
('MIS703', 'مقرر اختياري (2)', 'Elective Course (2)', 3, 8, 'نظم المعلومات الإدارية', '{}', true),
('MIS704', 'مقرر اختياري (3)', 'Elective Course (3)', 3, 8, 'نظم المعلومات الإدارية', '{}', true);

-- ========================================
-- 1️⃣2️⃣ إنشاء إعلان ترحيبي
-- ========================================

INSERT INTO announcements (title_ar, title_en, content_ar, content_en, type, is_active) VALUES
(
  'مرحباً بكم في نظام تسجيل المقررات',
  'Welcome to Course Registration System',
  'نرحب بكم في نظام تسجيل المقررات الإلكتروني لجامعة الملك خالد - قسم المعلوماتية الإدارية. يمكنكم الآن تسجيل المقررات، متابعة معدلاتكم، والتواصل مع المشرف الأكاديمي بكل سهولة.',
  'Welcome to the electronic course registration system for King Khalid University - MIS Department. You can now register courses, track your GPA, and communicate with your academic advisor easily.',
  'general',
  true
);

-- ========================================
-- ✅ تم الانتهاء!
-- ========================================

SELECT 
  '✅ تم إنشاء قاعدة البيانات بنجاح!' as status,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM announcements) as total_announcements,
  'جاهز للاستخدام 🚀' as message;
