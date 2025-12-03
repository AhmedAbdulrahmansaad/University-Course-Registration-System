import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Mail, 
  UserPlus,
  IdCard,
  BookOpen,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Shield,
  Users,
  Building2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MAJORS_FOR_SELECT as MAJORS, DEPARTMENTS, ACADEMIC_LEVELS, USER_ROLES } from '../../utils/departments';

export const SignUpPage: React.FC = () => {
  const { language, t, setCurrentPage, setIsLoggedIn, setUserInfo } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    gpa: '',
    major: '',
    level: '',
    role: 'student', // الدور الافتراضي
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ التحقق من البريد الإلكتروني
  const validateEmail = (email: string): boolean => {
    return email.endsWith('@kku.edu.sa');
  };

  // ✅ التحقق من الرقم الجامعي (9 أرقام)
  const validateStudentId = (id: string): boolean => {
    return /^\d{9}$/.test(id);
  };

  // ✅ التحقق من كلمة المرور القوية
  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { 
        valid: false, 
        message: language === 'ar' 
          ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' 
          : 'Password must be at least 8 characters' 
      };
    }
    if (!/[A-Z]/.test(password)) {
      return { 
        valid: false, 
        message: language === 'ar' 
          ? 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)' 
          : 'Password must contain at least one uppercase letter (A-Z)' 
      };
    }
    if (!/[a-z]/.test(password)) {
      return { 
        valid: false, 
        message: language === 'ar' 
          ? 'كلمة المرور يجب أن تتوي على حرف صغير واحد على الأقل (a-z)' 
          : 'Password must contain at least one lowercase letter (a-z)' 
      };
    }
    if (!/[0-9]/.test(password)) {
      return { 
        valid: false, 
        message: language === 'ar' 
          ? 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)' 
          : 'Password must contain at least one number (0-9)' 
      };
    }
    if (!/[@#$%&*]/.test(password)) {
      return { 
        valid: false, 
        message: language === 'ar' 
          ? 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (@#$%&*)' 
          : 'Password must contain at least one special character (@#$%&*)' 
      };
    }
    return { valid: true };
  };

  // ✅ التحقق من النموذج
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // التحقق من الاسم
    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    // التحقق من البريد الإلكتروني
    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الجامعي مطلوب' : 'University email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = language === 'ar' ? 'يجب استخدام البريد لجامعي (@kku.edu.sa)' : 'Must use university email (@kku.edu.sa)';
    }

    // التحقق من كلمة المرور
    if (!formData.password.trim()) {
      newErrors.password = language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message!;
      }
    }

    // التحقق من تطابق كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match';
    }

    // ✅ إذا كان الدور "طالب" فقط، نطلب الحقول الإضافية
    if (formData.role === 'student') {
      // التحقق من الرقم الجامعي
      if (!formData.studentId.trim()) {
        newErrors.studentId = language === 'ar' ? 'الرقم الجامعي مطلوب' : 'Student ID is required';
      } else if (!validateStudentId(formData.studentId)) {
        newErrors.studentId = language === 'ar' ? 'الرقم الجامعي يجب أن يكون 9 أرقام' : 'Student ID must be 9 digits';
      }

      // التحقق من التخصص
      if (!formData.major || formData.major === '') {
        newErrors.major = language === 'ar' ? 'التخصص مطلوب' : 'Major is required';
      }

      // التحقق من المستوى
      if (!formData.level || formData.level === '') {
        newErrors.level = language === 'ar' ? 'المستوى الدراسي مطلوب' : 'Academic level is required';
      }

      // التحقق من المعدل (اختياري)
      if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 5)) {
        newErrors.gpa = language === 'ar' ? 'المعدل يجب أن يكون بين 0 و 5' : 'GPA must be between 0 and 5';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ معالجة إنشاء الحساب
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى تصحيح الأخطاء في النموذج' 
          : '⚠️ Please fix the errors in the form'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('📝 [Signup] Starting signup process...');

      // ✅ إرسال البيانات للسيرفر مباشرة
      const dataToSend = {
        studentId: formData.studentId || null,
        email: formData.email.trim(),
        password: formData.password,
        name: formData.fullName.trim(),
        phone: formData.phone || null,
        role: formData.role,
        level: formData.level ? parseInt(formData.level) : null,
        major: formData.major || null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      };

      console.log('📤 [Signup] Sending to server...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [Signup] Server error:', result);
        
        // التحقق من خطأ قاعدة البيانات غير جاهزة
        if (result.error === 'DATABASE_NOT_SETUP') {
          toast.error(
            language === 'ar'
              ? '❌ قاعدة البيانات غير جاهزة!'
              : '❌ Database Not Ready!',
            {
              description: language === 'ar'
                ? 'يجب تشغيل سكريبت إعداد قاعدة البيانات أولاً. انقر على زر "فحص قاعدة البيانات" للمساعدة.'
                : 'You must run the database setup script first. Click "Check Database" button for help.',
              duration: 10000,
            }
          );
          
          // توجيه المستخدم لصفحة فحص قاعدة البيانات
          setTimeout(() => {
            toast.info(
              language === 'ar'
                ? '📊 سيتم توجيهك لصفحة فحص قاعدة البيانات...'
                : '📊 Redirecting to database check page...',
              { duration: 3000 }
            );
            
            setTimeout(() => {
              setCurrentPage('databaseCheck');
            }, 2000);
          }, 3000);
          
          setLoading(false);
          return;
        }
        
        // التحقق من خطأ الحساب اليتيم
        if (result.error === 'ORPHANED_ACCOUNT') {
          toast.error(
            language === 'ar'
              ? '⚠️ حساب يتيم موجود!'
              : '⚠️ Orphaned Account Exists!',
            {
              description: language === 'ar'
                ? `البريد ${formData.email} موجود لكن غير مكتمل. جاري توجيهك لصفحة الإصلاح التلقائي...`
                : `Email ${formData.email} exists but incomplete. Redirecting to auto-fix page...`,
              duration: 5000,
            }
          );
          
          // عرض تعليمات إضافية
          setTimeout(() => {
            toast.info(
              language === 'ar'
                ? '💡 ستقوم صفحة الإصلاح بحل المشكلة تلقائياً'
                : '💡 The auto-fix page will solve this automatically',
              { duration: 3000 }
            );
          }, 1000);
          
          // توجيه المستخدم لصفحة الإصلاح التلقائي
          setTimeout(() => {
            setCurrentPage('autofix');
          }, 2500);
          
          setLoading(false);
          return;
        }
        
        // التحقق من خطأ فشل التنظيف
        if (result.error === 'CLEANUP_FAILED') {
          toast.error(
            language === 'ar'
              ? '⚠️ فشل التنظيف التلقائي!'
              : '⚠️ Automatic Cleanup Failed!',
            {
              description: language === 'ar'
                ? 'جاري توجيهك لصفحة الإصلاح التلقائي...'
                : 'Redirecting to auto-fix page...',
              duration: 4000,
            }
          );
          
          // توجيه المستخدم لصفحة الإصلاح التلقائي
          setTimeout(() => {
            setCurrentPage('autofix');
          }, 2000);
          
          setLoading(false);
          return;
        }
        
        // التحقق من خطأ الحساب الموجود
        if (result.error === 'ACCOUNT_EXISTS') {
          toast.error(
            language === 'ar'
              ? '✅ الحساب موجود بالفعل!'
              : '✅ Account Already Exists!',
            {
              description: language === 'ar'
                ? 'هذا البريد مسجل بالفعل في النظام. سجل دخول بدلاً من ذلك.'
                : 'This email is already registered. Please login instead.',
              duration: 6000,
            }
          );
          
          // توجيه المستخدم لصفحة تسجيل الدخول
          setTimeout(() => {
            setCurrentPage('login');
          }, 2000);
          
          setLoading(false);
          return;
        }
        
        let errorMessage = result.error || 'فشل إنشاء الحساب';
        
        if (errorMessage.includes('already exists')) {
          errorMessage = language === 'ar'
            ? '❌ هذا البريد أو الرقم الجامعي مسجل مسبقاً'
            : '❌ This email or student ID already exists';
        }
        
        toast.error(errorMessage, { duration: 6000 });
        setLoading(false);
        return;
      }

      console.log('✅ [Signup] Account created successfully!');

      // ✅ رسالة نجاح مؤقتة
      toast.success(
        language === 'ar'
          ? '✅ تم إنشاء الحساب بنجاح!'
          : '✅ Account created successfully!',
        { duration: 2000 }
      );

      // ⏳ انتظار قصير للتأكد من تأكيد البريد
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔐 تسجيل الدخول التلقائي
      console.log('🔐 [Signup] Auto-login starting...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError || !authData?.user || !authData?.session) {
        console.error('❌ [Signup] Auto-login failed:', authError?.message);
        
        toast.warning(
          language === 'ar'
            ? '⚠️ تم إنشاء الحساب، الرجاء تسجيل الدخول يدوياً'
            : '⚠️ Account created, please login manually',
          {
            description: language === 'ar'
              ? 'سيتم توجيهك لصفحة تسجيل الدخول...'
              : 'Redirecting to login page...',
            duration: 4000,
          }
        );
        
        setTimeout(() => {
          setCurrentPage('login');
        }, 2000);
        
        setLoading(false);
        return;
      }

      console.log('✅ [Signup] Auto-login successful!');

      // ✅ استخدام بيانات المستخدم من الـ Backend مباشرة
      const userData = result.user;
      
      if (!userData) {
        console.error('❌ [Signup] User data not found in response');
        
        toast.warning(
          language === 'ar'
            ? '⚠️ الرجاء تسجيل الدخول يدوياً'
            : '⚠️ Please login manually',
          { duration: 4000 }
        );
        
        setTimeout(() => {
          setCurrentPage('login');
        }, 2000);
        
        setLoading(false);
        return;
      }

      console.log('✅ [Signup] User data received from backend:', userData);

      // ✅ دمج بيانات الطالب مع بيانات المستخدم
      const enrichedUserData = {
        ...userData,
        // إضافة بيانات الطالب على مستوى المستخدم مباشرة
        major: userData.students?.[0]?.major || formData.major || null,
        level: userData.students?.[0]?.level || (formData.level ? parseInt(formData.level) : null),
        gpa: userData.students?.[0]?.gpa || (formData.gpa ? parseFloat(formData.gpa) : null),
        total_credits: userData.students?.[0]?.total_credits || 0,
        completed_credits: userData.students?.[0]?.completed_credits || 0,
        // إضافة access_token
        access_token: authData.session.access_token,
      };

      console.log('📊 [Signup] Enriched user data:', {
        name: enrichedUserData.name,
        role: enrichedUserData.role,
        major: enrichedUserData.major,
        level: enrichedUserData.level,
        gpa: enrichedUserData.gpa,
      });

      // ✅ حفظ بيانات المستخدم المدمجة
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userInfo', JSON.stringify(enrichedUserData));
      localStorage.setItem('userRole', enrichedUserData.role);
      localStorage.setItem('userEmail', enrichedUserData.email);
      localStorage.setItem('access_token', authData.session.access_token);

      // ✅ تحديث حالة التطبيق
      setIsLoggedIn(true);
      setUserInfo(enrichedUserData);

      // ✅ رسالة ترحيب
      toast.success(
        language === 'ar'
          ? `🎉 أهلاً بك ${enrichedUserData.name}!`
          : `🎉 Welcome ${enrichedUserData.name}!`,
        {
          description: language === 'ar'
            ? 'تم تسجيل دخولك بنجاح'
            : 'You are now logged in',
          duration: 3000,
        }
      );

      // ✅ الانتقال للوحة التحكم المناسبة
      setTimeout(() => {
        if (enrichedUserData.role === 'student') {
          setCurrentPage('studentDashboard');
        } else if (enrichedUserData.role === 'advisor') {
          setCurrentPage('supervisorDashboard');
        } else if (enrichedUserData.role === 'admin') {
          setCurrentPage('adminDashboard');
        } else {
          setCurrentPage('home');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ [Signup] Error:', error);
      toast.error(
        language === 'ar'
          ? '❌ حدث خطأ أثناء إنشاء الحساب'
          : '❌ Error creating account',
        {
          description: error.message,
          duration: 6000
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ الحقول المشتركة لجميع الأدوار
  const renderCommonFields = () => (
    <>
      {/* الاسم الكامل */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Label htmlFor="fullName" className="text-base font-bold flex items-center gap-2">
          <User className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
        </Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value });
            setErrors({ ...errors, fullName: '' });
          }}
          className={`mt-2 h-12 ${errors.fullName ? 'border-red-500' : 'border-2'}`}
          placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.fullName}
          </p>
        )}
      </div>

      {/* البريد الإلكتروني */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Label htmlFor="email" className="text-base font-bold flex items-center gap-2">
          <Mail className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'البريد الجامعي *' : 'University Email *'}
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setErrors({ ...errors, email: '' });
          }}
          className={`mt-2 h-12 ${errors.email ? 'border-red-500' : 'border-2'}`}
          placeholder="example@kku.edu.sa"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* كلمة المرور */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Label htmlFor="password" className="text-base font-bold flex items-center gap-2">
          <Lock className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'كلمة المرور *' : 'Password *'}
        </Label>
        <div className="relative mt-2">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setErrors({ ...errors, password: '' });
            }}
            className={`h-12 ${errors.password ? 'border-red-500' : 'border-2'} ${language === 'ar' ? 'pl-12' : 'pr-12'}`}
            placeholder={language === 'ar' ? 'كلمة مرور قوية (8+ أحرف، أرقام، رموز)' : 'Strong password (8+ chars, numbers, symbols)'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.password}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'ar' 
            ? '✅ 8+ أحرف | حرف كبير | حرف صغير | رقم | رمز (@#$%&*)' 
            : '✅ 8+ chars | Uppercase | Lowercase | Number | Symbol (@#$%&*)'}
        </p>
      </div>

      {/* تأكيد كلمة المرور */}
      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Label htmlFor="confirmPassword" className="text-base font-bold flex items-center gap-2">
          <Lock className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
        </Label>
        <div className="relative mt-2">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              setErrors({ ...errors, confirmPassword: '' });
            }}
            className={`h-12 ${errors.confirmPassword ? 'border-red-500' : 'border-2'} ${language === 'ar' ? 'pl-12' : 'pr-12'}`}
            placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.confirmPassword}
          </p>
        )}
      </div>
    </>
  );

  // ✅ الحقول الخاصة بالطلاب فقط
  const renderStudentFields = () => (
    <>
      {/* الرقم الجامعي */}
      <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <Label htmlFor="studentId" className="text-base font-bold flex items-center gap-2">
          <IdCard className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'الرقم الجامعي *' : 'Student ID *'}
        </Label>
        <Input
          id="studentId"
          value={formData.studentId}
          onChange={(e) => {
            setFormData({ ...formData, studentId: e.target.value });
            setErrors({ ...errors, studentId: '' });
          }}
          className={`mt-2 h-12 ${errors.studentId ? 'border-red-500' : 'border-2'}`}
          placeholder={language === 'ar' ? '9 أرقام (مثال: 442012345)' : '9 digits (e.g., 442012345)'}
          maxLength={9}
        />
        {errors.studentId && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.studentId}
          </p>
        )}
      </div>

      {/* التخصص */}
      <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <Label htmlFor="major" className="text-base font-bold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'التخصص *' : 'Major *'}
        </Label>
        <Select value={formData.major} onValueChange={(value) => {
          setFormData({ ...formData, major: value });
          setErrors({ ...errors, major: '' });
        }}>
          <SelectTrigger className={`mt-2 h-12 ${errors.major ? 'border-red-500' : 'border-2'}`}>
            <SelectValue placeholder={language === 'ar' ? 'اختر التخصص' : 'Select Major'} />
          </SelectTrigger>
          <SelectContent>
            {MAJORS.map((major) => (
              <SelectItem key={major.value} value={major.value}>
                {major.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.major && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.major}
          </p>
        )}
      </div>

      {/* المستوى الدراسي */}
      <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
        <Label htmlFor="level" className="text-base font-bold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-kku-green dark:text-primary" />
          {language === 'ar' ? 'المستوى الدراسي *' : 'Academic Level *'}
        </Label>
        <Select value={formData.level} onValueChange={(value) => {
          setFormData({ ...formData, level: value });
          setErrors({ ...errors, level: '' });
        }}>
          <SelectTrigger className={`mt-2 h-12 ${errors.level ? 'border-red-500' : 'border-2'}`}>
            <SelectValue placeholder={language === 'ar' ? 'اختر المستوى' : 'Select Level'} />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.level && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.level}
          </p>
        )}
      </div>

      {/* المعدل التراكمي (اختياري) */}
      <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <Label htmlFor="gpa" className="text-base font-bold flex items-center gap-2">
          <Award className="h-4 w-4 text-kku-gold" />
          {language === 'ar' ? 'المعدل التراكمي (اختياري)' : 'GPA (Optional)'}
        </Label>
        <Input
          id="gpa"
          type="number"
          step="0.01"
          min="0"
          max="5"
          value={formData.gpa}
          onChange={(e) => {
            setFormData({ ...formData, gpa: e.target.value });
            setErrors({ ...errors, gpa: '' });
          }}
          className={`mt-2 h-12 ${errors.gpa ? 'border-red-500' : 'border-2'}`}
          placeholder={language === 'ar' ? 'اتركه فارغاً إذا كنت في السنة الأولى' : 'Leave empty if first year'}
        />
        {errors.gpa && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.gpa}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'ar' 
            ? '💡 سيتم حساب المعدل تلقائياً بعد نهاية كل فصل' 
            : '💡 GPA will be calculated automatically after each semester'}
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen relative overflow-hidden -mt-8 -mx-4 px-4">
      {/* خلفية رؤية 2030 */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1669407938045-152068ed42e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXNpb24lMjAyMDMwJTIwc2F1ZGklMjBhcmFiaWF8ZW58MXx8fHwxNzYyOTg1Nzc5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Vision 2030"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/70 via-gray-700/60 to-emerald-800/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
      </div>

      {/* شعار رؤية 2030 */}
      <div className="absolute bottom-8 left-8 opacity-20 hover:opacity-50 transition-opacity duration-300 hidden md:block">
        <div className="flex items-center gap-3 text-white animate-fade-in">
          <TrendingUp className="h-20 w-20 text-kku-gold drop-shadow-2xl" />
          <div>
            <p className="text-3xl font-bold drop-shadow-lg">
              {language === 'ar' ? 'رؤية 2030' : 'Vision 2030'}
            </p>
            <p className="text-sm text-kku-gold">
              {language === 'ar' ? 'نحو مستقبل أفضل' : 'Towards a Better Future'}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 md:py-16">
        <div className="w-full max-w-2xl animate-fade-up" style={{ animationDuration: '0.7s' }}>
          {/* رأس الصفحة */}
          <div className="text-center mb-8 text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border-2 border-kku-gold/50 shadow-2xl animate-pulse">
                <UserPlus className="h-16 w-16 text-kku-gold drop-shadow-lg" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-2">
              {language === 'ar' ? '🎓 جامعة الملك خالد' : '🎓 King Khalid University'}
            </p>
            
            <p className="text-sm text-kku-gold">
              {language === 'ar' ? 'كلية إدارة الأعمال - قسم نظم المعلومات الإدارية' : 'College of Business - MIS Department'}
            </p>
          </div>

          {/* بطاقة التسجيل */}
          <Card className="backdrop-blur-xl bg-white/10 border-2 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            {/* شريط ذهبي للعنوان */}
            <div className="bg-gradient-to-r from-kku-gold via-yellow-500 to-kku-gold p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <div className="relative flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-kku-green" />
                  <h2 className="text-xl md:text-2xl font-bold text-kku-green">
                    {language === 'ar' ? '📝 بيانات التسجيل' : '📝 Registration Data'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={handleSignUp} className="space-y-5">
                {/* ✅ 1️⃣ اختيار الدور في البداية */}
                <div className="bg-gradient-to-r from-kku-green/10 to-kku-gold/10 border-2 border-kku-green/30 rounded-xl p-5 animate-fade-in">
                  <Label htmlFor="role" className="text-lg font-bold flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-kku-green dark:text-primary" />
                    {language === 'ar' ? 'نوع الحساب *' : 'Account Type *'}
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      role: value,
                      // إعادة تعيين الحقول الخاصة بالطالب
                      studentId: '',
                      major: '',
                      level: '',
                      gpa: ''
                    });
                    setErrors({});
                  }}>
                    <SelectTrigger className="h-14 border-2 bg-white dark:bg-background font-bold text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-3 py-2">
                            {role.icon}
                            <div className="text-left">
                              <p className="font-bold">{role.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* رسالة توضيحية */}
                  <div className="mt-3 p-3 bg-white/50 dark:bg-background/50 rounded-lg">
                    <p className="text-sm">
                      {formData.role === 'student' ? (
                        language === 'ar' 
                          ? '📚 ستحتاج لإدخال الرقم الجامعي، التخصص، والمستوى الدراسي' 
                          : '📚 You will need to enter Student ID, Major, and Academic Level'
                      ) : formData.role === 'supervisor' ? (
                        language === 'ar' 
                          ? '✅ لن تحتاج لإدخال بيانات الطالب الأكاديمية' 
                          : '✅ You won\'t need to enter student academic data'
                      ) : (
                        language === 'ar' 
                          ? '⚙️ لن تحتاج لإدخال بيانات الطالب الأكاديمية' 
                          : '⚙️ You won\'t need to enter student academic data'
                      )}
                    </p>
                  </div>
                </div>

                {/* ✅ 2️⃣ الحقول المشتركة لجميع الأدوار */}
                {renderCommonFields()}

                {/* ✅ 3️⃣ الحقول الخاصة بالطلاب فقط */}
                {formData.role === 'student' && renderStudentFields()}

                {/* زر إنشاء الحساب */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-kku-green to-emerald-700 hover:from-kku-green/90 hover:to-emerald-700/90 shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner h-5 w-5" />
                        {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
                      </>
                    )}
                  </Button>
                </div>

                {/* تنبيه حساب يتيم */}
                {/* رابط تسجيل الدخول */}
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-sm text-white">
                    {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                    {' '}
                    <button
                      type="button"
                      onClick={() => setCurrentPage('login')}
                      className="text-kku-gold hover:underline font-bold"
                    >
                      {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </Card>

          {/* مساعدة */}
          <div className="mt-6 text-center text-sm space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-white/80">
              {language === 'ar' ? 'تحتاج مساعدة؟' : 'Need help?'}
              {' '}
              <button
                type="button"
                onClick={() => setCurrentPage('contact')}
                className="text-kku-gold hover:underline font-bold"
              >
                {language === 'ar' ? 'اتصل بالدعم الفني' : 'Contact Support'}
              </button>
            </p>
            <p className="text-xs bg-orange-500/20 border border-orange-400/50 rounded-lg px-4 py-2 inline-block text-white">
              {language === 'ar' 
                ? '⚠️ مشكلة "البريد مسجل مسبقاً"؟ ' 
                : '⚠️ "Email registered" error? '}
              <button
                type="button"
                onClick={() => setCurrentPage('cleanup')}
                className="text-kku-gold hover:underline font-bold"
              >
                {language === 'ar' ? 'استخدم أداة التنظيف' : 'Use Cleanup Tool'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};