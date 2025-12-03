-- 🔥🔥🔥 COMPLETE DATABASE FIX - نهائي وكامل 🔥🔥🔥
-- نسخ هذا السكريبت بالكامل والصقه في Supabase SQL Editor
-- رابط SQL Editor: https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/sql/new

-- ===================================
-- الخطوة 1: حذف كل شيء قديم
-- ===================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===================================
-- الخطوة 2: إنشاء جدول المستخدمين
-- ===================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  student_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- الخطوة 3: إنشاء جدول الطلاب
-- ===================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  major TEXT NOT NULL DEFAULT 'نظم المعلومات الإدارية',
  major_en TEXT DEFAULT 'Management Information Systems',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.0 CHECK (gpa >= 0.0 AND gpa <= 5.0),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- الخطوة 4: إنشاء جدول المشرفين
-- ===================================

CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'قسم المعلوماتية الإدارية',
  department_en TEXT DEFAULT 'MIS Department',
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- الخطوة 5: إنشاء جدول المقررات
-- ===================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  semester TEXT DEFAULT 'both',
  prerequisites TEXT[],
  description_ar TEXT,
  description_en TEXT,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- الخطوة 6: إنشاء جدول التسجيلات
-- ===================================

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  grade TEXT,
  grade_points DECIMAL(3,2),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- ===================================
-- الخطوة 7: إنشاء جدول الإشعارات
-- ===================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  message_en TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- الخطوة 8: تعطيل RLS على جميع الجداول
-- ===================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ===================================
-- الخطوة 9: إضافة المقررات الدراسية (49 مقرر)
-- ===================================

-- المستوى الأول
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester) VALUES
('ARAB101', 'المهارات اللغوية', 'Language Skills', 3, 1, 'both'),
('ENGL101', 'اللغة الإنجليزية 1', 'English Language 1', 3, 1, 'both'),
('MATH101', 'الرياضيات للإدارة', 'Mathematics for Management', 3, 1, 'both'),
('ACCT101', 'مبادئ المحاسبة', 'Principles of Accounting', 3, 1, 'both'),
('MGT101', 'مبادئ الإدارة', 'Principles of Management', 3, 1, 'both'),
('ECON101', 'مبادئ الاقتصاد', 'Principles of Economics', 3, 1, 'both'),
('ISLM101', 'الثقافة الإسلامية', 'Islamic Culture', 2, 1, 'both');

-- المستوى الثاني
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('ENGL102', 'اللغة الإنجليزية 2', 'English Language 2', 3, 2, 'both', ARRAY['ENGL101']),
('STAT201', 'الإحصاء للأعمال', 'Statistics for Business', 3, 2, 'both', ARRAY['MATH101']),
('ACCT102', 'محاسبة إدارية', 'Managerial Accounting', 3, 2, 'both', ARRAY['ACCT101']),
('MKT201', 'مبادئ التسويق', 'Principles of Marketing', 3, 2, 'both', ARRAY['MGT101']),
('FIN201', 'مبادئ التمويل', 'Principles of Finance', 3, 2, 'both', ARRAY['ACCT101']),
('MIS201', 'مقدمة في نظم المعلومات', 'Introduction to Information Systems', 3, 2, 'both', NULL),
('LAW201', 'القانون التجاري', 'Commercial Law', 2, 2, 'both', NULL);

-- المستوى الثالث
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS301', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, 'both', ARRAY['MIS201']),
('MIS302', 'قواعد البيانات', 'Database Systems', 3, 3, 'both', ARRAY['MIS201']),
('MIS303', 'البرمجة للأعمال', 'Programming for Business', 3, 3, 'both', ARRAY['MIS201']),
('MGT301', 'إدارة العمليات', 'Operations Management', 3, 3, 'both', ARRAY['MGT101', 'STAT201']),
('HRM301', 'إدارة الموارد البشرية', 'Human Resource Management', 3, 3, 'both', ARRAY['MGT101']),
('OM301', 'بحوث العمليات', 'Operations Research', 3, 3, 'both', ARRAY['STAT201']),
('COMM301', 'الاتصال في المنظمات', 'Communication in Organizations', 2, 3, 'both', NULL);

