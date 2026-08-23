import { useState } from "react";
import { SessionProvider } from "./components/SessionProvider";
import { AdminAuthProvider, useAdminAuth } from "./components/AdminAuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { BottomNav } from "./components/BottomNav";
import { Home } from "./pages/Home";
import { Book } from "./pages/Book";
import { Profile } from "./pages/Profile";
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";

function MainView({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const [currentTab, setCurrentTab] = useState("home");

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      {currentTab === "home" && <Home onBook={() => setCurrentTab("book")} />}
      {currentTab === "book" && <Book onBooked={() => setCurrentTab("home")} />}
      {currentTab === "profile" && <Profile onOpenAdmin={onOpenAdmin} />}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

function AdminGate() {
  const { token, loading } = useAdminAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (token) return <AdminDashboard />;
  if (showLogin) return <AdminLogin />;

  return <MainView onOpenAdmin={() => setShowLogin(true)} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AdminAuthProvider>
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center sm:p-4 transition-colors">
            <div className="w-full sm:max-w-[400px] h-[100dvh] sm:h-[850px] bg-white dark:bg-slate-950 sm:rounded-[3rem] sm:border-[8px] border-slate-900 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
              <AdminGate />
            </div>
          </div>
        </AdminAuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
