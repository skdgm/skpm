
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjq3Iv2A2IuY2VQW3ZWOGaQwwBLWemo-mv1Wnl8iGrZb6JLYEUXhQktqpoMlNVmp7A4A/exec';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export const authenticateUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();
    
    // Add cache-busting timestamp and type parameter
    const url = `${SCRIPT_URL}?type=checkLogin&email=${encodeURIComponent(cleanEmail)}&password=${encodeURIComponent(cleanPass)}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      return { success: false, error: `Server Response Error (${response.status})` };
    }
    
    const data = await response.json();
    
    if (data && data.success === true) {
      return { success: true };
    } else {
      return { success: false, error: data?.message || 'Invalid Credentials' };
    }
  } catch (error) {
    console.error("Auth Exception:", error);
    return { success: false, error: 'Network Connection Failed' };
  }
};
