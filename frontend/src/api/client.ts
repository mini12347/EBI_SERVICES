const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshInProgress: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      const refreshToken = localStorage.getItem('ebi_refresh_token');
      if (!refreshToken) {
        throw new ApiError('Your session has expired. Please sign in again.', 401);
      }
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const body = await response.json().catch(() => ({ message: response.statusText }));
      if (!response.ok || !body.access_token || !body.refresh_token) {
        throw new ApiError(body.message || 'Your session has expired. Please sign in again.', response.status || 401);
      }
      localStorage.setItem('ebi_api_token', body.access_token);
      localStorage.setItem('ebi_refresh_token', body.refresh_token);
      return body.access_token as string;
    })().finally(() => {
      refreshInProgress = null;
    });
  }
  return refreshInProgress;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const send = () => {
    const headers = new Headers(options.headers);
    const token = localStorage.getItem('ebi_api_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  };

  const response = await send();
  if (response.status !== 401 || endpoint === '/auth/refresh' || !localStorage.getItem('ebi_refresh_token')) {
    return response;
  }

  try {
    await refreshAccessToken();
    return await send();
  } catch (error) {
    localStorage.removeItem('ebi_api_token');
    localStorage.removeItem('ebi_refresh_token');
    localStorage.removeItem('ebi_session_token');
    localStorage.removeItem('ebi_auth_mode');
    window.dispatchEvent(new Event('ebi:session-expired'));
    throw error;
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

  const res = await apiFetch(endpoint, {
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

  const res = await apiFetch(endpoint, {
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
