import { useState, useRef, useEffect } from "react";
import { CalendarPlus, ExternalLink, Download, ChevronDown } from "lucide-react";
import { Appointment } from "../types";
import { buildGoogleCalendarUrl, downloadICS } from "../lib/calendar";

type Props = {
  appointment: Appointment;
  durationMinutes?: number;
  variant?: "default" | "compact";
  className?: string;
};

export function AddToCalendar({ appointment, durationMinutes, variant = "default", className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleGoogle = () => {
    const url = buildGoogleCalendarUrl(appointment, { durationMinutes });
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleICS = () => {
    downloadICS(appointment, { durationMinutes });
    setOpen(false);
  };

  if (variant === "compact") {
    return (
      <div ref={ref} className={`relative ${className ?? ""}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Add to calendar
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden p-1.5"
          >
            <button
              role="menuitem"
              onClick={handleGoogle}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
            >
              <ExternalLink className="h-4 w-4 text-slate-500" />
              <span className="flex-1">Google Calendar</span>
            </button>
            <button
              role="menuitem"
              onClick={handleICS}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span className="flex-1">Apple / Outlook (.ics)</span>
            </button>
            <p className="px-3 pt-1 pb-1 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
              .ics works with Apple Calendar, Outlook &amp; Yahoo.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <CalendarPlus className="h-4 w-4" />
        Add to calendar
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 z-20 mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden p-1.5"
        >
          <button
            role="menuitem"
            onClick={handleGoogle}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
          >
            <ExternalLink className="h-4 w-4 text-slate-500" />
            <div className="flex-1">
              <div className="font-medium">Google Calendar</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Opens in a new tab</div>
            </div>
          </button>
          <button
            role="menuitem"
            onClick={handleICS}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <div className="flex-1">
              <div className="font-medium">Apple / Outlook</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Download .ics file</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
