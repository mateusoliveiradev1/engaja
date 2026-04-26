import { describe, expect, it } from "vitest";

import { developmentSessionTokens } from "@engaja/security";

import { createApiApp } from "../src/index.js";

describe("operations routes", () => {
  it("returns the operations view with routines, standards and shift summary", async () => {
    const response = await createApiApp().request("/operations/view", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_operations_view",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        routines: expect.arrayContaining([
          expect.objectContaining({
            id: "opening",
          }),
        ]),
        shiftSummary: expect.objectContaining({
          title: "Resumo do turno FLV",
        }),
        standards: expect.arrayContaining([
          expect.objectContaining({
            id: "standard_quality_review",
          }),
        ]),
      },
      requestId: "req_operations_view",
    });
  });

  it("completes checklist items, creates issues and marks learning bites through HTTP routes", async () => {
    const app = createApiApp({
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    const checklistResponse = await app.request("/operations/checklist-items/complete", {
      body: JSON.stringify({
        evidencePhotoUrl: "https://images.engaja.local/operations/replenishment-gaps.jpg",
        itemId: "replenishment-gaps",
        note: "Ruptura principal fechada antes do almoco.",
        pendingSync: true,
        routineId: "replenishment",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        shiftId: "shift_today_collaborator",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_operations_checklist_complete",
      },
      method: "POST",
    });

    expect(checklistResponse.status).toBe(200);
    await expect(checklistResponse.json()).resolves.toMatchObject({
      data: {
        routines: expect.arrayContaining([
          expect.objectContaining({
            id: "replenishment",
            items: expect.arrayContaining([
              expect.objectContaining({
                completedByUserId: "user_demo_colaborador",
                id: "replenishment-gaps",
                pendingSync: true,
                shiftId: "shift_today_collaborator",
                status: "completed",
              }),
            ]),
          }),
        ]),
        summary: expect.objectContaining({
          pendingSyncCount: expect.any(Number),
        }),
      },
      requestId: "req_operations_checklist_complete",
    });

    const issueResponse = await app.request("/operations/issues", {
      body: JSON.stringify({
        category: "avaria",
        evidencePhotoUrls: ["https://images.engaja.local/operations/avaria.jpg"],
        note: "Manga com dano aparente separada do lote.",
        pendingSync: true,
        productName: "Manga palmer",
        quantity: 3,
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        severity: "high",
        shiftId: "shift_today_collaborator",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_operations_issue_create",
      },
      method: "POST",
    });

    expect(issueResponse.status).toBe(200);
    await expect(issueResponse.json()).resolves.toMatchObject({
      data: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            category: "Avaria de produto",
            pendingSync: true,
            productName: "Manga palmer",
            quantity: 3,
            severity: "high",
            status: "open",
          }),
        ]),
      },
      requestId: "req_operations_issue_create",
    });

    const learningResponse = await app.request("/operations/learning-bites/complete", {
      body: JSON.stringify({
        learningBiteId: "learning_bite_2",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_operations_learning_complete",
      },
      method: "POST",
    });

    expect(learningResponse.status).toBe(200);
    await expect(learningResponse.json()).resolves.toMatchObject({
      data: {
        learningBites: expect.arrayContaining([
          expect.objectContaining({
            completed: true,
            completedByUserId: "user_demo_colaborador",
            id: "learning_bite_2",
          }),
        ]),
      },
      requestId: "req_operations_learning_complete",
    });
  });
});
