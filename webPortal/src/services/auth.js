// src/services/auth.js
export const verifyAuth = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return { authenticated: false };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return { authenticated: false };
  }
};

export const logout = async () => {
  const csrfToken = getCsrfToken();
  await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    }
  });
};

export const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }
  return null;
};

export const isAuthenticated = async () => {
  const result = await verifyAuth();
  return result.authenticated;
};