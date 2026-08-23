import { CalendarDays, Home, User } from "lucide-react";
import { cn } from "../lib/utils";

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "book", label: "Book", icon: CalendarDays },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pt-3 pb-8 flex justify-between items-center z-20 pointer-events-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "pointer-events-auto flex flex-col items-center justify-center space-y-1 w-16 transition-colors rounded-2xl py-2",
              isActive
                ? "text-slate-900 dark:text-white bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}