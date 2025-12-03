import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleAIAssistant } from './aiAssistant.tsx';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// HELPER FUNCTIONS
// ========================================

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) return null;
  
  // Get user details from database
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      students(*),
      supervisors(*)
    `)
    .eq('auth_id', data.user.id)
    .single();
  
  return userData;
}

// ========================================
// AUTHENTICATION ROUTES
// ========================================

// 📝 تسجيل مستخدم جديد
app.post('/make-server-1573e40a/auth/signup', async (c) => {
  try {
    const { email, password, name, studentId, phone, role, major, level, gpa } = await c.req.json();

    console.log('📝 [Signup] Starting signup process...');
    console.log('📝 [Signup] Email:', email);
    console.log('📝 [Signup] Role:', role);

    // 1. التحقق من البيانات المطلوبة
    if (!email || !password || !name) {
      console.log('❌ [Signup] Missing required fields');
      return c.json({
        success: false,
        error: 'Email, password, and name are required'
      }, 400);
    }

    // 2. التحقق من صحة البريد الجامعي
    if (!email.endsWith('@kku.edu.sa')) {
      console.log('❌ [Signup] Invalid email domain');
      return c.json({ 
        success: false, 
        error: 'Must use KKU email (@kku.edu.sa)' 
      }, 400);
    }

    // 🔧 3. التحقق من وجود الجداول المطلوبة
    console.log('🔍 [Signup] Checking if database tables exist...');
    
    try {
      const { error: tableCheckError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (tableCheckError) {
        // إذا كان الخطأ هو أن الجدول غير موجود
        if (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist')) {
          console.error('❌ [Signup] Database tables do not exist!');
          return c.json({
            success: false,
            error: 'DATABASE_NOT_SETUP',
            message: 'Database tables do not exist. Please run /database-setup.sql first.',
            details: {
              errorCode: tableCheckError.code,
              instruction: 'Run the database setup script in Supabase SQL Editor',
              file: '/database-setup.sql'
            }
          }, 503);
        }
      }
      
      console.log('✅ [Signup] Database tables exist');
    } catch (checkError: any) {
      console.error('❌ [Signup] Table check failed:', checkError);
      return c.json({
        success: false,
        error: 'DATABASE_NOT_SETUP',
        message: 'Cannot connect to database. Tables may not exist.',
        details: {
          instruction: 'Run /database-setup.sql in Supabase SQL Editor'
        }
      }, 503);
    }

    // 4. حذف أي مستخدم يتيم بنفس البريد
    console.log('🧹 [Signup] Cleaning up any orphaned users...');
    
    try {
      console.log('🔍 [Signup] Checking for existing auth user...');
      
      // 🔧 محاولة حذف أي حساب قديم - 3 محاولات
      let deleteAttempts = 0;
      const maxAttempts = 3;
      let userDeleted = false;
      
      while (deleteAttempts < maxAttempts && !userDeleted) {
        deleteAttempts++;
        console.log(`🔄 [Signup] Delete attempt ${deleteAttempts}/${maxAttempts}...`);
        
        // البحث عن المستخدم
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('❌ [Signup] Cannot list users:', listError);
          
          // إذا فشل list، نحاول getUserByEmail مباشرة
          try {
            const { data: { user: existingUser } } = await supabase.auth.admin.getUserByEmail(email);
            
            if (existingUser) {
              console.log('🗑️ [Signup] Found user via getUserByEmail, attempting delete...');
              
              // حذف من Auth
              const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(existingUser.id);
              
              if (!deleteAuthError) {
                console.log('✅ [Signup] User deleted via getUserByEmail method');
                userDeleted = true;
                await new Promise(resolve => setTimeout(resolve, 5000)); // انتظار 5 ثوان
              }
            } else {
              console.log('✅ [Signup] No user found via getUserByEmail');
              userDeleted = true; // لا يوجد مستخدم للحذف
            }
          } catch (getUserError) {
            console.log('ℹ️ [Signup] getUserByEmail failed, user may not exist');
            userDeleted = true; // نفترض عدم وجود المستخدم
          }
          
          break;
        }
        
        // البحث عن المستخدم بالبريد
        const existingAuthUser = authUsers?.users?.find(u => u.email === email);
        
        if (existingAuthUser) {
          console.log('⚠️ [Signup] Found existing auth user:', existingAuthUser.id);
          
          // التحقق إذا كان عنده سجل في قاعدة البيانات
          const { data: dbUser } = await supabase
            .from('users')
            .select('id, auth_id, email')
            .eq('auth_id', existingAuthUser.id)
            .maybeSingle();
          
          if (!dbUser) {
            // 🗑️ حساب يتيم - نحذفه
            console.log('🗑️ [Signup] Orphaned auth user detected, deleting...');
            
            const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
            
            if (deleteError) {
              console.error(`❌ [Signup] Delete failed on attempt ${deleteAttempts}:`, deleteError);
              
              if (deleteAttempts >= maxAttempts) {
                return c.json({
                  success: false,
                  error: 'ORPHANED_ACCOUNT',
                  message: `Cannot automatically delete orphaned account after ${maxAttempts} attempts.`,
                  email: email,
                  authId: existingAuthUser.id,
                  instruction: 'Please go to /autofix page or delete manually from Supabase Dashboard',
                  dashboardUrl: 'https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/auth/users'
                }, 409);
              }
              
              // انتظار قبل المحاولة التالية
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            
            console.log(`✅ [Signup] User deleted on attempt ${deleteAttempts}, waiting for propagation...`);
            
            // انتظار 5 ثوان للتأكد
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // التحقق من الحذف
            const { data: checkUsers } = await supabase.auth.admin.listUsers();
            const stillExists = checkUsers?.users?.find(u => u.email === email);
            
            if (!stillExists) {
              console.log('✅ [Signup] Verified - user successfully deleted');
              userDeleted = true;
            } else {
              console.log(`⚠️ [Signup] User still exists after attempt ${deleteAttempts}`);
              
              if (deleteAttempts >= maxAttempts) {
                return c.json({
                  success: false,
                  error: 'ORPHANED_ACCOUNT',
                  message: 'User persists after deletion attempts. Please use /autofix page.',
                  email: email,
                  instruction: 'Go to /autofix page in the app',
                }, 409);
              }
            }
          } else {
            // ✅ حساب كامل موجود
            console.log('⚠️ [Signup] User already has complete account:', dbUser.id);
            return c.json({
              success: false,
              error: 'ACCOUNT_EXISTS',
              message: 'A complete account with this email already exists. Please login instead.',
              email: email,
              userId: dbUser.id
            }, 409);
          }
        } else {
          console.log('✅ [Signup] No existing auth user found');
          userDeleted = true; // لا يوجد مستخدم للحذف
        }
      }
      
      if (!userDeleted) {
        return c.json({
          success: false,
          error: 'CLEANUP_FAILED',
          message: 'Failed to cleanup orphaned account. Please use /autofix page.',
          email: email
        }, 500);
      }
      
    } catch (cleanupError: any) {
      console.error('❌ [Signup] Cleanup error:', cleanupError);
      return c.json({
        success: false,
        error: 'CLEANUP_FAILED',
        message: 'Error during cleanup. Please use /autofix page.',
        details: cleanupError.message,
        instruction: 'Go to /autofix page in the app',
        email: email
      }, 500);
    }

    // 5. التحقق من أن المستخدم غير موجود في قاعدة البيانات
    const { data: existingDbUser } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .eq('email', email)
      .maybeSingle();

    if (existingDbUser) {
      console.log('❌ [Signup] User exists in database:', existingDbUser.id);
      // حذف السجل اليتيم
      await supabase.from('users').delete().eq('id', existingDbUser.id);
      console.log('✅ [Signup] Database user deleted');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 6. إنشاء مستخدم في Auth
    console.log('🔐 [Signup] Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ✅ تأكيد البريد تلقائياً
      user_metadata: { name }
    });

    if (authError || !authData?.user) {
      console.error('❌ [Signup] Auth error:', authError);
      return c.json({ 
        success: false, 
        error: authError?.message || 'Failed to create auth user' 
      }, 500);
    }

    const authUserId = authData.user.id;
    console.log('✅ [Signup] Auth user created:', authUserId);

    // 7. إنشاء مستخدم في جدول users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authUserId,
        email,
        name,
        name_ar: name,
        name_en: name,
        student_id: studentId || null,
        role: role || 'student',
        phone: phone || null,
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('❌ [Signup] User creation error:', userError);
      // حذف المستخدم من Auth إذا فشل إنشاء السجل
      await supabase.auth.admin.deleteUser(authUserId);
      return c.json({ 
        success: false, 
        error: userError?.message || 'Failed to create user record' 
      }, 500);
    }

    console.log('✅ [Signup] User record created:', user.id);

    // 8. إذا كان طالب، إنشاء سجل في جدول students
    let studentData = null;
    if (role === 'student') {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          major: major || 'نظم المعلومات الإدارية',
          major_en: major || 'Management Information Systems',
          level: level ? parseInt(level) : 1,
          gpa: gpa ? parseFloat(gpa) : 0.0,
          total_credits: 0,
          completed_credits: 0,
        })
        .select()
        .single();

      if (studentError) {
        console.error('⚠️ [Signup] Student record creation failed:', studentError);
        // لا نحذف المستخدم، فقط نسجل الخطأ
      } else {
        console.log('✅ [Signup] Student record created:', student.id);
        studentData = student;
      }
    }

    // 9. إذا كان مشرف، إنشاء سجل في جدول supervisors
    let supervisorData = null;
    if (role === 'advisor') {
      const { data: supervisor, error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: user.id,
          department: 'قسم المعلوماتية الإدارية',
          department_en: 'MIS Department',
        })
        .select()
        .single();

      if (supervisorError) {
        console.error('⚠️ [Signup] Supervisor record creation failed:', supervisorError);
      } else {
        console.log('✅ [Signup] Supervisor record created:', supervisor.id);
        supervisorData = supervisor;
      }
    }

    console.log('🎉 [Signup] SIGNUP COMPLETE - User can now login!');

    return c.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        name: user.name,
        name_ar: user.name_ar,
        name_en: user.name_en,
        student_id: user.student_id,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
        students: studentData ? [studentData] : [],
        supervisors: supervisorData ? [supervisorData] : [],
      },
    });

  } catch (error) {
    console.error('❌ [Signup] Unexpected error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// 🔐 تسجيل الدخول
app.post('/make-server-1573e40a/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('🔐 [Login] Login attempt for:', email);

    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, 400);
    }

    // 1. تسجيل الدخول عبر Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('❌ [Login] Auth error:', authError?.message);
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, 401);
    }

    console.log('✅ [Login] Auth successful for:', authData.user.id);

    // 2. الحصول على بيانات المستخدم من قاعدة البيانات
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !user) {
      console.error('❌ [Login] User not found in database:', userError);
      return c.json({ 
        success: false, 
        error: 'User data not found' 
      }, 404);
    }

    console.log('✅ [Login] Login successful:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasStudentData: user.students && user.students.length > 0,
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        name: user.name,
        student_id: user.student_id,
        role: user.role,
        phone: user.phone,
        students: user.students || [],
      },
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

  } catch (error) {
    console.error('❌ [Login] Unexpected error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// 🚪 تسجيل الخروج
app.post('/make-server-1573e40a/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('❌ [Logout] Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ [Logout] Successful');
    return c.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('❌ [Logout] Unexpected error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// 📋 حفظ تعهد الاستخدام
app.post('/make-server-1573e40a/agreements', async (c) => {
  try {
    const body = await c.req.json();
    const { fullName, ipAddress, userAgent, timestamp, language } = body;

    console.log('📋 [Agreement] Received agreement from:', fullName);

    if (!fullName) {
      return c.json({ 
        success: false, 
        error: 'Full name is required' 
      }, 400);
    }

    console.log('✅ [Agreement] Agreement accepted by:', fullName);
    console.log('📊 [Agreement] Details:', {
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown',
      language: language || 'ar',
      timestamp: timestamp || new Date().toISOString(),
    });

    return c.json({
      success: true,
      message: 'Agreement accepted successfully',
      agreementId: `agreement-${Date.now()}`,
    });

  } catch (error: any) {
    console.error('❌ [Agreement] Error:', error);
    return c.json({ 
      success: false,
      error: error?.message || 'Failed to save agreement' 
    }, 500);
  }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/make-server-1573e40a/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'KKU Course Registration System - SQL Database',
    database: 'PostgreSQL via Supabase'
  });
});

// ========================================
// PUBLIC CLEANUP ENDPOINT
// ========================================

// 🧹 تنظيف مستخدم يتيم محدد بالبريد الإلكتروني
app.post('/make-server-1573e40a/public/cleanup-orphaned-user', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log('🧹 [Public Cleanup] Attempting to clean orphaned user:', email);

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);
    
    if (!authUser) {
      console.log('ℹ️ [Public Cleanup] User not found in Auth');
      return c.json({
        success: true,
        message: 'User not found in Auth - nothing to clean',
        cleaned: false,
      });
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    
    if (dbUser) {
      console.log('ℹ️ [Public Cleanup] User is not orphaned');
      return c.json({
        success: true,
        message: 'User is not orphaned - account is complete',
        cleaned: false,
      });
    }

    console.log('🗑️ [Public Cleanup] Deleting orphaned user from Auth:', authUser.id);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
    
    if (deleteError) {
      console.error('❌ [Public Cleanup] Failed to delete user:', deleteError);
      return c.json({ 
        error: 'Failed to delete orphaned user',
        details: deleteError.message 
      }, 500);
    }

    console.log('✅ [Public Cleanup] Successfully deleted orphaned user');
    
    return c.json({
      success: true,
      message: 'Orphaned user cleaned successfully. You can now register again.',
      cleaned: true,
    });

  } catch (error: any) {
    console.error('❌ [Public Cleanup] Error:', error);
    return c.json({ error: 'Cleanup failed: ' + error.message }, 500);
  }
});

// 🧹 تنظيف جميع المستخدمين اليتامى (عام - للطوارئ)
app.post('/make-server-1573e40a/public/cleanup-all-orphaned-users', async (c) => {
  try {
    console.log('🧹 [Public Cleanup All] Starting cleanup of all orphaned users...');

    // 1. جلب جميع المستخدمين من Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ [Public Cleanup All] Failed to list auth users:', authError);
      return c.json({ error: 'Failed to list auth users' }, 500);
    }

    console.log(`ℹ️ [Public Cleanup All] Found ${authUsers?.users?.length || 0} users in Auth`);

    // 2. جلب جميع المستخدمين من قاعدة البيانات
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('auth_id, email, student_id');
    
    if (dbError) {
      console.error('❌ [Public Cleanup All] Failed to list DB users:', dbError);
      return c.json({ error: 'Failed to list database users' }, 500);
    }

    console.log(`ℹ️ [Public Cleanup All] Found ${dbUsers?.length || 0} users in Database`);

    // 3. تحديد المستخدمين اليتامى
    const dbAuthIds = new Set(dbUsers?.map(u => u.auth_id) || []);
    const orphanedUsers = authUsers?.users?.filter(authUser => !dbAuthIds.has(authUser.id)) || [];

    console.log(`🔍 [Public Cleanup All] Found ${orphanedUsers.length} orphaned users`);

    if (orphanedUsers.length === 0) {
      return c.json({
        success: true,
        message: 'No orphaned users found',
        cleaned: 0,
        orphanedUsers: [],
      });
    }

    // 4. حذف المستخدمين اليتامى
    const cleanupResults = [];
    let successCount = 0;
    let failCount = 0;

    for (const orphan of orphanedUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(orphan.id);
        
        if (deleteError) {
          console.error(`❌ [Public Cleanup All] Failed to delete ${orphan.email}:`, deleteError);
          cleanupResults.push({
            email: orphan.email,
            status: 'failed',
            error: deleteError.message,
          });
          failCount++;
        } else {
          console.log(`✅ [Public Cleanup All] Deleted ${orphan.email}`);
          cleanupResults.push({
            email: orphan.email,
            status: 'deleted',
          });
          successCount++;
        }
        
        // انتظار قليل بين كل عملية حذف
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        console.error(`❌ [Public Cleanup All] Exception deleting ${orphan.email}:`, err);
        failCount++;
      }
    }

    console.log(`✅ [Public Cleanup All] Cleanup complete - Success: ${successCount}, Failed: ${failCount}`);

    return c.json({
      success: true,
      message: `Cleaned up ${successCount} orphaned users`,
      cleaned: successCount,
      failed: failCount,
      results: cleanupResults,
    });

  } catch (error: any) {
    console.error('❌ [Public Cleanup All] Error:', error);
    return c.json({ error: 'Cleanup failed: ' + error.message }, 500);
  }
});

// ========================================
// AI ASSISTANT ENDPOINT
// ========================================

app.post('/make-server-1573e40a/ai-assistant', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { message, language } = await c.req.json();
    
    const result = await handleAIAssistant(authHeader, message, language || 'ar');
    
    return c.json(result);
  } catch (error) {
    console.error('❌ [AI Assistant] Error:', error);
    return c.json({
      success: false,
      response: 'An error occurred',
      type: 'error'
    }, 500);
  }
});

// ========================================
// STUDENT DATA & STATISTICS ENDPOINTS
// ========================================

// 📊 GET: جلب بيانات الطالب الكاملة
app.get('/make-server-1573e40a/student/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('📊 [Student Data] Fetching student data for:', userId);

    // جلب بيانات المستخدم مع بيانات الطالب
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ [Student Data] User not found:', userError);
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    console.log('✅ [Student Data] User found:', user.email);
    console.log('📊 [Student Data] Student info:', user.students);

    return c.json({
      success: true,
      user: {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        name: user.name,
        student_id: user.student_id,
        role: user.role,
        phone: user.phone,
        students: user.students || [],
        // إضافة البيانات مباشرة على مستوى المستخدم لسهولة الوصول
        major: user.students?.[0]?.major || null,
        level: user.students?.[0]?.level || null,
        gpa: user.students?.[0]?.gpa || null,
        total_credits: user.students?.[0]?.total_credits || 0,
        completed_credits: user.students?.[0]?.completed_credits || 0,
      },
    });

  } catch (error: any) {
    console.error('❌ [Student Data] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch student data' 
    }, 500);
  }
});

// 📊 GET: جلب إحصائيات الطالب
app.get('/make-server-1573e40a/dashboard/student/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('📊 [Dashboard Stats] Fetching statistics for user:', userId);

    // جلب بيانات الطالب
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ [Dashboard Stats] User not found:', userError);
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    // جلب تسجيلات الطالب
    const { data: registrations, error: regError } = await supabase
      .from('registration_requests')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('student_id', userId);

    if (regError) {
      console.error('⚠️ [Dashboard Stats] Failed to fetch registrations:', regError);
    }

    // حساب الإحصائيات
    const totalRegistrations = registrations?.length || 0;
    const approvedRegistrations = registrations?.filter(r => r.status === 'approved').length || 0;
    const pendingRegistrations = registrations?.filter(r => r.status === 'pending').length || 0;
    const rejectedRegistrations = registrations?.filter(r => r.status === 'rejected').length || 0;

    // حساب الساعات
    const registeredHours = registrations
      ?.filter(r => r.status === 'approved' || r.status === 'pending')
      ?.reduce((sum, r) => sum + (r.course?.credits || 0), 0) || 0;

    console.log('✅ [Dashboard Stats] Stats calculated:', {
      totalRegistrations,
      approvedRegistrations,
      pendingRegistrations,
      rejectedRegistrations,
      registeredHours,
    });

    return c.json({
      success: true,
      stats: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          student_id: user.student_id,
          role: user.role,
          major: user.students?.[0]?.major || null,
          level: user.students?.[0]?.level || null,
          gpa: user.students?.[0]?.gpa || null,
          total_credits: user.students?.[0]?.total_credits || 0,
          completed_credits: user.students?.[0]?.completed_credits || 0,
        },
        registrations: {
          total: totalRegistrations,
          approved: approvedRegistrations,
          pending: pendingRegistrations,
          rejected: rejectedRegistrations,
          registeredHours: registeredHours,
        },
        courses: registrations || [],
      },
    });

  } catch (error: any) {
    console.error('❌ [Dashboard Stats] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch statistics' 
    }, 500);
  }
});

// 📚 GET: جلب تسجيلات الطالب المسجل دخوله (من access_token)
app.get('/make-server-1573e40a/student/registrations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('📚 [Student Registrations] Fetching registrations...');

    // التحقق من وجود token
    if (!accessToken) {
      console.warn('⚠️ [Student Registrations] No access token provided');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // الحصول على معلومات المستخدم من token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      console.error('❌ [Student Registrations] Auth error:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    console.log('✅ [Student Registrations] Authenticated user:', authUser.email);

    // جلب معلومات المستخدم من جدول users
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      console.error('❌ [Student Registrations] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    console.log('✅ [Student Registrations] User ID:', user.id);

    // جلب التسجيلات من registration_requests
    const { data: registrations, error: regError } = await supabase
      .from('registration_requests')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ [Student Registrations] Error fetching registrations:', regError);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch registrations' 
      }, 500);
    }

    console.log(`✅ [Student Registrations] Found ${registrations?.length || 0} registrations`);

    return c.json({
      success: true,
      registrations: registrations || [],
    });

  } catch (error: any) {
    console.error('❌ [Student Registrations] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch registrations' 
    }, 500);
  }
});

// 🔔 GET: جلب إشعارات الطالب المسجل دخوله (من access_token)
app.get('/make-server-1573e40a/student/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔔 [Student Notifications] Fetching notifications...');

    // التحقق من وجود token
    if (!accessToken) {
      console.warn('⚠️ [Student Notifications] No access token provided');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // الحصول على معلومات المستخدم من token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      console.error('❌ [Student Notifications] Auth error:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    console.log('✅ [Student Notifications] Authenticated user:', authUser.email);

    // جلب معلومات المستخدم من جدول users
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      console.error('❌ [Student Notifications] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    console.log('✅ [Student Notifications] User ID:', user.id);

    // جلب الإشعارات
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notifError) {
      console.error('❌ [Student Notifications] Error fetching notifications:', notifError);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      }, 500);
    }

    console.log(`✅ [Student Notifications] Found ${notifications?.length || 0} notifications`);

    return c.json({
      success: true,
      notifications: notifications || [],
    });

  } catch (error: any) {
    console.error('❌ [Student Notifications] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch notifications' 
    }, 500);
  }
});

// 🔔 POST: تحديث جميع الإشعارات كمقروءة
app.post('/make-server-1573e40a/student/notifications/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔔 [Mark All Read] Marking all notifications as read...');

    if (!accessToken) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // تحديث جميع الإشعارات
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('❌ [Mark All Read] Error:', updateError);
      return c.json({ 
        success: false, 
        error: 'Failed to mark notifications as read' 
      }, 500);
    }

    console.log('✅ [Mark All Read] All notifications marked as read');

    return c.json({
      success: true,
      message: 'All notifications marked as read',
    });

  } catch (error: any) {
    console.error('❌ [Mark All Read] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to mark notifications as read' 
    }, 500);
  }
});

// 📚 GET: جلب جميع المقررات المتاحة
app.get('/make-server-1573e40a/courses', async (c) => {
  try {
    console.log('📚 [Courses] Fetching all courses...');

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('level', { ascending: true })
      .order('course_code', { ascending: true });

    if (error) {
      console.error('❌ [Courses] Error fetching courses:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch courses' 
      }, 500);
    }

    console.log(`✅ [Courses] Found ${courses?.length || 0} courses`);

    return c.json({
      success: true,
      courses: courses || [],
    });

  } catch (error: any) {
    console.error('❌ [Courses] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch courses' 
    }, 500);
  }
});

// 📝 GET: جلب تسجيلات الطالب
app.get('/make-server-1573e40a/registrations/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('📝 [Registrations] Fetching registrations for user:', userId);

    const { data: registrations, error: regError } = await supabase
      .from('registration_requests')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ [Registrations] Error fetching registrations:', regError);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch registrations' 
      }, 500);
    }

    console.log(`✅ [Registrations] Found ${registrations?.length || 0} registrations`);

    return c.json({
      success: true,
      registrations: registrations || [],
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch registrations' 
    }, 500);
  }
});

// 📝 POST: تسجيل مقرر جديد
app.post('/make-server-1573e40a/registrations', async (c) => {
  try {
    const { student_id, course_id, semester } = await c.req.json();
    
    console.log('📝 [Register Course] Student:', student_id, 'Course:', course_id);

    if (!student_id || !course_id || !semester) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, 400);
    }

    // التحقق من عدم التسجيل المكرر
    const { data: existing } = await supabase
      .from('registration_requests')
      .select('id')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .eq('semester', semester)
      .maybeSingle();

    if (existing) {
      console.log('⚠️ [Register Course] Already registered');
      return c.json({ 
        success: false, 
        error: 'Already registered for this course' 
      }, 409);
    }

    // إنشاء التسجيل
    const { data: registration, error: regError } = await supabase
      .from('registration_requests')
      .insert({
        student_id,
        course_id,
        semester,
        status: 'pending',
      })
      .select(`
        *,
        course:courses(*)
      `)
      .single();

    if (regError) {
      console.error('❌ [Register Course] Error:', regError);
      return c.json({ 
        success: false, 
        error: 'Failed to register course' 
      }, 500);
    }

    console.log('✅ [Register Course] Registered successfully:', registration.id);

    return c.json({
      success: true,
      registration,
    });

  } catch (error: any) {
    console.error('❌ [Register Course] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to register course' 
    }, 500);
  }
});

// 🔄 PUT: تحديث بيانات الطالب (المعدل، المستوى، التخصص)
app.put('/make-server-1573e40a/student/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { major, level, gpa } = await c.req.json();
    
    console.log('🔄 [Update Student] Updating student data for:', userId);

    // تحديث بيانات الطالب
    const { data: student, error: updateError } = await supabase
      .from('students')
      .update({
        major: major || undefined,
        level: level ? parseInt(level) : undefined,
        gpa: gpa ? parseFloat(gpa) : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Update Student] Error:', updateError);
      return c.json({ 
        success: false, 
        error: 'Failed to update student data' 
      }, 500);
    }

    console.log('✅ [Update Student] Updated successfully');

    return c.json({
      success: true,
      student,
    });

  } catch (error: any) {
    console.error('❌ [Update Student] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to update student data' 
    }, 500);
  }
});

// ========================================
// ADMIN ENDPOINTS - إحصائيات ووظائف المدير
// ========================================

// 📊 GET: إحصائيات المدير الشاملة
app.get('/make-server-1573e40a/admin/stats', async (c) => {
  try {
    console.log('📊 [Admin Stats] Fetching comprehensive statistics...');

    // 1. عدد الطلاب
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // 2. عدد المشرفين
    const { count: totalSupervisors } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'advisor');

    // 3. عدد المدراء
    const { count: totalAdmins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    // 4. عدد المقررات
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // 5. طلبات التسجيل المعلقة
    const { count: pendingRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 6. طلبات التسجيل المعتمدة
    const { count: approvedRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // 7. إجمالي التسجيلات
    const { count: totalRegistrations } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true });

    // 8. الإشعارات غير المقروءة
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    const stats = {
      totalStudents: totalStudents || 0,
      totalSupervisors: totalSupervisors || 0,
      totalAdmins: totalAdmins || 0,
      totalCourses: totalCourses || 0,
      pendingRequests: pendingRequests || 0,
      approvedRequests: approvedRequests || 0,
      totalRegistrations: totalRegistrations || 0,
      unreadNotifications: unreadNotifications || 0,
    };

    console.log('✅ [Admin Stats] Statistics:', stats);

    return c.json({
      success: true,
      stats,
    });

  } catch (error: any) {
    console.error('❌ [Admin Stats] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch statistics' 
    }, 500);
  }
});

// 👥 GET: جلب جميع المستخدمين (للمدير فقط)
app.get('/make-server-1573e40a/admin/users', async (c) => {
  try {
    console.log('👥 [Admin Users] Fetching all users...');

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        students(*),
        supervisors(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Admin Users] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch users' \n      }, 500);
    }

    console.log(`✅ [Admin Users] Found ${users?.length || 0} users`);

    return c.json({
      success: true,
      users: users || [],
    });

  } catch (error: any) {
    console.error('❌ [Admin Users] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch users' 
    }, 500);
  }
});

// 👥 GET: جلب جميع الطلاب فقط (للمدير)
app.get('/make-server-1573e40a/admin/students', async (c) => {
  try {
    console.log('📚 [Admin Students] Fetching all students...');

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Admin Students] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch students' 
      }, 500);
    }

    // تحويل البيانات للصيغة المتوقعة
    const students = users?.map(user => ({
      user_id: user.id,
      student_id: user.student_id || user.id,
      name: user.name,
      email: user.email,
      major: user.students?.[0]?.major || 'نظم المعلومات الإدارية',
      level: user.students?.[0]?.level || 1,
      gpa: user.students?.[0]?.gpa || 0,
      role: user.role,
      created_at: user.created_at,
      students: user.students || [],
    })) || [];

    console.log(`✅ [Admin Students] Found ${students.length} students`);

    return c.json({
      success: true,
      students,
    });

  } catch (error: any) {
    console.error('❌ [Admin Students] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch students' 
    }, 500);
  }
});

// 🗑️ DELETE: حذف مستخدم (للمدير فقط)
app.delete('/make-server-1573e40a/admin/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🗑️ [Admin Delete User] Deleting user:', userId);

    // 1. جلب بيانات المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('auth_id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ [Admin Delete User] User not found:', userError);
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    console.log('🔍 [Admin Delete User] Found user:', user.email);

    // 2. حذف من Auth إذا كان له auth_id
    if (user.auth_id) {
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.auth_id);
        
        if (authDeleteError) {
          console.error('⚠️ [Admin Delete User] Auth deletion failed:', authDeleteError);
          // نستمر في الحذف من قاعدة البيانات حتى لو فشل حذف Auth
        } else {
          console.log('✅ [Admin Delete User] Deleted from Auth');
        }
      } catch (authErr) {
        console.error('⚠️ [Admin Delete User] Auth deletion exception:', authErr);
      }
    }

    // 3. حذف السجلات المرتبطة
    // حذف من جدول students إذا كان طالب
    if (user.role === 'student') {
      await supabase.from('students').delete().eq('user_id', userId);
      console.log('✅ [Admin Delete User] Deleted student record');
    }

    // حذف من جدول supervisors إذا كان مشرف
    if (user.role === 'advisor') {
      await supabase.from('supervisors').delete().eq('user_id', userId);
      console.log('✅ [Admin Delete User] Deleted supervisor record');
    }

    // حذف التسجيلات
    await supabase.from('registration_requests').delete().eq('student_id', userId);
    console.log('✅ [Admin Delete User] Deleted registrations');

    // حذف الإشعارات
    await supabase.from('notifications').delete().eq('user_id', userId);
    console.log('✅ [Admin Delete User] Deleted notifications');

    // 4. حذف من جدول users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ [Admin Delete User] Database deletion failed:', deleteError);
      return c.json({ 
        success: false, 
        error: 'Failed to delete user from database' 
      }, 500);
    }

    console.log('✅ [Admin Delete User] User completely deleted:', userId);

    return c.json({
      success: true,
      message: 'User deleted successfully',
      userId,
      email: user.email,
    });

  } catch (error: any) {
    console.error('❌ [Admin Delete User] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to delete user' 
    }, 500);
  }
});

// ========================================
// NOTIFICATIONS ENDPOINTS - نظام الإشعارات
// ========================================

// 🔔 POST: إنشاء إشعار جديد (تلقائي عند تسجيل مقرر)
app.post('/make-server-1573e40a/notifications', async (c) => {
  try {
    const { user_id, title, title_ar, title_en, message, message_ar, message_en, type, related_id } = await c.req.json();
    
    console.log('🔔 [Create Notification] Creating notification for user:', user_id);

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title: title || title_ar || title_en,
        title_ar: title_ar || title,
        title_en: title_en || title,
        message: message || message_ar || message_en,
        message_ar: message_ar || message,
        message_en: message_en || message,
        type: type || 'info',
        related_id,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Create Notification] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to create notification' 
      }, 500);
    }

    console.log('✅ [Create Notification] Notification created:', notification.id);

    return c.json({
      success: true,
      notification,
    });

  } catch (error: any) {
    console.error('❌ [Create Notification] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to create notification' 
    }, 500);
  }
});

// 🔔 GET: جلب إشعارات المستخدم
app.get('/make-server-1573e40a/notifications/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🔔 [Get Notifications] Fetching notifications for user:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ [Get Notifications] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      }, 500);
    }

    console.log(`✅ [Get Notifications] Found ${notifications?.length || 0} notifications`);

    return c.json({
      success: true,
      notifications: notifications || [],
      unread: notifications?.filter(n => !n.read).length || 0,
    });

  } catch (error: any) {
    console.error('❌ [Get Notifications] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch notifications' 
    }, 500);
  }
});

// 🔔 GET: جلب إشعارات المشرف/المدير (طلبات التسجيل المعلقة)
app.get('/make-server-1573e40a/notifications/supervisor/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🔔 [Supervisor Notifications] Fetching for user:', userId);

    // جلب المستخدم للتحقق من الدور
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || (user.role !== 'advisor' && user.role !== 'admin')) {
      return c.json({ 
        success: false, 
        error: 'Not authorized' 
      }, 403);
    }

    // جلب الإشعارات الخاصة بالمشرف/المدير
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ [Supervisor Notifications] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      }, 500);
    }

    // جلب طلبات التسجيل المعلقة
    const { data: pendingRequests, error: reqError } = await supabase
      .from('registration_requests')
      .select(`
        *,
        student:users!registration_requests_student_id_fkey(id, name, email, student_id),
        course:courses(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('⚠️ [Supervisor Notifications] Error fetching requests:', reqError);
    }

    console.log(`✅ [Supervisor Notifications] Found ${notifications?.length || 0} notifications and ${pendingRequests?.length || 0} pending requests`);

    return c.json({
      success: true,
      notifications: notifications || [],
      pendingRequests: pendingRequests || [],
      unread: notifications?.filter(n => !n.read).length || 0,
      pendingCount: pendingRequests?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ [Supervisor Notifications] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch notifications' 
    }, 500);
  }
});

