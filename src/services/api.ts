import { auth } from './firebase';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const token = await currentUser.getIdToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'API Request failed');
  }

  return data;
}

export const appointmentApi = {
  create: async (payload: any) => {
    const res = await fetchWithAuth('/api/create-appointment', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Trigger dispatch asynchronously for Hobby plans
    fetchWithAuth('/api/dispatch-outbox', { method: 'POST' }).catch(() => {});
    return res;
  },
  
  update: async (barbershopId: string, appointmentId: string, status: string) => {
    const res = await fetchWithAuth('/api/update-appointment', {
      method: 'POST',
      body: JSON.stringify({ barbershopId, appointmentId, status })
    });
    fetchWithAuth('/api/dispatch-outbox', { method: 'POST' }).catch(() => {});
    return res;
  }
};
