import { useEffect, useState } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { adminChangePassword, adminGetRecoveryKey } from "../../lib/api";
import { KeyRound, Shield, Eye, EyeOff } from "lucide-react";

export function SettingsTab() {
  const { token, clearSavedPassword } = useAdminAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      adminGetRecoveryKey(token).then(setRecoveryKey).catch(() => {});
    }
  }, [token]);

  async function handleChangePassword() {
    if (!token) return;
    setPwError(null);
    setPwSuccess(false);
    if (newPw.length < 4) {
      setPwError("New password must be at least 4 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await adminChangePassword(token, currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      clearSavedPassword();
    } catch {
      setPwError("Current password is incorrect.");
    } finally {
      setPwLoading(false);
    }
  }

  async function copyRecoveryKey() {
    if (!recoveryKey) return;
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Change Password</h2>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-sm"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min 4 chars)"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-sm"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-sm"
          />

          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600">Password updated successfully.</p>}

          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            className="w-full py-3 rounded-xl font-medium text-white bg-slate-900 text-sm disabled:opacity-50"
          >
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* Recovery Key */}
      <div>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Recovery Key</h2>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700 font-medium">Password Recovery Key</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Use this key to reset your password if you forget it. Save it somewhere safe.
              </p>
            </div>
          </div>

          {recoveryKey && (
            <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
              {showRecovery ? (
                <span className="font-mono text-sm text-slate-900 break-all">{recoveryKey}</span>
              ) : (
                <span className="font-mono text-sm text-slate-400">••••••••-••••-••••-••••-••••••••••••</span>
              )}
              <div className="flex items-center space-x-1 shrink-0 ml-3">
                <button onClick={() => setShowRecovery(!showRecovery)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                  {showRecovery ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={copyRecoveryKey} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                  <Shield className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {copied && <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>}
        </div>
      </div>
    </div>
  );
}