import { get, post, patch } from './client';

export interface ApiAppointment {
  _id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  date: string;
  timeSlot: string;
  timezone: string;
  slotDate?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  adminNotes?: string;
  createdAt: string;
}

export interface ApiSlot {
  date: string;
}

export async function apiGetMyAppointments(userId: string) {
  return get<ApiAppointment[]>(`/appointments/user/${userId}`);
}

export async function apiGetAllAppointments() {
  return get<ApiAppointment[]>('/appointments');
}

export async function apiGetAvailability() {
  return get<ApiSlot[]>('/appointments/availability');
}

export async function apiCreateAppointment(data: Record<string, unknown>) {
  return post<ApiAppointment>('/appointments', data);
}

export async function apiUpdateAppointmentStatus(
  id: string,
  data: { status: string; adminNotes?: string },
) {
  return patch<ApiAppointment>(`/appointments/${id}`, data);
}

export async function apiCancelAppointment(id: string) {
  return patch<ApiAppointment>(`/appointments/${id}/cancel`);
}
