const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('ebi_api_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token && token.length > 10) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(body.message || res.statusText, res.status);
  }

  return res.json();
}

export async function uploadFile(
  endpoint: string,
  formData: FormData,
): Promise<any> {
  const token = localStorage.getItem('ebi_api_token');
  const headers: Record<string, string> = {};
  if (token && token.length > 10) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(body.message || res.statusText, res.status);
  }

  return res.json();
}

export function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' });
}

export function post<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

export function put<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

export function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

export function isApiAvailable(): boolean {
  return !!localStorage.getItem('ebi_api_token') || navigator.onLine;
}
