import { auth } from './firebase';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export interface CreateAppointmentInput {
  barbershopId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  /** Stable identifier for this booking attempt. Auto-generated if omitted. Used for idempotency on retry. */
  requestId?: string;
  manualContact?: { name: string; phone: string; email?: string };
}

export type AppointmentStatusChange = 'confirmed' | 'cancelled' | 'completed' | 'absent';
export interface AppointmentCommandResult {
  success: true;
  id: string;
  status: 'pending' | AppointmentStatusChange;
  notificationStatus: 'queued' | 'skipped';
}

const sessionMessage = 'Tu sesión expiró. Iniciá sesión nuevamente.';
const requestMessage = 'No pudimos procesar la solicitud. Intentá nuevamente.';

async function postCommand(endpoint: string, payload: unknown): Promise<AppointmentCommandResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new ApiError(401, sessionMessage);
  }

  let token: string;
  try {
    token = await currentUser.getIdToken();
  } catch {
    throw new ApiError(401, sessionMessage);
  }
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar. Revisá tu conexión e intentá nuevamente.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401 ? sessionMessage
      : response.status === 403 ? 'No tenés permiso para realizar esta acción.'
      : data?.error === 'SLOT_TAKEN' ? 'SLOT_TAKEN'
      : requestMessage;
    throw new ApiError(response.status, message);
  }

  if (!data || typeof data !== 'object') throw new ApiError(502, requestMessage);
  return data as AppointmentCommandResult;
}

export const appointmentApi = {
  create: (payload: CreateAppointmentInput) => {
    // Attach a stable requestId for idempotency; preserve caller-provided value across retries.
    const requestId = payload.requestId ?? crypto.randomUUID();
    return postCommand('/api/create-appointment', { ...payload, requestId });
  },
  update: (barbershopId: string, appointmentId: string, status: AppointmentStatusChange) =>
    postCommand('/api/update-appointment', { barbershopId, appointmentId, status }),
};
