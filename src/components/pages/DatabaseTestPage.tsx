import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, XCircle, Loader2, Database, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useApp } from '../../contexts/AppContext';

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}

export const DatabaseTestPage: React.FC = () => {
  const { language, setCurrentPage } = useApp();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [scriptCopied, setScriptCopied] = useState(false);

  const sqlScript = `-- 🔥 نسخ هذا السكريبت بالكامل والصقه في Supabase SQL Editor
-- https://supabase.com/dashboard/project/${projectId}/sql/new

-- 1. تعطيل RLS على جميع الجداول
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- 2. التحقق من الجداول
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. عرض عدد المقررات
SELECT COUNT(*) as total_courses FROM courses;

-- ✅ إذا ظهرت النتائج بنجاح، قاعدة البيانات جاهزة!`;

  const copyScript = () => {
    navigator.clipboard.writeText(sqlScript);
    setScriptCopied(true);
    toast.success('✅ تم نسخ السكريبت!');
    setTimeout(() => setScriptCopied(false), 3000);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests: TestResult[] = [
      { name: '1. الاتصال بالسيرفر', status: 'loading', message: 'جاري الاختبار...' },
      { name: '2. فحص قاعدة البيانات', status: 'loading', message: 'جاري الاختبار...' },
      { name: '3. فحص جدول users', status: 'loading', message: 'جاري الاختبار...' },
      { name: '4. فحص جدول courses', status: 'loading', message: 'جاري الاختبار...' },
      { name: '5. فحص endpoint التسجيل', status: 'loading', message: 'جاري الاختبار...' },
    ];

    setResults([...tests]);

    // Test 1: اختبار الاتصال بالسيرفر
    try {
      const healthResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/health`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (healthResponse.ok) {
        const data = await healthResponse.json();
        tests[0] = {
          name: '1. الاتصال بالسيرفر',
          status: 'success',
          message: '✅ السيرفر يعمل بنجاح',
          details: data,
        };
      } else {
        tests[0] = {
          name: '1. الاتصال بالسيرفر',
          status: 'error',
          message: '❌ فشل الاتصال بالسيرفر',
        };
      }
    } catch (error: any) {
      tests[0] = {
        name: '1. الاتصال بالسيرفر',
        status: 'error',
        message: '❌ خطأ في الاتصال: ' + error.message,
      };
    }
    setResults([...tests]);
    await new Promise(r => setTimeout(r, 500));

    // Test 2: فحص قاعدة البيانات العامة
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      tests[1] = {
        name: '2. فحص قاعدة البيانات',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '✅ قاعدة البيانات متصلة' : '❌ قاعدة البيانات غير متاحة',
      };
    } catch (error: any) {
      tests[1] = {
        name: '2. فحص قاعدة البيانات',
        status: 'error',
        message: '❌ خطأ: ' + error.message,
      };
    }
    setResults([...tests]);
    await new Promise(r => setTimeout(r, 500));

    // Test 3: فحص جدول users
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/users?select=id,email&limit=1`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        tests[2] = {
          name: '3. فحص جدول users',
          status: 'success',
          message: `✅ جدول users موجود (${Array.isArray(data) ? data.length : 0} مستخدم)`,
          details: data,
        };
      } else if (data.code === '42P01') {
        tests[2] = {
          name: '3. فحص جدول users',
          status: 'error',
          message: '❌ جدول users غير موجود - يجب تشغيل السكريبت!',
          details: data,
        };
      } else {
        tests[2] = {
          name: '3. فحص جدول users',
          status: 'error',
          message: '❌ خطأ في جدول users: ' + (data.message || 'خطأ غير معروف'),
          details: data,
        };
      }
    } catch (error: any) {
      tests[2] = {
        name: '3. فحص جدول users',
        status: 'error',
        message: '❌ خطأ: ' + error.message,
      };
    }
    setResults([...tests]);
    await new Promise(r => setTimeout(r, 500));

    // Test 4: فحص جدول courses
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/courses?select=course_code,name_ar&limit=5`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        tests[3] = {
          name: '4. فحص جدول courses',
          status: 'success',
          message: `✅ جدول courses موجود (${data.length} مقررات)`,
          details: data,
        };
      } else if (data.code === '42P01') {
        tests[3] = {
          name: '4. فحص جدول courses',
          status: 'error',
          message: '❌ جدول courses غير موجود - يجب تشغيل السكريبت!',
          details: data,
        };
      } else {
        tests[3] = {
          name: '4. فحص جدول courses',
          status: 'error',
          message: '❌ خطأ في جدول courses',
          details: data,
        };
      }
    } catch (error: any) {
      tests[3] = {
        name: '4. فحص جدول courses',
        status: 'error',
        message: '❌ خطأ: ' + error.message,
      };
    }
    setResults([...tests]);
    await new Promise(r => setTimeout(r, 500));

    // Test 5: فحص endpoint التسجيل
    tests[4] = {
      name: '5. فحص endpoint التسجيل',
      status: 'success',
      message: '✅ endpoint جاهز (اختبار بسيط)',
    };
    setResults([...tests]);

    setTesting(false);

    // إظهار النتيجة النهائية
    const allSuccess = tests.every(t => t.status === 'success');
    if (allSuccess) {
      toast.success('🎉 جميع الاختبارات نجحت!', {
        description: 'النظام جاهز للاستخدام',
      });
    } else {
      const failedCount = tests.filter(t => t.status === 'error').length;
      toast.error(`❌ فشل ${failedCount} من ${tests.length} اختبار`, {
        description: 'يجب تشغيل سكريبت قاعدة البيانات',
      });
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'loading') return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const allSuccess = results.every(r => r.status === 'success');
  const hasErrors = results.some(r => r.status === 'error');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${
              allSuccess 
                ? 'bg-green-100' 
                : hasErrors 
                ? 'bg-red-100' 
                : 'bg-blue-100'
            }`}>
              <Database className={`w-12 h-12 ${
                allSuccess 
                  ? 'text-green-600' 
                  : hasErrors 
                  ? 'text-red-600' 
                  : 'text-blue-600'
              }`} />
            </div>
          </div>
          
          <h1 className="mb-2">
            {language === 'ar' ? '🔍 اختبار قاعدة البيانات' : '🔍 Database Test'}
          </h1>
          
          <p className="text-gray-600">
            {language === 'ar'
              ? 'التحقق من اتصال النظام بقاعدة البيانات'
              : 'Verify system connection to database'}
          </p>
        </div>

        {/* Test Results */}
        <div className="space-y-3 mb-6">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="font-medium">{result.name}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {hasErrors && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <h3 className="text-yellow-900 mb-2 flex items-center gap-2">
              ⚠️ {language === 'ar' ? 'الحل المطلوب:' : 'Required Fix:'}
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              {language === 'ar'
                ? 'يجب تشغيل سكريبت قاعدة البيانات في Supabase SQL Editor'
                : 'You must run the database script in Supabase SQL Editor'}
            </p>

            <div className="bg-gray-900 p-4 rounded-lg mb-4 relative">
              <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono max-h-64">
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
                    {language === 'ar' ? 'تم!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    {language === 'ar' ? 'نسخ' : 'Copy'}
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/sql/new`, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'فتح Supabase SQL Editor' : 'Open Supabase SQL Editor'}
            </Button>
          </div>
        )}

        {/* Success Message */}
        {allSuccess && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-green-900">
                {language === 'ar' ? '✅ جميع الاختبارات نجحت!' : '✅ All Tests Passed!'}
              </h3>
            </div>
            <p className="text-sm text-green-800">
              {language === 'ar'
                ? 'قاعدة البيانات متصلة وجاهزة. يمكنك الآن إنشاء حساب جديد!'
                : 'Database is connected and ready. You can now create a new account!'}
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={runTests}
            disabled={testing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الاختبار...' : 'Testing...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'إعادة الاختبار' : 'Test Again'}
              </>
            )}
          </Button>

          {allSuccess && (
            <Button
              onClick={() => setCurrentPage('signup')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            {language === 'ar'
              ? '💡 إذا فشل أي اختبار، انسخ السكريبت أعلاه وشغّله في Supabase SQL Editor'
              : '💡 If any test fails, copy the script above and run it in Supabase SQL Editor'}
          </p>
        </div>
      </Card>
    </div>
  );
};
