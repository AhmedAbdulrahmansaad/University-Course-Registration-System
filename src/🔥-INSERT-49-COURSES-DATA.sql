-- =====================================================
-- 📚 إدراج 49 مقرراً دراسياً - قسم نظم المعلومات الإدارية
-- KKU MIS Department - 49 Courses Data
-- 
-- جامعة الملك خالد - كلية إدارة الأعمال
-- قسم المعلوماتية الإدارية - نظم المعلومات الإدارية
-- =====================================================

-- حذف المقررات القديمة (اختياري)
-- TRUNCATE courses CASCADE;

-- =====================================================
-- 🎯 المستوى الأول - Level 1 (8 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS101', 'مبادئ نظم المعلومات', 'مبادئ نظم المعلومات', 'Principles of Information Systems', 3, 1, 'both', '{}', 'مقدمة في نظم المعلومات وتطبيقاتها في المنظمات', 'Introduction to information systems and their applications in organizations'),
('BUS100', 'مقدمة في إدارة الأعمال', 'مقدمة في إدارة الأعمال', 'Introduction to Business', 3, 1, 'both', '{}', 'المفاهيم الأساسية في إدارة الأعمال', 'Basic concepts in business management'),
('MATH110', 'الرياضيات للأعمال', 'الرياضيات للأعمال', 'Mathematics for Business', 3, 1, 'both', '{}', 'الرياضيات الأساسية المستخدمة في الأعمال', 'Basic mathematics used in business'),
('ENGL101', 'اللغة الإنجليزية 1', 'اللغة الإنجليزية 1', 'English Language I', 3, 1, 'both', '{}', 'المهارات الأساسية في اللغة الإنجليزية', 'Basic English language skills'),
('ARAB101', 'اللغة العربية', 'اللغة العربية', 'Arabic Language', 2, 1, 'both', '{}', 'مهارات الكتابة والقراءة في اللغة العربية', 'Arabic reading and writing skills'),
('ISLA101', 'الثقافة الإسلامية', 'الثقافة الإسلامية', 'Islamic Culture', 2, 1, 'both', '{}', 'أساسيات الثقافة الإسلامية', 'Fundamentals of Islamic culture'),
('CS101', 'مقدمة في الحاسب الآلي', 'مقدمة في الحاسب الآلي', 'Introduction to Computer', 3, 1, 'both', '{}', 'المفاهيم الأساسية للحاسب الآلي', 'Basic computer concepts'),
('STAT101', 'مبادئ الإحصاء', 'مبادئ الإحصاء', 'Principles of Statistics', 3, 1, 'both', '{}', 'المفاهيم الإحصائية الأساسية', 'Basic statistical concepts')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى الثاني - Level 2 (7 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS201', 'برمجة الحاسب', 'برمجة الحاسب', 'Computer Programming', 3, 2, 'both', ARRAY['CS101'], 'أساسيات البرمجة باستخدام لغة برمجة حديثة', 'Programming fundamentals using a modern programming language'),
('MIS202', 'قواعد البيانات', 'قواعد البيانات', 'Database Systems', 3, 2, 'both', ARRAY['MIS101'], 'مبادئ تصميم وإدارة قواعد البيانات', 'Principles of database design and management'),
('ACC201', 'مبادئ المحاسبة 1', 'مبادئ المحاسبة 1', 'Principles of Accounting I', 3, 2, 'both', '{}', 'المفاهيم الأساسية في المحاسبة المالية', 'Basic concepts in financial accounting'),
('ECON201', 'مبادئ الاقتصاد الجزئي', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics', 3, 2, 'both', '{}', 'النظرية الاقتصادية الجزئية', 'Microeconomic theory'),
('ENGL102', 'اللغة الإنجليزية 2', 'اللغة الإنجليزية 2', 'English Language II', 3, 2, 'both', ARRAY['ENGL101'], 'مهارات متقدمة في اللغة الإنجليزية', 'Advanced English language skills'),
('MGT201', 'السلوك التنظيمي', 'السلوك التنظيمي', 'Organizational Behavior', 3, 2, 'both', ARRAY['BUS100'], 'دراسة السلوك الفردي والجماعي في المنظمات', 'Study of individual and group behavior in organizations'),
('MATH210', 'الإحصاء التطبيقي', 'الإحصاء التطبيقي', 'Applied Statistics', 3, 2, 'both', ARRAY['STAT101'], 'التطبيقات الإحصائية في الأعمال', 'Statistical applications in business')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى الثالث - Level 3 (6 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS301', 'تحليل وتصميم النظم', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, 'both', ARRAY['MIS201', 'MIS202'], 'منهجيات تحليل وتصميم نظم المعلومات', 'Information systems analysis and design methodologies'),
('MIS302', 'شبكات الحاسب', 'شبكات الحاسب', 'Computer Networks', 3, 3, 'both', ARRAY['MIS201'], 'أساسيات شبكات الحاسب والاتصالات', 'Computer networks and communications fundamentals'),
('MIS303', 'البرمجة المتقدمة', 'البرمجة المتقدمة', 'Advanced Programming', 3, 3, 'both', ARRAY['MIS201'], 'مفاهيم متقدمة في البرمجة', 'Advanced programming concepts'),
('ACC202', 'مبادئ المحاسبة 2', 'مبادئ المحاسبة 2', 'Principles of Accounting II', 3, 3, 'both', ARRAY['ACC201'], 'المحاسبة الإدارية ومحاسبة التكاليف', 'Managerial and cost accounting'),
('MGT301', 'إدارة العمليات', 'إدارة العمليات', 'Operations Management', 3, 3, 'both', ARRAY['MGT201'], 'إدارة وتخطيط العمليات الإنتاجية', 'Production operations management and planning'),
('FIN301', 'الإدارة المالية', 'الإدارة المالية', 'Financial Management', 3, 3, 'both', ARRAY['ACC201'], 'المبادئ الأساسية للإدارة المالية', 'Basic principles of financial management')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى الرابع - Level 4 (6 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS401', 'إدارة قواعد البيانات', 'إدارة قواعد البيانات', 'Database Management', 3, 4, 'both', ARRAY['MIS202'], 'الإدارة المتقدمة لقواعد البيانات', 'Advanced database management'),
('MIS402', 'تطوير تطبيقات الويب', 'تطوير تطبيقات الويب', 'Web Application Development', 3, 4, 'both', ARRAY['MIS303'], 'تصميم وتطوير تطبيقات الويب', 'Web application design and development'),
('MIS403', 'أمن المعلومات', 'أمن المعلومات', 'Information Security', 3, 4, 'both', ARRAY['MIS302'], 'مبادئ أمن المعلومات والحماية', 'Information security and protection principles'),
('MIS404', 'نظم دعم القرار', 'نظم دعم القرار', 'Decision Support Systems', 3, 4, 'both', ARRAY['MIS301'], 'نظم المعلومات لدعم اتخاذ القرارات', 'Information systems for decision support'),
('MGT401', 'إدارة المشاريع', 'إدارة المشاريع', 'Project Management', 3, 4, 'both', ARRAY['MGT301'], 'أساسيات إدارة المشاريع', 'Project management fundamentals'),
('MKT301', 'مبادئ التسويق', 'مبادئ التسويق', 'Principles of Marketing', 3, 4, 'both', ARRAY['BUS100'], 'المفاهيم الأساسية في التسويق', 'Basic marketing concepts')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى الخامس - Level 5 (6 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS501', 'ذكاء الأعمال', 'ذكاء الأعمال', 'Business Intelligence', 3, 5, 'both', ARRAY['MIS404'], 'أدوات وتقنيات ذكاء الأعمال', 'Business intelligence tools and techniques'),
('MIS502', 'إدارة نظم المعلومات', 'إدارة نظم المعلومات', 'Information Systems Management', 3, 5, 'both', ARRAY['MIS301'], 'إدارة موارد نظم المعلومات', 'Managing information systems resources'),
('MIS503', 'التجارة الإلكترونية', 'التجارة الإلكترونية', 'E-Commerce', 3, 5, 'both', ARRAY['MIS402'], 'مفاهيم وتطبيقات التجارة الإلكترونية', 'E-commerce concepts and applications'),
('MIS504', 'الحوسبة السحابية', 'الحوسبة السحابية', 'Cloud Computing', 3, 5, 'both', ARRAY['MIS302'], 'مبادئ وتطبيقات الحوسبة السحابية', 'Cloud computing principles and applications'),
('MIS505', 'تطبيقات الأجهزة المحمولة', 'تطبيقات الأجهزة المحمولة', 'Mobile Applications', 3, 5, 'both', ARRAY['MIS402'], 'تطوير تطبيقات الأجهزة المحمولة', 'Mobile application development'),
('LAW301', 'القانون التجاري', 'القانون التجاري', 'Commercial Law', 2, 5, 'both', '{}', 'القوانين المنظمة للأعمال التجارية', 'Laws governing commercial activities')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى السادس - Level 6 (5 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS601', 'تعدين البيانات', 'تعدين البيانات', 'Data Mining', 3, 6, 'both', ARRAY['MIS501'], 'تقنيات تعدين واستخراج المعرفة من البيانات', 'Data mining and knowledge extraction techniques'),
('MIS602', 'إدارة علاقات العملاء', 'إدارة علاقات العملاء', 'Customer Relationship Management', 3, 6, 'both', ARRAY['MIS502'], 'نظم إدارة علاقات العملاء', 'Customer relationship management systems'),
('MIS603', 'تخطيط موارد المؤسسة', 'تخطيط موارد المؤسسة', 'Enterprise Resource Planning', 3, 6, 'both', ARRAY['MIS502'], 'نظم تخطيط موارد المؤسسات', 'Enterprise resource planning systems'),
('MIS604', 'تدقيق نظم المعلومات', 'تدقيق نظم المعلومات', 'Information Systems Audit', 3, 6, 'both', ARRAY['MIS403'], 'مراجعة وتدقيق نظم المعلومات', 'Information systems auditing and review'),
('MIS605', 'الذكاء الاصطناعي', 'الذكاء الاصطناعي', 'Artificial Intelligence', 3, 6, 'both', ARRAY['MIS303'], 'مبادئ الذكاء الاصطناعي وتطبيقاته', 'Artificial intelligence principles and applications')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى السابع - Level 7 (5 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS701', 'إدارة المعرفة', 'إدارة المعرفة', 'Knowledge Management', 3, 7, 'both', ARRAY['MIS502'], 'نظم وتقنيات إدارة المعرفة', 'Knowledge management systems and techniques'),
('MIS702', 'تحليل البيانات الضخمة', 'تحليل البيانات الضخمة', 'Big Data Analytics', 3, 7, 'both', ARRAY['MIS601'], 'تحليل ومعالجة البيانات الضخمة', 'Big data analysis and processing'),
('MIS703', 'الحوكمة الإلكترونية', 'الحوكمة الإلكترونية', 'E-Governance', 3, 7, 'both', ARRAY['MIS503'], 'تطبيقات الحوكمة الإلكترونية', 'E-governance applications'),
('MIS704', 'إنترنت الأشياء', 'إنترنت الأشياء', 'Internet of Things', 3, 7, 'both', ARRAY['MIS504'], 'مفاهيم وتطبيقات إنترنت الأشياء', 'IoT concepts and applications'),
('RES401', 'مناهج البحث العلمي', 'مناهج البحث العلمي', 'Research Methodology', 3, 7, 'both', '{}', 'أساسيات البحث العلمي ومناهجه', 'Scientific research fundamentals and methodologies')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- 🎯 المستوى الثامن - Level 8 (6 مقررات)
-- =====================================================

INSERT INTO courses (course_code, name, name_ar, name_en, credits, level, semester, prerequisites, description_ar, description_en)
VALUES
('MIS801', 'مشروع التخرج 1', 'مشروع التخرج 1', 'Graduation Project I', 3, 8, 'fall', ARRAY['RES401'], 'الجزء الأول من مشروع التخرج', 'First part of graduation project'),
('MIS802', 'مشروع التخرج 2', 'مشروع التخرج 2', 'Graduation Project II', 3, 8, 'spring', ARRAY['MIS801'], 'الجزء الثاني من مشروع التخرج', 'Second part of graduation project'),
('MIS803', 'الأمن السيبراني', 'الأمن السيبراني', 'Cybersecurity', 3, 8, 'both', ARRAY['MIS403'], 'حماية الأنظمة من التهديدات السيبرانية', 'Protecting systems from cyber threats'),
('MIS804', 'تقنيات البلوك تشين', 'تقنيات البلوك تشين', 'Blockchain Technology', 3, 8, 'both', ARRAY['MIS403'], 'مبادئ وتطبيقات تقنية البلوك تشين', 'Blockchain technology principles and applications'),
('MIS805', 'التحول الرقمي', 'التحول الرقمي', 'Digital Transformation', 3, 8, 'both', ARRAY['MIS502'], 'استراتيجيات التحول الرقمي للمنظمات', 'Digital transformation strategies for organizations'),
('ENTR401', 'ريادة الأعمال', 'ريادة الأعمال', 'Entrepreneurship', 2, 8, 'both', '{}', 'مبادئ ريادة الأعمال وإنشاء المشاريع', 'Entrepreneurship principles and business creation')
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- ✅ التحقق من إدراج المقررات
-- =====================================================

SELECT 
  'Courses Inserted Successfully!' AS message,
  COUNT(*) AS total_courses,
  COUNT(DISTINCT level) AS total_levels
FROM courses;

-- عرض المقررات حسب المستوى
SELECT 
  level,
  COUNT(*) AS courses_count,
  SUM(credits) AS total_credits
FROM courses
GROUP BY level
ORDER BY level;

-- =====================================================
-- 📊 إحصائيات المقررات
-- =====================================================

SELECT 
  '📚 Total Courses: 49' AS summary
UNION ALL
SELECT 
  '🎯 Total Levels: 8'
UNION ALL
SELECT 
  '💯 Total Credits: ' || SUM(credits) FROM courses
UNION ALL
SELECT 
  '🏫 Department: Management Information Systems';

-- =====================================================
-- 🎉 تم إدراج 49 مقرراً بنجاح!
-- =====================================================
