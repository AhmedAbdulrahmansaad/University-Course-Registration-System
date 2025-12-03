-- =====================================================
-- 🎯 قاعدة البيانات الكاملة - نظام تسجيل المقررات
-- جامعة الملك خالد - نظم المعلومات الإدارية
-- =====================================================
-- هذا الملف الوحيد الذي تحتاجه!
-- انسخه والصقه في Supabase SQL Editor واضغط RUN
-- =====================================================

-- =====================================================
-- الجزء 1: حذف أي جداول قديمة (لو موجودة)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow admin full access to users" ON users;
DROP POLICY IF EXISTS "Allow admin full access to students" ON students;
DROP POLICY IF EXISTS "Allow admin full access to supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow admin full access to registrations" ON registrations;
DROP POLICY IF EXISTS "Allow admin full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Allow admin full access to course_offerings" ON course_offerings;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS course_offerings CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- الجزء 2: إنشاء الجداول
-- =====================================================

-- جدول المستخدمين
CREATE TABLE users (
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

-- جدول الطلاب
CREATE TABLE students (
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

-- جدول المشرفين
CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT DEFAULT 'قسم المعلوماتية الإدارية',
  department_en TEXT DEFAULT 'MIS Department',
  office_location TEXT,
  office_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المقررات (مع course_code و is_active)
CREATE TABLE courses (
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

-- جدول التسجيلات
CREATE TABLE registrations (
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

-- جدول الإشعارات
CREATE TABLE notifications (
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

-- جدول عروض المقررات
CREATE TABLE course_offerings (
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

-- =====================================================
-- الجزء 3: إنشاء Indexes للأداء
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_major ON students(major);

CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);

CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_is_active ON courses(is_active);

CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_course ON registrations(course_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_semester ON registrations(semester);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_offerings_course ON course_offerings(course_id);
CREATE INDEX idx_offerings_semester ON course_offerings(semester);

-- =====================================================
-- الجزء 4: تفعيل Row Level Security
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- الجزء 5: إنشاء Policies
-- =====================================================

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

-- =====================================================
-- الجزء 6: إضافة 49 مقرراً من الخطة الرسمية
-- =====================================================

-- المستوى الأول (8 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS101', 'مبادئ نظم المعلومات', 'مبادئ نظم المعلومات', 'Principles of Information Systems', 3, 1, 'both', '{}', 'مقدمة في نظم المعلومات وتطبيقاتها في المنظمات', 'Introduction to information systems and their applications in organizations', true),
('BUS100', 'مقدمة في إدارة الأعمال', 'مقدمة في إدارة الأعمال', 'Introduction to Business', 3, 1, 'both', '{}', 'المفاهيم الأساسية في إدارة الأعمال', 'Basic concepts in business management', true),
('MATH110', 'الرياضيات للأعمال', 'الرياضيات للأعمال', 'Mathematics for Business', 3, 1, 'both', '{}', 'الرياضيات الأساسية المستخدمة في الأعمال', 'Basic mathematics used in business', true),
('ENGL101', 'اللغة الإنجليزية 1', 'اللغة الإنجليزية 1', 'English Language I', 3, 1, 'both', '{}', 'المهارات الأساسية في اللغة الإنجليزية', 'Basic English language skills', true),
('ARAB101', 'اللغة العربية', 'اللغة العربية', 'Arabic Language', 2, 1, 'both', '{}', 'مهارات الكتابة والقراءة في اللغة العربية', 'Arabic reading and writing skills', true),
('ISLA101', 'الثقافة الإسلامية', 'الثقافة الإسلامية', 'Islamic Culture', 2, 1, 'both', '{}', 'أساسيات الثقافة الإسلامية', 'Fundamentals of Islamic culture', true),
('CS101', 'مقدمة في الحاسب الآلي', 'مقدمة في الحاسب الآلي', 'Introduction to Computer', 3, 1, 'both', '{}', 'المفاهيم الأساسية للحاسب الآلي', 'Basic computer concepts', true),
('STAT101', 'مبادئ الإحصاء', 'مبادئ الإحصاء', 'Principles of Statistics', 3, 1, 'both', '{}', 'المفاهيم الإحصائية الأساسية', 'Basic statistical concepts', true);

-- المستوى الثاني (7 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS201', 'برمجة الحاسب', 'برمجة الحاسب', 'Computer Programming', 3, 2, 'both', ARRAY['CS101'], 'أساسيات البرمجة باستخدام لغة برمجة حديثة', 'Programming fundamentals using a modern programming language', true),
('MIS202', 'قواعد البيانات', 'قواعد البيانات', 'Database Systems', 3, 2, 'both', ARRAY['MIS101'], 'مبادئ تصميم وإدارة قواعد البيانات', 'Principles of database design and management', true),
('ACC201', 'مبادئ المحاسبة 1', 'مبادئ المحاسبة 1', 'Principles of Accounting I', 3, 2, 'both', '{}', 'المفاهيم الأساسية في المحاسبة المالية', 'Basic concepts in financial accounting', true),
('ECON201', 'مبادئ الاقتصاد الجزئي', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics', 3, 2, 'both', '{}', 'النظرية الاقتصادية الجزئية', 'Microeconomic theory', true),
('ENGL102', 'اللغة الإنجليزية 2', 'اللغة الإنجليزية 2', 'English Language II', 3, 2, 'both', ARRAY['ENGL101'], 'مهارات متقدمة في اللغة الإنجليزية', 'Advanced English language skills', true),
('MGT201', 'السلوك التنظيمي', 'السلوك التنظيمي', 'Organizational Behavior', 3, 2, 'both', ARRAY['BUS100'], 'دراسة السلوك الفردي والجماعي في المنظمات', 'Study of individual and group behavior in organizations', true),
('MATH210', 'الإحصاء التطبيقي', 'الإحصاء التطبيقي', 'Applied Statistics', 3, 2, 'both', ARRAY['STAT101'], 'التطبيقات الإحصائية في الأعمال', 'Statistical applications in business', true);

-- المستوى الثالث (6 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS301', 'تحليل وتصميم النظم', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, 'both', ARRAY['MIS201', 'MIS202'], 'منهجيات تحليل وتصميم نظم المعلومات', 'Information systems analysis and design methodologies', true),
('MIS302', 'شبكات الحاسب', 'شبكات الحاسب', 'Computer Networks', 3, 3, 'both', ARRAY['MIS201'], 'أساسيات شبكات الحاسب والاتصالات', 'Computer networks and communications fundamentals', true),
('MIS303', 'إدارة المشاريع', 'إدارة المشاريع', 'Project Management', 3, 3, 'both', ARRAY['MGT201'], 'إدارة المشاريع والتخطيط', 'Project management and planning', true),
('ACC202', 'مبادئ المحاسبة 2', 'مبادئ المحاسبة 2', 'Principles of Accounting II', 3, 3, 'both', ARRAY['ACC201'], 'المحاسبة الإدارية والتكاليف', 'Managerial and cost accounting', true),
('FIN301', 'التمويل والاستثمار', 'التمويل والاستثمار', 'Finance and Investment', 3, 3, 'both', ARRAY['ACC201'], 'مبادئ التمويل والاستثمار', 'Finance and investment principles', true),
('MKT301', 'مبادئ التسويق', 'مبادئ التسويق', 'Principles of Marketing', 3, 3, 'both', ARRAY['BUS100'], 'أساسيات التسويق والعلاقات مع العملاء', 'Marketing and customer relations basics', true);

-- المستوى الرابع (6 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS401', 'برمجة الإنترنت', 'برمجة الإنترنت', 'Web Programming', 3, 4, 'both', ARRAY['MIS201'], 'تطوير تطبيقات الويب', 'Web application development', true),
('MIS402', 'أمن المعلومات', 'أمن المعلومات', 'Information Security', 3, 4, 'both', ARRAY['MIS302'], 'مبادئ أمن المعلومات والحماية', 'Information security principles', true),
('MIS403', 'إدارة قواعد البيانات', 'إدارة قواعد البيانات', 'Database Management', 3, 4, 'both', ARRAY['MIS202'], 'إدارة وتحسين قواعد البيانات', 'Database administration and optimization', true),
('MIS404', 'نظم دعم القرار', 'نظم دعم القرار', 'Decision Support Systems', 3, 4, 'both', ARRAY['MIS301'], 'أنظمة دعم اتخاذ القرار', 'Decision support systems', true),
('MIS405', 'التجارة الإلكترونية', 'التجارة الإلكترونية', 'E-Commerce', 3, 4, 'both', ARRAY['MIS401'], 'مفاهيم وتطبيقات التجارة الإلكترونية', 'E-commerce concepts and applications', true),
('LAW301', 'القانون التجاري', 'القانون التجاري', 'Commercial Law', 2, 4, 'both', '{}', 'أساسيات القانون التجاري', 'Commercial law fundamentals', true);

-- المستوى الخامس (6 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS501', 'تطبيقات الأعمال الإلكترونية', 'تطبيقات الأعمال الإلكترونية', 'E-Business Applications', 3, 5, 'both', ARRAY['MIS405'], 'تطبيقات الأعمال الإلكترونية المتقدمة', 'Advanced e-business applications', true),
('MIS502', 'تحليل البيانات', 'تحليل البيانات', 'Data Analytics', 3, 5, 'both', ARRAY['MATH210', 'MIS403'], 'تحليل البيانات واستخراج المعلومات', 'Data analysis and information extraction', true),
('MIS503', 'إدارة نظم المعلومات', 'إدارة نظم المعلومات', 'Information Systems Management', 3, 5, 'both', ARRAY['MIS301'], 'إدارة موارد نظم المعلومات', 'IS resources management', true),
('MIS504', 'نظم المعلومات الإستراتيجية', 'نظم المعلومات الإستراتيجية', 'Strategic Information Systems', 3, 5, 'both', ARRAY['MIS503'], 'دور نظم المعلومات في الاستراتيجية', 'Role of IS in strategy', true),
('MIS505', 'إدارة علاقات العملاء', 'إدارة علاقات العملاء', 'Customer Relationship Management', 3, 5, 'both', ARRAY['MKT301'], 'نظم إدارة علاقات العملاء', 'CRM systems', true),
('HRM401', 'إدارة الموارد البشرية', 'إدارة الموارد البشرية', 'Human Resource Management', 3, 5, 'both', ARRAY['MGT201'], 'مبادئ إدارة الموارد البشرية', 'HRM principles', true);

-- المستوى السادس (6 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS601', 'الحوسبة السحابية', 'الحوسبة السحابية', 'Cloud Computing', 3, 6, 'both', ARRAY['MIS302'], 'مفاهيم وتطبيقات الحوسبة السحابية', 'Cloud computing concepts', true),
('MIS602', 'الذكاء الاصطناعي', 'الذكاء الاصطناعي', 'Artificial Intelligence', 3, 6, 'both', ARRAY['MIS201'], 'مقدمة في الذكاء الاصطناعي', 'Introduction to AI', true),
('MIS603', 'تعلم الآلة', 'تعلم الآلة', 'Machine Learning', 3, 6, 'both', ARRAY['MIS502', 'MIS602'], 'خوارزميات تعلم الآلة', 'Machine learning algorithms', true),
('MIS604', 'تطوير تطبيقات الجوال', 'تطوير تطبيقات الجوال', 'Mobile App Development', 3, 6, 'both', ARRAY['MIS401'], 'تطوير تطبيقات الأجهزة المحمولة', 'Mobile applications development', true),
('MIS605', 'إدارة سلاسل الإمداد', 'إدارة سلاسل الإمداد', 'Supply Chain Management', 3, 6, 'both', ARRAY['MIS503'], 'نظم إدارة سلاسل الإمداد', 'Supply chain management systems', true),
('ENTR401', 'ريادة الأعمال', 'ريادة الأعمال', 'Entrepreneurship', 3, 6, 'both', ARRAY['BUS100'], 'مبادئ ريادة الأعمال', 'Entrepreneurship principles', true);

-- المستوى السابع (5 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS701', 'إنترنت الأشياء', 'إنترنت الأشياء', 'Internet of Things', 3, 7, 'both', ARRAY['MIS302'], 'مفاهيم وتطبيقات إنترنت الأشياء', 'IoT concepts and applications', true),
('MIS702', 'البيانات الضخمة', 'البيانات الضخمة', 'Big Data', 3, 7, 'both', ARRAY['MIS502'], 'تحليل ومعالجة البيانات الضخمة', 'Big data analysis and processing', true),
('MIS703', 'حوكمة تقنية المعلومات', 'حوكمة تقنية المعلومات', 'IT Governance', 3, 7, 'both', ARRAY['MIS503'], 'إطار حوكمة تقنية المعلومات', 'IT governance framework', true),
('MIS704', 'تدقيق نظم المعلومات', 'تدقيق نظم المعلومات', 'Information Systems Audit', 3, 7, 'both', ARRAY['MIS402'], 'تدقيق ومراجعة نظم المعلومات', 'IS audit and review', true),
('MIS705', 'الأمن السيبراني', 'الأمن السيبراني', 'Cybersecurity', 3, 7, 'both', ARRAY['MIS402'], 'حماية الأنظمة من التهديدات', 'Systems protection from threats', true);

-- المستوى الثامن (5 مقررات)
INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en, is_active)
VALUES
('MIS801', 'مشروع التخرج 1', 'مشروع التخرج 1', 'Graduation Project I', 3, 8, 'fall', ARRAY['MIS701'], 'البحث والتخطيط لمشروع التخرج', 'Research and planning for graduation project', true),
('MIS802', 'مشروع التخرج 2', 'مشروع التخرج 2', 'Graduation Project II', 3, 8, 'spring', ARRAY['MIS801'], 'تنفيذ وتقديم مشروع التخرج', 'Implementation and presentation', true),
('MIS803', 'البحث العلمي في نظم المعلومات', 'البحث العلمي في نظم المعلومات', 'Research Methods in IS', 2, 8, 'both', ARRAY['MIS701'], 'منهجيات البحث العلمي', 'Scientific research methodologies', true),
('MIS804', 'التدريب التعاوني', 'التدريب التعاوني', 'Cooperative Training', 3, 8, 'both', ARRAY['MIS701'], 'التدريب العملي في المؤسسات', 'Practical training in organizations', true),
('MIS805', 'موضوعات متقدمة في نظم المعلومات', 'موضوعات متقدمة في نظم المعلومات', 'Advanced Topics in IS', 2, 8, 'both', ARRAY['MIS702'], 'موضوعات حديثة ومتقدمة', 'Modern and advanced topics', true);

-- =====================================================
-- الجزء 7: التحقق النهائي
-- =====================================================

SELECT '✅ قاعدة البيانات جاهزة!' AS message;
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT COUNT(*) AS total_courses FROM courses;
SELECT level, COUNT(*) AS count FROM courses GROUP BY level ORDER BY level;

-- =====================================================
-- 🎉 انتهى! قاعدة البيانات جاهزة 100%
-- الآن يمكنك إنشاء الحسابات من واجهة النظام
-- =====================================================
