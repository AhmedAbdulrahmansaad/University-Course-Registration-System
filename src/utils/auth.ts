// ======================================
// 🔐 نظام المصادقة الحقيقي - Supabase فقط
// ======================================

import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a`;

// ✅ تسجيل مستخدم جديد
export async function signUp(data: {
  email: string;
  password: string;
  name: string;
  studentId?: string;
  role?: string;
  major?: string;
  level?: string;
  gpa?: string;
  phone?: string;
}) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to sign up');
  }

  return result;
}

// ✅ تسجيل الدخول
export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Invalid credentials');
  }

  // حفظ الجلسة
  localStorage.setItem('kku_user_session', JSON.stringify(result.user));
  localStorage.setItem('kku_access_token', result.access_token);

  return result;
}

// ✅ تسجيل الخروج
export async function logout() {
  const token = localStorage.getItem('kku_access_token');

  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // مسح الجلسة المحلية
  localStorage.removeItem('kku_user_session');
  localStorage.removeItem('kku_access_token');
}

// ✅ الحصول على المستخدم الحالي من الجلسة
export function getCurrentUser() {
  const session = localStorage.getItem('kku_user_session');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// ✅ الحصول على التوكن
export function getAccessToken() {
  return localStorage.getItem('kku_access_token');
}

// ✅ التحقق من تسجيل الدخول
export function isLoggedIn() {
  return !!getCurrentUser() && !!getAccessToken();
}
