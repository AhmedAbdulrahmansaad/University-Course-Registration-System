import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Database, 
  Server, 
  Users, 
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export const SupabaseTestPage: React.FC = () => {
  const { language } = useApp();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const tests = [
    {
      name: language === 'ar' ? 'اتصال Supabase' : 'Supabase Connection',
      testFn: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        return { success: true, message: language === 'ar' ? 'الاتصال ناجح' : 'Connection successful' };
      }
    },
    {
      name: language === 'ar' ? 'جدول المستخدمين (users)' : 'Users Table',
      testFn: async () => {
        const { data, error, count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { 
          success: true, 
          message: `${language === 'ar' ? 'عدد المستخدمين:' : 'User count:'} ${count || 0}`,
          details: { count }
        };
      }
    },
    {
      name: language === 'ar' ? 'جدول الطلاب (students)' : 'Students Table',
      testFn: async () => {
        const { data, error, count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { 
          success: true, 
          message: `${language === 'ar' ? 'عدد الطلاب:' : 'Student count:'} ${count || 0}`,
          details: { count }
        };
      }
    },
    {
      name: language === 'ar' ? 'جدول المقررات (courses)' : 'Courses Table',
      testFn: async () => {
        const { data, error, count } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { 
          success: true, 
          message: `${language === 'ar' ? 'عدد المقررات:' : 'Course count:'} ${count || 0}`,
          details: { count }
        };
      }
    },
    {
      name: language === 'ar' ? 'جدول التسجيلات (registrations)' : 'Registrations Table',
      testFn: async () => {
        const { data, error, count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { 
          success: true, 
          message: `${language === 'ar' ? 'عدد التسجيلات:' : 'Registration count:'} ${count || 0}`,
          details: { count }
        };
      }
    },
    {
      name: language === 'ar' ? 'جدول الإشعارات (notifications)' : 'Notifications Table',
      testFn: async () => {
        const { data, error, count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { 
          success: true, 
          message: `${language === 'ar' ? 'عدد الإشعارات:' : 'Notification count:'} ${count || 0}`,
          details: { count }
        };
      }
    },
    {
      name: language === 'ar' ? 'Supabase Auth' : 'Supabase Auth',
      testFn: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        return { 
          success: true, 
          message: session 
            ? (language === 'ar' ? 'المستخدم مسجل الدخول' : 'User is logged in')
            : (language === 'ar' ? 'لا يوجد مستخدم مسجل' : 'No user logged in'),
          details: { hasSession: !!session }
        };
      }
    },
  ];

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    for (const test of tests) {
      setResults(prev => [...prev, {
        name: test.name,
        status: 'pending',
        message: language === 'ar' ? 'جاري الاختبار...' : 'Testing...'
      }]);

      try {
        const result = await test.testFn();
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'success', message: result.message, details: result.details }
            : r
        ));
        
        // انتظار قصير بين الاختبارات
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'error', message: error.message || 'Test failed', details: { error } }
            : r
        ));
      }
    }

    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="mb-6 border-2 border-[#D4AF37]">
        <CardHeader className="bg-gradient-to-r from-[#184A2C] to-[#2a7043] text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="w-6 h-6" />
            {language === 'ar' ? 'اختبار اتصال Supabase' : 'Supabase Connection Test'}
          </CardTitle>
          <CardDescription className="text-white/80">
            {language === 'ar' 
              ? 'اختبار شامل لجميع مكونات قاعدة البيانات' 
              : 'Comprehensive test of all database components'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* معلومات الاتصال */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                {language === 'ar' ? 'معرف المشروع' : 'Project ID'}
              </div>
              <div className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all">
                {projectId}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                {language === 'ar' ? 'حالة الاتصال' : 'Connection Status'}
              </div>
              <div className="flex items-center gap-2">
                {errorCount === 0 && pendingCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {language === 'ar' ? 'متصل' : 'Connected'}
                    </span>
                  </>
                ) : errorCount > 0 ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {language === 'ar' ? 'جاري الاختبار...' : 'Testing...'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* نتائج الاختبارات */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#184A2C] dark:text-white">
                {language === 'ar' ? 'نتائج الاختبارات' : 'Test Results'}
              </h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {successCount}
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
                  <XCircle className="w-3 h-3 mr-1" />
                  {errorCount}
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                  <Loader2 className="w-3 h-3 mr-1" />
                  {pendingCount}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    result.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : result.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {result.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : result.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {result.message}
                        </div>
                        {result.details && (
                          <div className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-500">
                            {JSON.stringify(result.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* زر إعادة الاختبار */}
          <div className="flex justify-center">
            <Button
              onClick={runTests}
              disabled={testing}
              className="bg-gradient-to-r from-[#184A2C] to-[#2a7043] hover:from-[#2a7043] hover:to-[#184A2C] text-white"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الاختبار...' : 'Testing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إعادة الاختبار' : 'Retest'}
                </>
              )}
            </Button>
          </div>

          {/* ملخص النتائج */}
          {!testing && results.length > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-r from-[#184A2C]/10 to-[#D4AF37]/10 rounded-lg border-2 border-[#D4AF37]/50">
              <div className="text-center">
                {errorCount === 0 ? (
                  <>
                    <CheckCheck className="w-16 h-16 text-green-600 mx-auto mb-3" />
                    <h4 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                      {language === 'ar' ? '✅ جميع الاختبارات نجحت!' : '✅ All Tests Passed!'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar' 
                        ? 'النظام متصل بقاعدة البيانات بشكل صحيح وجميع الجداول موجودة وتعمل.' 
                        : 'The system is correctly connected to the database and all tables exist and are working.'}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-3" />
                    <h4 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                      {language === 'ar' ? '⚠️ بعض الاختبارات فشلت' : '⚠️ Some Tests Failed'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar' 
                        ? `${errorCount} اختبار فشل من أصل ${results.length}. يرجى التحقق من إعدادات قاعدة البيانات.` 
                        : `${errorCount} out of ${results.length} tests failed. Please check database settings.`}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
