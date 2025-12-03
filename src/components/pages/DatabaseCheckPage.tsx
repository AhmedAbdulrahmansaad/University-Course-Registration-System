import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, XCircle, Loader2, Database, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { useApp } from '../../contexts/AppContext';

interface TableStatus {
  name: string;
  exists: boolean;
  rowCount?: number;
  error?: string;
}

export const DatabaseCheckPage: React.FC = () => {
  const { language } = useApp();
  const [checking, setChecking] = useState(false);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [allTablesExist, setAllTablesExist] = useState(false);

  const requiredTables = [
    'users',
    'students',
    'supervisors',
    'courses',
    'registrations',
    'notifications'
  ];

  const checkTables = async () => {
    setChecking(true);
    setTables([]);

    try {
      const results: TableStatus[] = [];

      for (const tableName of requiredTables) {
        try {
          // محاولة الاستعلام عن الجدول
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            // إذا كان الخطأ هو أن الجدول غير موجود
            if (error.code === '42P01' || error.message.includes('does not exist')) {
              results.push({
                name: tableName,
                exists: false,
                error: 'Table does not exist'
              });
            } else {
              results.push({
                name: tableName,
                exists: true,
                rowCount: count || 0,
                error: error.message
              });
            }
          } else {
            results.push({
              name: tableName,
              exists: true,
              rowCount: count || 0
            });
          }
        } catch (err: any) {
          results.push({
            name: tableName,
            exists: false,
            error: err.message
          });
        }
      }

      setTables(results);
      const allExist = results.every(t => t.exists);
      setAllTablesExist(allExist);

      if (allExist) {
        toast.success(
          language === 'ar'
            ? '✅ جميع الجداول موجودة!'
            : '✅ All tables exist!',
          {
            description: language === 'ar'
              ? 'قاعدة البيانات جاهزة للاستخدام'
              : 'Database is ready to use'
          }
        );
      } else {
        const missingCount = results.filter(t => !t.exists).length;
        toast.error(
          language === 'ar'
            ? `❌ ${missingCount} جدول مفقود`
            : `❌ ${missingCount} table(s) missing`,
          {
            description: language === 'ar'
              ? 'يجب تشغيل سكريبت إعداد قاعدة البيانات'
              : 'You must run the database setup script'
          }
        );
      }

    } catch (error: any) {
      console.error('❌ Error checking tables:', error);
      toast.error(
        language === 'ar'
          ? '❌ فشل فحص قاعدة البيانات'
          : '❌ Database check failed',
        { description: error.message }
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkTables();
  }, []);

  const copySetupSQL = () => {
    const sqlPath = '/database-setup.sql';
    navigator.clipboard.writeText(sqlPath);
    toast.success(
      language === 'ar'
        ? '✅ تم نسخ مسار الملف'
        : '✅ File path copied',
      {
        description: language === 'ar'
          ? 'افتح الملف ونسخ محتوياته'
          : 'Open the file and copy its contents'
      }
    );
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/edlnpolgtkrmddjyrxwm/editor', '_blank');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-blue-100">
                <Database className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="mb-2 text-blue-600">
              {language === 'ar' ? 'فحص قاعدة البيانات' : 'Database Check'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar'
                ? 'التحقق من وجود جميع الجداول المطلوبة'
                : 'Verify all required tables exist'}
            </p>
          </div>

          <div className="mb-6">
            <Button
              onClick={checkTables}
              disabled={checking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الفحص...' : 'Checking...'}
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إعادة الفحص' : 'Re-check'}
                </>
              )}
            </Button>
          </div>

          {tables.length > 0 && (
            <>
              <div className={`p-4 rounded-lg mb-6 ${allTablesExist ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <div className="flex items-center gap-3">
                  {allTablesExist ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold ${allTablesExist ? 'text-green-800' : 'text-red-800'}`}>
                      {allTablesExist
                        ? (language === 'ar' ? '✅ قاعدة البيانات جاهزة!' : '✅ Database Ready!')
                        : (language === 'ar' ? '❌ قاعدة البيانات غير جاهزة' : '❌ Database Not Ready')}
                    </p>
                    <p className={`text-sm ${allTablesExist ? 'text-green-700' : 'text-red-700'}`}>
                      {allTablesExist
                        ? (language === 'ar'
                          ? 'جميع الجداول موجودة. يمكنك الآن التسجيل وتسجيل الدخول.'
                          : 'All tables exist. You can now signup and login.')
                        : (language === 'ar'
                          ? 'بعض الجداول مفقودة. يجب تشغيل سكريبت إعداد قاعدة البيانات أولاً.'
                          : 'Some tables are missing. You must run the database setup script first.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className={`p-4 rounded-lg border ${
                      table.exists
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {table.exists ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className={`font-semibold ${table.exists ? 'text-green-800' : 'text-red-800'}`}>
                            {table.name}
                          </p>
                          {table.exists && (
                            <p className="text-sm text-green-700">
                              {language === 'ar'
                                ? `${table.rowCount} سجل`
                                : `${table.rowCount} row(s)`}
                            </p>
                          )}
                          {table.error && !table.exists && (
                            <p className="text-xs text-red-600">
                              {table.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-semibold ${
                        table.exists
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {table.exists
                          ? (language === 'ar' ? 'موجود' : 'EXISTS')
                          : (language === 'ar' ? 'مفقود' : 'MISSING')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!allTablesExist && tables.length > 0 && (
            <div className="space-y-4">
              <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-yellow-900">
                      {language === 'ar'
                        ? '⚠️ يجب إعداد قاعدة البيانات'
                        : '⚠️ Database Setup Required'}
                    </h3>
                    <p className="text-sm text-yellow-800">
                      {language === 'ar'
                        ? 'قبل استخدام النظام، يجب تشغيل سكريبت إعداد قاعدة البيانات في Supabase.'
                        : 'Before using the system, you must run the database setup script in Supabase.'}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-yellow-900">
                        {language === 'ar' ? 'الخطوات:' : 'Steps:'}
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                        <li>
                          {language === 'ar'
                            ? 'افتح ملف `/database-setup.sql` في محرر الأكواد'
                            : 'Open `/database-setup.sql` file in your code editor'}
                        </li>
                        <li>
                          {language === 'ar'
                            ? 'انسخ كامل محتويات الملف'
                            : 'Copy the entire file contents'}
                        </li>
                        <li>
                          {language === 'ar'
                            ? 'افتح Supabase SQL Editor'
                            : 'Open Supabase SQL Editor'}
                        </li>
                        <li>
                          {language === 'ar'
                            ? 'الصق المحتوى وانقر "Run"'
                            : 'Paste the content and click "Run"'}
                        </li>
                        <li>
                          {language === 'ar'
                            ? 'انتظر حتى يكتمل التنفيذ (30-60 ثانية)'
                            : 'Wait for execution to complete (30-60 seconds)'}
                        </li>
                        <li>
                          {language === 'ar'
                            ? 'ارجع لهذه الصفحة واضغط "إعادة الفحص"'
                            : 'Come back here and click "Re-check"'}
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={copySetupSQL}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'نسخ مسار الملف' : 'Copy File Path'}
                </Button>
                
                <Button
                  onClick={openSupabase}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'فتح Supabase' : 'Open Supabase'}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  {language === 'ar'
                    ? '💡 السكريبت يحتوي على 49 مقرراً دراسياً من الخطة الرسمية لقسم نظم المعلومات الإدارية'
                    : '💡 The script contains 49 courses from the official MIS curriculum'}
                </p>
              </div>
            </div>
          )}

          {allTablesExist && (
            <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-900">
                    {language === 'ar'
                      ? '✅ قاعدة البيانات جاهزة للاستخدام!'
                      : '✅ Database Ready to Use!'}
                  </h3>
                  <p className="text-sm text-green-800">
                    {language === 'ar'
                      ? 'جميع الجداول موجودة. يمكنك الآن:'
                      : 'All tables exist. You can now:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                    <li>{language === 'ar' ? 'إنشاء حساب جديد' : 'Create a new account'}</li>
                    <li>{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</li>
                    <li>{language === 'ar' ? 'تسجيل المقررات' : 'Register for courses'}</li>
                    <li>{language === 'ar' ? 'استخدام جميع ميزات النظام' : 'Use all system features'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
