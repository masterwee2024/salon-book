import { useState, type FormEvent } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { adminResetPassword } from "../../lib/api";
import { Lock, KeyRound } from "lucide-react";

export function AdminLogin() {
  const { login, savedPassword } = useAdminAuth();
  const [password, setPassword] = useState(savedPassword ?? "");
  const [remember, setRemember] = useState(!!savedPassword);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try { await login(password, remember); }
    catch { setError("Invalid password."); }
    finally { setLoading(false); }
  };

  if (showReset) return <ResetPassword onBack={() => setShowReset(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <h1 className="text-xl font-medium text-slate-900 dark:text-white text-center mb-1">Admin Login</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Enter the admin password to continue.</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-500 bg-transparent mb-3" />
        <label className="flex items-center space-x-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-slate-900" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Remember password</span>
        </label>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <button type="submit" disabled={loading || !password} className="w-full py-3 rounded-xl font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 disabled:opacity-50">{loading ? "Logging in..." : "Login"}</button>
        <button type="button" onClick={() => setShowReset(true)} className="w-full mt-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Forgot password?</button>
      </form>
    </div>
  );
}

function ResetPassword({ onBack }: { onBack: () => void }) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await adminResetPassword(recoveryKey, newPassword); setSuccess(true); }
    catch { setError("Invalid recovery key."); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"><KeyRound className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
        <h1 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Password Reset</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your password has been updated.</p>
        <button onClick={onBack} className="w-full py-3 rounded-xl font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900">Back to Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleReset} className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6"><KeyRound className="w-6 h-6 text-slate-600 dark:text-slate-300" /></div>
        <h1 className="text-xl font-medium text-slate-900 dark:text-white text-center mb-1">Reset Password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Enter your recovery key and a new password.</p>
        <input type="text" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)} placeholder="Recovery key"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-400 bg-transparent mb-3 font-mono text-sm" />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 4 chars)"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-400 bg-transparent mb-3" />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <button type="submit" disabled={loading || !recoveryKey || newPassword.length < 4}
          className="w-full py-3 rounded-xl font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 disabled:opacity-50">{loading ? "Resetting..." : "Reset Password"}</button>
        <button type="button" onClick={onBack} className="w-full mt-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Back to Login</button>
      </form>
    </div>
  );
}