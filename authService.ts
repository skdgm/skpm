
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjq3Iv2A2IuY2VQW3ZWOGaQwwBLWemo-mv1Wnl8iGrZb6JLYEUXhQktqpoMlNVmp7A4A/exec';

export const authenticateUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Safari on iOS often fails when redirects happen in 'cors' mode 
    // for certain Google Script endpoints.
    // Lowercase email is critical because iOS keyboard auto-capitalizes.
    const cleanEmail = email.toLowerCase().trim();
    
    // We add a timestamp 't' to the URL to prevent Safari from returning a cached (possibly failed) response
    const url = `${SCRIPT_URL}?type=checkLogin&email=${encodeURIComponent(cleanEmail)}&password=${encodeURIComponent(password)}&t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store', // Force Safari to check the server every time
      credentials: 'omit', // Standard for public scripts to avoid CORS preflight issues
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Authentication Service Failure:", error);
    // If we reach here, it's likely a network error or a blocked redirect in Safari
    return false;
  }
};
