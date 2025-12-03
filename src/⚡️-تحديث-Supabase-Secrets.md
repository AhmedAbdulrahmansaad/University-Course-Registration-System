# ⚡️ تحديث Supabase Secrets - خطوة واحدة فقط!

## 🎯 الهدف:
ربط Edge Function بقاعدة البيانات الصحيحة

---

## 📋 الخطوات (دقيقة واحدة):

### 1. افتح Supabase Dashboard:
اذهب إلى: https://supabase.com/dashboard/project/kcbxyonombsqamwsmmqz

### 2. افتح Edge Functions Secrets:
- من القائمة الجانبية → **Edge Functions**
- اضغط على تبويب **Secrets** (في الأعلى)

### 3. تحقق من القيم الموجودة:
يجب أن تجد:
- ✅ `SUPABASE_URL` = `https://kcbxyonombsqamwsmmqz.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (الـ key الطويل)

### 4. إذا كانت القيم صحيحة:
✅ لا تحتاج أي شيء! انتقل للخطوة التالية

### 5. إذا كانت القيم خاطئة أو غير موجودة:
اضغط **Add Secret** وأضف:

**Secret 1:**
```
Name: SUPABASE_URL
Value: https://kcbxyonombsqamwsmmqz.supabase.co
```

**Secret 2:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnh5b25vbWJzcWFtd3NtbXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM3MDc5MywiZXhwIjoyMDc5OTQ2NzkzfQ.5cgLm3CjLP0NzGE6riqoZTtABW1wljEEJ7iH0XAeJR0
```

---

## ✅ تم التحديث!

الآن النظام مربوط بمشروعك الصحيح:
- ✅ Project ID: `kcbxyonombsqamwsmmqz`
- ✅ Project URL: `https://kcbxyonombsqamwsmmqz.supabase.co`
- ✅ Frontend متصل بالمشروع الصحيح
- ✅ Edge Functions جاهزة (بعد تحديث Secrets)

---

## 🚀 الخطوة التالية:

**بعد تحديث الـ Secrets (إذا كان مطلوباً):**

1. ✅ ارفع Edge Function مرة أخرى:
   - اذهب لـ Edge Functions في Dashboard
   - اضغط Deploy
   - أو استخدم Supabase CLI

2. ✅ جرب إنشاء حساب جديد:
   ```
   البريد: student1@kku.edu.sa
   الباسوورد: Student@123
   الاسم: محمد علي السعيد
   الرقم الجامعي: 443210001
   التخصص: نظم المعلومات الإدارية
   المستوى: 5
   المعدل: 4.50
   ```

3. ✅ سجل دخول وخبرني النتيجة!

---

## ❓ إذا ظهرت أخطاء:

افتح Console (F12) وأرسل لي:
- ❌ رسالة الخطأ
- ❌ الـ logs في Console
- ❌ screenshot للخطأ

وسأصلحها فوراً! 🔧
