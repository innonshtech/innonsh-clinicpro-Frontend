import axios from 'axios';

// Central API configuration
// Change this to your production URL when deploying
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Safely extracts the JWT auth token from localStorage (checking both 'token' key and 'user.token').
 */
const sanitizeToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  let clean = token.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean === 'undefined' || clean === 'null' || clean === '[object Object]') return '';
  return clean;
};

/**
 * Safely extracts the JWT auth token from localStorage.
 */
export const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  
  const keys = ['token', 'adminToken', 'jwt', 'authToken'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    const clean = sanitizeToken(raw);
    if (clean) return clean;
  }
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        const clean = sanitizeToken(user.token);
        if (clean) return clean;
      }
    }
  } catch (e) {}
  
  return '';
};

/**
 * Returns Authorization header object formatted as Bearer <token>.
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Singleton in-flight refresh promise to prevent concurrent refreshes and token reuse detection
let refreshPromise = null;

/**
 * Calls backend /api/v1/auth/refresh using existing 7-day httpOnly refreshToken cookie.
 * Updates localStorage['token'] and retries smoothly.
 */
export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // sends the httpOnly refreshToken cookie
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with status ${response.status}`);
      }

      const resData = await response.json();
      const newToken = resData?.data?.token;

      if (!newToken) {
        throw new Error('No token returned from refresh');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.token = newToken;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (e) {}
      }

      return newToken;
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Global Axios Interceptors for Token Refresh
if (typeof window !== 'undefined' && !axios.__auth_interceptor_attached) {
  axios.__auth_interceptor_attached = true;
  axios.defaults.withCredentials = true;

  axios.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token && (!config.headers['Authorization'] || config.headers['Authorization'] === 'Bearer ')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/api/v1/auth/refresh') &&
        !originalRequest.url?.includes('/api/v1/auth/onelogin') &&
        !originalRequest.url?.includes('/api/v1/admin/auth/login')
      ) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAccessToken();
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshErr) {
          return Promise.reject(refreshErr);
        }
      }
      return Promise.reject(error);
    }
  );
}

// Global window.fetch wrapper to ensure cookie credentials and 401 refresh retry for fetch calls
if (typeof window !== 'undefined' && !window.__fetch_auth_intercepted) {
  window.__fetch_auth_intercepted = true;
  const originalFetch = window.fetch;

  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';

    if (url.includes(API_BASE_URL) || url.startsWith('/api/')) {
      if (!init.credentials) {
        init.credentials = 'include';
      }
    }

    let response = await originalFetch(input, init);

    if (
      response.status === 401 &&
      !url.includes('/api/v1/auth/refresh') &&
      !url.includes('/api/v1/auth/onelogin') &&
      !url.includes('/api/v1/admin/auth/login') &&
      !init._retry
    ) {
      init._retry = true;
      try {
        const newToken = await refreshAccessToken();
        const headers = new Headers(init.headers || {});
        headers.set('Authorization', `Bearer ${newToken}`);
        init.headers = headers;
        response = await originalFetch(input, init);
      } catch (e) {
        // Refresh failed, let caller handle 401
      }
    }

    return response;
  };
}
