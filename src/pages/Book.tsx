import { useState, useEffect } from "react";
import { useSession } from "../components/SessionProvider";
import { Appointment, Service, Stylist } from "../types";
import { getServices, getStylists, getAvailability, getTimeSlots, createAppointment } from "../lib/api";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { Clock, Phone, Check, User, CalendarCheck, Calendar } from "lucide-react";
import { cn, isValidMalaysianMobile, normalizeMalaysianMobile } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { AddToCalendar } from "../components/AddToCalendar";

const TIME_SLOTS_FALLBACK = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export function Book({ onBooked }: { onBooked: () => void }) {
  const { phone: sessionPhone, name: sessionName, setSession } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>(TIME_SLOTS_FALLBACK);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clientName, setClientName] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [phone, setPhone] = useState(sessionPhone ?? "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    Promise.all([getServices(), getStylists(), getTimeSlots()])
      .then(([s, st, ts]) => { setServices(s); setStylists(st); if (ts.length > 0) setTimeSlots(ts.map((t) => t.time)); })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (!selectedStylist) return;
    getAvailability(format(selectedDate, 'yyyy-MM-dd'), selectedStylist.id).then(setBookedSlots).catch(() => setBookedSlots([]));
  }, [selectedDate, selectedStylist]);

  const dates = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i));
  const phoneValid = isValidMalaysianMobile(phone);
  const nameValid = clientName.trim().length >= 2;

  const titles: Record<number, string> = { 1: "Select Service", 2: "Your Contact", 3: "Choose Stylist", 4: "Pick a Time", 5: "Booking Confirmed" };
  const subtitles: Record<number, string> = { 1: "What can we do for you today?", 2: selectedService?.name ?? "", 3: selectedService?.name ?? "", 4: `${selectedStylist?.name ?? ""} · ${selectedService?.name ?? ""}`, 5: bookedAppointment ? `${bookedAppointment.serviceName} · ${format(parseISO(bookedAppointment.date), 'MMM d, yyyy')} at ${bookedAppointment.time}` : "" };

  const handleBook = async () => {
    if (!nameValid || !phoneValid || !selectedService || !selectedStylist || !selectedTime) {
      if (!nameValid || !phoneValid) setStep(2);
      return;
    }
    setBooking(true);
    try {
      const appt = await createAppointment({ clientName: clientName.trim(), clientPhone: phone, serviceId: selectedService.id, stylistId: selectedStylist.id, date: format(selectedDate, 'yyyy-MM-dd'), time: selectedTime });
      setSession(normalizeMalaysianMobile(phone), clientName.trim());
      setBookedAppointment(appt);
      setStep(5);
    } catch (e) { alert(e instanceof Error ? e.message : "Error booking appointment."); }
    finally { setBooking(false); }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-28">
      <div className="bg-white dark:bg-slate-950 px-6 pt-12 pb-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <h1 className="text-2xl font-light text-slate-900 dark:text-white">{titles[step]}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitles[step]}</p>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {services.map((svc) => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2); }}
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col text-left hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start w-full">
                    <h3 className="font-medium text-slate-900 dark:text-white">{svc.name}</h3>
                    <span className="font-medium text-slate-900 dark:text-white">RM {svc.price}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pr-4">{svc.description}</p>
                  <div className="flex items-center space-x-2 mt-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <Clock className="w-4 h-4" /><span>{svc.duration} min</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Full Name</label>
                <div className={cn("flex items-center space-x-3 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm px-4 py-4", nameTouched && !nameValid ? "border-red-400" : "border-slate-100 dark:border-slate-700")}>
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} onBlur={() => setNameTouched(true)} placeholder="Your name" className="flex-1 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent" />
                </div>
                {nameTouched && !nameValid && (
                  <p className="text-sm text-red-500 mt-2">Please enter your name (at least 2 characters).</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Mobile Number</label>
                <div className={cn("flex items-center space-x-3 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm px-4 py-4", phoneTouched && !phoneValid ? "border-red-400" : "border-slate-100 dark:border-slate-700")}>
                  <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                  <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhoneTouched(true)} placeholder="012-3456789" className="flex-1 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent" />
                </div>
                {phoneTouched && !phoneValid ? (
                  <p className="text-sm text-red-500 mt-2">Please enter a valid Malaysian mobile number (e.g. 012-3456789).</p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">A valid Malaysian mobile number is required to confirm your booking.</p>
                )}
              </div>
              <div className="flex space-x-4 pt-2">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-full font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 w-1/3">Back</button>
                <button onClick={() => { setNameTouched(true); setPhoneTouched(true); if (nameValid && phoneValid) setStep(3); }} className="flex-1 py-4 rounded-full font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {stylists.map((sty) => {
                const isSelected = selectedStylist?.id === sty.id;
                return (
                  <button key={sty.id} onClick={() => { setSelectedStylist(sty); setSelectedTime(null); setStep(4); }}
                    className={cn("w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border shadow-sm flex items-start gap-4 text-left transition-colors",
                      isSelected ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700" : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600")}>
                    {sty.photoUrl ? (
                      <img src={sty.photoUrl} alt={sty.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover border-2 border-white shadow-md dark:border-slate-600" />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-2xl font-medium text-slate-600 shadow-inner dark:from-slate-600 dark:to-slate-700 dark:text-slate-200">{sty.name.charAt(0)}</div>
                    )}
                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-medium text-slate-900 dark:text-white">{sty.name}</h3>
                        {isSelected && <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900"><Check className="h-4 w-4" /></span>}
                      </div>
                      {sty.specialties && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{sty.specialties}</p>}
                      {sty.bio ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{sty.bio}</p> : <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Tap to book with {sty.name.split(" ")[0]}.</p>}
                    </div>
                  </button>
                );
              })}
              <div className="pt-4">
                <button onClick={() => setStep(2)} className="px-6 py-4 rounded-full font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800">Back</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Date</h3>
                <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                  {dates.map((d, i) => {
                    const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                    return (
                      <button key={i} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                        className={cn("flex flex-col items-center justify-center w-16 h-20 rounded-2xl shrink-0 transition-colors border",
                          isSelected ? "bg-slate-900 dark:bg-white dark:text-slate-900 text-white border-slate-900 dark:border-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600")}>
                        <span className="text-xs uppercase font-medium opacity-80 mb-1">{format(d, 'EEE')}</span>
                        <span className="text-xl font-light">{format(d, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Available Times</h3>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((t) => {
                    const isBooked = bookedSlots.includes(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button key={t} onClick={() => { if (!isBooked) setSelectedTime(t); }} disabled={isBooked}
                        className={cn("py-3 rounded-xl text-sm font-medium transition-colors border relative overflow-hidden",
                          isSelected ? "bg-slate-900 dark:bg-white dark:text-slate-900 text-white border-slate-900 dark:border-white"
                            : isBooked ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed line-through decoration-slate-300 dark:decoration-slate-600"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600")}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>{normalizeMalaysianMobile(phone)}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStylist?.name}</span>
              </div>

              <div className="mt-6 flex space-x-4">
                <button onClick={() => setStep(3)} className="px-6 py-4 rounded-full font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 w-1/3">Back</button>
                <button onClick={handleBook} disabled={!selectedTime || booking}
                  className="flex-1 py-4 rounded-full font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center">
                  {booking ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && bookedAppointment && (
            <motion.div key="s5" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">You&apos;re booked!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {bookedAppointment.serviceName} with {bookedAppointment.stylistName}<br />
                  {format(parseISO(bookedAppointment.date), 'EEEE, MMMM d, yyyy')} at {bookedAppointment.time}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Vogue Salon · Kuching</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Add to your calendar</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Get a reminder and never miss your appointment.</p>
                <AddToCalendar appointment={bookedAppointment} durationMinutes={selectedService?.duration} />
              </div>

              <button
                onClick={onBooked}
                className="w-full py-4 rounded-full font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg"
              >
                Done — View My Bookings
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}