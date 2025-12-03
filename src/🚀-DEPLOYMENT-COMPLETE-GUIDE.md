# 🚀 دليل النشر الكامل - نظام تسجيل المقررات جامعة الملك خالد

## 📋 قبل البدء

تأكد من أن لديك:
- ✅ حساب Supabase (مجاني)
- ✅ حساب Vercel (مجاني)
- ✅ حساب GitHub (مجاني)

---

## الخطوة 1️⃣: إعداد قاعدة البيانات Supabase

### 1. إنشاء مشروع Supabase جديد

1. اذهب إلى https://supabase.com
2. اضغط **"Start your project"**
3. سجل دخول أو أنشئ حساب
4. اضغط **"New Project"**
5. املأ البيانات:
   - **Name:** KKU Course Registration System
   - **Database Password:** (احفظها في مكان آمن!)
   - **Region:** (اختر الأقرب لك)
6. اضغط **"Create new project"**
7. انتظر 2-3 دقائق حتى يكتمل الإعداد

### 2. تشغيل سكريبتات قاعدة البيانات

1. **في Supabase Dashboard:**
   - اذهب إلى القائمة الجانبية
   - اضغط **SQL Editor**
   - اضغط **"New query"**

2. **تنفيذ سكريبت إنشاء الجداول:**
   - افتح الملف `/🎯-KKU-COURSE-REGISTRATION-DATABASE-SETUP.sql`
   - انسخ المحتوى بالكامل (Ctrl+A → Ctrl+C)
   - الصقه في SQL Editor (Ctrl+V)
   - اضغط **"RUN"** (أو Ctrl+Enter)
   - انتظر حتى تظهر رسالة ✅ Success

3. **تنفيذ سكريبت إدراج المقررات:**
   - افتح الملف `/🔥-INSERT-49-COURSES-DATA.sql`
   - انسخ المحتوى بالكامل
   - الصقه في SQL Editor جديد
   - اضغط **"RUN"**
   - يجب أن ترى: "49 courses inserted successfully!"

### 3. التحقق من نجاح الإعداد

1. **اذهب إلى Table Editor:**
   - من القائمة الجانبية → **Table Editor**

2. **تحقق من الجداول:**
   يجب أن ترى:
   - ✅ users
   - ✅ students
   - ✅ supervisors
   - ✅ courses (يحتوي على 49 صف)
   - ✅ registrations
   - ✅ notifications
   - ✅ course_offerings

3. **افتح جدول courses:**
   - يجب أن ترى 49 مقرراً
   - من MIS101 إلى ENTR401

### 4. الحصول على مفاتيح الاتصال

1. **اذهب إلى Project Settings:**
   - القائمة الجانبية → ⚙️ **Settings**
   - اختر **API**

2. **احفظ المعلومات التالية:**
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUz...
   service_role: eyJhbGciOiJIUz...
   ```

3. **استخرج Project ID:**
   من Project URL، القيمة قبل `.supabase.co`
   مثال: إذا كان URL هو `https://edlnpolgtkrmddjyrxwm.supabase.co`
   فإن Project ID هو: `edlnpolgtkrmddjyrxwm`

---

## الخطوة 2️⃣: رفع Edge Function

### 1. تفعيل Edge Functions

1. **في Supabase Dashboard:**
   - اذهب إلى **Edge Functions**
   - اضغط **"Enable Edge Functions"**

### 2. تثبيت Supabase CLI

```bash
# على Windows
scoop install supabase

# على Mac
brew install supabase/tap/supabase

# على Linux
curl -sL https://github.com/supabase/cli/releases/download/v1.x.x/supabase_1.x.x_linux_amd64.deb -o supabase.deb
sudo dpkg -i supabase.deb
```

### 3. تسجيل الدخول

```bash
supabase login
```

سيفتح متصفح للمصادقة، اضغط **"Authorize"**

### 4. ربط المشروع

```bash
# استبدل xxxxx بـ Project ID الخاص بك
supabase link --project-ref xxxxx
```

سيطلب منك Database Password الذي أنشأته في الخطوة 1.

### 5. رفع Edge Function

```bash
# من مجلد المشروع
cd /path/to/your/project

# رفع الـ function
supabase functions deploy make-server-1573e40a
```

### 6. ضبط Environment Variables

```bash
# في Supabase Dashboard → Edge Functions → make-server-1573e40a → Settings
# أضف هذه المتغيرات:

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
```

### 7. التحقق من عمل Edge Function

