import { Appointment } from "../types";

export const SALON_NAME = "Vogue Salon";
export const SALON_LOCATION = "No. 328, Tabuan Laru Commercial Centre, 93350 Kuching, Sarawak";
export const SALON_TZ = "Asia/Kuching";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format Date as UTC Google/ICS value: YYYYMMDDTHHmmssZ */
function formatUTC(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Parse YYYY-MM-DD + HH:mm in Asia/Kuching (+08:00, no DST) to a real Date. */
function parseKuchingDateTime(date: string, time: string): Date {
  // Explicit offset so UTC conversion is correct regardless of browser tz.
  return new Date(`${date}T${time}:00+08:00`);
}

function getRange(
  appointment: Appointment,
  durationMinutes?: number
): { start: Date; end: Date } {
  const start = parseKuchingDateTime(appointment.date, appointment.time);
  const duration = durationMinutes ?? 60;
  const end = new Date(start.getTime() + duration * 60_000);
  return { start, end };
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldICSLine(line: string): string {
  // RFC 5545: fold at 75 octets — simple char-based fold is good enough
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

export function buildCalendarEvent(
  appointment: Appointment,
  opts?: { durationMinutes?: number; location?: string }
): CalendarEvent {
  const { start, end } = getRange(appointment, opts?.durationMinutes);
  return {
    title: `${appointment.serviceName} with ${appointment.stylistName}`,
    description: `${SALON_NAME} appointment\\nService: ${appointment.serviceName}\\nStylist: ${appointment.stylistName}\\nStatus: ${appointment.status}`,
    location: opts?.location ?? SALON_LOCATION,
    start,
    end,
  };
}

/** Build Google Calendar “Add to Calendar” URL (opens in new tab). */
export function buildGoogleCalendarUrl(
  appointment: Appointment,
  opts?: { durationMinutes?: number; location?: string }
): string {
  const event = buildCalendarEvent(appointment, opts);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUTC(event.start)}/${formatUTC(event.end)}`,
    details: event.description.replace(/\\n/g, "\n"),
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Build ICS file content for Apple Calendar / Outlook / Yahoo. */
export function buildICS(
  appointment: Appointment,
  opts?: { durationMinutes?: number; location?: string }
): string {
  const event = buildCalendarEvent(appointment, opts);
  const now = formatUTC(new Date());
  const uid = `${appointment.id}@vogue-salon`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vogue Salon//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatUTC(event.start)}`,
    `DTEND:${formatUTC(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description.replace(/\\n/g, "\n"))}`,
    `LOCATION:${escapeICS(event.location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldICSLine).join("\r\n");
}

/** Trigger download/open of the ICS file. Works on desktop + iOS Safari. */
export function downloadICS(
  appointment: Appointment,
  opts?: { durationMinutes?: number; location?: string; filename?: string }
): void {
  const ics = buildICS(appointment, opts);
  const filename =
    opts?.filename ?? `vogue-salon-${appointment.date}-${appointment.time}.ics`;

  // iOS Safari / PWA doesn't support <a download> for blob: URLs — it needs
  // the file opened in a new tab so the system shows "Add to Calendar".
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints > 1);
  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isIOS || isStandalone) {
    // Blob URL opened in a new tab triggers the iOS preview sheet with
    // "Add All" → Apple Calendar. data: URI would lose the .ics hint.
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    // window.open must be called synchronously inside the click handler
    // or it will be blocked as a popup.
    const win = window.open(url, "_blank");
    if (!win) {
      // Fallback for popup blockers — navigate in place (user can back).
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    return;
  }

  // Desktop / Android — anchor with download attribute (Chrome, Edge, Firefox, macOS Safari).
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Append to DOM required for Firefox.
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Cleanup after the browser has started the download.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 4000);
}
