import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Shield, 
  Eye, 
  Lock,
  Users,
  Database,
  Globe,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  Sun,
  Moon,
  FileCheck,
  User,
  Building2,
  ArrowRight
} from 'lucide-react';
import { KKULogo } from '../KKULogo';
import { toast } from 'sonner@2.0.3';

export const AccessAgreementPage: React.FC = () => {
  const { language, setLanguage, theme, setTheme, setCurrentPage, setHasAcceptedAgreement } = useApp();
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ دالة تبديل اللغة
  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    console.log('🌐 Changing language from', language, 'to', newLang);
    setLanguage(newLang);
    toast.success(
      newLang === 'ar' 
        ? '✅ تم تغيير اللغة إلى العربية' 
        : '✅ Language changed to English'
    );
  };

  // ✅ دالة تبديل الثيم
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 Changing theme from', theme, 'to', newTheme);
    setTheme(newTheme);
    toast.success(
      language === 'ar'
        ? `✅ تم تغيير المظهر إلى ${newTheme === 'dark' ? 'الليلي' : 'النهاري'}`
        : `✅ Theme changed to ${newTheme}`
    );
  };

  const agreementTermsAr = [
    {
      icon: <Shield className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'الاستخدام الأكاديمي',
      text: 'استخدام هذا النظام للأغراض الأكاديمية فقط والمتعلقة بتسجيل المقررات الدراسية.'
    },
    {
      icon: <Lock className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'سرية البيانات',
      text: 'عدم مشاركة بيانات الدخول الخاصة بي (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر.'
    },
    {
      icon: <Users className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'الخصوصية',
      text: 'المحافظة على سرية المعلومات الشخصية والأكاديمية الخاصة بي وبزملائي الطلاب.'
    },
    {
      icon: <Database className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'الالتزام باللوائح',
      text: 'الالتزام بالأنظمة واللوائح الأكاديمية المعمول بها في جامعة الملك خالد.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'عدم الوصول غير المصرح',
      text: 'عدم محاولة الوصول غير المصرح به إلى أي بيانات أو معلومات لا تخصني.'
    },
    {
      icon: <Award className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'المسؤولية الكاملة',
      text: 'تحمل المسؤولية الكاملة عن أي استخدام لحسابي الشخصي في هذا النظام.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'الإبلاغ الفوري',
      text: 'الإبلاغ الفوري عن أي نشاط مشبوه أو محاولة اختراق للنظام.'
    }
  ];

  const agreementTermsEn = [
    {
      icon: <Shield className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Academic Use',
      text: 'To use this system solely for academic purposes related to course registration.'
    },
    {
      icon: <Lock className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Data Confidentiality',
      text: 'Not to share my login credentials (email and password) with anyone else.'
    },
    {
      icon: <Users className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Privacy',
      text: 'To maintain the confidentiality of personal and academic information of myself and fellow students.'
    },
    {
      icon: <Database className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Compliance',
      text: 'To comply with all academic regulations and policies in effect at King Khalid University.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'No Unauthorized Access',
      text: 'Not to attempt unauthorized access to any data or information that does not belong to me.'
    },
    {
      icon: <Award className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Full Responsibility',
      text: 'To take full responsibility for any use of my personal account in this system.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />,
      title: 'Immediate Reporting',
      text: 'To immediately report any suspicious activity or attempted breach of the system.'
    }
  ];

  const terms = language === 'ar' ? agreementTermsAr : agreementTermsEn;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = language === 'ar' 
        ? 'الاسم الكامل مطلوب' 
        : 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = language === 'ar' 
        ? 'يجب أن يكون الاسم 3 أحرف على الأقل' 
        : 'Name must be at least 3 characters';
    }

    if (!agreed) {
      newErrors.agreed = language === 'ar' 
        ? 'يجب الموافقة على التعهد للمتابعة' 
        : 'You must agree to the pledge to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAgree = async () => {
    if (!validateForm()) {
      toast.error(
        language === 'ar' 
          ? 'يرجى تصحيح الأخطاء في النموذج' 
          : 'Please fix the errors in the form'
      );
      return;
    }

    setLoading(true);
    console.log('📝 [Agreement] Starting agreement process...');
    console.log('👤 Full Name:', fullName);
    console.log('✅ Agreed:', agreed);

    try {
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      const ipAddress = 'N/A';
      
      const agreementData = {
        fullName,
        userAgent,
        ipAddress,
        timestamp,
      };

      // حفظ في localStorage
      localStorage.setItem('agreementAccepted', 'true');
      localStorage.setItem('agreementData', JSON.stringify(agreementData));
      
      console.log('✅ [Agreement] Saved to localStorage:', agreementData);

      // ✅ تحديث الحالة
      setHasAcceptedAgreement(true);

      toast.success(
        language === 'ar' 
          ? '✅ تم قبول التعهد بنجاح! جاري الانتقال لصفحة تسجيل الدخول...' 
          : '✅ Agreement accepted successfully! Redirecting to login...'
      );

      console.log('🔄 [Agreement] Redirecting to login page...');

      // ✅ الانتقال لصفحة تسجيل الدخول
      setTimeout(() => {
        console.log('✅ [Agreement] Navigating to login page NOW');
        setCurrentPage('login');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error in agreement process:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ، يرجى المحاولة مرة أخرى' 
          : 'An error occurred, please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ✅ خلفية جامعة الملك خالد */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1700085060165-1ac17cf08286?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzYXVkaSUyMGFyYWJpYXxlbnwxfHx8fDE3NjQ3OTMzNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="King Khalid University"
          className="w-full h-full object-cover"
        />
        {/* طبقة تعتيم */}
        <div 
          className="absolute inset-0" 
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, rgba(13, 36, 22, 0.95) 0%, rgba(24, 74, 44, 0.92) 50%, rgba(13, 36, 22, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(24, 74, 44, 0.92) 0%, rgba(42, 112, 67, 0.88) 25%, rgba(212, 175, 55, 0.85) 50%, rgba(42, 112, 67, 0.88) 75%, rgba(24, 74, 44, 0.92) 100%)',
          }}
        ></div>
      </div>

      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-10 z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#184A2C] rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* ✅ أزرار التبديل المحسنة */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="bg-white/95 backdrop-blur-md hover:bg-white border-2 border-[#D4AF37] text-[#184A2C] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Globe className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{language === 'ar' ? 'English' : 'عربي'}</span>
          <span className="sm:hidden">{language === 'ar' ? 'EN' : 'AR'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="bg-white/95 backdrop-blur-md hover:bg-white border-2 border-[#D4AF37] text-[#184A2C] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* الشعار والعنوان */}
          <div className="text-center mb-8 md:mb-12">
            {/* شعار جامعة الملك خالد */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-4 shadow-2xl">
                <KKULogo className="w-full h-full" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-2">
              {language === 'ar' 
                ? 'كلية إدارة الأعمال - قسم المعلوماتية الإدارية' 
                : 'College of Business Administration - Department of Management Information Systems'}
            </p>

            <div className="flex items-center justify-center gap-3 text-white/80 text-sm md:text-base">
              <Building2 className="w-5 h-5" />
              <span>
                {language === 'ar' 
                  ? 'نظام تسجيل المقررات الإلكتروني' 
                  : 'Electronic Course Registration System'}
              </span>
            </div>
          </div>

          {/* بطاقة التعهد */}
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 shadow-2xl border-2 border-[#D4AF37]">
            <CardHeader className="text-center pb-4 border-b-2 border-[#D4AF37]/30">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-[#184A2C] to-[#2a7043] p-4 rounded-full">
                  <FileCheck className="w-12 h-12 text-[#D4AF37]" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl text-[#184A2C] dark:text-white">
                {language === 'ar' ? '📜 تعهد استخدام النظام' : '📜 System Usage Agreement'}
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                {language === 'ar' 
                  ? 'يرجى قراءة التعهد التالي بعناية والموافقة عليه قبل استخدام النظام' 
                  : 'Please read the following agreement carefully and accept it before using the system'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {/* نموذج الاسم */}
              <div className="mb-6 bg-gradient-to-r from-[#184A2C]/5 to-[#D4AF37]/5 p-6 rounded-xl border border-[#D4AF37]/30">
                <Label htmlFor="fullName" className="text-lg font-semibold text-[#184A2C] dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: '' });
                    }
                  }}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل (مثال: أحمد محمد الغامدي)' : 'Enter your full name (e.g., Ahmed Mohammed Al-Ghamdi)'}
                  className={`text-lg py-6 border-2 ${errors.fullName ? 'border-red-500' : 'border-[#184A2C]/30 focus:border-[#D4AF37]'}`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* شروط التعهد */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#184A2C] dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                  {language === 'ar' ? 'أتعهد بما يلي:' : 'I pledge to:'}
                </h3>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {terms.map((term, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-gradient-to-r from-[#184A2C]/5 to-transparent rounded-xl hover:from-[#D4AF37]/10 transition-all duration-300 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50"
                    >
                      <div className="mt-1">{term.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-[#184A2C] dark:text-white mb-1">
                          {index + 1}. {term.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {term.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* checkbox الموافقة */}
              <div className="mb-6 p-6 bg-gradient-to-r from-[#D4AF37]/10 to-[#184A2C]/10 rounded-xl border-2 border-[#D4AF37]/50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(checked) => {
                      setAgreed(checked as boolean);
                      if (errors.agreed) {
                        setErrors({ ...errors, agreed: '' });
                      }
                    }}
                    className={`mt-1 w-6 h-6 ${errors.agreed ? 'border-red-500' : 'border-[#184A2C]'}`}
                  />
                  <label
                    htmlFor="agree"
                    className="text-base font-semibold text-[#184A2C] dark:text-white cursor-pointer leading-relaxed"
                  >
                    {language === 'ar'
                      ? 'أوافق على جميع شروط الاستخدام وأتعهد بالالتزام بها'
                      : 'I agree to all terms of use and pledge to abide by them'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                {errors.agreed && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 mr-9">
                    <AlertCircle className="w-4 h-4" />
                    {errors.agreed}
                  </p>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAgree}
                  disabled={loading || !fullName.trim() || !agreed}
                  className="flex-1 py-6 text-lg font-bold bg-gradient-to-r from-[#184A2C] to-[#2a7043] hover:from-[#2a7043] hover:to-[#184A2C] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {language === 'ar' ? 'أوافق وأتعهد' : 'I Agree and Pledge'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* ملاحظة قانونية */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 text-center leading-relaxed">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {language === 'ar'
                    ? 'بموافقتك على هذا التعهد، فإنك تقر بأنك قرأت جميع الشروط وفهمتها وتوافق على الالتزام بها. أي مخالفة قد تعرضك للمساءلة الأكاديمية.'
                    : 'By agreeing to this pledge, you acknowledge that you have read, understood, and agree to abide by all terms. Any violation may subject you to academic accountability.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* تذييل */}
          <div className="mt-8 text-center text-white/80 text-sm">
            <p className="flex items-center justify-center gap-2">
              <GraduationCap className="w-5 h-5" />
              {language === 'ar'
                ? '© 2025 جامعة الملك خالد - جميع الحقوق محفوظة'
                : '© 2025 King Khalid University - All Rights Reserved'}
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #184A2C 0%, #D4AF37 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #D4AF37 0%, #184A2C 100%);
        }
      ` }} />
    </div>
  );
};