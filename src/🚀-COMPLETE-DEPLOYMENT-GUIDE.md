# 🚀 دليل النشر الكامل - نظام تسجيل المقررات
## جامعة الملك خالد

**التاريخ:** 3 ديسمبر 2025  
**الحالة:** ✅ جاهز للنشر الفوري

---

## 📋 جدول المحتويات

1. [متطلبات النشر](#متطلبات-النشر)
2. [نشر قاعدة البيانات على Supabase](#نشر-قاعدة-البيانات-على-supabase)
3. [رفع المشروع على GitHub](#رفع-المشروع-على-github)
4. [نشر التطبيق على Vercel](#نشر-التطبيق-على-vercel)
5. [إعداد المتغيرات البيئية](#إعداد-المتغيرات-البيئية)
6. [الاختبار النهائي](#الاختبار-النهائي)
7. [حل المشاكل الشائعة](#حل-المشاكل-الشائعة)

---

## 1️⃣ متطلبات النشر

### الحسابات المطلوبة:

- ✅ **حساب Supabase** - [supabase.com](https://supabase.com)
- ✅ **حساب GitHub** - [github.com](https://github.com)
- ✅ **حساب Vercel** - [vercel.com](https://vercel.com)

### الأدوات المطلوبة:

```bash
# Git
git --version
# يجب أن يكون مثبت (أي إصدار)

# Node.js (اختياري للاختبار المحلي)
node --version
# يُفضل v18+ أو v20+

# npm أو yarn (اختياري)
npm --version
```

---

## 2️⃣ نشر قاعدة البيانات على Supabase

### الخطوة 1: إنشاء مشروع Supabase جديد

1. اذهب إلى [supabase.com](https://supabase.com)
2. اضغط **"Start your project"** أو **"New Project"**
3. املأ البيانات:
   - **Project Name:** `kku-course-registration`
   - **Database Password:** اختر كلمة مرور قوية (احتفظ بها!)
   - **Region:** اختر `Singapore (Southeast Asia)` أو الأقرب
   - **Pricing Plan:** Free tier (مجاني)

4. اضغط **"Create new project"**
5. انتظر 2-3 دقائق حتى يتم تجهيز المشروع

---

### الخطوة 2: تشغيل SQL Setup Script

1. في لوحة Supabase، اذهب إلى **"SQL Editor"** من القائمة الجانبية

2. اضغط **"New Query"**

3. افتح الملف: `/🔥-COMPLETE-DATABASE-FIX.sql`

4. **انسخ المحتوى بالكامل** (جميع الـ SQL)

5. الصق في SQL Editor في Supabase

6. اضغط **"Run"** أو اضغط `Ctrl+Enter` (Windows) أو `Cmd+Enter` (Mac)

7. انتظر حتى تظهر رسالة: **"Success. No rows returned"**

---

### الخطوة 3: التحقق من إنشاء الجداول

```sql
-- نفذ هذا الأمر في SQL Editor للتحقق:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**يجب أن ترى:**
- ✅ `users`
- ✅ `students`
- ✅ `supervisors`
- ✅ `courses`
- ✅ `registrations`
- ✅ `notifications`

---

### الخطوة 4: التحقق من عدد المقررات

```sql
-- يجب أن يكون العدد 49
SELECT COUNT(*) FROM courses;
```

**النتيجة المتوقعة:** `49 rows`

---

### الخطوة 5: نسخ مفاتيح API

1. اذهب إلى **"Settings"** → **"API"**

2. انسخ المعلومات التالية (ستحتاجها لاحقاً):

```bash
# Project URL
https://your-project-id.supabase.co

# anon/public key (API Key)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (Secret Key)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **مهم جداً:** احتفظ بـ `service_role key` في مكان آمن! لا تشاركه علناً.

---

## 3️⃣ رفع المشروع على GitHub

### الخطوة 1: إنشاء Repository جديد

1. اذهب إلى [github.com](https://github.com)
2. اضغط **"New repository"** (زر أخضر)
3. املأ البيانات:
   - **Repository name:** `kku-course-registration-system`
   - **Description:** `نظام تسجيل المقررات الإلكتروني - جامعة الملك خالد`
   - **Visibility:** `Private` (خاص) أو `Public` (عام)
   - **لا تضف:** README, .gitignore, أو license (سنضيفها لاحقاً)

4. اضغط **"Create repository"**

---

### الخطوة 2: ربط المشروع المحلي بـ GitHub

افتح Terminal/Command Prompt في مجلد المشروع:

```bash
# 1. تهيئة Git (إذا لم يكن مُهيأ)
git init

# 2. إضافة جميع الملفات
git add .

# 3. عمل Commit أولي
git commit -m "🎉 Initial commit - KKU Course Registration System"

# 4. إضافة remote (استبدل USERNAME و REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/kku-course-registration-system.git

# 5. رفع الكود
git branch -M main
git push -u origin main
```

---

### الخطوة 3: التحقق من الرفع

1. حدّث صفحة GitHub Repository
2. يجب أن ترى جميع ملفات المشروع
3. تحقق من وجود:
   - `/components/`
   - `/utils/`
   - `/supabase/`
   - `App.tsx`
   - `package.json` (إن وجد)

---

## 4️⃣ نشر التطبيق على Vercel

### الخطوة 1: ربط Vercel بـ GitHub

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **"Login"** أو **"Sign Up"**
3. اختر **"Continue with GitHub"**
4. امنح Vercel صلاحية الوصول لـ GitHub

---

### الخطوة 2: استيراد المشروع

1. في Vercel Dashboard، اضغط **"Add New..."** → **"Project"**

2. ابحث عن Repository: `kku-course-registration-system`

3. اضغط **"Import"**

4. في صفحة الإعدادات:
   - **Project Name:** `kku-course-registration` (أو أي اسم تريده)
   - **Framework Preset:** `Vite` (إذا كان متاح) أو `Other`
   - **Root Directory:** `./` (الافتراضي)
   - **Build Command:** (اتركه فارغاً أو `npm run build`)
   - **Output Directory:** (اتركه فارغاً أو `dist`)

---

### الخطوة 3: إعداد Environment Variables

قبل النشر، أضف المتغيرات البيئية:

1. في صفحة Vercel Project Settings، اذهب إلى **"Environment Variables"**

2. أضف المتغيرات التالية واحدة تلو الأخرى:

```bash
# Supabase URL
VITE_SUPABASE_URL = https://your-project-id.supabase.co

# Supabase Anon Key (Public Key)
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Server-only)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **مهم:**
- استبدل القيم بمفاتيحك الحقيقية من Supabase
- اضغط **"Add"** بعد كل متغير
- اختر **"Production"**, **"Preview"**, و **"Development"** للجميع

---

### الخطوة 4: نشر المشروع

1. بعد إضافة Environment Variables، اضغط **"Deploy"**

2. انتظر 2-5 دقائق لإكمال النشر

3. ستظهر رسالة: **"Congratulations! Your project has been deployed."**

4. احصل على رابط المشروع:
   ```
   https://kku-course-registration.vercel.app
   ```

---

### الخطوة 5: اختبار النشر

1. افتح الرابط في المتصفح

2. يجب أن ترى صفحة **"تعهد استخدام النظام"**

3. اختبر:
   - ✅ تغيير اللغة (EN/AR)
   - ✅ الوضع الليلي/النهاري
   - ✅ التنقل للصفحة التالية

---

## 5️⃣ إعداد Supabase Edge Functions

### الخطوة 1: تثبيت Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# أو تحميل مباشر من:
# https://github.com/supabase/cli/releases
```

---

### الخطوة 2: تسجيل الدخول

```bash
# تسجيل الدخول لـ Supabase
supabase login

# سيفتح متصفح، سجل دخول بحساب Supabase
```

---

### الخطوة 3: ربط المشروع

```bash
# في مجلد المشروع
cd /path/to/your/project

# ربط بمشروع Supabase
supabase link --project-ref your-project-id

# استبدل your-project-id بـ ID مشروعك من Supabase
```

---

### الخطوة 4: نشر Edge Functions

```bash
# نشر جميع Functions
supabase functions deploy

# أو نشر function محددة
supabase functions deploy make-server-1573e40a
```

---

### الخطوة 5: تعيين Environment Variables للـ Functions

```bash
# تعيين SERVICE_ROLE_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# تعيين SUPABASE_URL
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co

# التحقق من Secrets
supabase secrets list
```

---

## 6️⃣ تحديث Frontend ليستخدم URLs الصحيحة

### الخطوة 1: تحديث `/utils/supabase/info.tsx`

```typescript
export const projectId = "your-new-project-id"
export const publicAnonKey = "your-new-anon-key"
```

---

### الخطوة 2: Commit والرفع

```bash
git add .
git commit -m "🔧 Update Supabase credentials"
git push
```

---

### الخطوة 3: إعادة النشر التلقائي

- Vercel سيكتشف التغييرات تلقائياً
- سيبدأ بإعادة النشر (Re-deploy)
- انتظر 2-3 دقائق

---

## 7️⃣ الاختبار النهائي

### ✅ قائمة اختبار شاملة:

#### 1. اختبار صفحة التعهد
- [ ] الخلفية تظهر بشكل صحيح
- [ ] شعار جامعة الملك خالد يظهر
- [ ] تغيير اللغة يعمل
- [ ] الوضع الليلي يعمل
- [ ] الموافقة على التعهد تعمل

#### 2. اختبار صفحة تسجيل الدخول
- [ ] الخلفية (رؤية 2030) تظهر
- [ ] شعار الجامعة موجود
- [ ] يمكن إدخال البريد وكلمة المرور
- [ ] رسائل الخطأ تظهر بشكل صحيح

#### 3. اختبار التسجيل (Sign Up)
- [ ] فتح صفحة إنشاء حساب
- [ ] ملء جميع الحقول
- [ ] التحقق من صحة البريد (@kku.edu.sa)
- [ ] إنشاء حساب بنجاح
- [ ] إرسال إشعار للطالب

#### 4. اختبار تسجيل الدخول (Login)
- [ ] تسجيل الدخول بالحساب الجديد
- [ ] التوجيه لـ Dashboard الصحيح (حسب الدور)
- [ ] عرض البيانات من قاعدة البيانات
- [ ] إرسال إشعار تسجيل دخول

#### 5. اختبار Dashboard الطالب
- [ ] عرض الاسم والرقم الجامعي
- [ ] عرض المعدل التراكمي الحقيقي
- [ ] عرض المستوى الدراسي
- [ ] عرض التخصص
- [ ] عرض المقررات المسجلة

#### 6. اختبار صفحة المقررات
- [ ] عرض 49 مقرر
- [ ] التصفية حسب المستوى
- [ ] تسجيل مقرر جديد
- [ ] منع التسجيل المكرر

#### 7. اختبار الإشعارات
- [ ] استلام إشعار عند التسجيل
- [ ] استلام إشعار عند تسجيل الدخول
- [ ] عرض عدد الإشعارات غير المقروءة
- [ ] تعليم الإشعار كمقروء

#### 8. اختبار المساعد الذكي
- [ ] فتح نافذة المحادثة
- [ ] إرسال سؤال
- [ ] استقبال رد من المساعد
- [ ] الردود باللغة الصحيحة

---

## 8️⃣ حل المشاكل الشائعة

### ❌ المشكلة 1: "Failed to fetch" عند التسجيل

**السبب:** Edge Functions غير منشورة أو Environment Variables ناقصة

**الحل:**
1. تأكد من نشر Edge Functions:
   ```bash
   supabase functions deploy
   ```
2. تحقق من Secrets:
   ```bash
   supabase secrets list
   ```
3. أعد نشر التطبيق على Vercel

---

### ❌ المشكلة 2: "PGRST116" أو "User not found"

**السبب:** مستخدم يتيم (موجود في Auth فقط، ليس في جدول users)

**الحل:**
1. اذهب لصفحة **"/cleanup"** في التطبيق
2. اضغط **"تنظيف جميع المستخدمين اليتامى"**
3. أعد محاولة التسجيل

---

### ❌ المشكلة 3: "Table does not exist"

**السبب:** لم يتم تشغيل SQL Setup Script

**الحل:**
1. افتح Supabase SQL Editor
2. شغّل `/🔥-COMPLETE-DATABASE-FIX.sql` مرة أخرى
3. تحقق من وجود الجداول:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

### ❌ المشكلة 4: Environment Variables لا تعمل

**السبب:** المتغيرات غير محفوظة في Vercel أو بصيغة خاطئة

**الحل:**
1. في Vercel → Settings → Environment Variables
2. تأكد من:
   - الأسماء صحيحة (بدون مسافات)
   - القيم كاملة (بدون اقتباسات إضافية)
   - مُفعلة لـ Production, Preview, Development
3. أعد النشر:
   - Deployments → Latest → **"Redeploy"**

---

### ❌ المشكلة 5: الصور/الأيقونات لا تظهر

**السبب:** مشكلة في مسارات الملفات

**الحل:**
1. تحقق من وجود `/components/KKULogoSVG.tsx`
2. استخدم مسارات نسبية بدلاً من المطلقة
3. تأكد من استيراد الصور بشكل صحيح

---

## 9️⃣ تحسينات ما بعد النشر

### 🔒 الأمان

```sql
-- تفعيل Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء Policies
CREATE POLICY "Users can view own data" 
ON users FOR SELECT 
USING (auth.uid() = auth_id);

CREATE POLICY "Students can view own data" 
ON students FOR SELECT 
USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
```

---

### ⚡ الأداء

1. **إضافة Indexes إضافية:**
   ```sql
   CREATE INDEX idx_registrations_student_status 
   ON registrations(student_id, status);
   
   CREATE INDEX idx_notifications_user_unread 
   ON notifications(user_id, is_read);
   ```

2. **تفعيل Caching في Vercel:**
   - إضافة `vercel.json`:
   ```json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

---

### 📊 المراقبة

1. **تفعيل Supabase Logs:**
   - Supabase Dashboard → Logs
   - راقب API Requests, Database Queries, Edge Functions

2. **Vercel Analytics:**
   - في Vercel Dashboard → Analytics
   - تفعيل **"Web Analytics"** (مجاني)

3. **Error Tracking:**
   - استخدام Sentry أو LogRocket (اختياري)

---

## 🔟 نسخة احتياطية (Backup)

### إنشاء نسخة احتياطية من قاعدة البيانات:

```bash
# باستخدام Supabase CLI
supabase db dump -f backup.sql

# أو من Dashboard:
# Settings → Database → Connection string
# استخدم pg_dump
```

---

### إنشاء نسخة احتياطية من المشروع:

```bash
# 1. Clone من GitHub
git clone https://github.com/YOUR_USERNAME/kku-course-registration-system.git

# 2. أو تحميل ZIP من GitHub
# Repository → Code → Download ZIP
```

---

## 📞 معلومات إضافية

### روابط مفيدة:

- 📚 **Supabase Docs:** https://supabase.com/docs
- 📚 **Vercel Docs:** https://vercel.com/docs
- 📚 **React Docs:** https://react.dev
- 🐛 **Issues/Support:** GitHub Repository Issues

---

### الدعم الفني:

إذا واجهت أي مشاكل:

1. **تحقق من Console في المتصفح** (F12 → Console)
2. **تحقق من Vercel Logs** (Dashboard → Deployments → View Function Logs)
3. **تحقق من Supabase Logs** (Dashboard → Logs)
4. **راجع هذا الدليل** مرة أخرى
5. **اسأل المساعد الذكي** في النظام

---

## ✅ قائمة التحقق النهائية

قبل تسليم المشروع، تأكد من:

### قاعدة البيانات:
- [x] Supabase Project منشئ
- [x] 6 جداول موجودة
- [x] 49 مقرر مُدخلة
- [x] Environment Variables محفوظة

### GitHub:
- [x] Repository منشئ
- [x] جميع الملفات مرفوعة
- [x] README.md موجود
- [x] `.gitignore` مُعد بشكل صحيح

### Vercel:
- [x] التطبيق منشور ويعمل
- [x] Environment Variables مُعدة
- [x] Custom Domain (اختياري)
- [x] HTTPS مُفعل

### الوظائف:
- [x] التسجيل يعمل
- [x] تسجيل الدخول يعمل
- [x] Dashboard يعرض بيانات حقيقية
- [x] المقررات تُعرض (49 مقرر)
- [x] الإشعارات تعمل
- [x] المساعد الذكي يستجيب

### التصميم:
- [x] الهوية البصرية صحيحة (#184A2C + #D4AF37)
- [x] شعار جامعة الملك خالد موجود
- [x] الخلفيات جميلة
- [x] رؤية 2030 مذكورة
- [x] Responsive على جميع الأجهزة

---

## 🎉 تهانينا!

لقد نشرت بنجاح **أقوى نظام تسجيل مقررات** في جامعة الملك خالد! 🚀

النظام الآن:
- ✅ منشور على Vercel
- ✅ متصل بـ Supabase
- ✅ مرفوع على GitHub
- ✅ يعمل بكامل طاقته
- ✅ جاهز للاستخدام الفعلي

---

**© 2025 جامعة الملك خالد - جميع الحقوق محفوظة**
