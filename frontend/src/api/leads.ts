import { get, post, put, del } from './client';

export interface ApiLead {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  projectDescription: string;
  budget: string;
  deadline: string;
  status: string;
  suggestedDepartment: string;
  priority: string;
  source: string;
  userId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  projectDescription: string;
  company?: string;
  phone?: string;
  country?: string;
  budget?: string;
  deadline?: string;
  suggestedDepartment?: string;
  source: 'chatbot' | 'contact_form';
  userId?: string;
}

export async function apiGetLeads() {
  return get<ApiLead[]>('/leads');
}

export async function apiCreateLead(body: CreateLeadInput) {
  return post<{ message: string; lead: ApiLead }>('/leads', body);
}

export async function apiUpdateLead(
  id: string,
  body: Partial<ApiLead>,
) {
  return put<{ message: string; lead: ApiLead }>(`/leads/${id}`, body);
}

export async function apiDeleteLead(id: string) {
  return del<{ message: string }>(`/leads/${id}`);
}
