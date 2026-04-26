import type {
  AccessInviteAcceptRequestPayload,
  AuthLoginRequestPayload,
  FlvRole,
  TenantScopePayload,
} from "@engaja/contracts";
import type { PropsWithChildren, ReactNode } from "react";

import NetInfo from "@react-native-community/netinfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  flvPalette,
  flvSemanticColors,
  flvVisualDirection,
  radiusScale,
  spacingScale,
} from "@engaja/ui";
import { ErrorStateCard, ScreenScaffold } from "@engaja/ui/native";

import { createMobileAnalyticsEmitter } from "./analytics.js";
import {
  createMobileAuthService,
  isUnauthorizedAuthError,
  type MobileAuthService,
} from "./auth-service.js";
import { secureStoreAuthStorage, type MobileAuthStorage } from "./auth-storage.js";

export interface MobileSession {
  readonly accessToken?: string;
  readonly displayName: string;
  readonly role: FlvRole;
  readonly scope: TenantScopePayload;
  readonly userId: string;
}

interface ThemeContextValue {
  readonly colors: typeof flvSemanticColors;
  readonly palette: typeof flvPalette;
  readonly radii: typeof radiusScale;
  readonly spacing: typeof spacingScale;
  readonly visualDirection: typeof flvVisualDirection;
}

interface SessionContextValue {
  readonly acceptInvite: (input: AccessInviteAcceptRequestPayload) => Promise<void>;
  readonly clearSession: () => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly refreshSession: () => Promise<void>;
  readonly session: MobileSession | null;
  readonly sessionError?: string;
  readonly sessionStatus: SessionStatus;
  readonly setSession: (session: MobileSession | null) => void;
  readonly signIn: (input: AuthLoginRequestPayload) => Promise<void>;
}

type SessionStatus = "authenticated" | "restoring" | "unauthenticated";

interface OfflineStatusContextValue {
  readonly isOffline: boolean;
}

interface AnalyticsContextValue {
  readonly emit: (eventName: string, properties?: Readonly<Record<string, unknown>>) => void;
}

interface AppProvidersProps extends PropsWithChildren {
  readonly authService?: MobileAuthService | undefined;
  readonly authStorage?: MobileAuthStorage | undefined;
  readonly initialSession?: MobileSession | null | undefined;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: flvSemanticColors,
  palette: flvPalette,
  radii: radiusScale,
  spacing: spacingScale,
  visualDirection: flvVisualDirection,
});

const SessionContext = createContext<SessionContextValue>({
  acceptInvite: () => Promise.resolve(),
  clearSession: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  refreshSession: () => Promise.resolve(),
  session: null,
  sessionStatus: "unauthenticated",
  setSession: () => undefined,
  signIn: () => Promise.resolve(),
});

const OfflineStatusContext = createContext<OfflineStatusContextValue>({
  isOffline: false,
});

const AnalyticsContext = createContext<AnalyticsContextValue>({
  emit: () => undefined,
});

