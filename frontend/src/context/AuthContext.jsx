import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY, USER_KEY } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const saveSession = useCallback((data) => {
    const { token, ...profile } = data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // On first load, confirm the stored token is still valid.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/profile')
      .then((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        setUser(res.data);
      })
      .catch((err) => {
        // Only drop the session if the server said the token is bad (network errors keep it).
        if (err.response && err.response.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [logout]);

  // The axios interceptor fires this when any request returns 401 with a stale token.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(
    async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data),
    [saveSession]
  );

  const register = useCallback(
    async (name, email, password) =>
      saveSession((await api.post('/auth/register', { name, email, password })).data),
    [saveSession]
  );

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
