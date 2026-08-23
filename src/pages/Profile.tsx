import { useEffect, useState } from "react";
import { useSession } from "../components/SessionProvider";
import { useTheme } from "../components/ThemeProvider";
import { Appointment } from "../types";
import { getAppointments } from "../lib/api";
import { format, parseISO } from "date-fns";
import { History, Phone, LogOut, User as UserIcon, Shield, Sun, Moon, Monitor } from "lucide-react";
import { motion } from "motion/react";
import { cn, isValidMalaysianMobile, normalizeMalaysianMobile } from "../lib/utils";

export function Profile({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { phone, name, setSession, clear } = useSession();
  const { theme, setTheme } = useTheme();
  const [phoneInput, setPhoneInput] = useState("");
  const [touched, setTouched] = useState(false);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!phone) return;
      setLoading(true);
      try { setHistory(await getAppointments(phone, "history")); }
      catch { setHistory([]); }
      finally { setLoading(false); }
    }
    fetchHistory();
  }, [phone]);

  if (!phone) {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 shadow-sm flex items-center justify-center">
          <UserIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-xl font-medium text-slate-900 dark:text-white">Guest Mode</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          Enter your Malaysian mobile number to view your booking history.
        </p>

        <div className="w-full mt-6">
          <div className={cn("flex items-center space-x-3 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm px-4 py-4", touched && !isValidMalaysianMobile(phoneInput) ? "border-red-400" : "border-slate-100 dark:border-slate-700")}>
            <Phone className="w-5 h-5 text-slate-400 shrink-0" />
            <input type="tel" inputMode="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onBlur={() => setTouched(true)} placeholder="012-3456789" className="flex-1 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent" />
          </div>
          {touched && !isValidMalaysianMobile(phoneInput) && (
            <p className="text-sm text-red-500 mt-2">Please enter a valid Malaysian mobile number (e.g. 012-3456789).</p>
          )}
        </div>

        <button onClick={() => { setTouched(true); if (isValidMalaysianMobile(phoneInput)) setSession(normalizeMalaysianMobile(phoneInput)); }}
          className="mt-6 w-full py-4 rounded-full font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg flex items-center justify-center">
          View My Bookings
        </button>

        <ThemeToggle theme={theme} setTheme={setTheme} />

          <button onClick={onOpenAdmin} className="mt-4 w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <Shield className="w-5 h-5" /><span className="flex-1 text-left text-sm font-medium">Admin</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-28">
      <div className="bg-white dark:bg-slate-950 px-6 py-10 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 shadow-sm flex items-center justify-center text-2xl font-light text-slate-900 dark:text-white">
          {name?.charAt(0) || 'G'}
        </div>
        <h1 className="text-xl font-medium text-slate-900 dark:text-white">{name || 'Guest'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{phone}</p>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4 uppercase tracking-wide">Service History</h3>
        {loading ? (
          <div className="animate-pulse space-y-4"><div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" /></div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((appt, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={appt.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">{appt.serviceName}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{format(parseISO(appt.date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300">{appt.status}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-center shadow-sm">
            <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No past appointments found.</p>
          </div>
        )}

        <ThemeToggle theme={theme} setTheme={setTheme} />

        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <button onClick={() => { clear(); setPhoneInput(""); setTouched(false); }}
            className="w-full px-5 py-4 flex items-center space-x-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600">
            <LogOut className="w-5 h-5" /><span className="flex-1 text-left font-medium">Switch Phone Number</span>
          </button>
        </div>

        <button onClick={onOpenAdmin}
          className="mt-4 w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <Shield className="w-5 h-5" /><span className="flex-1 text-left text-sm font-medium">Admin</span>
        </button>
      </div>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (t: "light" | "dark" | "system") => void }) {
  const opts = [
    { id: "light" as const, icon: Sun, label: "Light" },
    { id: "dark" as const, icon: Moon, label: "Dark" },
    { id: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div className="mt-6 mb-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Theme</p>
      <div className="flex items-center justify-between px-2">
        {opts.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTheme(id)}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            className={cn("flex h-14 w-14 items-center justify-center rounded-2xl p-4 text-sm font-medium transition-colors",
              theme === id ? "bg-slate-900 dark:bg-white dark:text-slate-900 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600")}>
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