// 🔔 PUT: تحديث حالة الإشعار (قراءة/عدم قراءة)
app.put('/make-server-1573e40a/notifications/:notificationId', async (c) => {
  try {
    const notificationId = c.req.param('notificationId');
    const { read } = await c.req.json();
    
    console.log('🔔 [Update Notification] Updating notification:', notificationId);

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: read !== undefined ? read : true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Update Notification] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to update notification' 
      }, 500);
    }

    console.log('✅ [Update Notification] Notification updated');

    return c.json({
      success: true,
      notification,
    });

  } catch (error: any) {
    console.error('❌ [Update Notification] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to update notification' 
    }, 500);
  }
});

// 🔔 PUT: تحديث جميع الإشعارات كمقروءة
app.put('/make-server-1573e40a/notifications/mark-all-read/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🔔 [Mark All Read] Marking all notifications as read for:', userId);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ [Mark All Read] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to mark notifications as read' 
      }, 500);
    }

    console.log('✅ [Mark All Read] All notifications marked as read');

    return c.json({
      success: true,
      message: 'All notifications marked as read',
    });

  } catch (error: any) {
    console.error('❌ [Mark All Read] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to mark notifications as read' 
    }, 500);
  }
});

// ========================================
// SUPERVISOR ENDPOINTS - وظائف المشرف
// ========================================

