import { useAuth } from "../components/AuthProvider";
import { LogOut, History, Settings, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Appointment } from "../types";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";

export function Profile() {
  const { user, signOut } = useAuth();
  const [history, setHistory] = useState<Appointment[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, "appointments"),
        where("clientId", "==", user.id),
        where("date", "<", today),
        orderBy("date", "desc")
      );
      
      const snap = await getDocs(q);
      const appts: Appointment[] = [];
      snap.forEach(doc => {
        appts.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setHistory(appts);
    }
    fetchHistory();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      <div className="bg-white px-6 py-10 border-b border-slate-100 flex flex-col items-center">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mb-4 shadow-sm" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 shadow-sm flex items-center justify-center text-2xl font-light">
            {user.name?.charAt(0) || 'G'}
          </div>
        )}
        <h1 className="text-xl font-medium text-slate-900">{user.name}</h1>
        <p className="text-sm text-slate-500 mt-1">{user.email}</p>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-slate-900 mb-4 uppercase tracking-wide">Settings</h3>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mb-8">
          <button className="w-full px-5 py-4 flex items-center space-x-4 hover:bg-slate-50 border-b border-slate-50">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="flex-1 text-left text-slate-700 font-medium">Notifications</span>
          </button>
          <button className="w-full px-5 py-4 flex items-center space-x-4 hover:bg-slate-50 border-b border-slate-50">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="flex-1 text-left text-slate-700 font-medium">Account Settings</span>
          </button>
          <button onClick={signOut} className="w-full px-5 py-4 flex items-center space-x-4 hover:bg-slate-50 text-red-600">
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Log Out</span>
          </button>
        </div>

        <h3 className="text-sm font-medium text-slate-900 mb-4 uppercase tracking-wide">Service History</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((appt, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={appt.id} 
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium text-slate-900">{appt.serviceName}</h4>
                  <p className="text-sm text-slate-500 mt-1">{format(parseISO(appt.date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                  {appt.status}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center shadow-sm">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No past appointments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
