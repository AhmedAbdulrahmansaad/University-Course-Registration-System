-- =====================================================
-- King Khalid University - Course Registration System
-- Database Setup Script
-- =====================================================
-- Run this script in Supabase SQL Editor
-- Project ID: edlnpolgtkrmddjyrxwm
-- =====================================================

-- 1️⃣ DROP EXISTING TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2️⃣ CREATE USERS TABLE
-- =====================================================
-- Central table linking to auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  student_id TEXT UNIQUE, -- رقم الطالب الجامعي
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'advisor', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_role ON users(role);

-- 3️⃣ CREATE STUDENTS TABLE
-- =====================================================
-- Extended info for students
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
  enrollment_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_major ON students(major);
CREATE INDEX idx_students_level ON students(level);

-- 4️⃣ CREATE SUPERVISORS TABLE
-- =====================================================
-- Extended info for supervisors/advisors
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

-- Index for faster lookups
CREATE INDEX idx_supervisors_user_id ON supervisors(user_id);

-- 5️⃣ CREATE COURSES TABLE
-- =====================================================
-- Course catalog
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL, -- مثل: MIS101
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  department TEXT NOT NULL DEFAULT 'نظم المعلومات الإدارية',
  department_en TEXT DEFAULT 'MIS',
  prerequisites TEXT[], -- Array of prerequisite course codes
  instructor_name TEXT,
  schedule_time TEXT,
  schedule_days TEXT,
  room TEXT,
  capacity INTEGER DEFAULT 30,
  enrolled_count INTEGER DEFAULT 0,
  semester TEXT, -- مثل: Fall 2025
  is_active BOOLEAN DEFAULT true,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_semester ON courses(semester);
CREATE INDEX idx_courses_active ON courses(is_active);

-- 6️⃣ CREATE REGISTRATIONS TABLE
-- =====================================================
-- Student course registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'withdrawn')),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'IP', 'W')),
  grade_points DECIMAL(3,2),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate registrations
  UNIQUE(student_id, course_id, semester)
);

-- Indexes for faster lookups
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_registrations_course ON registrations(course_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_semester ON registrations(semester);

-- 7️⃣ CREATE NOTIFICATIONS TABLE
-- =====================================================
-- User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'approval', 'rejection', 'announcement', 'reminder', 'info')),
  title TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  message_en TEXT,
  is_read BOOLEAN DEFAULT false,
  related_registration_id UUID REFERENCES registrations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 8️⃣ ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 🔓 USERS TABLE POLICIES
-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Service role can do everything
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- 🔓 STUDENTS TABLE POLICIES
-- Students can read their own data
CREATE POLICY "Students can read own data"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = students.user_id
      AND users.auth_id = auth.uid()
    )
  );

-- Advisors can read all students
CREATE POLICY "Advisors can read all students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('advisor', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to students"
  ON students FOR ALL
  USING (true)
  WITH CHECK (true);

-- 🔓 SUPERVISORS TABLE POLICIES
CREATE POLICY "Supervisors can read own data"
  ON supervisors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = supervisors.user_id
      AND users.auth_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to supervisors"
  ON supervisors FOR ALL
  USING (true)
  WITH CHECK (true);

-- 🔓 COURSES TABLE POLICIES
-- Everyone can read active courses
CREATE POLICY "Anyone can read active courses"
  ON courses FOR SELECT
  USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access to courses"
  ON courses FOR ALL
  USING (true)
  WITH CHECK (true);

-- 🔓 REGISTRATIONS TABLE POLICIES
-- Students can read their own registrations
CREATE POLICY "Students can read own registrations"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = registrations.student_id
      AND users.auth_id = auth.uid()
    )
  );

-- Advisors can read all registrations
CREATE POLICY "Advisors can read all registrations"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('advisor', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to registrations"
  ON registrations FOR ALL
  USING (true)
  WITH CHECK (true);

-- 🔓 NOTIFICATIONS TABLE POLICIES
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notifications.user_id
      AND users.auth_id = auth.uid()
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notifications.user_id
      AND users.auth_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to notifications"
  ON notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 9️⃣ FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at
  BEFORE UPDATE ON supervisors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔟 INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Note: You can uncomment this section after creating your first user
-- This is just example data structure

/*
-- Sample Admin User (after signup)
-- The auth_id should match the actual UUID from auth.users
INSERT INTO users (auth_id, email, name, name_ar, name_en, role)
VALUES (
  'YOUR-AUTH-UUID-HERE',
  'admin@kku.edu.sa',
  'مدير النظام',
  'مدير النظام',
  'System Admin',
  'admin'
);
*/

-- =====================================================
-- ✅ SETUP COMPLETE!
-- =====================================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
