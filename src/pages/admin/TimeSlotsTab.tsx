import { useEffect, useState } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { TimeSlot } from "../../types";
import { adminGetTimeSlots, adminCreateTimeSlot, adminUpdateTimeSlot, adminDeleteTimeSlot } from "../../lib/api";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function TimeSlotsTab() {
  const { token } = useAdminAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTime, setNewTime] = useState("17:00");

  async function load() {
    if (!token) return;
    setLoading(true);
    try { setSlots(await adminGetTimeSlots(token)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  async function handleAdd() {
    if (!token || !/^\d{2}:\d{2}$/.test(newTime)) return;
    try {
      await adminCreateTimeSlot(token, newTime);
      setShowForm(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add slot.");
    }
  }

  async function handleToggle(slot: TimeSlot) {
    if (!token) return;
    await adminUpdateTimeSlot(token, slot.id, { enabled: !slot.enabled });
    load();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Delete this time slot?")) return;
    await adminDeleteTimeSlot(token, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-900">Time Slots</h2>
        <button onClick={() => { setNewTime("17:00"); setShowForm(true); }}
          className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium">
          <Plus className="w-4 h-4" /><span>Add</span>
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-medium text-slate-900 tabular-nums">{slot.time}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${slot.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                  {slot.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleToggle(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${slot.enabled ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                  {slot.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleDelete(slot.id)} className="p-2 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">New Time Slot</h3>
                <button onClick={() => setShowForm(false)} className="p-1"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-lg tabular-nums" />
              <div className="flex space-x-3 mt-4">
                <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm">Cancel</button>
                <button onClick={handleAdd}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm disabled:opacity-50">
                  Add Slot
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}