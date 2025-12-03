/**
 * Supabase Database Operations
 * All database operations should go through these functions
 * NO localStorage for data storage - only for session management
 */

import { supabase } from './client';

// ========================================
// USER OPERATIONS
// ========================================

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students(*),
      supervisors(*)
    `)
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

export async function getUserByAuthId(authId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students(*),
      supervisors(*)
    `)
    .eq('auth_id', authId)
    .single();
  
  if (error) {
    console.error('Error fetching user by auth_id:', error);
    return null;
  }
  
  return data;
}

// ========================================
// COURSE OPERATIONS
// ========================================

export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('level', { ascending: true })
    .order('code', { ascending: true });
  
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  
  return data || [];
}

export async function getCoursesByLevel(level: number) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('level', level)
    .order('code', { ascending: true });
  
  if (error) {
    console.error('Error fetching courses by level:', error);
    return [];
  }
  
  return data || [];
}

export async function getCourseByCode(code: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }
  
  return data;
}

// ========================================
// REGISTRATION OPERATIONS
// ========================================

export async function getStudentRegistrations(studentId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      courses(*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'approved');
  
  if (error) {
    console.error('Error fetching student registrations:', error);
    return [];
  }
  
  return data || [];
}

export async function registerCourse(studentId: string, courseCode: string, semester: string) {
  // First check if already registered
  const { data: existing } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_code', courseCode)
    .eq('semester', semester)
    .single();
  
  if (existing) {
    return { success: false, error: 'Already registered for this course' };
  }
  
  // Register the course
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      student_id: studentId,
      course_code: courseCode,
      semester: semester,
      status: 'pending', // Requires supervisor approval
      registered_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error registering course:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function dropCourse(registrationId: string) {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', registrationId);
  
  if (error) {
    console.error('Error dropping course:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// ========================================
// REGISTRATION REQUEST OPERATIONS
// ========================================

export async function getPendingRegistrationRequests() {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      courses(*),
      students:users!registrations_student_id_fkey(*)
    `)
    .eq('status', 'pending')
    .order('registered_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
  
  return data || [];
}

export async function approveRegistration(registrationId: string, supervisorId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .update({
      status: 'approved',
      reviewed_by: supervisorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select()
    .single();
  
  if (error) {
    console.error('Error approving registration:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function rejectRegistration(registrationId: string, supervisorId: string, note?: string) {
  const { data, error } = await supabase
    .from('registrations')
    .update({
      status: 'rejected',
      reviewed_by: supervisorId,
      reviewed_at: new Date().toISOString(),
      note: note,
    })
    .eq('id', registrationId)
    .select()
    .single();
  
  if (error) {
    console.error('Error rejecting registration:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

// ========================================
// STUDENT OPERATIONS
// ========================================

export async function getAllStudents() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students(*)
    `)
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return data || [];
}

export async function getStudentGPA(studentId: string) {
  // This would calculate GPA from grades table if it exists
  // For now, return from student record
  const { data, error } = await supabase
    .from('students')
    .select('gpa')
    .eq('user_id', studentId)
    .single();
  
  if (error) {
    console.error('Error fetching student GPA:', error);
    return null;
  }
  
  return data?.gpa || null;
}

// ========================================
// NOTIFICATION OPERATIONS
// ========================================

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
  
  return { success: true };
}

export async function createNotification(notification: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
