import axios from 'axios';

export const TOKEN_KEY = 'bookstore_token';
export const USER_KEY = 'bookstore_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server rejects our token (expired/invalid), clear the session and tell the app.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && hadToken && !isAuthForm) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into a readable message.
export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  (error?.request ? 'Cannot reach the server. Check that the backend is running.' : error?.message) ||
  'Something went wrong';

export default api;
