export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string;
  photoUrl: string;
  bio: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  enabled: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}