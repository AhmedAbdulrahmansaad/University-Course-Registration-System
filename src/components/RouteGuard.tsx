import React from 'react';
import { useApp } from '../contexts/AppContext';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = false,
  allowedRoles = [],
  redirectTo = 'login',
}) => {
  const { isLoggedIn, userInfo, setCurrentPage, language } = useApp();

  // إذا لم تكن الصفحة تحتاج مصادقة، اعرضها مباشرة
  if (!requireAuth) {
    return <>{children}</>;
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!isLoggedIn || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'يتطلب تسجيل الدخول' : 'Login Required'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'ar'
              ? 'يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة'
              : 'You need to login to access this page'}
          </p>
          <Button onClick={() => setCurrentPage(redirectTo)}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  // إذا كانت هناك أدوار محددة، تحقق منها
  if (allowedRoles.length > 0) {
    const userRole = userInfo.role || 'student';
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full">
                <AlertCircle className="h-12 w-12 text-yellow-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'ar'
                ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
                : 'You do not have permission to access this page'}
            </p>
            <Button
              onClick={() => {
                if (userRole === 'admin') {
                  setCurrentPage('adminDashboard');
                } else if (userRole === 'supervisor') {
                  setCurrentPage('supervisorDashboard');
                } else {
                  setCurrentPage('studentDashboard');
                }
              }}
            >
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </Card>
        </div>
      );
    }
  }

  // كل شيء على ما يرام، اعرض الصفحة
  return <>{children}</>;
};
