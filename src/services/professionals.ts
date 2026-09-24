import { auth } from './firebase';

export async function manageProfessional(command: { action: 'assign'; barbershopId: string; email: string } | { action: 'remove'; barbershopId: string; professionalId: string }) {
  if (!auth.currentUser) throw new Error('Iniciá sesión para administrar tu equipo.');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch('/api/manage-professional', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Alcanzaste el límite de operaciones. Intentá más tarde.');
    if (response.status === 409) throw new Error('No se puede agregar o quitar este usuario. Comprobá el correo y su disponibilidad.');
    throw new Error('No se pudo actualizar el equipo. Verificá tus permisos e intentá nuevamente.');
  }
}
