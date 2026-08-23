import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../components/AuthProvider";
import { Service } from "../types";
import { format, addDays, startOfToday } from "date-fns";
import { Check, ChevronRight, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_SERVICES: Omit<Service, 'id'>[] = [
  { name: "Women's Haircut", duration: 60, price: 80, description: "Includes wash, cut, and blowout styling." },
  { name: "Men's Haircut", duration: 45, price: 45, description: "Classic or modern cut with hot towel finish." },
  { name: "Balayage", duration: 180, price: 220, description: "Hand-painted highlights for a natural look." },
  { name: "Root Touch-up", duration: 90, price: 95, description: "Color application to the regrowth area only." },
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export function Book({ onBooked }: { onBooked: () => void }) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      const snap = await getDocs(collection(db, "services"));
      if (snap.empty) {
        // Seed default services
        const batch = INITIAL_SERVICES.map(async (svc) => {
          const docRef = doc(collection(db, "services"));
          await setDoc(docRef, { ...svc, id: docRef.id });
          return { ...svc, id: docRef.id };
        });
        const saved = await Promise.all(batch);
        setServices(saved);
      } else {
        const svcs: Service[] = [];
        snap.forEach(doc => svcs.push(doc.data() as Service));
        setServices(svcs);
      }
    }
    fetchServices();
  }, []);

  const dates = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i));

  const handleBook = async () => {
    if (!user || !selectedService || !selectedTime) return;
    setBooking(true);
    
    try {
      await addDoc(collection(db, "appointments"), {
        clientId: user.id,
        clientName: user.name || "Guest",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending',
      });
      onBooked();
    } catch (e) {
      console.error(e);
      alert("Error booking appointment.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-8">
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-2xl font-light text-slate-900">
          {step === 1 ? "Select Service" : "Choose Time"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {step === 1 ? "What can we do for you today?" : selectedService?.name}
        </p>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc);
                    setStep(2);
                  }}
                  className="w-full bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col text-left hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-start w-full">
                    <h3 className="font-medium text-slate-900">{svc.name}</h3>
                    <span className="font-medium text-slate-900">${svc.price}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 pr-4">{svc.description}</p>
                  <div className="flex items-center space-x-2 mt-4 text-xs font-medium text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{svc.duration} min</span>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-900 mb-3 uppercase tracking-wide">Date</h3>
                <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                  {dates.map((d, i) => {
                    const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(d)}
                        className={cn(
                          "flex flex-col items-center justify-center w-16 h-20 rounded-2xl shrink-0 transition-colors border",
                          isSelected 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className="text-xs uppercase font-medium opacity-80 mb-1">{format(d, 'EEE')}</span>
                        <span className="text-xl font-light">{format(d, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3 uppercase tracking-wide">Available Times</h3>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map(t => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={cn(
                          "py-3 rounded-xl text-sm font-medium transition-colors border",
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-12 flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-full font-medium text-slate-600 bg-slate-200 w-1/3"
                >
                  Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={!selectedTime || booking}
                  className="flex-1 py-4 rounded-full font-medium text-white bg-slate-900 shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                >
                  {booking ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
