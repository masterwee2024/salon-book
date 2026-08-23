import { useState } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { ServicesTab } from "./ServicesTab";
import { StylistsTab } from "./StylistsTab";
import { TimeSlotsTab } from "./TimeSlotsTab";
import { SettingsTab } from "./SettingsTab";
import { Scissors, User, Clock, Settings, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";

const TABS = [
  { id: "services", label: "Services", icon: Scissors },
  { id: "stylists", label: "Stylists", icon: User },
  { id: "slots", label: "Time Slots", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [tab, setTab] = useState<string>("services");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 dark:bg-slate-950 text-white px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-medium">Admin Dashboard</h1>
          <button onClick={logout} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0",
                  tab === t.id ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>
      <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
        {tab === "services" && <ServicesTab />}
        {tab === "stylists" && <StylistsTab />}
        {tab === "slots" && <TimeSlotsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}