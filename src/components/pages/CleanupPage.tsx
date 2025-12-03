import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertCircle, Trash2, CheckCircle, Loader2, ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useApp } from '../../contexts/AppContext';

export const CleanupPage: React.FC = () => {
  const { language, setCurrentPage } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cleaned, setCleaned] = useState(false);

  const handleCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(
        language === 'ar' 
          ? 'يرجى إدخال البريد الإلكتروني' 
          : 'Please enter your email'
      );
      return;
    }

    if (!email.endsWith('@kku.edu.sa')) {
      toast.error(
        language === 'ar'
          ? 'يجب استخدام بريد جامعي (@kku.edu.sa)'
          : 'Must use KKU email (@kku.edu.sa)'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🧹 [Cleanup] Sending cleanup request for:', email);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/public/cleanup-orphaned-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [Cleanup] Server error:', result);
        toast.error(
          language === 'ar'
            ? `❌ فشل التنظيف: ${result.error || 'خطأ غير معروف'}`
            : `❌ Cleanup failed: ${result.error || 'Unknown error'}`,
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      console.log('✅ [Cleanup] Response:', result);

      if (result.cleaned) {
        setCleaned(true);
        toast.success(
          language === 'ar'
            ? '✅ تم تنظيف الحساب بنجاح!'
            : '✅ Account cleaned successfully!',
          {
            description: language === 'ar'
              ? 'يمكنك الآن إنشاء حساب جديد بنفس البريد الإلكتروني'
              : 'You can now create a new account with the same email',
            duration: 5000,
          }
        );
        
        setTimeout(() => {
          setCurrentPage('signup');
        }, 3000);
      } else {
        toast.info(
          language === 'ar'
            ? 'ℹ️ الحساب غير موجود أو مكتمل بالفعل'
            : 'ℹ️ Account not found or already complete',
          {
            description: language === 'ar'
              ? 'يمكنك المتابعة لإنشاء حساب جديد أو تسجيل الدخول'
              : 'You can proceed to create a new account or login',
            duration: 5000,
          }
        );
      }

    } catch (error: any) {
      console.error('❌ [Cleanup] Unexpected error:', error);
      toast.error(
        language === 'ar'
          ? '❌ حدث خطأ أثناء التنظيف'
          : '❌ An error occurred during cleanup',
        {
          description: error?.message || 'Unknown error',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #184A2C 0%, #0d2416 100%)',
      }}
    >
      <Card className="w-full max-w-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-orange-100">
              <Trash2 className="w-12 h-12 text-orange-600" />
            </div>
          </div>
          
          <h1 className="mb-2 text-orange-600">
            {language === 'ar' ? 'تنظيف الحساب' : 'Account Cleanup'}
          </h1>
          
          <p className="text-gray-600">
            {language === 'ar'
              ? 'إصلاح مشكلة الحساب غير المكتمل'
              : 'Fix incomplete account issue'}
          </p>
        </div>

        {!cleaned ? (
          <>
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="text-orange-800">
                    {language === 'ar'
                      ? '⚠️ استخدم هذه الصفحة إذا:'
                      : '⚠️ Use this page if:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-orange-700">
                    <li>
                      {language === 'ar'
                        ? 'حاولت التسجيل وظهرت رسالة "البريد مسجل مسبقاً"'
                        : 'You tried to signup and got "email already registered"'}
                    </li>
                    <li>
                      {language === 'ar'
                        ? 'حاولت تسجيل الدخول وظهرت رسالة "بيانات المستخدم غير موجودة"'
                        : 'You tried to login and got "user data not found"'}
                    </li>
                    <li>
                      {language === 'ar'
                        ? 'رأيت خطأ PGRST116 في الكونسول'
                        : 'You saw PGRST116 error in console'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleCleanup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {language === 'ar' ? 'البريد الجامعي' : 'University Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@kku.edu.sa"
                  required
                  disabled={loading}
                  className="text-left"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'أدخل البريد الذي حاولت التسجيل به'
                    : 'Enter the email you tried to signup with'}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري التنظيف...' : 'Cleaning...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تنظيف الحساب' : 'Clean Account'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t space-y-3">
              <p className="text-sm text-gray-600 text-center">
                {language === 'ar'
                  ? 'أو يمكنك:'
                  : 'Or you can:'}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage('signup')}
                  disabled={loading}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage('login')}
                  disabled={loading}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {language === 'ar' ? 'تسجيل دخول' : 'Login'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-green-600">
                {language === 'ar' ? '✅ تم التنظيف بنجاح!' : '✅ Cleaned Successfully!'}
              </h2>
              <p className="text-gray-600">
                {language === 'ar'
                  ? 'يمكنك الآن إنشاء حساب جديد بنفس البريد الإلكتروني'
                  : 'You can now create a new account with the same email'}
              </p>
            </div>

            <Button
              onClick={() => setCurrentPage('signup')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {language === 'ar' ? 'الانتقال لصفحة التسجيل' : 'Go to Signup Page'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            {language === 'ar'
              ? '💡 هذا الإجراء آمن - يحذف فقط الحسابات غير المكتملة من نظام المصادقة'
              : '💡 This is safe - it only deletes incomplete accounts from the auth system'}
          </p>
        </div>
      </Card>
    </div>
  );
};
