import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ✅ Types
export interface Course {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  instructor: string;
  time: string;
  room: string;
  department: string;
  level: number;
  capacity: number;
  enrolled: number;
  prerequisite?: string;
}

// ✅ إضافة نوع طلب التسجيل
export interface RegistrationRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseCode: string;
  courseName: string;
  section: string;
  time: string;
  credits: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
}

// ✅ إضافة نوع الإشعار
export interface Notification {
  id: string;
  userId: string;
  type: 'request' | 'approval' | 'rejection' | 'info';
  title: string;
  message: string;
  requestId?: string;
  read: boolean;
  createdAt: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  t: (key: string) => string;
  availableCourses: Course[];
  registeredCourses: Course[];
  setRegisteredCourses: (courses: Course[]) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  userInfo: { name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null;
  setUserInfo: (info: { name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null) => void;
  hasAcceptedAgreement: boolean;
  setHasAcceptedAgreement: (value: boolean) => void;
  // ✅ إضافة طلبات التسجيل والإشعارات
  registrationRequests: RegistrationRequest[];
  setRegistrationRequests: (requests: RegistrationRequest[]) => void;
  addRegistrationRequest: (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  unreadNotificationsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    about: 'عن المشروع',
    project: 'مراحل المشروع',
    projectPhases: 'مراحل التطوير',
    designMethodology: 'منهجية التصميم',
    howToRedesign: 'منهجية إعادة التصميم',
    news: 'الأخبار',
    contact: 'تواصل معنا',
    responsive: 'التصميم التجاوبي',
    accessibility: 'سهولة الوصول',
    privacy: 'سياسة الخصوصية',
    search: 'البحث',
    courses: 'المقررات المتاحة',
    schedule: 'الجدول الدراسي',
    transcript: 'السجل الأكاديمي',
    testing: 'مرحلة الاختبار',
    reports: 'تقاريري',
    documents: 'المستندات',
    notifications: 'الإشعارات',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    aiAssistant: 'المساعد الذكي',
    supervisorDashboard: 'لوحة المشرف',
    studentDashboard: 'لوحة التحكم',
    requests: 'طلبات التسجيل',
    curriculum: 'المنهج الدراسي',
    adminDashboard: 'لوحة المدير',
    manageCourses: 'إدارة المقررات',
    manageStudents: 'إدارة الطلاب',
    manageSupervisors: 'إدارة المشرفين',
    announcements: 'الإعلانات',
    messages: 'الرسائل',
    systemSettings: 'إعدادات النظام',
    systemTools: 'أدوات النظام',
    
    // Common
    back: 'رجوع',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',
    loading: 'جاري التحميل...',
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
  },
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    project: 'Project Phases',
    projectPhases: 'Development Phases',
    designMethodology: 'Design Methodology',
    howToRedesign: 'Redesign Methodology',
    news: 'News',
    contact: 'Contact',
    responsive: 'Responsive Design',
    accessibility: 'Accessibility',
    privacy: 'Privacy Policy',
    search: 'Search',
    courses: 'Available Courses',
    schedule: 'My Schedule',
    transcript: 'Transcript',
    testing: 'Testing Phase',
    reports: 'My Reports',
    documents: 'Documents',
    notifications: 'Notifications',
    login: 'Login',
    signup: 'Sign Up',
    aiAssistant: 'AI Assistant',
    supervisorDashboard: 'Supervisor Dashboard',
    studentDashboard: 'Student Dashboard',
    requests: 'Registration Requests',
    curriculum: 'Curriculum',
    adminDashboard: 'Admin Dashboard',
    manageCourses: 'Manage Courses',
    manageStudents: 'Manage Students',
    manageSupervisors: 'Manage Supervisors',
    announcements: 'Announcements',
    messages: 'Messages',
    systemSettings: 'System Settings',
    systemTools: 'System Tools',
    
    // Common
    back: 'Back',
    logout: 'Logout',
    welcome: 'Welcome',
    loading: 'Loading...',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
  },
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [theme, setThemeState] = useState<Theme>('light');
  const [currentPage, setCurrentPageState] = useState<string>('accessAgreement');
  const [registeredCourses, setRegisteredCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]); // ✅ Fetch from Supabase
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null>(null);
  const [hasAcceptedAgreement, setHasAcceptedAgreementState] = useState<boolean>(false);
  // ✅ إضافة طلبات التسجيل والإشعارات
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // التحقق من تسجيل الدخول عند التحميل
  useEffect(() => {
    console.log('🎯 [AppContext] Initializing application...');
    
    const agreementAccepted = localStorage.getItem('agreementAccepted');
    const savedUser = localStorage.getItem('userInfo');
    const savedLang = localStorage.getItem('language') as Language;
    const savedTheme = localStorage.getItem('theme') as Theme;

    // تطبيق اللغة والثيم
    if (savedLang) setLanguageState(savedLang);
    if (savedTheme) setThemeState(savedTheme);

    // ✅ لا نحمل المقررات من localStorage - سنحملها من Supabase
    // المقررات المسجلة يجب أن تأتي من قاعدة البيانات فقط

    // التحقق من تسجيل الدخول أولاً
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        // ✅ التحقق من صحة البيانات
        if (!user || typeof user !== 'object' || !user.id || !user.email) {
          console.error('❌ [AppContext] Invalid user data in localStorage:', user);
          // ✅ حذف البيانات التالفة وإعادة التحميل
          console.log('🗑️ [AppContext] Clearing corrupted localStorage data...');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('isLoggedIn');
          throw new Error('Invalid user data structure');
        }
        
        // ✅ التحقق من أن user.id هو UUID صحيح
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.id)) {
          console.error('❌ [AppContext] Invalid user ID format in localStorage:', user.id);
          console.error('❌ [AppContext] Full user object:', user);
          // ✅ حذف البيانات التالفة وإعادة التحميل
          console.log('🗑️ [AppContext] Clearing corrupted user ID from localStorage...');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('isLoggedIn');
          throw new Error(`Invalid user ID format: ${user.id}`);
        }
        