```bash
# اختبار health check
curl https://xxxxx.supabase.co/functions/v1/make-server-1573e40a/health
```

يجب أن ترى:
```json
{
  "status": "ok",
  "message": "KKU Course Registration System - SQL Database",
  "database": "PostgreSQL via Supabase"
}
```

---

## الخطوة 3️⃣: تحديث ملفات المشروع

### 1. تحديث معلومات Supabase

**افتح `/utils/supabase/info.tsx` وحدثه:**

```typescript
// استبدل بمعلومات مشروعك
export const projectId = 'edlnpolgtkrmddjyrxwm'; // Project ID الخاص بك
export const publicAnonKey = 'eyJhbGciOiJIUz...'; // Anon public key الخاص بك

// لا تعدل هذه
export const supabaseUrl = `https://${projectId}.supabase.co`;
```

### 2. إنشاء ملف `.env.local` (اختياري للتطوير المحلي)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
```

---

## الخطوة 4️⃣: رفع المشروع إلى GitHub

### 1. إنشاء Repository جديد

1. اذهب إلى https://github.com
2. اضغط **"New repository"**
3. **Repository name:** kku-course-registration-system
4. **Description:** نظام تسجيل المقررات - جامعة الملك خالد
5. **Public** أو **Private** (اختر ما تريد)
6. ✅ لا تضف README (موجود مسبقاً)
7. اضغط **"Create repository"**

### 2. رفع الكود

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit - KKU Course Registration System"
git branch -M main
git remote add origin https://github.com/USERNAME/kku-course-registration-system.git
git push -u origin main
```

---

## الخطوة 5️⃣: النشر على Vercel

### 1. إنشاء حساب Vercel

1. اذهب إلى https://vercel.com
2. اضغط **"Sign Up"**
3. اختر **"Continue with GitHub"**
4. وافق على الصلاحيات

### 2. استيراد المشروع

1. في Vercel Dashboard:
   - اضغط **"Add New..."**
   - اختر **"Project"**

2. **استيراد من GitHub:**
   - اختر **"Import Git Repository"**
   - ابحث عن **kku-course-registration-system**
   - اضغط **"Import"**

### 3. ضبط الإعدادات

1. **Project Name:**
   ```
   kku-course-registration-system
   ```

2. **Framework Preset:**
   اختر **"Vite"**

3. **Build Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables:**
   اضغط **"Add"** لكل متغير:
   
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUz...
   ```

5. اضغط **"Deploy"**

### 4. انتظار النشر

- سيبدأ Vercel في بناء المشروع
- انتظر 2-5 دقائق
- عند النجاح سترى: ✅ **"Deployment Complete"**

### 5. الحصول على الرابط

```
https://kku-course-registration-system.vercel.app
```

أو رابط مخصص مثل:
```
https://your-custom-domain.com
```

---

## الخطوة 6️⃣: الاختبار النهائي

### 1. افتح الموقع

اذهب إلى رابط Vercel الخاص بك

### 2. اختبر صفحة التعهد

- ✅ يجب أن تظهر صورة خلفية الجامعة
- ✅ التبديل بين العربية والإنجليزية يعمل
- ✅ الوضع الليلي/النهاري يعمل

### 3. إنشاء حساب طالب

```
Email: student@kku.edu.sa
Password: Test123456
Name: محمد أحمد
Student ID: 43120001
Major: نظم المعلومات الإدارية
Level: 1
GPA: 0
```

اضغط **"إنشاء حساب"**

### 4. تسجيل دخول

- ادخل البريد وكلمة المرور
- يجب أن تذهب إلى لوحة تحكم الطالب

### 5. تحقق من الميزات

- ✅ لوحة التحكم تعرض الإحصائيات
- ✅ صفحة المقررات تعرض 49 مقرراً
- ✅ يمكن تسجيل مقرر
- ✅ الإشعارات تعمل

### 6. إنشاء حساب مشرف/مدير

كرر العملية مع دور مختلف:

```
Email: admin@kku.edu.sa
Password: Admin123456
Name: أحمد العمري
Role: admin
```

---

## 🎯 استكشاف الأخطاء

### خطأ: "Failed to fetch"

**السبب:** Edge Function غير مفعل أو لم يتم رفعه

**الحل:**
```bash
# تحقق من حالة Function
supabase functions list

# إعادة رفع
supabase functions deploy make-server-1573e40a
```

### خطأ: "Table does not exist"

**السبب:** لم يتم تشغيل سكريبتات SQL

