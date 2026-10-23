import { get, post } from './client';

export interface ApiMessage {
  _id: string;
  client: string | { _id: string; fullname: string } | null;
  expediteur: string | { _id: string; fullname: string; role: string } | null;
  contenu: string;
  departement?: string;
  lu: boolean;
  createdAt: string;
}

export async function apiGetMessages() {
  return get<ApiMessage[]>('/messages');
}

export async function apiGetMessagesByClient(clientId: string, department?: string) {
  const query = department ? `?departement=${encodeURIComponent(department)}` : '';
  return get<ApiMessage[]>(`/messages/client/${clientId}${query}`);
}

export async function apiCreateMessage(body: {
  client: string;
  contenu: string;
  departement?: string;
}) {
  return post<{ message: string; createdMessage: ApiMessage }>('/messages', body);
}
