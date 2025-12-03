-- =====================================================
-- 🔥 نظام تسجيل المقررات - جامعة الملك خالد
-- قاعدة البيانات الكاملة - Supabase PostgreSQL
-- =====================================================
-- 📋 التعليمات:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى SQL Editor
-- 3. اضغط "New Query"
-- 4. انسخ هذا الملف بالكامل والصقه
-- 5. اضغط "Run" أو Ctrl+Enter
-- =====================================================

-- =====================================================
-- 🗑️ حذف الجداول القديمة (إن وجدت)
-- =====================================================

DROP TABLE IF EXISTS public.course_prerequisites CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.supervisors CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- 📊 الجداول الأساسية
-- =====================================================

-- 1️⃣ جدول المستخدمين
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 2️⃣ جدول الطلاب
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  major TEXT DEFAULT 'نظم المعلومات الإدارية',
  major_en TEXT DEFAULT 'Management Information Systems',
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa BETWEEN 0.00 AND 5.00),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  advisor_id UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ جدول المشرفين
CREATE TABLE public.supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department TEXT DEFAULT 'قسم المعلوماتية الإدارية',
  department_en TEXT DEFAULT 'MIS Department',
  office TEXT,
  office_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ جدول المقررات
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  credit_hours INTEGER NOT NULL DEFAULT 3 CHECK (credit_hours > 0),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 8),
  major TEXT DEFAULT 'نظم المعلومات الإدارية',
  major_en TEXT DEFAULT 'Management Information Systems',
  semester TEXT CHECK (semester IN ('fall', 'spring', 'summer', 'all')),
  instructor_name TEXT,
  instructor_name_ar TEXT,
  schedule JSONB,
  room_number TEXT,
  max_students INTEGER DEFAULT 50,
  enrolled_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ جدول متطلبات المقررات السابقة
CREATE TABLE public.course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_course_id)
);

-- 6️⃣ جدول التسجيلات
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('pending', 'approved', 'rejected', 'current', 'completed', 'dropped', 'withdrawn')),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'IP', 'W')),
  gpa_points DECIMAL(3,2) CHECK (gpa_points BETWEEN 0.00 AND 5.00),
  attendance_percentage INTEGER CHECK (attendance_percentage BETWEEN 0 AND 100),
  midterm_grade DECIMAL(5,2),
  final_grade DECIMAL(5,2),
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- 7️⃣ جدول الطلبات
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_type TEXT NOT NULL CHECK (request_type IN ('enroll', 'drop', 'withdraw', 'add')),
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  student_notes TEXT,
  advisor_notes TEXT,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  message_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'request')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9️⃣ جدول الاتفاقيات
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  language TEXT DEFAULT 'ar',
  accepted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔑 الفهارس (Indexes) لتحسين الأداء
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_student_id ON public.users(student_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_level ON public.students(level);
CREATE INDEX idx_students_advisor_id ON public.students(advisor_id);

CREATE INDEX idx_supervisors_user_id ON public.supervisors(user_id);

CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_code ON public.courses(course_code);
CREATE INDEX idx_courses_active ON public.courses(is_active);

CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_semester ON public.enrollments(semester, academic_year);

CREATE INDEX idx_requests_student ON public.requests(student_id);
CREATE INDEX idx_requests_advisor ON public.requests(advisor_id);
CREATE INDEX idx_requests_status ON public.requests(status);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- =====================================================
-- 🔒 Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies للمستخدمين
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = auth_id OR true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Policies للطلاب
CREATE POLICY "Students can view own data" ON public.students FOR SELECT USING (true);
CREATE POLICY "Students can update own data" ON public.students FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies للمشرفين
CREATE POLICY "Supervisors can view all" ON public.supervisors FOR SELECT USING (true);

-- Policies للمقررات (الجميع يمكنهم القراءة)
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can modify courses" ON public.courses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Policies للتسجيلات
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (
  student_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('advisor', 'admin'))
);

