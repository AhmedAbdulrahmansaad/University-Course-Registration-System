/**
 * ✅ مساعد لإدارة طلبات fetch مع منع الأخطاء غير الضرورية
 * 
 * الهدف: تجنب أخطاء "Failed to fetch" عندما يكون السيرفر غير متاح
 */

export const SERVER_AVAILABLE = true; // ✅ السيرفر متاح الآن!

/**
 * fetch آمن - لا يُظهر أخطاء في Console
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  if (!SERVER_AVAILABLE) {
    console.log(`ℹ️ [SafeFetch] Server disabled, skipping: ${url}`);
    return null;
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.log(`ℹ️ [SafeFetch] Silent fail: ${url}`);
    return null;
  }
}

/**
 * fetch آمن مع JSON
 */
export async function safeFetchJSON<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  const response = await safeFetch(url, options);

  if (!response) {
    return { data: null, error: 'Server unavailable' };
  }

  if (!response.ok) {
    return { data: null, error: `HTTP ${response.status}` };
  }

  try {
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'Invalid JSON' };
  }
}