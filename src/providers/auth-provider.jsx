"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentSession,
  getCurrentUser,
  hasVerifiedTotp,
  getSessionRole,
  isAuthenticated,
  requiresTotp,
  signOut as signOutSession,
} from "@/lib/auth/session";

const AuthContext = createContext(null);

function buildState(session, isLoading) {
  const user = getCurrentUser(session);

  return {
    session,
    user,
    role: getSessionRole(session),
    isLoading,
    isAuthenticated: isAuthenticated(session),
    totpRequired: requiresTotp(session),
    totpVerified: hasVerifiedTotp(session),
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => buildState(null, true));

  async function refresh() {
    setState((currentState) => ({ ...currentState, isLoading: true }));

    try {
      const session = await getCurrentSession();
      setState(buildState(session, false));
      return session;
    } catch (error) {
      setState(buildState(null, false));
      throw error;
    }
  }

  async function logout() {
    await signOutSession();
    setState(buildState(null, false));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const session = await getCurrentSession();

        if (isMounted) {
          setState(buildState(session, false));
        }
      } catch {
        if (isMounted) {
          setState(buildState(null, false));
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider.");
  }

  return context;
}