-- المستوى الرابع
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS401', 'الشبكات والاتصالات', 'Networks and Communications', 3, 4, 'both', ARRAY['MIS201']),
('MIS402', 'إدارة قواعد البيانات', 'Database Management', 3, 4, 'both', ARRAY['MIS302']),
('MIS403', 'نظم المعلومات الإدارية', 'Management Information Systems', 3, 4, 'both', ARRAY['MIS301']),
('MGT401', 'الإدارة الاستراتيجية', 'Strategic Management', 3, 4, 'both', ARRAY['MGT101']),
('MKT401', 'إدارة التسويق', 'Marketing Management', 3, 4, 'both', ARRAY['MKT201']),
('FIN401', 'الإدارة المالية', 'Financial Management', 3, 4, 'both', ARRAY['FIN201']),
('IS401', 'أمن المعلومات', 'Information Security', 3, 4, 'both', ARRAY['MIS201']);

-- المستوى الخامس
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS501', 'نظم دعم القرار', 'Decision Support Systems', 3, 5, 'both', ARRAY['MIS403', 'MIS302']),
('MIS502', 'تطوير تطبيقات الويب', 'Web Application Development', 3, 5, 'both', ARRAY['MIS303']),
('MIS503', 'إدارة المشاريع التقنية', 'IT Project Management', 3, 5, 'both', ARRAY['MIS301']),
('MIS504', 'ذكاء الأعمال', 'Business Intelligence', 3, 5, 'both', ARRAY['MIS302', 'STAT201']),
('ENT501', 'ريادة الأعمال', 'Entrepreneurship', 3, 5, 'both', ARRAY['MGT101']),
('SCM501', 'إدارة سلسلة الإمداد', 'Supply Chain Management', 3, 5, 'both', ARRAY['MGT301']),
('ETHICS501', 'أخلاقيات الأعمال', 'Business Ethics', 2, 5, 'both', NULL);

-- المستوى السادس
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS601', 'تطبيقات الأعمال الإلكترونية', 'E-Business Applications', 3, 6, 'both', ARRAY['MIS502']),
('MIS602', 'تخطيط موارد المؤسسة', 'Enterprise Resource Planning', 3, 6, 'both', ARRAY['MIS403']),
('MIS603', 'إدارة المعرفة', 'Knowledge Management', 3, 6, 'both', ARRAY['MIS403']),
('MIS604', 'الحوسبة السحابية', 'Cloud Computing', 3, 6, 'both', ARRAY['MIS401']),
('DATA601', 'تحليل البيانات', 'Data Analytics', 3, 6, 'both', ARRAY['MIS504', 'STAT201']),
('AI601', 'الذكاء الاصطناعي للأعمال', 'AI for Business', 3, 6, 'both', ARRAY['MIS504']),
('RESEARCH601', 'مناهج البحث', 'Research Methods', 2, 6, 'both', NULL);

-- المستوى السابع
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS701', 'إدارة نظم المعلومات', 'Information Systems Management', 3, 7, 'both', ARRAY['MIS503']),
('MIS702', 'تدقيق نظم المعلومات', 'Information Systems Audit', 3, 7, 'both', ARRAY['MIS403', 'IS401']),
('MIS703', 'نظم المعلومات المتقدمة', 'Advanced Information Systems', 3, 7, 'both', ARRAY['MIS601']),
('MOBILE701', 'تطبيقات الجوال', 'Mobile Applications', 3, 7, 'both', ARRAY['MIS502']),
('BIGDATA701', 'البيانات الضخمة', 'Big Data', 3, 7, 'both', ARRAY['DATA601']),
('BLOCKCHAIN701', 'تقنية البلوك تشين', 'Blockchain Technology', 3, 7, 'both', ARRAY['IS401']);

-- المستوى الثامن
INSERT INTO courses (course_code, name_ar, name_en, credits, level, semester, prerequisites) VALUES
('MIS801', 'مشروع التخرج 1', 'Graduation Project 1', 3, 8, 'first', ARRAY['MIS701']),
('MIS802', 'مشروع التخرج 2', 'Graduation Project 2', 3, 8, 'second', ARRAY['MIS801']),
('MIS803', 'التدريب التعاوني', 'Cooperative Training', 6, 8, 'both', NULL);

-- ===================================
-- الخطوة 10: إنشاء Indexes للأداء
-- ===================================

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);
CREATE INDEX idx_registrations_student_id ON registrations(student_id);
CREATE INDEX idx_registrations_course_id ON registrations(course_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_code ON courses(course_code);

-- ===================================
-- الخطوة 11: التحقق من الإنشاء
-- ===================================

SELECT 
  'الجداول المنشأة:' as status,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

SELECT 
  '✅ المقررات الدراسية:' as status,
  COUNT(*) as count
FROM courses;

SELECT 
  table_name as "الجدول",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ===================================
-- ✅✅✅ تم الإنشاء بنجاح! ✅✅✅
-- ===================================
-- الآن يمكنك إنشاء حساب جديد في النظام
-- ===================================
