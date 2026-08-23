import { Appointment, Service, Stylist, TimeSlot } from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function adminHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ── public ──────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  return (await request<{ services: Service[] }>("/api/services")).services;
}

export async function getStylists(): Promise<Stylist[]> {
  return (await request<{ stylists: Stylist[] }>("/api/stylists")).stylists;
}

export async function getTimeSlots(): Promise<TimeSlot[]> {
  return (await request<{ slots: TimeSlot[] }>("/api/time-slots")).slots;
}

export async function getAvailability(date: string, stylistId: string): Promise<string[]> {
  return (await request<{ bookedSlots: string[] }>(
    `/api/availability?date=${encodeURIComponent(date)}&stylistId=${encodeURIComponent(stylistId)}`
  )).bookedSlots;
}

export async function createAppointment(input: {
  clientName?: string;
  clientPhone: string;
  serviceId: string;
  stylistId: string;
  date: string;
  time: string;
}): Promise<Appointment> {
  return (await request<{ appointment: Appointment }>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  })).appointment;
}

export async function getAppointments(phone: string, scope: "upcoming" | "history" = "upcoming"): Promise<Appointment[]> {
  return (await request<{ appointments: Appointment[] }>(
    `/api/appointments?phone=${encodeURIComponent(phone)}&scope=${scope}`
  )).appointments;
}

export async function cancelAppointment(id: string, clientPhone: string): Promise<Appointment> {
  return (await request<{ appointment: Appointment }>(`/api/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ clientPhone }),
  })).appointment;
}

// ── admin ───────────────────────────────────────────────────────────

export async function adminLogin(password: string): Promise<string> {
  return (await request<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  })).token;
}

export async function adminGetServices(token: string): Promise<Service[]> {
  return (await request<{ services: Service[] }>("/api/admin/services", { headers: adminHeaders(token) })).services;
}

export async function adminCreateService(token: string, data: Omit<Service, "id">): Promise<Service> {
  return (await request<{ service: Service }>("/api/admin/services", {
    method: "POST", headers: adminHeaders(token), body: JSON.stringify(data),
  })).service;
}

export async function adminUpdateService(token: string, id: string, data: Partial<Service>): Promise<Service> {
  return (await request<{ service: Service }>(`/api/admin/services/${id}`, {
    method: "PUT", headers: adminHeaders(token), body: JSON.stringify(data),
  })).service;
}

export async function adminDeleteService(token: string, id: string): Promise<void> {
  await request(`/api/admin/services/${id}`, { method: "DELETE", headers: adminHeaders(token) });
}

export async function adminGetStylists(token: string): Promise<Stylist[]> {
  return (await request<{ stylists: Stylist[] }>("/api/admin/stylists", { headers: adminHeaders(token) })).stylists;
}

export async function adminCreateStylist(token: string, data: Omit<Stylist, "id">): Promise<Stylist> {
  return (await request<{ stylist: Stylist }>("/api/admin/stylists", {
    method: "POST", headers: adminHeaders(token), body: JSON.stringify(data),
  })).stylist;
}

export async function adminUpdateStylist(token: string, id: string, data: Partial<Stylist>): Promise<Stylist> {
  return (await request<{ stylist: Stylist }>(`/api/admin/stylists/${id}`, {
    method: "PUT", headers: adminHeaders(token), body: JSON.stringify(data),
  })).stylist;
}

export async function adminDeleteStylist(token: string, id: string): Promise<void> {
  await request(`/api/admin/stylists/${id}`, { method: "DELETE", headers: adminHeaders(token) });
}

export async function adminGetTimeSlots(token: string): Promise<TimeSlot[]> {
  return (await request<{ slots: TimeSlot[] }>("/api/admin/time-slots", { headers: adminHeaders(token) })).slots;
}

export async function adminCreateTimeSlot(token: string, time: string, enabled = true): Promise<TimeSlot> {
  return (await request<{ slot: TimeSlot }>("/api/admin/time-slots", {
    method: "POST", headers: adminHeaders(token), body: JSON.stringify({ time, enabled }),
  })).slot;
}

export async function adminUpdateTimeSlot(token: string, id: string, data: { time?: string; enabled?: boolean }): Promise<TimeSlot> {
  return (await request<{ slot: TimeSlot }>(`/api/admin/time-slots/${id}`, {
    method: "PUT", headers: adminHeaders(token), body: JSON.stringify(data),
  })).slot;
}

export async function adminDeleteTimeSlot(token: string, id: string): Promise<void> {
  await request(`/api/admin/time-slots/${id}`, { method: "DELETE", headers: adminHeaders(token) });
}

export async function adminChangePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
  await request("/api/admin/change-password", {
    method: "POST", headers: adminHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function adminResetPassword(recoveryKey: string, newPassword: string): Promise<void> {
  await request("/api/admin/reset-password", {
    method: "POST",
    body: JSON.stringify({ recoveryKey, newPassword }),
  });
}

export async function adminGetRecoveryKey(token: string): Promise<string> {
  return (await request<{ recoveryKey: string }>("/api/admin/recovery-key", { headers: adminHeaders(token) })).recoveryKey;
}