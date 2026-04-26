import { describe, expect, it } from "vitest";

import {
  ApiClientError,
  canRunSensitiveQuery,
  createSensitiveQueryScope,
  createTypedApiClient,
  localDataAdapterDescriptor,
  mobileApiAdapterDescriptor,
} from "../src/index.js";

describe("localDataAdapterDescriptor", () => {
  it("defaults data adapters to server-only local mode", () => {
    expect(localDataAdapterDescriptor).toEqual({
      kind: "local",
      serverOnly: true,
    });
  });

  it("exposes an API-only mobile adapter", () => {
    expect(mobileApiAdapterDescriptor).toEqual({
      kind: "api",
      serverOnly: false,
    });
  });

  it("uses shared contracts to parse typed API responses", async () => {
    const client = createTypedApiClient({
      baseUrl: "http://localhost:3000",
      fetcher: (input, init) => {
        expect(urlFromRequestInput(input)).toBe("http://localhost:3000/health");
        expect(init?.method).toBe("GET");

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                name: "@engaja/api",
                status: "ok",
                version: "0.2.0",
              },
              requestId: "req_data",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
              status: 200,
            },
          ),
        );
      },
    });

    await expect(client.request("health.read")).resolves.toEqual({
      data: {
        name: "@engaja/api",
        status: "ok",
        version: "0.2.0",
      },
      requestId: "req_data",
    });
  });

  it("raises typed errors for API error envelopes", async () => {
    const client = createTypedApiClient({
      baseUrl: "http://localhost:3000",
      fetcher: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: {
                code: "forbidden",
                message: "Sem permissao.",
              },
              requestId: "req_forbidden",
            }),
            {
              headers: {
                "content-type": "application/json",
              },
              status: 403,
            },
          ),
        ),
    });

    await expect(client.request("dashboard.summary")).rejects.toBeInstanceOf(ApiClientError);
  });

  it("requires scoped authorization before sensitive query helpers return filters", () => {
    const actor = {
      role: "lider-setor" as const,
      scope: {
        departmentId: domainId<"department">("dept_flv"),
        organizationId: domainId<"organization">("org_demo"),
        storeId: domainId<"store">("store_001"),
      },
      userId: domainId<"user">("user_lider"),
    };

    expect(
      createSensitiveQueryScope(actor, {
        action: "operations.summary.read",
        requestedScope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
    ).toEqual({
      departmentId: "dept_flv",
      organizationId: "org_demo",
      permissionAction: "operations.summary.read",
      storeId: "store_001",
    });

    expect(
      canRunSensitiveQuery(actor, {
        action: "operations.summary.read",
        requestedScope: {
          departmentId: "dept_padaria",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
    ).toBe(false);
  });
});

function urlFromRequestInput(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  if (input instanceof Request) {
    return input.url;
  }

  throw new Error("Unsupported fetch input.");
}

function domainId<TBrand extends string>(value: string): string & { readonly __brand: TBrand } {
  return value as string & { readonly __brand: TBrand };
}