**الحل:**
- ارجع إلى الخطوة 1 وشغل السكريبتات مرة أخرى
- تأكد من عدم وجود أخطاء في SQL Editor

### خطأ: "Invalid API key"

**السبب:** Project ID أو Anon Key خاطئ

**الحل:**
- تحقق من `/utils/supabase/info.tsx`
- تأكد من صحة المفاتيح من Supabase Dashboard

### خطأ: Build failed على Vercel

**السبب:** Environment Variables مفقودة

**الحل:**
1. اذهب إلى Vercel → Project → Settings → Environment Variables
2. أضف المتغيرات المطلوبة
3. اضغط **"Redeploy"**

---

## 📱 ربط Domain مخصص (اختياري)

### 1. شراء Domain

من:
- Namecheap
- GoDaddy
- أي موقع آخر

### 2. ربط Domain في Vercel

1. **في Vercel Dashboard:**
   - اذهب إلى Project → Settings → Domains
   - اضغط **"Add"**
   - ادخل domain الخاص بك
   - مثال: `kku-registration.com`

2. **ضبط DNS:**
   - في لوحة تحكم Domain الخاص بك
   - أضف سجلات DNS التالية:
   
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **انتظر:**
   - قد يستغرق 24-48 ساعة للنشر

---

## 🔐 الأمان

### 1. لا تشارك هذه المعلومات أبداً:

❌ SUPABASE_SERVICE_ROLE_KEY  
❌ Database Password  
❌ JWT Secret  

### 2. ✅ يمكن مشاركة:

✅ Project URL  
✅ Anon Public Key  
✅ Project ID  

### 3. تفعيل Row Level Security (RLS)

سكريبتات قاعدة البيانات تفعل RLS تلقائياً ✅

---

## 📊 مراقبة الأداء

### في Supabase:

1. **Database:**
   - Logs → عرض استعلامات SQL
   - Usage → حجم البيانات المستخدم

2. **Edge Functions:**
   - Logs → أخطاء الـ Function
   - Metrics → عدد الطلبات

### في Vercel:

1. **Analytics:**
   - عدد الزوار
   - وقت التحميل

2. **Logs:**
   - Build logs
   - Function logs

---

## 🎉 تهانينا!

نظامك الآن:
- ✅ منشور على الإنترنت
- ✅ متصل بقاعدة بيانات حقيقية
- ✅ يعمل بكامل الميزات
- ✅ جاهز للاستخدام

---

## 🔄 التحديثات المستقبلية

### عند تعديل الكود:

```bash
# 1. حفظ التغييرات
git add .
git commit -m "وصف التعديل"

# 2. رفع إلى GitHub
git push

# 3. Vercel ستنشر تلقائياً!
```

### عند تعديل Edge Function:

```bash
# رفع التحديث
supabase functions deploy make-server-1573e40a
```

### عند تعديل قاعدة البيانات:

- افتح SQL Editor في Supabase
- نفذ التعديلات المطلوبة

---

## 📞 الدعم

إذا واجهت مشاكل:

1. **تحقق من Console:**
   - اضغط F12 في المتصفح
   - ابحث عن أخطاء في Console

2. **تحقق من Logs:**
   - Supabase Logs
   - Vercel Logs

3. **راجع الوثائق:**
   - `/🎉-COMPLETE-SYSTEM-GUIDE-AR.md`
   - `/README.md`

---

## 🌟 نصائح إضافية

### للأداء الأفضل:

1. **استخدم CDN:**
   - Vercel يوفر CDN تلقائياً ✅

2. **تفعيل Caching:**
   - في Vercel → Settings → Caching

3. **تحسين الصور:**
   - Unsplash يوفر صور محسنة تلقائياً ✅

### للأمان:

1. **تفعيل HTTPS:**
   - Vercel يفعل HTTPS تلقائياً ✅

2. **Backup قاعدة البيانات:**
   - Supabase → Database → Backups
   - خطط مجانية: backup يومي

3. **مراجعة RLS Policies:**
   - Supabase → Authentication → Policies

---

## ✨ مبروك!

أنت الآن لديك نظام تسجيل مقررات احترافي منشور على الإنترنت!

**مشروع تخرج - جامعة الملك خالد 2024**

🎓 **نظام تسجيل المقررات الإلكتروني**  
📍 **قسم نظم المعلومات الإدارية**  
👨‍🏫 **إشراف: د. محمد رشيد**

---

**تم بحمد الله** 🌟
