import { describe, expect, it } from "vitest";

import { createOperationsService } from "../src/app/operations-service.js";

const offlineFetcher: typeof fetch = async () => {
  throw new Error("offline");
};

const session = {
  displayName: "Colaborador FLV",
  role: "colaborador" as const,
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_colaborador",
};

describe("operations mobile service", () => {
  it("does not fall back to demo writes unless explicitly enabled", async () => {
    const service = createOperationsService(session, {
      fetcher: offlineFetcher,
    });

    await expect(service.getCollaboratorView()).rejects.toThrow("offline");
  });

  it("preserves checklist progress locally with pending sync when offline", async () => {
    const service = createOperationsService(session, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });

    const view = await service.completeChecklistItem({
      evidencePhotoUrl: "https://images.engaja.local/operations/replenishment-gaps.jpg",
      itemId: "replenishment-gaps",
      note: "Ruptura principal fechada offline.",
      pendingSync: true,
      routineId: "replenishment",
      shiftId: "shift_today_collaborator",
    });

    const completedItem =
      view.routines
        .find((routine) => routine.id === "replenishment")
        ?.items.find((item) => item.id === "replenishment-gaps") ??
      fail("Expected replenishment item.");

    expect(completedItem).toMatchObject({
      completedByUserId: "user_demo_colaborador",
      completedByUserName: "Colaborador FLV",
      evidencePhotoUrl: "https://images.engaja.local/operations/replenishment-gaps.jpg",
      note: "Ruptura principal fechada offline.",
      pendingSync: true,
      shiftId: "shift_today_collaborator",
      status: "completed",
    });
    expect(view.summary.pendingSyncCount).toBeGreaterThan(0);
    expect(view.highlight).toContain("sincronizacao local");
  });

  it("validates required evidence offline and keeps learning/issue updates available", async () => {
    const service = createOperationsService(session, {
      fetcher: offlineFetcher,
      offlineFallback: true,
    });

    await expect(
      service.createIssue({
        category: "avaria",
        pendingSync: true,
        severity: "high",
      }),
    ).rejects.toMatchObject({
      message: "Inclua uma foto de evidencia para registrar este desvio.",
      status: 400,
    });

    const issueView = await service.createIssue({
      category: "avaria",
      evidencePhotoUrls: ["https://images.engaja.local/operations/avaria.jpg"],
      pendingSync: true,
      productName: "Manga palmer",
      quantity: 2,
      severity: "high",
    });
    const learningView = await service.completeLearningBite({
      learningBiteId: "learning_bite_2",
      pendingSync: true,
    });

    expect(issueView.issues[0]).toMatchObject({
      category: "Avaria de produto",
      pendingSync: true,
      productName: "Manga palmer",
      quantity: 2,
      severity: "high",
      status: "open",
    });
    expect(learningView.learningBites.find((bite) => bite.id === "learning_bite_2")).toMatchObject({
      completed: true,
      completedByUserId: "user_demo_colaborador",
      pendingSync: true,
    });
  });
});

function fail(message: string): never {
  throw new Error(message);
}
