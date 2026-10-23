import { apiFetch, get, post, put } from './client';

export interface ApiDemandeDevis {
  _id: string;
  client: string | { _id: string; fullname: string; email: string; entreprise?: string } | null;
  service: string | { _id: string; nom: string; description?: string } | null;
  manager?: string | { _id: string; fullname: string } | null;
  archivedAt?: string | null;
  besoin: string;
  secteur?: string;
  budget?: string;
  delai?: string;
  statut: string;
  notes?: any[];
  createdAt: string;
}

export interface ApiDevis {
  _id: string;
  demande: string | { _id: string; besoin: string };
  fichier_pdf?: string;
  montant: number;
  terms?: string;
  statut: string;
  createdAt: string;
}

export async function apiGetDemandes() {
  return get<ApiDemandeDevis[]>('/demandes');
}

export async function apiGetDemandesByClient(clientId: string) {
  return get<ApiDemandeDevis[]>(`/demandes/client/${clientId}`);
}

export async function apiCreateDemande(body: {
  service: string;
  besoin: string;
  secteur: string;
  budget: string;
  delai: string;
}) {
  return post<{ message: string; demande: ApiDemandeDevis }>(
    '/demandes',
    body,
  );
}

export async function apiUpdateDemande(
  id: string,
  body: Partial<ApiDemandeDevis> & { manager?: string | null; archive?: boolean },
) {
  return put<{ message: string; demande: ApiDemandeDevis }>(
    `/demandes/${id}`,
    body,
  );
}

export async function apiGetDevis() {
  return get<ApiDevis[]>('/devis');
}

export async function apiGetDevisByDemande(demandeId: string) {
  return get<ApiDevis[]>(`/devis/demande/${demandeId}`);
}

export async function apiCreateDevis(body: {
  demande: string;
  montant: number;
  terms?: string;
}) {
  return post<{ message: string; devis: ApiDevis }>('/devis', body);
}

export async function apiUpdateDevis(id: string, body: Partial<ApiDevis>) {
  return put<{ message: string; devis: ApiDevis }>(`/devis/${id}`, body);
}

export async function apiDownloadQuotePDF(id: string): Promise<void> {
  const token = localStorage.getItem('ebi_api_token');
  const headers: Record<string, string> = {};
  if (token && token.length > 10) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await apiFetch(`/devis/${id}/download`, { headers });
  if (!res.ok) {
    throw new Error('Failed to download quote PDF');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quote-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
