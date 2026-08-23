import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../components/AuthProvider";
import { Appointment } from "../types";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "motion/react";

export function Home() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, "appointments"),
        where("clientId", "==", user.id),
        where("date", ">=", today),
        orderBy("date", "asc")
      );
      
      const snap = await getDocs(q);
      const appts: Appointment[] = [];
      snap.forEach(doc => {
        appts.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(appts);
      setLoading(false);
    }
    fetchAppointments();
  }, [user]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      <div className="bg-slate-900 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <h2 className="text-slate-400 text-sm font-medium tracking-wide mb-1">WELCOME BACK</h2>
        <h1 className="text-2xl font-light">{user?.name?.split(' ')[0] || 'Guest'}</h1>
      </div>

      <div className="px-6 py-8">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Upcoming Appointments</h3>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appt, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={appt.id} 
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-900">{appt.serviceName}</h4>
                    <p className="text-sm text-slate-500 mt-1 capitalize">{appt.status}</p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                    {appt.status}
                  </div>
                </div>
                
                <div className="h-px bg-slate-100 w-full" />
                
                <div className="flex space-x-6 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{format(parseISO(appt.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{appt.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center shadow-sm">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No upcoming appointments</p>
            <p className="text-sm text-slate-400 mt-1">Book your next visit to see it here.</p>
          </div>
        )}

        <h3 className="text-lg font-medium text-slate-800 mb-4 mt-8">Salon Location</h3>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Vogue Salon</h4>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              No. 328, Tabuan Laru Commercial Centre<br/>
              93350 Kuching, Sarawak<br/>
              Tue-Sat 10AM-8PM, Sun 10AM-6PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
