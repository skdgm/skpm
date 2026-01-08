
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjq3Iv2A2IuY2VQW3ZWOGaQwwBLWemo-mv1Wnl8iGrZb6JLYEUXhQktqpoMlNVmp7A4A/exec';

export const authenticateUser = async (email: string, password: string): Promise<boolean> => {
  try {
    const url = `${SCRIPT_URL}?type=checkLogin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    // We use 'no-cors' is not possible for JSON results, 
    // but Google Apps Script handles redirects.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Auth Script Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Auth Service Error:", error);
    return false;
  }
};