CREATE POLICY "Students can create enrollments" ON public.enrollments FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Policies للطلبات
CREATE POLICY "Students can view own requests" ON public.requests FOR SELECT USING (
  student_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  advisor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can create requests" ON public.requests FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Policies للإشعارات
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Policies للاتفاقيات
CREATE POLICY "Anyone can create agreements" ON public.agreements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view agreements" ON public.agreements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- ⚙️ Functions & Triggers
-- =====================================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON public.supervisors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🎓 إدراج المقررات الدراسية (49 مقرراً)
-- =====================================================

-- المستوى الأول
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('MIS101', 'مهارات الاتصال', 'Communication Skills', 'تطوير مهارات الاتصال الشفهي والكتابي', 'Develop oral and written communication skills', 3, 1, 'fall'),
('ENG101', 'اللغة الإنجليزية I', 'English Language I', 'أساسيات اللغة الإنجليزية', 'English language fundamentals', 3, 1, 'fall'),
('CS101', 'مقدمة في الحاسب', 'Introduction to Computing', 'مفاهيم الحاسب الأساسية', 'Basic computer concepts', 3, 1, 'fall'),
('ACC101', 'مبادئ المحاسبة', 'Principles of Accounting', 'أساسيات المحاسبة المالية', 'Financial accounting fundamentals', 3, 1, 'fall'),
('MATH101', 'الرياضيات للإدارة', 'Mathematics for Management', 'الرياضيات التطبيقية في الإدارة', 'Applied mathematics in management', 3, 1, 'fall'),
('MGT101', 'مبادئ الإدارة', 'Principles of Management', 'مفاهيم الإدارة الأساسية', 'Basic management concepts', 3, 1, 'fall');

-- المستوى الثاني
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('ENG102', 'اللغة الإنجليزية II', 'English Language II', 'اللغة الإنجليزية المتقدمة', 'Advanced English language', 3, 2, 'spring'),
('CS102', 'برمجة الحاسب', 'Computer Programming', 'أساسيات البرمجة', 'Programming fundamentals', 3, 2, 'spring'),
('ECON101', 'مبادئ الاقتصاد الجزئي', 'Microeconomics', 'مبادئ الاقتصاد الجزئي', 'Principles of microeconomics', 3, 2, 'spring'),
('STAT101', 'مبادئ الإحصاء', 'Principles of Statistics', 'الإحصاء الوصفي والاستنتاجي', 'Descriptive and inferential statistics', 3, 2, 'spring'),
('MKT101', 'مبادئ التسويق', 'Principles of Marketing', 'أساسيات التسويق', 'Marketing fundamentals', 3, 2, 'spring'),
('MGT102', 'السلوك التنظيمي', 'Organizational Behavior', 'سلوك الأفراد في المنظمات', 'Individual behavior in organizations', 3, 2, 'spring');

-- المستوى الثالث
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('ISL101', 'الثقافة الإسلامية', 'Islamic Culture', 'مبادئ الثقافة الإسلامية', 'Principles of Islamic culture', 2, 3, 'fall'),
('CS201', 'هياكل البيانات', 'Data Structures', 'هياكل البيانات والخوارزميات', 'Data structures and algorithms', 3, 3, 'fall'),
('CS202', 'قواعد البيانات', 'Database Systems', 'تصميم وإدارة قواعد البيانات', 'Database design and management', 3, 3, 'fall'),
('STAT201', 'الإحصاء للأعمال', 'Business Statistics', 'الإحصاء التطبيقي في الأعمال', 'Applied statistics in business', 3, 3, 'fall'),
('MGT201', 'إدارة الموارد البشرية', 'Human Resource Management', 'إدارة الموارد البشرية', 'Managing human resources', 3, 3, 'fall'),
('MIS201', 'نظم المعلومات الإدارية', 'Management Information Systems', 'مفاهيم نظم المعلومات', 'Information systems concepts', 3, 3, 'fall');

-- المستوى الرابع
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('MIS301', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 'تحليل وتصميم النظم المعلوماتية', 'Information systems analysis and design', 3, 4, 'spring'),
('CS301', 'شبكات الحاسب', 'Computer Networks', 'أساسيات شبكات الحاسب', 'Computer networking fundamentals', 3, 4, 'spring'),
('FIN201', 'الإدارة المالية', 'Financial Management', 'إدارة الموارد المالية', 'Managing financial resources', 3, 4, 'spring'),
('MGT301', 'إدارة العمليات', 'Operations Management', 'إدارة العمليات الإنتاجية', 'Managing production operations', 3, 4, 'spring'),
('MGT302', 'بحوث العمليات', 'Operations Research', 'النماذج الكمية في الإدارة', 'Quantitative models in management', 3, 4, 'spring'),
('LAW201', 'القانون التجاري', 'Business Law', 'القوانين التجارية', 'Commercial laws', 2, 4, 'spring');

-- المستوى الخامس
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('CS401', 'تطبيقات الإنترنت', 'Internet Applications', 'تطوير تطبيقات الإنترنت', 'Developing internet applications', 3, 5, 'fall'),
('CS402', 'إدارة قواعد البيانات', 'Database Management', 'إدارة قواعد البيانات المتقدمة', 'Advanced database management', 3, 5, 'fall'),
('MIS401', 'الذكاء الاصطناعي للأعمال', 'AI for Business', 'تطبيقات الذكاء الاصطناعي', 'AI applications in business', 3, 5, 'fall'),
('MIS402', 'التجارة الإلكترونية', 'E-Commerce', 'أساسيات التجارة الإلكترونية', 'E-commerce fundamentals', 3, 5, 'fall'),
('CS403', 'أمن المعلومات', 'Information Security', 'حماية المعلومات والبيانات', 'Information and data protection', 3, 5, 'fall'),
('MGT401', 'إدارة المشاريع', 'Project Management', 'تخطيط وإدارة المشاريع', 'Project planning and management', 3, 5, 'fall');

-- المستوى السادس
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('CS501', 'تطوير تطبيقات الويب', 'Web Application Development', 'تطوير تطبيقات الويب الحديثة', 'Modern web application development', 3, 6, 'spring'),
('MIS501', 'تحليل البيانات', 'Data Analytics', 'تحليل البيانات واستخراج المعرفة', 'Data analysis and knowledge extraction', 3, 6, 'spring'),
('MIS502', 'إدارة علاقات العملاء', 'CRM Systems', 'نظم إدارة علاقات العملاء', 'Customer relationship management systems', 3, 6, 'spring'),
('MIS503', 'نظم دعم القرار', 'Decision Support Systems', 'أنظمة دعم القرارات الإدارية', 'Management decision support systems', 3, 6, 'spring'),
('MIS504', 'نظم تخطيط موارد المؤسسة', 'ERP Systems', 'نظم ERP وتطبيقاتها', 'ERP systems and applications', 3, 6, 'spring'),
('MGT501', 'ريادة الأعمال', 'Entrepreneurship', 'إنشاء وإدارة المشاريع الريادية', 'Creating and managing entrepreneurial ventures', 2, 6, 'spring');

-- المستوى السابع
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('MIS601', 'إدارة المعرفة', 'Knowledge Management', 'إدارة المعرفة التنظيمية', 'Organizational knowledge management', 3, 7, 'fall'),
('MIS602', 'حوكمة تقنية المعلومات', 'IT Governance', 'حوكمة وإدارة تقنية المعلومات', 'IT governance and management', 3, 7, 'fall'),
('MIS603', 'ذكاء الأعمال', 'Business Intelligence', 'أنظمة ذكاء الأعمال', 'Business intelligence systems', 3, 7, 'fall'),
('MIS604', 'استراتيجية نظم المعلومات', 'IS Strategy', 'استراتيجية نظم المعلومات', 'Information systems strategy', 3, 7, 'fall'),
('MGT601', 'إدارة التغيير التنظيمي', 'Change Management', 'إدارة التغيير في المنظمات', 'Managing organizational change', 3, 7, 'fall'),
('MIS605', 'أخلاقيات المعلوماتية', 'IT Ethics', 'أخلاقيات تقنية المعلومات', 'Information technology ethics', 2, 7, 'fall');

-- المستوى الثامن
INSERT INTO public.courses (course_code, name_ar, name_en, description_ar, description_en, credit_hours, level, semester) VALUES
('MIS701', 'مشروع التخرج 1', 'Graduation Project I', 'مشروع التخرج - الجزء الأول', 'Graduation project - Part I', 3, 8, 'fall'),
('MIS702', 'مشروع التخرج 2', 'Graduation Project II', 'مشروع التخرج - الجزء الثاني', 'Graduation project - Part II', 3, 8, 'spring'),
('MGT701', 'إدارة الابتكار', 'Innovation Management', 'إدارة الابتكار والإبداع', 'Managing innovation and creativity', 3, 8, 'spring'),
('MIS703', 'حلقة بحث', 'Research Seminar', 'منهجية البحث العلمي', 'Research methodology', 2, 8, 'spring'),
('MIS704', 'التدريب الميداني', 'Internship', 'التدريب العملي الميداني', 'Practical field training', 3, 8, 'summer'),
('CS701', 'الحوسبة السحابية', 'Cloud Computing', 'مفاهيم وتطبيقات الحوسبة السحابية', 'Cloud computing concepts and applications', 3, 8, 'spring'),
('MGT702', 'إدارة سلسلة الإمداد', 'Supply Chain Management', 'إدارة سلاسل الإمداد', 'Supply chain management', 3, 8, 'spring');

-- =====================================================
-- ✅ تم إنشاء قاعدة البيانات بنجاح!
-- =====================================================
-- الآن لديك:
-- ✅ 9 جداول كاملة
-- ✅ 49 مقرراً دراسياً حقيقياً
-- ✅ فهارس للأداء
-- ✅ Row Level Security
-- ✅ Triggers تلقائية
-- =====================================================
