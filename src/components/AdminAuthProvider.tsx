import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { adminLogin } from "../lib/api";

const TOKEN_KEY = "salon-book.admin-token";
const SAVED_PW_KEY = "salon-book.admin-pw";

interface AdminAuth {
  token: string | null;
  login: (password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  savedPassword: string | null;
  clearSavedPassword: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuth>({
  token: null,
  login: async () => {},
  logout: () => {},
  savedPassword: null,
  clearSavedPassword: () => {},
  loading: true,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
      const pw = localStorage.getItem(SAVED_PW_KEY);
      if (pw) setSavedPassword(pw);
    } catch {}
    setLoading(false);
  }, []);

  const login = async (password: string, remember = false) => {
    const t = await adminLogin(password);
    setToken(t);
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    if (remember) {
      setSavedPassword(password);
      try { localStorage.setItem(SAVED_PW_KEY, password); } catch {}
    } else {
      clearSavedPassword();
    }
  };

  const logout = () => {
    setToken(null);
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  };

  const clearSavedPassword = () => {
    setSavedPassword(null);
    try { localStorage.removeItem(SAVED_PW_KEY); } catch {}
  };

  return (
    <AdminAuthContext.Provider value={{ token, login, logout, savedPassword, clearSavedPassword, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);