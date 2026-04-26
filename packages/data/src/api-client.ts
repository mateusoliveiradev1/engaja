import type { ActorContext, ApplicationResult } from "@engaja/application";
import type { ApiContractKey } from "@engaja/contracts";
import type {
  AuthorizationRequest,
  PermissionAction,
  ScopedResource,
  SecurityActor,
} from "@engaja/security";
import type { z } from "zod";

import { apiContracts, apiErrorEnvelopeSchema } from "@engaja/contracts";
import { assertAuthorized, evaluatePermission } from "@engaja/security";

export type DataAdapterKind = "api" | "local" | "neon" | "memory";

export interface RepositoryPort<TEntity, TQuery> {
  find(query: TQuery): Promise<readonly TEntity[]>;
}

export interface DataAdapterDescriptor {
  readonly kind: DataAdapterKind;
  readonly serverOnly: boolean;
}

export interface SensitiveQueryRequest {
  readonly action: PermissionAction;
  readonly requestedScope?: ScopedResource;
}

export interface SensitiveQueryScope extends ScopedResource {
  readonly permissionAction: PermissionAction;
}

export type RepositoryResult<TData> = ApplicationResult<TData>;

export const localDataAdapterDescriptor: DataAdapterDescriptor = {
  kind: "local",
  serverOnly: true,
};

export const mobileApiAdapterDescriptor: DataAdapterDescriptor = {
  kind: "api",
  serverOnly: false,
};

type ResponseSchemaFor<TContract extends ApiContractKey> =
  (typeof apiContracts)[TContract]["response"];

type RequestSchemaFor<TContract extends ApiContractKey> =
  (typeof apiContracts)[TContract] extends { readonly request: infer TSchema extends z.ZodType }
    ? TSchema
    : undefined;

export type ApiContractResponse<TContract extends ApiContractKey> = z.infer<
  ResponseSchemaFor<TContract>
>;

export type ApiContractRequest<TContract extends ApiContractKey> =
  RequestSchemaFor<TContract> extends z.ZodType ? z.infer<RequestSchemaFor<TContract>> : undefined;

export interface ApiClientRequestOptions<TContract extends ApiContractKey> {
  readonly body?: ApiContractRequest<TContract>;
  readonly query?: Readonly<Record<string, boolean | number | string | undefined>>;
  readonly requestId?: string;
}

export interface TypedApiClientOptions {
  readonly accessTokenProvider?: () => Promise<string | undefined> | string | undefined;
  readonly baseUrl: string;
  readonly fetcher?: typeof fetch;
}

export interface TypedApiClient {
  request<TContract extends ApiContractKey>(
    contractKey: TContract,
    options?: ApiClientRequestOptions<TContract>,
  ): Promise<ApiContractResponse<TContract>>;
}

export class ApiClientError extends Error {
  readonly requestId?: string;
  readonly status: number;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;

    if (requestId !== undefined) {
      this.requestId = requestId;
    }
  }
}

export function createTypedApiClient(options: TypedApiClientOptions): TypedApiClient {
  const fetcher = options.fetcher ?? fetch;

  return {
    async request(contractKey, requestOptions) {
      const contract = apiContracts[contractKey];
      const url = new URL(joinPath(options.baseUrl, contract.path));

      for (const [key, value] of Object.entries(requestOptions?.query ?? {})) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }

      const headers = new Headers({
        accept: "application/json",
        "x-contract-version": "0.2.0",
      });

      if (requestOptions?.requestId !== undefined) {
        headers.set("x-request-id", requestOptions.requestId);
      }

      const token = await options.accessTokenProvider?.();

      if (token !== undefined) {
        headers.set("authorization", `Bearer ${token}`);
      }

      const init: RequestInit = {
        headers,
        method: contract.method,
      };

      if ("request" in contract) {
        const parsedBody = contract.request.parse(requestOptions?.body);
        headers.set("content-type", "application/json");
        init.body = JSON.stringify(parsedBody);
      }

      const response = await fetcher(url, init);
      const json: unknown = await response.json();

      if (!response.ok) {
        const parsedError = apiErrorEnvelopeSchema.safeParse(json);
        const message = parsedError.success
          ? parsedError.data.error.message
          : `Request ${contractKey} failed with status ${response.status}.`;
        const requestId = parsedError.success ? parsedError.data.requestId : undefined;

        throw new ApiClientError(message, response.status, requestId);
      }

      const parseResponse = contract.response.parse.bind(contract.response) as (
        input: unknown,
      ) => ApiContractResponse<typeof contractKey>;

      return parseResponse(json);
    },
  };
}

export function createSensitiveQueryScope(
  actor: ActorContext,
  request: SensitiveQueryRequest,
): SensitiveQueryScope {
  const requestedScope = request.requestedScope ?? scopeFromActor(actor);
  const authorizationRequest: AuthorizationRequest = {
    action: request.action,
    resource: requestedScope,
  };

  assertAuthorized(toSecurityActor(actor), authorizationRequest);

  return {
    ...requestedScope,
    permissionAction: request.action,
  };
}

export function canRunSensitiveQuery(
  actor: ActorContext,
  request: SensitiveQueryRequest,
): boolean {
  const requestedScope = request.requestedScope ?? scopeFromActor(actor);

  return evaluatePermission(toSecurityActor(actor), {
    action: request.action,
    resource: requestedScope,
  }).allowed;
}

function joinPath(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function toSecurityActor(actor: ActorContext): SecurityActor {
  return {
    role: actor.role,
    scope: actor.scope,
    userId: actor.userId,
  };
}

function scopeFromActor(actor: ActorContext): ScopedResource {
  return {
    organizationId: actor.scope.organizationId,
    ...(actor.scope.departmentId === undefined ? {} : { departmentId: actor.scope.departmentId }),
    ...(actor.scope.storeId === undefined ? {} : { storeId: actor.scope.storeId }),
  };
}