export function AppProviders({
  authService = createMobileAuthService(),
  authStorage = secureStoreAuthStorage,
  children,
  initialSession,
}: AppProvidersProps): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 30,
            retry: 1,
            staleTime: 1000 * 20,
          },
        },
      }),
  );

  const theme = useMemo<ThemeContextValue>(
    () => ({
      colors: flvSemanticColors,
      palette: flvPalette,
      radii: radiusScale,
      spacing: spacingScale,
      visualDirection: flvVisualDirection,
    }),
    [],
  );

  return (
    <MobileErrorBoundary>
      <ThemeContext.Provider value={theme}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider
            authService={authService}
            authStorage={authStorage}
            initialSession={initialSession}
          >
            <OfflineStatusProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </OfflineStatusProvider>
          </SessionProvider>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </MobileErrorBoundary>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

export function useOfflineStatus(): OfflineStatusContextValue {
  return useContext(OfflineStatusContext);
}

function SessionProvider({
  authService,
  authStorage,
  children,
  initialSession,
}: AppProvidersProps & {
  readonly authService: MobileAuthService;
  readonly authStorage: MobileAuthStorage;
}): ReactNode {
  const [session, setSession] = useState<MobileSession | null>(initialSession ?? null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(
    initialSession === undefined
      ? "restoring"
      : initialSession === null
        ? "unauthenticated"
        : "authenticated",
  );
  const [sessionError, setSessionError] = useState<string>();

  useEffect(() => {
    if (initialSession !== undefined) {
      return;
    }

    let cancelled = false;

    async function restoreSession(): Promise<void> {
      setSessionStatus("restoring");
      setSessionError(undefined);

      const storedSessionToken = await authStorage.getSessionToken();

      if (storedSessionToken === undefined) {
        if (!cancelled) {
          setSession(null);
          setSessionStatus("unauthenticated");
        }

        return;
      }

      try {
        const refreshedSession = await authService.refreshSession(storedSessionToken);

        await authStorage.setSessionToken(refreshedSession.accessToken ?? storedSessionToken);

        if (!cancelled) {
          setSession(refreshedSession);
          setSessionStatus("authenticated");
        }
      } catch (error) {
        if (isUnauthorizedAuthError(error)) {
          await authStorage.clearSessionToken();
        }

        if (!cancelled) {
          setSession(null);
          setSessionStatus("unauthenticated");
          setSessionError(
            isUnauthorizedAuthError(error)
              ? "Seu acesso expirou. Entre novamente para continuar."
              : "Nao foi possivel confirmar seu acesso agora.",
          );
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [authService, authStorage, initialSession]);

  const applySession = React.useCallback((nextSession: MobileSession | null): void => {
    setSession(nextSession);
    setSessionStatus(nextSession === null ? "unauthenticated" : "authenticated");
    setSessionError(undefined);
  }, []);

  const clearSession = React.useCallback(async (): Promise<void> => {
    await authStorage.clearSessionToken();
    applySession(null);
  }, [applySession, authStorage]);

  const signIn = React.useCallback(
    async (input: AuthLoginRequestPayload): Promise<void> => {
      const nextSession = await authService.login(input);

      await authStorage.setSessionToken(nextSession.accessToken ?? "");
      applySession(nextSession);
    },
    [applySession, authService, authStorage],
  );

  const acceptInvite = React.useCallback(
    async (input: AccessInviteAcceptRequestPayload): Promise<void> => {
      const nextSession = await authService.acceptInvite(input);

      await authStorage.setSessionToken(nextSession.accessToken ?? "");
      applySession(nextSession);
    },
    [applySession, authService, authStorage],
  );

  const refreshSession = React.useCallback(async (): Promise<void> => {
    const sessionToken = session?.accessToken ?? (await authStorage.getSessionToken());

    if (sessionToken === undefined) {
      await clearSession();
      return;
    }

    try {
      const refreshedSession = await authService.refreshSession(sessionToken);

      await authStorage.setSessionToken(refreshedSession.accessToken ?? sessionToken);
      applySession(refreshedSession);
    } catch (error) {
      if (isUnauthorizedAuthError(error)) {
        await clearSession();
        return;
      }

      setSessionError("Nao foi possivel atualizar seu acesso agora.");
      throw error;
    }
  }, [applySession, authService, authStorage, clearSession, session?.accessToken]);

  const logout = React.useCallback(async (): Promise<void> => {
    const sessionToken = session?.accessToken ?? (await authStorage.getSessionToken());

    try {
      await authService.logout(sessionToken);
    } finally {
      await clearSession();
    }
  }, [authService, authStorage, clearSession, session?.accessToken]);

  const value = useMemo<SessionContextValue>(
    () => ({
      acceptInvite,
      clearSession,
      logout,
      refreshSession,
      session,
      ...(sessionError === undefined ? {} : { sessionError }),
      sessionStatus,
      setSession: applySession,
      signIn,
    }),
    [
      acceptInvite,
      applySession,
      clearSession,
      logout,
      refreshSession,
      session,
      sessionError,
      sessionStatus,
      signIn,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function OfflineStatusProvider({ children }: PropsWithChildren): ReactNode {
  const [isOffline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<OfflineStatusContextValue>(() => ({ isOffline }), [isOffline]);

  return <OfflineStatusContext.Provider value={value}>{children}</OfflineStatusContext.Provider>;
}

function AnalyticsProvider({ children }: PropsWithChildren): ReactNode {
  const value = useMemo<AnalyticsContextValue>(
    () => ({
      emit: createMobileAnalyticsEmitter(),
    }),
    [],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

interface ErrorBoundaryState {
  readonly errorMessage?: string;
}

class MobileErrorBoundary extends React.Component<PropsWithChildren, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      errorMessage: error.message,
    };
  }

  override render(): ReactNode {
    if (this.state.errorMessage !== undefined) {
      return (
        <ScreenScaffold
          eyebrow="Falha protegida"
          subtitle="A experiencia de erro segue o mesmo cuidado visual dos fluxos primarios."
          title="Nao foi possivel abrir esta tela"
        >
          <ErrorStateCard
            actionLabel="Tentar de novo"
            description="O erro foi isolado para que o restante do app continue confiavel e seguro."
            title={this.state.errorMessage}
          />
        </ScreenScaffold>
      );
    }

    return this.props.children;
  }
}
