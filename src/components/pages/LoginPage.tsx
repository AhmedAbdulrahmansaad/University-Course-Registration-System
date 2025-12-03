import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GraduationCap, Lock, Eye, EyeOff, Mail, Loader2, Shield, LogIn, UserPlus, Sparkles, BookOpen, Globe, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { KKULogoSVG } from '../KKULogoSVG';

export const LoginPage: React.FC = () => {
  const { language, setLanguage, theme, setTheme, setCurrentPage, setIsLoggedIn, setUserInfo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من المدخلات
      if (!email || !password) {
        toast.error(
          language === 'ar' 
            ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
            : 'Please enter email and password'
        );
        setLoading(false);
        return;
      }

      console.log('🔐 [Login] Attempting login for:', email);

      // تسجيل الدخول عبر Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError || !authData?.user || !authData?.session) {
        console.error('❌ [Login] Auth error:', authError?.message);
        
        toast.error(
          language === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
          {
            description: language === 'ar' 
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
              : 'Invalid email or password',
            duration: 4000,
          }
        );
        setLoading(false);
        return;
      }

      console.log('✅ [Login] Auth successful, fetching user data...');

      // جلب بيانات المستخدم من قاعدة البيانات
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          students(*),
          supervisors(*)
        `)
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        console.error('❌ [Login] User data error:', userError);
        
        // تسجيل الخروج من Auth
        await supabase.auth.signOut();
        
        toast.error(
          language === 'ar' ? 'خطأ في جلب البيانات' : 'Error fetching data',
          {
            description: language === 'ar' 
              ? 'فشل في جلب بيانات المستخدم من قاعدة البيانات' 
              : 'Failed to fetch user data from database',
          }
        );
        setLoading(false);
        return;
      }

      console.log('✅ [Login] User data fetched successfully:', userData);

      // إعداد بيانات المستخدم
      const userInfo = {
        id: userData.id,
        authId: userData.auth_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        studentId: userData.student_id,
        avatar: userData.avatar_url,
        phone: userData.phone,
        language: userData.language || 'ar',
      };

      // إضافة بيانات الطالب أو المشرف
      if (userData.role === 'student' && userData.students?.[0]) {
        const studentData = userData.students[0];
        userInfo.major = studentData.major;
        userInfo.level = studentData.level;
        userInfo.gpa = studentData.gpa;
        userInfo.totalHours = studentData.total_hours || 0;
        userInfo.status = studentData.status || 'active';
        userInfo.advisorId = studentData.advisor_id;
      } else if ((userData.role === 'supervisor' || userData.role === 'advisor') && userData.supervisors?.[0]) {
        const supervisorData = userData.supervisors[0];
        userInfo.department = supervisorData.department;
        userInfo.officeLocation = supervisorData.office_location;
        userInfo.officeHours = supervisorData.office_hours;
      }

      console.log('✅ [Login] Complete user info:', userInfo);

      // ✅ التحقق من صحة userInfo قبل الحفظ
      if (!userInfo || !userInfo.id || !userInfo.email) {
        console.error('❌ [Login] Invalid userInfo before saving:', userInfo);
        toast.error(
          language === 'ar' ? 'خطأ في بيانات المستخدم' : 'Invalid user data',
          {
            description: language === 'ar'
              ? 'فشل في جلب بيانات المستخدم الكاملة'
              : 'Failed to fetch complete user data',
          }
        );
        setLoading(false);
        return;
      }

      // ✅ التحقق من أن userInfo.id هو UUID صحيح
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userInfo.id)) {
        console.error('❌ [Login] Invalid user ID format:', userInfo.id);
        console.error('❌ [Login] Full userInfo:', userInfo);
        toast.error(
          language === 'ar' ? 'خطأ في معرف المستخدم' : 'Invalid user ID',
          {
            description: language === 'ar'
              ? `معرف المستخدم غير صحيح: ${userInfo.id}`
              : `Invalid user ID: ${userInfo.id}`,
          }
        );
        setLoading(false);
        return;
      }

      console.log('✅ [Login] User ID validation passed:', userInfo.id);

      // حفظ البيانات
      localStorage.setItem('accessToken', authData.session.access_token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      setUserInfo(userInfo);
      setIsLoggedIn(true);

      // عرض رسالة نجاح
      toast.success(
        language === 'ar' ? `مرحباً ${userInfo.name}! 🎉` : `Welcome ${userInfo.name}! 🎉`,
        {
          description: language === 'ar' 
            ? 'تم تسجيل الدخول بنجاح' 
            : 'Login successful',
          duration: 3000,
        }
      );

      // إرسال إشعار للطالب
      if (userInfo.role === 'student') {
        try {
          await supabase.from('notifications').insert({
            user_id: userInfo.id,
            type: 'info',
            title: language === 'ar' ? 'تسجيل دخول جديد' : 'New Login',
            message: language === 'ar' 
              ? `مرحباً ${userInfo.name}، تم تسجيل دخولك بنجاح إلى نظام تسجيل المقررات.` 
              : `Welcome ${userInfo.name}, you have successfully logged into the course registration system.`,
            is_read: false,
          });
          console.log('✅ [Login] Login notification sent');
        } catch (error) {
          console.log('⚠️ [Login] Could not send notification:', error);
        }
      }

      // التوجيه حسب الدور
      setTimeout(() => {
        if (userInfo.role === 'student') {
          setCurrentPage('studentDashboard');
        } else if (userInfo.role === 'supervisor' || userInfo.role === 'advisor') {
          setCurrentPage('supervisorDashboard');
        } else if (userInfo.role === 'admin') {
          setCurrentPage('adminDashboard');
        } else {
          setCurrentPage('home');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ [Login] Unexpected error:', error);
      toast.error(
        language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
        {
          description: error.message || (language === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again'),
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #0a1628 0%, #184A2C 50%, #0a1628 100%)'
          : 'linear-gradient(135deg, #184A2C 0%, #2a7043 20%, #D4AF37 50%, #2a7043 80%, #184A2C 100%)',
      }}
    >
      {/* خلفية رؤية 2030 المتحركة */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[40rem] font-bold text-white select-none">
            2030
          </div>
        </div>
      </div>

      {/* أشكال متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#184A2C] rounded-full blur-3xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* أزرار التبديل */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="bg-white/90 backdrop-blur-sm hover:bg-white border-[#D4AF37] text-[#184A2C]"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'EN' : 'AR'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="bg-white/90 backdrop-blur-sm hover:bg-white border-[#D4AF37] text-[#184A2C]"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>

      {/* بطاقة تسجيل الدخول */}
      <Card className="w-full max-w-md backdrop-blur-md bg-white/95 dark:bg-gray-900/95 shadow-2xl border-2 border-[#D4AF37] relative z-10">
        <CardHeader className="text-center pb-4 space-y-4">
          {/* شعار جامعة الملك خالد */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#184A2C] to-[#2a7043] rounded-full p-4 shadow-xl">
              <KKULogoSVG className="w-full h-full" />
            </div>
          </div>

          <CardTitle className="text-2xl md:text-3xl font-bold text-[#184A2C] dark:text-white">
            {language === 'ar' ? '🎓 جامعة الملك خالد' : '🎓 King Khalid University'}
          </CardTitle>
          
          <CardDescription className="text-base text-gray-600 dark:text-gray-400">
            {language === 'ar' 
              ? 'نظام تسجيل المقررات الإلكتروني' 
              : 'Electronic Course Registration System'}
          </CardDescription>

          {/* شعار رؤية 2030 */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#184A2C]/10 to-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-bold text-[#184A2C] dark:text-white">
              {language === 'ar' ? 'رؤية المملكة 2030' : 'Saudi Vision 2030'}
            </span>
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* حقل البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#184A2C] dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                {language === 'ar' ? 'البريد الجامعي' : 'University Email'}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'ar' ? 'your.name@kku.edu.sa' : 'your.name@kku.edu.sa'}
                  className="pr-10 border-2 border-[#184A2C]/30 focus:border-[#D4AF37] text-base py-6"
                  dir="ltr"
                  required
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#184A2C] dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'ar' ? '••••••••' : '••••••••'}
                  className="pr-10 border-2 border-[#184A2C]/30 focus:border-[#D4AF37] text-base py-6"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#184A2C]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-[#184A2C] to-[#2a7043] hover:from-[#2a7043] hover:to-[#184A2C] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </>
              )}
            </Button>

            {/* رابط إنشاء حساب */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentPage('signup')}
                className="w-full border-2 border-[#D4AF37] text-[#184A2C] dark:text-white hover:bg-[#D4AF37] hover:text-white transition-all duration-300"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
              </Button>
            </div>
          </form>

          {/* معلومات إضافية */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-[#D4AF37]/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {language === 'ar'
                  ? 'استخدم بريدك الجامعي (@kku.edu.sa) وكلمة المرور للدخول. جميع البيانات محمية ومشفرة.'
                  : 'Use your university email (@kku.edu.sa) and password to login. All data is protected and encrypted.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تذييل */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-white/80 text-sm flex items-center justify-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {language === 'ar'
            ? '© 2025 جامعة الملك خالد - جميع الحقوق محفوظة'
            : '© 2025 King Khalid University - All Rights Reserved'}
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};