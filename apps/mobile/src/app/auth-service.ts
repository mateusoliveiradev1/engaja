import type {
  AccessInviteAcceptRequestPayload,
  AccessInviteCreateRequestPayload,
  AccessInvitePayload,
  AuthLoginRequestPayload,
  AuthSessionPayload,
  SessionUserPayload,
} from "@engaja/contracts";
import type { MobileSession } from "./providers.js";

import { ApiClientError, createTypedApiClient } from "@engaja/data/mobile";

export interface MobileAuthService {
  acceptInvite(input: AccessInviteAcceptRequestPayload): Promise<MobileSession>;
  createInvite(
    sessionToken: string | undefined,
    input: AccessInviteCreateRequestPayload,
  ): Promise<AccessInvitePayload>;
  listInvites(sessionToken: string | undefined): Promise<readonly AccessInvitePayload[]>;
  login(input: AuthLoginRequestPayload): Promise<MobileSession>;
  logout(sessionToken: string | undefined): Promise<void>;
  refreshSession(sessionToken: string): Promise<MobileSession>;
  resendInvite(
    sessionToken: string | undefined,
    inviteId: string,
  ): Promise<AccessInvitePayload>;
  restoreSession(sessionToken: string): Promise<MobileSession>;
  revokeInvite(
    sessionToken: string | undefined,
    inviteId: string,
  ): Promise<AccessInvitePayload>;
}

export interface MobileAuthServiceOptions {
  readonly baseUrl?: string;
  readonly fetcher?: typeof fetch;
}

export function createMobileAuthService(
  options: MobileAuthServiceOptions = {},
): MobileAuthService {
  const baseUrl = options.baseUrl ?? resolveApiBaseUrl();

  return {
    async acceptInvite(input) {
      const response = await createAuthApiClient(baseUrl, options.fetcher).request(
        "auth.invites.accept",
        {
          body: input,
        },
      );

      return toMobileSessionFromAuthSession(response.data.session);
    },
    async createInvite(sessionToken, input) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.invites.create",
        {
          body: input,
        },
      );

      return response.data;
    },
    async listInvites(sessionToken) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.invites.list",
      );

      return response.data;
    },
    async login(input) {
      const response = await createAuthApiClient(baseUrl, options.fetcher).request("auth.login", {
        body: input,
      });

      return toMobileSessionFromAuthSession(response.data);
    },
    async logout(sessionToken) {
      if (sessionToken === undefined) {
        return;
      }

      await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request("auth.logout");
    },
    async refreshSession(sessionToken) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.session.refresh",
      );

      return toMobileSessionFromAuthSession(response.data);
    },
    async resendInvite(sessionToken, inviteId) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.invites.resend",
        {
          body: {
            inviteId,
          },
        },
      );

      return response.data;
    },
    async restoreSession(sessionToken) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.session",
      );

      return toMobileSessionFromSessionUser(response.data, sessionToken);
    },
    async revokeInvite(sessionToken, inviteId) {
      const response = await createAuthApiClient(baseUrl, options.fetcher, sessionToken).request(
        "auth.invites.revoke",
        {
          body: {
            inviteId,
          },
        },
      );

      return response.data;
    },
  };
}

export function isUnauthorizedAuthError(error: unknown): boolean {
  return error instanceof ApiClientError && (error.status === 401 || error.status === 403);
}

export function toSafeAuthMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return "Nao encontramos um acesso valido com esses dados. Revise as informacoes ou peca um novo convite.";
    }

    if (error.status === 403) {
      return "Seu acesso nao permite concluir esta acao. Fale com a lideranca da loja.";
    }

    if (error.status === 410) {
      return "Este convite expirou ou foi revogado. Peca um novo acesso para a lideranca.";
    }

    if (error.status === 409) {
      return "Este convite ja foi usado. Entre com seu email e senha ou peca ajuda para recuperar o acesso.";
    }

    if (error.status === 429) {
      return "Houve muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    }

    return fallbackMessage;
  }

  return fallbackMessage;
}

export function toMobileSessionFromAuthSession(
  payload: AuthSessionPayload,
): MobileSession {
  return toMobileSessionFromSessionUser(payload.user, payload.sessionToken);
}

export function toMobileSessionFromSessionUser(
  user: SessionUserPayload,
  accessToken: string,
): MobileSession {
  return {
    accessToken,
    displayName: user.displayName,
    role: user.role,
    scope: user.scope,
    userId: user.id,
  };
}

function createAuthApiClient(
  baseUrl: string,
  fetcher: typeof fetch | undefined,
  sessionToken?: string,
) {
  return createTypedApiClient({
    accessTokenProvider: () => sessionToken,
    baseUrl,
    ...(fetcher === undefined ? {} : { fetcher }),
  });
}

function resolveApiBaseUrl(): string {
  const processEnv =
    typeof process === "undefined"
      ? undefined
      : (process.env as Record<string, string | undefined>);
  const configuredBaseUrl = processEnv?.EXPO_PUBLIC_API_URL;

  return configuredBaseUrl === undefined || configuredBaseUrl.length === 0
    ? "http://localhost:3000"
    : configuredBaseUrl;
}
