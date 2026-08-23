import { useEffect, useState } from "react";
import { useSession } from "../components/SessionProvider";
import { Appointment } from "../types";
import { getAppointments, cancelAppointment } from "../lib/api";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, X, Navigation } from "lucide-react";
import { motion } from "motion/react";
import { AddToCalendar } from "../components/AddToCalendar";

export function Home({ onBook }: { onBook: () => void }) {
  const { phone, name } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function fetchAppointments() {
    if (!phone) { setLoading(false); return; }
    setLoading(true);
    try { setAppointments(await getAppointments(phone, "upcoming")); }
    catch { setAppointments([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAppointments(); }, [phone]);

  async function handleCancel(appt: Appointment) {
    if (!phone || cancelling) return;
    setCancelling(appt.id);
    try { await cancelAppointment(appt.id, phone); setAppointments((p) => p.filter((a) => a.id !== appt.id)); }
    catch { alert("Could not cancel appointment."); }
    finally { setCancelling(null); }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-28">
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <h2 className="text-slate-400 text-sm font-medium tracking-wide mb-1">
          {phone ? "WELCOME BACK" : "WELCOME"}
        </h2>
        <h1 className="text-2xl font-light">{name?.split(' ')[0] || 'to Vogue Salon'}</h1>
      </div>

      <div className="px-6 py-8">
        {!phone && (
          <button onClick={onBook}
            className="w-full bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-6 mb-8 text-left shadow-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <h3 className="text-lg font-medium mb-1">Book an Appointment</h3>
            <p className="text-sm text-slate-300">No login needed. Just enter your Malaysian mobile number to book.</p>
          </button>
        )}

        {phone && (
          <>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Upcoming Appointments</h3>
            {loading ? (
              <div className="animate-pulse space-y-4"><div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" /></div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appt, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={appt.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{appt.serviceName}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">with {appt.stylistName}</p>
                      </div>
                      <button onClick={() => handleCancel(appt)} disabled={cancelling === appt.id}
                        className="flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
                        <X className="w-3.5 h-3.5" />
                        <span>{cancelling === appt.id ? "Cancelling..." : "Cancel"}</span>
                      </button>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 w-full" />
                    <div className="flex space-x-6 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{format(parseISO(appt.date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{appt.time}</span>
                      </div>
                    </div>
                    <AddToCalendar appointment={appt} variant="compact" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 text-center shadow-sm">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">No upcoming appointments</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Book your next visit to see it here.</p>
              </div>
            )}
          </>
        )}

        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 mt-8">Salon Location</h3>
        <a
          href="https://www.google.com/maps/search/?api=1&query=No.+328+Tabuan+Laru+Commercial+Centre+93350+Kuching+Sarawak"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Vogue Salon location in maps"
          className="block bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-start space-x-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md active:scale-[0.98] transition-all text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Vogue Salon</h4>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                <Navigation className="w-3.5 h-3.5" />
                Navigate
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              No. 328, Tabuan Laru Commercial Centre<br />93350 Kuching, Sarawak<br />Tue-Sat 10AM-8PM, Sun 10AM-6PM
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">Tap to open in maps</p>
          </div>
        </a>
      </div>
    </div>
  );
}