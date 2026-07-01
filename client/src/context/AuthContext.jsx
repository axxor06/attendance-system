import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, try a silent refresh (httpOnly cookie) to restore the
  // session without forcing the person to log in again every page reload.
  useEffect(() => {
    async function bootstrap() {
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.getMe();
    setUser(data.data.user);
    return data.data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