// 📊 GET: إحصائيات المشرف
app.get('/make-server-1573e40a/supervisor/stats/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('📊 [Supervisor Stats] Fetching stats for:', userId);

    // طلبات التسجيل المعلقة
    const { count: pendingRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // إجمالي الطلبات المعتمدة
    const { count: approvedRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // إجمالي الطلبات المرفوضة
    const { count: rejectedRequests } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // إجمالي الطلاب
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    const stats = {
      pendingRequests: pendingRequests || 0,
      approvedRequests: approvedRequests || 0,
      rejectedRequests: rejectedRequests || 0,
      totalStudents: totalStudents || 0,
    };

    console.log('✅ [Supervisor Stats] Stats:', stats);

    return c.json({
      success: true,
      stats,
    });

  } catch (error: any) {
    console.error('❌ [Supervisor Stats] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch statistics' 
    }, 500);
  }
});

// 📝 GET: جلب جميع طلبات التسجيل (للمشرف/المدير)
app.get('/make-server-1573e40a/supervisor/requests', async (c) => {
  try {
    console.log('📝 [Supervisor Requests] Fetching all registration requests...');

    const { data: requests, error } = await supabase
      .from('registration_requests')
      .select(`
        *,
        student:users!registration_requests_student_id_fkey(id, name, email, student_id),
        course:courses(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Supervisor Requests] Error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch requests' 
      }, 500);
    }

    console.log(`✅ [Supervisor Requests] Found ${requests?.length || 0} requests`);

    return c.json({
      success: true,
      requests: requests || [],
    });

  } catch (error: any) {
    console.error('❌ [Supervisor Requests] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch requests' 
    }, 500);
  }
});

// 📝 PUT: تحديث حالة طلب التسجيل (موافقة/رفض)
app.put('/make-server-1573e40a/supervisor/requests/:requestId', async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const { status, notes } = await c.req.json();
    
    console.log('📝 [Update Request] Updating request:', requestId, 'Status:', status);

    // التحقق من الحالة
    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ 
        success: false, 
        error: 'Invalid status' 
      }, 400);
    }

    // تحديث الطلب
    const { data: request, error: updateError } = await supabase
      .from('registration_requests')
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select(`
        *,
        student:users!registrations_student_id_fkey(id, name, email),
        course:courses(*)
      `)
      .single();

    if (updateError || !request) {
      console.error('❌ [Update Request] Error:', updateError);
      return c.json({ 
        success: false, 
        error: 'Failed to update request' 
      }, 500);
    }

    console.log('✅ [Update Request] Request updated');

    // إنشاء إشعار للطالب
    try {
      const notificationTitle = status === 'approved' 
        ? 'تمت الموافقة على طلب التسجيل' 
        : 'تم رفض طلب التسجيل';
      
      const notificationMessage = status === 'approved'
        ? `تمت الموافقة على طلب تسجيل مقرر ${request.course?.name_ar || request.course?.name}`
        : `تم رفض طلب تسجيل مقرر ${request.course?.name_ar || request.course?.name}${notes ? ` - السبب: ${notes}` : ''}`;

      await supabase
        .from('notifications')
        .insert({
          user_id: request.student_id,
          title: notificationTitle,
          title_ar: notificationTitle,
          title_en: status === 'approved' ? 'Registration Request Approved' : 'Registration Request Rejected',
          message: notificationMessage,
          message_ar: notificationMessage,
          message_en: status === 'approved' 
            ? `Your registration request for ${request.course?.name_en || request.course?.name} has been approved`
            : `Your registration request for ${request.course?.name_en || request.course?.name} has been rejected${notes ? ` - Reason: ${notes}` : ''}`,
          type: status === 'approved' ? 'success' : 'error',
          related_id: requestId,
          read: false,
        });

      console.log('✅ [Update Request] Notification sent to student');
    } catch (notifError) {
      console.error('⚠️ [Update Request] Failed to create notification:', notifError);
    }

    return c.json({
      success: true,
      request,
      message: `Request ${status} successfully`,
    });

  } catch (error: any) {
    console.error('❌ [Update Request] Error:', error);
    return c.json({ 
      success: false, 
      error: error?.message || 'Failed to update request' 
    }, 500);
  }
});

// ========================================
// START SERVER
// ========================================

Deno.serve(app.fetch);