        console.log('🔄 [AppContext] Loading saved user from localStorage:', user);
        console.log('📊 [AppContext] User ID:', user.id);
        console.log('📊 [AppContext] User Level:', user.level);
        console.log('📊 [AppContext] User Major:', user.major);
        console.log('📊 [AppContext] User Role:', user.role);
        
        setUserInfo(user);
        setIsLoggedIn(true);
        
        const userRole = user.role || 'student';
        
        // ✅ المشرف والمدير لا يحتاجون للتعهد - يذهبون مباشرة للوحة التحكم
        if (userRole === 'admin') {
          setHasAcceptedAgreementState(true); // تخطي التعهد
          setCurrentPageState('adminDashboard');
          console.log('✅ [AppContext] Admin user - redirecting to adminDashboard');
          return;
        } else if (userRole === 'supervisor') {
          setHasAcceptedAgreementState(true); // تخطي التعهد
          setCurrentPageState('supervisorDashboard');
          console.log('✅ [AppContext] Supervisor user - redirecting to supervisorDashboard');
          return;
        }
        
        // ✅ الطالب يحتاج للتعهد
        if (agreementAccepted === 'true') {
          setHasAcceptedAgreementState(true);
          setCurrentPageState('studentDashboard');
          console.log('✅ [AppContext] Student user with agreement - redirecting to studentDashboard');
        } else {
          // لم يقبل التعهد - الذهاب لصفحة التعهد
          setCurrentPageState('accessAgreement');
          console.log('⚠️ [AppContext] Student user without agreement - redirecting to accessAgreement');
        }
      } catch (error) {
        console.error('⚠️ Error parsing user info from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('userInfo');
        localStorage.removeItem('access_token');
        localStorage.removeItem('isLoggedIn');
        setUserInfo(null);
        setIsLoggedIn(false);
        setCurrentPageState('accessAgreement');
      }
    } else {
      // ✅ لم يسجل دخول
      console.log('⚠️ [AppContext] No saved user found in localStorage');
      if (agreementAccepted === 'true') {
        setHasAcceptedAgreementState(true);
        // دع المستخدم في الصفحة التي هو فيها (login أو home)
      } else {
        // لم يقبل التعهد - الذهاب لصفحة التعهد
        setCurrentPageState('accessAgreement');
      }
    }

    // ✅ REMOVED: No longer loading courses from localStorage
    // Courses will be fetched from Supabase when needed
  }, []);

  const setHasAcceptedAgreement = (value: boolean) => {
    setHasAcceptedAgreementState(value);
    if (value) {
      localStorage.setItem('agreementAccepted', 'true');
    } else {
      localStorage.removeItem('agreementAccepted');
    }
  };

  const setCurrentPage = (page: string) => {
    const protectedPages = ['courses', 'schedule', 'reports', 'documents', 'assistant', 'requests'];
    const agreementAccepted = localStorage.getItem('agreementAccepted');

    // ✅ منع المستخدم المسجل من الوصول لصفحات تسجيل الدخول أو التسجيل
    if ((page === 'login' || page === 'signup') && isLoggedIn && userInfo) {
      console.log('⚠️ User already logged in - Redirecting to dashboard');
      const userRole = userInfo.role || 'student';
      
      if (userRole === 'admin') {
        setCurrentPageState('adminDashboard');
      } else if (userRole === 'supervisor') {
        setCurrentPageState('supervisorDashboard');
      } else {
        setCurrentPageState('studentDashboard');
      }
      return;
    }

    // التحقق من التعهد للصفحات المحمية
    if (protectedPages.includes(page)) {
      if (agreementAccepted !== 'true') {
        console.log(' Access Agreement not accepted - Redirecting to agreement page');
        setCurrentPageState('accessAgreement');
        return;
      }
      
      if (!isLoggedIn) {
        console.log('❌ User not logged in - Redirecting to login page');
        localStorage.setItem('redirectAfterLogin', page);
        setCurrentPageState('login');
        return;
      }

      // التحقق من الأدوار
      if (page === 'requests') {
        const userRole = userInfo?.role || 'student';
        if (userRole !== 'supervisor' && userRole !== 'admin') {
          console.log('❌ Insufficient permissions for requests page');
          setCurrentPageState('home');
          return;
        }
      }
    }

    setCurrentPageState(page);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ✅ REMOVED: No longer saving courses to localStorage
  // Courses should only come from Supabase database
  // useEffect(() => {
  //   if (registeredCourses.length > 0) {
  //     localStorage.setItem('registeredCourses', JSON.stringify(registeredCourses));
  //   }
  // }, [registeredCourses]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // ✅ إضافة طلبات التسجيل والإشعارات
  const addRegistrationRequest = (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => {
    const newRequest: RegistrationRequest = {
      id: Date.now().toString(),
      requestDate: new Date().toISOString(),
      status: 'pending',
      ...request,
    };
    setRegistrationRequests([...registrationRequests, newRequest]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications([...notifications, newNotification]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        currentPage,
        setCurrentPage,
        t,
        availableCourses,
        registeredCourses,
        setRegisteredCourses,
        isLoggedIn,
        setIsLoggedIn,
        userInfo,
        setUserInfo,
        hasAcceptedAgreement,
        setHasAcceptedAgreement,
        // ✅ إضافة طلبات التسجيل والإشعارات
        registrationRequests,
        setRegistrationRequests,
        addRegistrationRequest,
        notifications,
        setNotifications,
        addNotification,
        markNotificationAsRead,
        unreadNotificationsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};