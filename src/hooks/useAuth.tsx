import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

import type { User } from '../types';

export interface RegisterData {
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  birthDate: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (data: RegisterData) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone' | 'barbershopId'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES = ['super-admin', 'admin', 'professional', 'client'] as const;

const parseUserDoc = (uid: string, data: Record<string, unknown>): User => ({
  id: uid,
  name: typeof data.name === 'string' && data.name ? data.name : 'Usuario',
  email: typeof data.email === 'string' ? data.email : '',
  phone: typeof data.phone === 'string' ? data.phone : '',
  role: VALID_ROLES.includes(data.role as User['role']) ? (data.role as User['role']) : 'client',
  barbershopId: typeof data.barbershopId === 'string' ? data.barbershopId : undefined,
});

const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return parseUserDoc(firebaseUser.uid, docSnap.data() as Record<string, unknown>);
    }
    // Auth existe pero no hay doc en Firestore — lo creamos ahora
    const newProfile = {
      name: firebaseUser.displayName ?? firebaseUser.email ?? 'Usuario',
      email: firebaseUser.email ?? '',
      phone: '',
      role: 'client' as const,
    };
    await setDoc(docRef, newProfile);
    return parseUserDoc(firebaseUser.uid, newProfile);
  } catch {
    // Firestore no disponible — fallback sin persistir
    return parseUserDoc(firebaseUser.uid, {
      name: firebaseUser.displayName ?? firebaseUser.email ?? 'Usuario',
      email: firebaseUser.email ?? '',
      phone: '',
      role: 'client',
    });
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await fetchUserProfile(firebaseUser);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const register = async (data: RegisterData): Promise<void> => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      name: `${data.name} ${data.lastName}`,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dni: data.dni,
      birthDate: data.birthDate,
      role: 'client',
    });
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    return fetchUserProfile(firebaseUser);
  };

  const loginWithGoogle = async (): Promise<User> => {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        name: firebaseUser.displayName ?? 'Usuario',
        email: firebaseUser.email ?? '',
        phone: '',
        role: 'client',
      });
    }
    return fetchUserProfile(firebaseUser);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<Pick<User, 'name' | 'phone'>>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { ...data });
    setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      register,
      login,
      loginWithGoogle,
      logout,
      sendPasswordReset,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
