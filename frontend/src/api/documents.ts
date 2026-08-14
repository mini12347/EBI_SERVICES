import { get, del } from './client';
import { uploadFile } from './client';

export interface ApiDocument {
  _id: string;
  client: string | { _id: string; fullname: string };
  demande?: string | { _id: string; besoin: string };
  nom_fichier: string;
  lien: string;
  uploaded_by: string | { _id: string; fullname: string };
  origine: string;
  taille?: number;
  type_mime?: string;
  createdAt: string;
}

export async function apiGetDocuments() {
  return get<ApiDocument[]>('/documents');
}

export async function apiGetDocumentsByClient(clientId: string) {
  return get<ApiDocument[]>(`/documents/client/${clientId}`);
}

export async function apiUploadDocument(
  demandeId: string,
  file: File,
): Promise<any> {
  const formData = new FormData();
  formData.append('document', file);
  if (demandeId) {
    return uploadFile(`/client/demandes/${demandeId}/documents`, formData);
  }
  return uploadFile(`/client/documents`, formData);
}

export async function apiDeleteDocument(id: string) {
  return del<{ message: string }>(`/documents/${id}`);
}

export async function apiDownloadDocumentSummaryPDF(id: string): Promise<void> {
  const token = localStorage.getItem('ebi_api_token');
  const headers: Record<string, string> = {};
  if (token && token.length > 10) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/documents/${id}/summary-pdf`, { headers });
  if (!res.ok) {
    throw new Error('Failed to generate PDF');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `document-summary-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
