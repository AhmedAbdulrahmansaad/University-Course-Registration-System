import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'ai' | 'fallback' | 'error';
}

export const AIAssistant: React.FC = () => {
  const { language, currentPage, userInfo } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: language === 'ar' 
        ? `👋 مرحباً ${userInfo?.name || ''}! أنا المساعد الذكي لجامعة الملك خالد.\n\n✨ يمكنني مساعدتك في:\n${userInfo?.role === 'supervisor' 
          ? '• 📋 طلبات الطلاب\n• 📊 التقارير\n• 🎓 إدارة القسم'
          : userInfo?.role === 'admin'
          ? '• 📈 الإحصائيات\n• 🏢 الأقسام\n• ⚠️ المشاكل والحلول'
          : '• 📚 المقررات والتسجيل\n• 📅 الجدول الدراسي\n• 📊 المعدل والساعات\n• 🔍 التعارضات'
        }\n\nاسألني أي شيء! 🤔`
        : `👋 Hello ${userInfo?.name || ''}! I'm the King Khalid University Smart Assistant.\n\n✨ I can help you with:\n${userInfo?.role === 'supervisor' 
          ? '• 📋 Student requests\n• 📊 Reports\n• 🎓 Department management'
          : userInfo?.role === 'admin'
          ? '• 📈 Statistics\n• 🏢 Departments\n• ⚠️ Issues and solutions'
          : '• 📚 Courses and registration\n• 📅 Class schedule\n• 📊 GPA and hours\n• 🔍 Conflicts'
        }\n\nAsk me anything! 🤔`,
      isUser: false,
      timestamp: new Date(),
      type: 'ai',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update greeting when user info changes
  useEffect(() => {
    if (userInfo && messages.length === 1) {
      setMessages([{
        id: '0',
        text: language === 'ar' 
          ? `👋 مرحباً ${userInfo.name}! أنا المساعد الذكي لجامعة الملك خالد.\n\n✨ يمكنني مساعدتك في:\n${userInfo.role === 'supervisor' 
            ? '• 📋 طلبات الطلاب\n• 📊 التقارير\n• 🎓 إدارة القسم'
            : userInfo.role === 'admin'
            ? '• 📈 الإحصائيات\n• 🏢 الأقسام\n• ⚠️ المشاكل والحلول'
            : '• 📚 المقررات والتسجيل\n• 📅 الجدول الدراسي\n• 📊 المعدل والساعات\n• 🔍 التعارضات'
          }\n\nاسألني أي شيء! 🤔`
          : `👋 Hello ${userInfo.name}! I'm the King Khalid University Smart Assistant.\n\n✨ I can help you with:\n${userInfo.role === 'supervisor' 
            ? '• 📋 Student requests\n• 📊 Reports\n• 🎓 Department management'
            : userInfo.role === 'admin'
            ? '• 📈 Statistics\n• 🏢 Departments\n• ⚠️ Issues and solutions'
            : '• 📚 Courses and registration\n• 📅 Class schedule\n• 📊 GPA and hours\n• 🔍 Conflicts'
          }\n\nAsk me anything! 🤔`,
        isUser: false,
        timestamp: new Date(),
        type: 'ai',
      }]);
    }
  }, [userInfo, language]);

  const getAIResponse = async (query: string): Promise<{ response: string; type: 'ai' | 'fallback' | 'error' }> => {
    try {
      // جلب بيانات المستخدم الحالية
      let contextData: any = {
        userInfo: {
          name: userInfo?.name,
          id: userInfo?.id,
          role: userInfo?.role || 'student',
          level: userInfo?.level,
          major: userInfo?.major,
          gpa: userInfo?.gpa,
          access_token: userInfo?.access_token,
        },
      };

      // ✅ محاولة الحصول على رد ذكي من السيرفر
      try {
        console.log('🤖 [AI Assistant] Sending query to backend:', query);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/ai-assistant`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              query,
              context: contextData,
              language,
              currentPage,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [AI Assistant] Got AI response from backend');
          
          if (data.response) {
            return { 
              response: data.response, 
              type: 'ai' 
            };
          }
        } else {
          console.warn('⚠️ [AI Assistant] Backend returned error:', response.status);
        }
      } catch (fetchError) {
        console.warn('⚠️ [AI Assistant] Backend fetch failed, using fallback:', fetchError);
      }

      // 🔄 FALLBACK: ردود ذكية محلية
      console.log('🔄 [AI Assistant] Using smart local responses...');
      return getSmartLocalResponse(query, userInfo, language, currentPage);

    } catch (error: any) {
      console.error('❌ [AI Assistant] Error:', error);
      return {
        response: language === 'ar'
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.',
        type: 'error',
      };
    }
  };

  // 🧠 ردود ذكية محلية (Fallback)
  const getSmartLocalResponse = (
    query: string, 
    userInfo: any, 
    language: string, 
    currentPage: string
  ): { response: string; type: 'fallback' } => {
    const lowerQuery = query.toLowerCase();

    // 1. أسئلة عن التسجيل
    if (lowerQuery.includes('تسجيل') || lowerQuery.includes('register') || lowerQuery.includes('مقرر')) {
      return {
        response: language === 'ar'
          ? `📚 **كيفية تسجيل المقررات:**\n\n1. انتقل إلى صفحة "المقررات الدراسية"\n2. اختر المقررات المناسبة لمستواك (${userInfo?.level || 1})\n3. اضغط على "تسجيل" للمقرر المطلوب\n4. انتظر موافقة المشرف الأكاديمي\n\n💡 **نصيحة:** تأكد من عدم وجود تعارض في المواعيد!`
          : `📚 **How to Register Courses:**\n\n1. Go to "Courses" page\n2. Select courses for your level (${userInfo?.level || 1})\n3. Click "Register" for the desired course\n4. Wait for advisor approval\n\n💡 **Tip:** Make sure there are no time conflicts!`,
        type: 'fallback'
      };
    }

    // 2. أسئلة عن المعدل
    if (lowerQuery.includes('معدل') || lowerQuery.includes('gpa') || lowerQuery.includes('درجات')) {
      const currentGPA = userInfo?.gpa || 0;
      return {
        response: language === 'ar'
          ? `📊 **معلومات المعدل التراكمي:**\n\nمعدلك الحالي: **${currentGPA.toFixed(2)}** من 5.00\n\n${currentGPA >= 4.5 ? '🌟 ممتاز جداً! استمر!' : currentGPA >= 3.5 ? '👍 جيد جداً!' : currentGPA >= 2.5 ? '📈 يمكنك التحسين' : '⚠️ يجب رفع المعدل'}\n\n💡 لرفع معدلك:\n• احضر المحاضرات بانتظام\n• راجع المقررات أولاً بأول\n• استخدم مصادر إضافية للتعلم`
          : `📊 **GPA Information:**\n\nYour current GPA: **${currentGPA.toFixed(2)}** out of 5.00\n\n${currentGPA >= 4.5 ? '🌟 Excellent! Keep it up!' : currentGPA >= 3.5 ? '👍 Very Good!' : currentGPA >= 2.5 ? '📈 Room for improvement' : '⚠️ Need to improve'}\n\n💡 To improve your GPA:\n• Attend lectures regularly\n• Review courses regularly\n• Use additional learning resources`,
        type: 'fallback'
      };
    }

    // 3. أسئلة عن الجدول
    if (lowerQuery.includes('جدول') || lowerQuery.includes('schedule') || lowerQuery.includes('مواعيد')) {
      return {
        response: language === 'ar'
          ? `📅 **الجدول الدراسي:**\n\nيمكنك عرض جدولك الدراسي من خلال:\n• الانتقال إلى صفحة "الجدول الدراسي"\n• هناك ستجد جميع المقررات المسجلة مع مواعيدها\n• يمكنك تحميل الجدول بصيغة PDF\n\n⚡ الجدول يُحدّث تلقائياً عند تسجيل مقررات جديدة`
          : `📅 **Class Schedule:**\n\nYou can view your schedule by:\n• Going to "Schedule" page\n• You'll find all registered courses with timings\n• You can download the schedule as PDF\n\n⚡ Schedule updates automatically when new courses are registered`,
        type: 'fallback'
      };
    }

    // 4. أسئلة عن المستوى
    if (lowerQuery.includes('مستوى') || lowerQuery.includes('level')) {
      return {
        response: language === 'ar'
          ? `🎓 **معلومات المستوى:**\n\nأنت حالياً في المستوى ${userInfo?.level || 1}\nالتخصص: ${userInfo?.major || 'نظم المعلومات الإدارية'}\n\n💡 **لتحديث مستواك:**\n1. أكمل جميع مقررات المستوى الحالي\n2. احصل على موافقة المشرف\n3. سيتم تحديث مستواك تلقائياً`
          : `🎓 **Level Information:**\n\nYou are currently in Level ${userInfo?.level || 1}\nMajor: ${userInfo?.major || 'MIS'}\n\n💡 **To update your level:**\n1. Complete all current level courses\n2. Get advisor approval\n3. Your level will update automatically`,
        type: 'fallback'
      };
    }

    // 5. أسئلة عن الساعات
    if (lowerQuery.includes('ساعات') || lowerQuery.includes('hours') || lowerQuery.includes('credits')) {
      return {
        response: language === 'ar'
          ? `⏰ **معلومات الساعات المعتمدة:**\n\nيمكنك الاطلاع على:\n• إجمالي الساعات المكتسبة\n• الساعات المسجلة حالياً\n• الساعات المتبقية للتخرج\n\nمن خلال لوحة التحكم الرئيسية\n\n📊 الحد الأقصى للتسجيل: 18 ساعة\nالحد الأدنى: 12 ساعة`
          : `⏰ **Credit Hours Information:**\n\nYou can view:\n• Total earned hours\n• Currently registered hours\n• Remaining hours for graduation\n\nFrom the main dashboard\n\n📊 Maximum registration: 18 hours\nMinimum: 12 hours`,
        type: 'fallback'
      };
    }

    // 6. أسئلة عن المشرف
    if (lowerQuery.includes('مشرف') || lowerQuery.includes('advisor') || lowerQuery.includes('موافقة')) {
      return {
        response: language === 'ar'
          ? `👨‍🏫 **المشرف الأكاديمي:**\n\nالمشرف يقوم بـ:\n• مراجعة طلبات التسجيل\n• الموافقة أو رفض المقررات\n• متابعة تقدمك الأكاديمي\n\n⏱️ **وقت الموافقة:**\nعادةً خلال 1-3 أيام عمل\n\n📩 يمكنك التواصل معه عبر صفحة "الرسائل"`
          : `👨‍🏫 **Academic Advisor:**\n\nThe advisor:\n• Reviews registration requests\n• Approves or rejects courses\n• Monitors your academic progress\n\n⏱️ **Approval time:**\nUsually within 1-3 business days\n\n📩 You can contact them via "Messages" page`,
        type: 'fallback'
      };
    }

    // 7. تحية
    if (
      lowerQuery.includes('مرحبا') || 
      lowerQuery.includes('hello') || 
      lowerQuery.includes('hi') ||
      lowerQuery.includes('السلام')
    ) {
      return {
        response: language === 'ar'
          ? `👋 مرحباً ${userInfo?.name || ''}!\n\nأنا هنا لمساعدتك في:\n• التسجيل والجداول\n• المعدل والساعات\n• الاستفسارات الأكاديمية\n\nكيف يمكنني مساعدتك اليوم؟ 😊`
          : `👋 Hello ${userInfo?.name || ''}!\n\nI'm here to help you with:\n• Registration and schedules\n• GPA and credits\n• Academic inquiries\n\nHow can I help you today? 😊`,
        type: 'fallback'
      };
    }

    // 8. شكر
    if (lowerQuery.includes('شكر') || lowerQuery.includes('thank')) {
      return {
        response: language === 'ar'
          ? `🌟 العفو! سعيد بمساعدتك.\n\nلا تتردد في طرح أي سؤال آخر! 😊`
          : `🌟 You're welcome! Happy to help.\n\nFeel free to ask anything else! 😊`,
        type: 'fallback'
      };
    }

    // 9. رد افتراضي ذكي
    return {
      response: language === 'ar'
        ? `🤔 سؤال جيد!\n\nأنا هنا لمساعدتك في:\n\n📚 **التسجيل:**\n• كيفية تسجيل المقررات\n• متطلبات المقررات\n• حل التعارضات\n\n📊 **المعدل:**\n• حساب المعدل\n• تحسين الأداء الأكاديمي\n\n📅 **الجدول:**\n• عرض الجدول الدراسي\n• تحميل الجدول\n\n⏰ **الساعات:**\n• الساعات المكتسبة\n• المتبقي للتخرج\n\nجرب سؤالاً أكثر تحديداً! 😊`
        : `🤔 Great question!\n\nI'm here to help with:\n\n📚 **Registration:**\n• How to register courses\n• Course requirements\n• Resolve conflicts\n\n📊 **GPA:**\n• Calculate GPA\n• Improve academic performance\n\n📅 **Schedule:**\n• View class schedule\n• Download schedule\n\n⏰ **Hours:**\n• Earned hours\n• Remaining for graduation\n\nTry a more specific question! 😊`,
      type: 'fallback'
    };
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const { response, type } = await getAIResponse(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        type,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'ar'
          ? '😔 عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : '😔 Sorry, an error occurred. Please try again.',
        isUser: false,
        timestamp: new Date(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // إخفاء الزر العائم إذا كان المستخدم في صفحة المساعد الذكي
  if (currentPage === 'assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50" dir="ltr">
      {/* نافذة المحادثة */}
      {isOpen && (
        <Card className="w-80 md:w-96 mb-4 p-4 shadow-2xl animate-fade-in border-2 border-kku-green/20 dark:border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-kku-green to-kku-gold p-2 rounded-full relative">
                <Bot className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">
                    {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                  </h3>
                  <Sparkles className="h-3 w-3 text-kku-gold" />
                </div>
                <p className="text-xs text-green-500">
                  {language === 'ar' ? 'متصل الآن' : 'Online now'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <ScrollArea className="h-80 mb-4 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {!message.isUser && (
                      <div className="bg-gradient-to-br from-kku-green to-kku-gold p-1.5 rounded-full flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.isUser
                          ? 'bg-kku-green text-white dark:bg-primary'
                          : message.type === 'error'
                          ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      {!message.isUser && message.type === 'ai' && (
                        <Badge 
                          variant="secondary" 
                          className="mt-2 text-xs bg-kku-gold/20 text-kku-gold border-none"
                        >
                          <Sparkles className="h-2 w-2 mr-1" />
                          {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
                        </Badge>
                      )}
                      {!message.isUser && message.type === 'fallback' && (
                        <Badge 
                          variant="outline" 
                          className="mt-2 text-xs"
                        >
                          {language === 'ar' ? 'رد تلقائي' : 'Auto Response'}
                        </Badge>
                      )}
                    </div>
                    
                    {message.isUser && (
                      <div className="bg-kku-green/20 p-1.5 rounded-full flex-shrink-0 mt-1">
                        <User className="h-3 w-3 text-kku-green dark:text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="bg-gradient-to-br from-kku-green to-kku-gold p-1.5 rounded-full">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-muted px-4 py-2 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
              disabled={isTyping}
              className="flex-1"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-kku-green hover:bg-kku-green/90 dark:bg-primary dark:hover:bg-primary/90"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            {language === 'ar' 
              ? '💡 يمكنني مساعدتك في أي استفسار أكاديمي'
              : '💡 I can help with any academic inquiry'
            }
          </p>
        </Card>
      )}

      {/* زر فتح المحادثة */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-kku-green to-kku-gold hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </Button>
    </div>
  );
};