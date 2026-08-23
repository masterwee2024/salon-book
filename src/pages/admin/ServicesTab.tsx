import { useEffect, useState } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { Service } from "../../types";
import { adminGetServices, adminCreateService, adminUpdateService, adminDeleteService } from "../../lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ServicesTab() {
  const { token } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", duration: 60, price: 80, description: "" });

  async function load() {
    if (!token) return;
    setLoading(true);
    try { setServices(await adminGetServices(token)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", duration: 60, price: 80, description: "" });
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, duration: s.duration, price: s.price, description: s.description });
    setShowForm(true);
  }

  async function handleSave() {
    if (!token || !form.name) return;
    if (editing) {
      await adminUpdateService(token, editing.id, form);
    } else {
      await adminCreateService(token, form);
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Delete this service?")) return;
    await adminDeleteService(token, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-medium text-slate-900 dark:text-white">Services</h2>
        <button onClick={openNew} className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium">
          <Plus className="w-4 h-4" /><span>Add</span>
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
           {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
             <div key={s.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                 <h3 className="font-medium text-slate-900 dark:text-white">{s.name}</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{s.duration} min · RM {s.price}</p>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-4">
                 <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Pencil className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>
                 <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
               className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white">{editing ? "Edit Service" : "New Service"}</h3>
                 <button onClick={() => setShowForm(false)} className="p-1"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   placeholder="Name" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none focus:border-slate-400 dark:focus:border-slate-500" />
                <div className="flex space-x-3">
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                     placeholder="Duration (min)" className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none focus:border-slate-400 dark:focus:border-slate-500" />
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                     placeholder="Price" className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none focus:border-slate-400 dark:focus:border-slate-500" />
                </div>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description" rows={2}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none focus:border-slate-400 dark:focus:border-slate-500 resize-none" />
              </div>
              <div className="flex space-x-3 mt-4">
                 <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm">Cancel</button>
                <button onClick={handleSave} disabled={!form.name}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm disabled:opacity-50">
                  {editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
