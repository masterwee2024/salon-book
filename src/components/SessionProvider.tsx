import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Session {
  phone: string | null;
  name: string | null;
  setSession: (phone: string, name?: string) => void;
  clear: () => void;
}

const SessionContext = createContext<Session>({
  phone: null,
  name: null,
  setSession: () => {},
  clear: () => {},
});

const STORAGE_KEY = "salon-book.session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.phone) {
          setPhone(parsed.phone);
          setName(parsed.name ?? null);
        }
      }
    } catch {
      // ignore corrupt session
    }
  }, []);

  const setSession = (nextPhone: string, nextName?: string) => {
    setPhone(nextPhone);
    setName(nextName ?? null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: nextPhone, name: nextName ?? null }));
    } catch {
      // storage unavailable
    }
  };

  const clear = () => {
    setPhone(null);
    setName(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  };

  return (
    <SessionContext.Provider value={{ phone, name, setSession, clear }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);