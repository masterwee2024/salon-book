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
    <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-16 transition-colors",
              isActive ? "text-slate-900" : "text-gray-400 hover:text-gray-600"
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
