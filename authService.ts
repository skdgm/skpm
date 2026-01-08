
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjq3Iv2A2IuY2VQW3ZWOGaQwwBLWemo-mv1Wnl8iGrZb6JLYEUXhQktqpoMlNVmp7A4A/exec';

export const authenticateUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // CRITICAL for iPhone: Force everything to lowercase and trim spaces
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();
    
    // Add timestamp to prevent Safari caching a previous 401/403 result
    const url = `${SCRIPT_URL}?type=checkLogin&email=${encodeURIComponent(cleanEmail)}&password=${encodeURIComponent(cleanPass)}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit'
    });

    if (!response.ok) {
      console.warn("Auth script returned error status:", response.status);
      return false;
    }
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Authentication Network Error:", error);
    return false;
  }
};
