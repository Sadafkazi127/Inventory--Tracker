import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, ApiError, getToken, setToken, setUnauthorizedHandler } from '@/lib/apiClient';

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  // Restore session on launch by validating the stored token against the server
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user: me } = await api.get<{ user: AuthUser }>('/auth/me');
        setUser(me);
      } catch {
        await setToken(null);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await api.post<{ token: string; user: AuthUser }>(
        '/auth/login',
        { username, password },
        { skipAuth: true }
      );
      await setToken(result.token);
      setUser(result.user);
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        await api.put('/auth/password', { currentPassword, newPassword });
        return true;
      } catch (err) {
        if (err instanceof ApiError) return false;
        throw err;
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
