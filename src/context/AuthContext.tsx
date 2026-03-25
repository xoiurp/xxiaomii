'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

// Tipos para o contexto de autenticação
interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'CLIENT' | 'ADMIN';
  shopifyCustomerId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isClient: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Componente interno que usa useSession
function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  
  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    shopifyCustomerId: session.user.shopifyCustomerId,
  } : null;

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const isClient = user?.role === 'CLIENT';
  const isAdmin = user?.role === 'ADMIN';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isClient,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Provider principal que combina SessionProvider e AuthContextProvider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  );
} 