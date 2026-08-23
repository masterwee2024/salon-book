import { useEffect, useMemo, useState } from "react";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isSameDay, startOfToday, startOfWeek, subWeeks } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Phone } from "lucide-react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { Appointment, Stylist } from "../../types";
import { adminGetAppointments, adminGetStylists, adminUpdateAppointment } from "../../lib/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AppointmentsTab() {
  const { token } = useAdminAuth();
  const [weekStart, setWeekStart] = useState(startOfWeek(startOfToday()));
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistId, setStylistId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    adminGetStylists(token).then((items) => {
      setStylists(items);
      if (!stylistId && items[0]) setStylistId(items[0].id);
    }).catch(() => setError("Could not load stylists."));
  }, [token]);

  useEffect(() => {
    if (!token || !stylistId) return;
    setLoading(true);
    setError(null);
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(endOfWeek(weekStart), "yyyy-MM-dd");
    adminGetAppointments(token, from, to, stylistId)
      .then(setAppointments)
      .catch(() => { setAppointments([]); setError("Could not load appointments."); })
      .finally(() => setLoading(false));
  }, [token, stylistId, weekStart]);

  const weekDays = useMemo(() => eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart),
  }), [weekStart]);

  const byDate = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const existing = grouped.get(appointment.date) ?? [];
      grouped.set(appointment.date, [...existing, appointment]);
    }
    return grouped;
  }, [appointments]);

  const selectedAppointments = byDate.get(format(selectedDate, "yyyy-MM-dd")) ?? [];
  const selectedStylist = stylists.find((stylist) => stylist.id === stylistId);

  function changeWeek(direction: number) {
    const nextStart = direction < 0 ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1);
    setWeekStart(nextStart);
    setSelectedDate(nextStart);
  }

  function goToday() {
    const today = startOfToday();
    setWeekStart(startOfWeek(today));
    setSelectedDate(today);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Stylist workspace</p>
          <h2 className="text-2xl font-medium text-slate-900 dark:text-white">Schedule</h2>
        </div>
        <select value={stylistId} onChange={(event) => setStylistId(event.target.value)} aria-label="Stylist schedule"
          className="max-w-[48%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500">
          {stylists.map((stylist) => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-white">{format(weekStart, "MMM d")} – {format(endOfWeek(weekStart), "MMM d, yyyy")}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedStylist ? `${selectedStylist.name} · Weekly` : "Select a stylist"}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => changeWeek(-1)} aria-label="Previous week" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={goToday} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Today</button>
            <button onClick={() => changeWeek(1)} aria-label="Next week" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 pb-2 dark:border-slate-700">
          {WEEKDAYS.map((day) => <div key={day} className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{day}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const dayAppointments = byDate.get(format(day, "yyyy-MM-dd")) ?? [];
            const selected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, startOfToday());
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                className={`flex min-h-[72px] flex-col items-center justify-start rounded-xl p-1.5 text-center transition-colors ${selected ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{format(day, "EEE")}</span>
                <span className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${selected ? "" : isToday ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-900 dark:text-white"}`}>{format(day, "d")}</span>
                <span className="mt-1.5 flex min-h-3 items-center justify-center gap-0.5">
                  {dayAppointments.slice(0, 3).map((appointment) => <span key={appointment.id} className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white dark:bg-slate-900" : appointment.status === "cancelled" ? "bg-slate-300 dark:bg-slate-600" : "bg-emerald-500"}`} />)}
                  {dayAppointments.length > 3 && <span className="text-[9px]">+{dayAppointments.length - 3}</span>}
                </span>
                <span className="mt-1 text-[10px] font-medium tabular-nums opacity-70">{dayAppointments.length ? `${dayAppointments.length}` : "·"}</span>
              </button>
            );
          })}
        </div>
        {loading && <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">Loading schedule...</p>}
        {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">{format(selectedDate, "EEEE, MMM d")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedAppointments.length ? `${selectedAppointments.length} appointment${selectedAppointments.length === 1 ? "" : "s"}` : "No appointments"}</p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="space-y-3">
          {selectedAppointments.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-14 shrink-0 text-center"><p className="text-sm font-medium text-slate-900 dark:text-white">{appointment.time}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{appointment.status}</p></div>
                <div className="h-10 w-px bg-slate-100 dark:bg-slate-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{appointment.clientName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{appointment.clientPhone}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="truncate">{appointment.serviceName}</span>
                  </p>
                </div>
                <Clock className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <select value={appointment.status} onChange={async (e) => {
                  const next = e.target.value as Appointment["status"];
                  try { await adminUpdateAppointment(token!, appointment.id, { status: next }); const from = format(weekStart, "yyyy-MM-dd"); const to = format(endOfWeek(weekStart), "yyyy-MM-dd"); setAppointments(await adminGetAppointments(token!, from, to, stylistId)); } catch (err) { alert(err instanceof Error ? err.message : "Failed to update status."); }
                }} className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select value={appointment.stylistId} onChange={async (e) => {
                  const nextId = e.target.value;
                  if (nextId === appointment.stylistId) return;
                  try { await adminUpdateAppointment(token!, appointment.id, { stylistId: nextId }); const from = format(weekStart, "yyyy-MM-dd"); const to = format(endOfWeek(weekStart), "yyyy-MM-dd"); setAppointments(await adminGetAppointments(token!, from, to, stylistId)); } catch (err) { alert(err instanceof Error ? err.message : "Failed to reassign stylist."); }
                }} className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {stylists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          ))}
          {!selectedAppointments.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700"><CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" /><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A clear day for {selectedStylist?.name ?? "this stylist"}.</p></div>}
        </div>
      </section>
    </div>
  );
}
