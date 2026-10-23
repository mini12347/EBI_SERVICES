import { get } from './client';

export interface ApiService {
  _id?: string;
  code: string;
  nom: string;
  description: string;
  departement: string;
}

export function apiGetServices() {
  return get<ApiService[]>('/services');
}
