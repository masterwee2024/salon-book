import { useEffect, useState } from "react";
import { useAdminAuth } from "../../components/AdminAuthProvider";
import { Stylist } from "../../types";
import { adminGetStylists, adminCreateStylist, adminUpdateStylist, adminDeleteStylist } from "../../lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function StylistsTab() {
  const { token } = useAdminAuth();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Stylist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", specialties: "" });

  async function load() {
    if (!token) return;
    setLoading(true);
    try { setStylists(await adminGetStylists(token)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", specialties: "" });
    setShowForm(true);
  }

  function openEdit(s: Stylist) {
    setEditing(s);
    setForm({ name: s.name, specialties: s.specialties });
    setShowForm(true);
  }

  async function handleSave() {
    if (!token || !form.name) return;
    if (editing) {
      await adminUpdateStylist(token, editing.id, form);
    } else {
      await adminCreateStylist(token, form);
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Delete this stylist?")) return;
    await adminDeleteStylist(token, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-900">Stylists</h2>
        <button onClick={openNew} className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium">
          <Plus className="w-4 h-4" /><span>Add</span>
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {stylists.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-medium">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-900">{s.name}</h3>
                  {s.specialties && <p className="text-xs text-slate-500 truncate">{s.specialties}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-4">
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-600" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">{editing ? "Edit Stylist" : "New Stylist"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name" autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400" />
                <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="Specialties (comma-separated)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400" />
              </div>
              <div className="flex space-x-3 mt-4">
                <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm">Cancel</button>
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