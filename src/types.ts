export interface User {
  id: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'client' | 'admin';
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}
