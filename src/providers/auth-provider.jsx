"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentAdminSession,
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

  const refresh = useCallback(async (options = {}) => {
    setState((currentState) => ({ ...currentState, isLoading: true }));

    try {
      const session =
        options.scope === "admin"
          ? await getCurrentAdminSession(options)
          : await getCurrentSession(options);
      setState(buildState(session, false));
      return session;
    } catch (error) {
      if (error?.status === 401) {
        setState(buildState(null, false));
      } else {
        setState((currentState) => ({ ...currentState, isLoading: false }));
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOutSession();
    setState(buildState(null, false));
  }, []);

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

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      logout,
    }),
    [logout, refresh, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider.");
  }

  return context;
}
