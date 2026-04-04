import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken } from '@/api/client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  difficultyLevel?: string;
  lastQuizAverage?: number | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
};

const STORAGE_KEY = 'dls_token';
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!!token);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!token) return;
    setAuthToken(token);
    const { data } = await api.get('/user-data');
    setUser(data.user);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      setAuthToken(null);
      return;
    }
    setAuthToken(token);
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/user-data');
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post('/register', { name, email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUserData,
    }),
    [token, user, loading, login, register, logout, refreshUserData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
