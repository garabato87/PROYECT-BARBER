const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  'auth/user-not-found':         'Correo o contraseña incorrectos.', // Prevents account enumeration
  'auth/wrong-password':         'Correo o contraseña incorrectos.', // Prevents account enumeration
  'auth/invalid-email':          'El correo electrónico no es válido.',
  'auth/email-already-in-use':   'Ya existe una cuenta con este correo.',
  'auth/weak-password':          'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/too-many-requests':      'Demasiados intentos fallidos. Intentá más tarde.',
  'auth/user-disabled':          'Esta cuenta fue deshabilitada.',
  'auth/network-request-failed': 'Error de red. Revisá tu conexión a internet.',
  'auth/operation-not-allowed':  'Operación no permitida. Contactá a soporte.',
};

export const getAppError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    return FIREBASE_ERRORS[code] ?? 'Ocurrió un error inesperado. Intentá nuevamente.';
  }
  
  if (err instanceof Error && import.meta.env.DEV) {
    // Solo mostramos el mensaje de error técnico en desarrollo para evitar fugar información sensible (Toast Leak)
    return err.message;
  }
  
  return 'Ocurrió un error inesperado. Intentá nuevamente.';
};
