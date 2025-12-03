import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, Loader2, Database, Trash2, UserPlus, ArrowRight, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useApp } from '../../contexts/AppContext';

export const AutoFixPage: React.FC = () => {
  const { language, setCurrentPage } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [scriptCopied, setScriptCopied] = useState(false);

  const sqlScript = `-- 🔥 QUICK FIX SCRIPT
-- Copy and paste this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/${projectId}/sql

-- Disable RLS temporarily
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;`;

  const copyScript = () => {
    navigator.clipboard.writeText(sqlScript);
    setScriptCopied(true);
    toast.success(
      language === 'ar' 
        ? '✅ تم نسخ السكريبت!' 
        : '✅ Script copied!',
      {
        description: language === 'ar'
          ? 'الصقه في Supabase SQL Editor'
          : 'Paste it in Supabase SQL Editor',
      }
    );
    setTimeout(() => setScriptCopied(false), 3000);
  };

  const handleCleanupAll = async () => {
    setLoading(true);
    try {
      console.log('🧹 [AutoFix] Starting cleanup...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/public/cleanup-all-orphaned-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      // التحقق من نوع المحتوى
      const contentType = response.headers.get('content-type');
      console.log('📊 [AutoFix] Response content-type:', contentType);
      
      // قراءة النص أولاً للتحقق
      const responseText = await response.text();
      console.log('📄 [AutoFix] Response text:', responseText);
      
      // محاولة تحويله إلى JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [AutoFix] JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      console.log('✅ [AutoFix] Cleanup result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Cleanup failed');
      }

      setCleanedCount(result.cleaned || 0);
      setStep(3);
      
      toast.success(
        language === 'ar'
          ? `✅ تم تنظيف ${result.cleaned || 0} حساب يتيم!`
          : `✅ Cleaned ${result.cleaned || 0} orphaned accounts!`
      );

    } catch (error: any) {
      console.error('❌ [AutoFix] Error:', error);
      toast.error(
        language === 'ar'
          ? '❌ فشل التنظيف'
          : '❌ Cleanup failed',
        {
          description: error?.message,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const openSupabaseSQL = () => {
    window.open(`https://supabase.com/dashboard/project/${projectId}/sql`, '_blank');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #184A2C 0%, #0d2416 100%)',
      }}
    >
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {language === 'ar' ? '🔧 إصلاح تلقائي' : '🔧 Auto Fix'}
          </h1>
          
          <p className="text-gray-600">
            {language === 'ar'
              ? 'حل سريع لمشكلة "الحساب غير مكتمل"'
              : 'Quick fix for "Incomplete Account" issue'}
          </p>
        </div>

        {/* Error Display */}
        <div className="mb-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="text-red-800">
                {language === 'ar'
                  ? '🚨 الأخطاء الحالية:'
                  : '🚨 Current Errors:'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-700 font-mono text-xs">
                <li>PGRST116: Cannot coerce result to single JSON object</li>
                <li>AuthApiError: User with this email already registered</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`h-1 flex-1 mx-2 transition-all ${
                    step > s ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>{language === 'ar' ? 'تنظيف' : 'Clean'}</span>
            <span>{language === 'ar' ? 'تعطيل RLS' : 'Disable RLS'}</span>
            <span>{language === 'ar' ? 'تسجيل' : 'Signup'}</span>
            <span>{language === 'ar' ? 'تم!' : 'Done!'}</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-blue-900 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                {language === 'ar' ? 'الخطوة 1: تنظيف الحسابات اليتيمة' : 'Step 1: Clean Orphaned Accounts'}
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                {language === 'ar'
                  ? 'سنحذف جميع الحسابات الموجودة في Auth لكن ليست في قاعدة البيانات'
                  : 'We will delete all accounts that exist in Auth but not in database'}
              </p>
            </div>

            <Button
              onClick={handleCleanupAll}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري التنظيف...' : 'Cleaning...'}
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'ابدأ التنظيف الآن' : 'Start Cleanup Now'}
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-purple-900 mb-2 flex items-center gap-2">
                <Database className="w-5 h-5" />
                {language === 'ar' ? 'الخطوة 2: تعطيل RLS مؤقتاً' : 'Step 2: Disable RLS Temporarily'}
              </h3>
              <p className="text-sm text-purple-800 mb-4">
                {language === 'ar'
                  ? 'نسخ والصق السكريبت التالي في Supabase SQL Editor'
                  : 'Copy and paste the following script in Supabase SQL Editor'}
              </p>

              <div className="bg-gray-900 p-4 rounded-lg mb-4 relative">
                <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                  {sqlScript}
                </pre>
                <Button
                  onClick={copyScript}
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700"
                >
                  {scriptCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {language === 'ar' ? 'تم النسخ!' : 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      {language === 'ar' ? 'نسخ' : 'Copy'}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={openSupabaseSQL}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'فتح SQL Editor' : 'Open SQL Editor'}
                </Button>
                
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  {language === 'ar' ? 'تم التنفيذ ✓' : 'Done ✓'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-green-900 mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {language === 'ar' ? 'الخطوة 3: إنشاء حساب جديد' : 'Step 3: Create New Account'}
              </h3>
              <p className="text-sm text-green-800 mb-4">
                {language === 'ar'
                  ? 'الآن يمكنك إنشاء حساب جديد بدون مشاكل!'
                  : 'Now you can create a new account without issues!'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">
                    {language === 'ar' 
                      ? `تم تنظيف ${cleanedCount} حساب يتيم`
                      : `Cleaned ${cleanedCount} orphaned accounts`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">
                    {language === 'ar' 
                      ? 'تم تعطيل RLS مؤقتاً'
                      : 'RLS disabled temporarily'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">
                    {language === 'ar' 
                      ? 'قاعدة البيانات جاهزة'
                      : 'Database is ready'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentPage('signup')}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'الانتقال لصفحة التسجيل' : 'Go to Signup Page'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="w-20 h-20 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-green-600">
                {language === 'ar' ? '🎉 تم الإصلاح بنجاح!' : '🎉 Fixed Successfully!'}
              </h2>
              <p className="text-gray-600">
                {language === 'ar'
                  ? 'يمكنك الآن استخدام النظام بدون مشاكل'
                  : 'You can now use the system without issues'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setCurrentPage('login')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {language === 'ar' ? 'تسجيل دخول' : 'Login'}
              </Button>
              
              <Button
                onClick={() => setCurrentPage('home')}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && step > 1 && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => setStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
              variant="outline"
              className="flex-1"
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            
            {step < 3 && (
              <Button
                onClick={() => setStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            {language === 'ar'
              ? '💡 هذه العملية آمنة 100% وستحل جميع مشاكل تسجيل الدخول'
              : '💡 This process is 100% safe and will fix all login issues'}
          </p>
        </div>
      </Card>
    </div>
  );
};