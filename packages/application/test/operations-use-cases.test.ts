import { describe, expect, it } from "vitest";

import {
  createChecklistItemCompletion,
  createChecklistRun,
  createOperationIssue,
  createOperationLearningBite,
} from "@engaja/domain";

import {
  completeChecklistItem,
  completeLearningBite,
  createActorContext,
  createApplicationTenantScope,
  createOperationsIssue,
  getOperationsView,
  type OperationsRepositoryPort,
} from "../src/index.js";

const scope = createApplicationTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

const collaborator = createActorContext({
  role: "colaborador",
  scope,
  userId: "user_demo_colaborador",
});

describe("operations use cases", () => {
  it("records checklist completion with responsible user, timestamp, shift context and pending sync", async () => {
    const operationsRepository = createOperationsRepositoryHarness();

    const view = await completeChecklistItem({
      actor: collaborator,
      evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
      itemId: "opening-front",
      note: "Frente premium fechada antes do pico.",
      now: new Date("2026-04-23T09:08:00.000Z"),
      operationsRepository,
      pendingSync: true,
      routineId: "opening",
      scope,
      shiftId: "shift_today_collaborator" as string & { readonly __brand: "shift" },
    });

    const completedItem =
      view.routines
        .find((routine) => routine.id === "opening")
        ?.items.find((item) => item.id === "opening-front") ??
      fail("Expected checklist item.");

    expect(completedItem).toMatchObject({
      completedByUserId: "user_demo_colaborador",
      completedByUserName: "Colaborador FLV",
      evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
      note: "Frente premium fechada antes do pico.",
      pendingSync: true,
      shiftId: "shift_today_collaborator",
      status: "completed",
    });
    expect(completedItem.completedAt).toBeInstanceOf(Date);
    expect(view.summary.pendingSyncCount).toBe(1);
  });

  it("blocks missing evidence when checklist item or issue category requires it", async () => {
    const operationsRepository = createOperationsRepositoryHarness();

    await expect(
      completeChecklistItem({
        actor: collaborator,
        itemId: "opening-front",
        now: new Date("2026-04-23T09:08:00.000Z"),
        operationsRepository,
        routineId: "opening",
        scope,
      }),
    ).rejects.toThrow("obrigatoria");

    await expect(
      createOperationsIssue({
        actor: collaborator,
        category: "ruptura",
        now: new Date("2026-04-23T11:00:00.000Z"),
        operationsRepository,
        scope,
        severity: "high",
      }),
    ).rejects.toThrow("obrigatoria");
  });

  it("summarizes overdue routines, open issues, evidence and learning wins by shift", async () => {
    const operationsRepository = createOperationsRepositoryHarness({
      checklistItemCompletions: [
        createChecklistItemCompletion({
          completedAt: new Date("2026-04-23T09:08:00.000Z"),
          completedByUserId: "user_demo_colaborador",
          evidenceMode: "required",
          evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
          id: "checklist_run_opening:opening-front",
          itemId: "opening-front",
          pendingSync: false,
          runId: "checklist_run_opening",
          scope,
          shiftId: "shift_today_collaborator",
          status: "completed",
        }),
        createChecklistItemCompletion({
          completedAt: new Date("2026-04-23T10:08:00.000Z"),
          completedByUserId: "user_demo_colaborador",
          evidenceMode: "required",
          evidencePhotoUrl: "https://images.engaja.local/operations/quality-damaged.jpg",
          id: "checklist_run_quality:quality-damaged",
          itemId: "quality-damaged",
          pendingSync: false,
          runId: "checklist_run_quality",
          scope,
          shiftId: "shift_today_collaborator",
          status: "completed",
        }),
      ],
      checklistRuns: [
        createChecklistRun({
          assignedUserId: "user_demo_colaborador",
          completedAt: new Date("2026-04-23T09:35:00.000Z"),
          dueAt: new Date("2026-04-23T09:30:00.000Z"),
          id: "checklist_run_opening",
          pendingSync: false,
          routineId: "opening",
          scope,
          shiftId: "shift_today_collaborator",
          status: "completed",
        }),
        createChecklistRun({
          assignedUserId: "user_demo_colaborador",
          dueAt: new Date("2026-04-23T08:45:00.000Z"),
          id: "checklist_run_cleaning",
          pendingSync: false,
          routineId: "cleaning",
          scope,
          shiftId: "shift_today_collaborator",
          status: "overdue",
        }),
        createChecklistRun({
          assignedUserId: "user_demo_colaborador",
          completedAt: new Date("2026-04-23T10:35:00.000Z"),
          dueAt: new Date("2026-04-23T10:30:00.000Z"),
          id: "checklist_run_quality",
          pendingSync: false,
          routineId: "quality-review",
          scope,
          shiftId: "shift_today_collaborator",
          status: "completed",
        }),
      ],
      issues: [
        createOperationIssue({
          category: "Perda e quebra",
          createdAt: new Date("2026-04-23T11:00:00.000Z"),
          evidencePhotoUrls: ["https://images.engaja.local/operations/loss-issue.jpg"],
          id: "issue_open_1",
          note: "Tomate grape com quebra no segundo pico.",
          productName: "Tomate grape",
          quantity: 6,
          reportedByUserId: "user_demo_colaborador",
          scope,
          severity: "medium",
          shiftId: "shift_today_collaborator",
          status: "open",
        }),
      ],
      learningBites: [
        createOperationLearningBite({
          completedAt: new Date("2026-04-23T09:55:00.000Z"),
          completedByUserId: "user_demo_colaborador",
          description: "Aprenda a comparar cor, firmeza e brilho antes de manter frutas sensiveis na frente.",
          durationMinutes: 4,
          id: "learning_bite_1",
          pendingSync: false,
          pointsAwarded: 30,
          scope,
          standardId: "standard_quality_review",
          title: "Triagem expressa de frutas sensiveis",
        }),
      ],
    });

    const completedLearningView = await completeLearningBite({
      actor: collaborator,
      learningBiteId: "learning_bite_1" as string & { readonly __brand: "learning-bite" },
      now: new Date("2026-04-23T09:55:00.000Z"),
      operationsRepository,
      scope,
    });
    const view = await getOperationsView({
      actor: collaborator,
      operationsRepository,
      scope,
    });

    expect(completedLearningView.learningBites[0]).toMatchObject({
      completed: true,
      completedByUserId: "user_demo_colaborador",
    });
    expect(view.shiftSummary).toMatchObject({
      completedRoutineCount: 0,
      evidenceCount: 2,
      openIssueCount: 1,
      pendingSyncCount: 0,
      shiftId: "shift_today_collaborator",
    });
    expect(view.shiftSummary.overdueItems.length).toBeGreaterThan(0);
    expect(view.shiftSummary.wins.length).toBeGreaterThan(0);
  });
});

function createOperationsRepositoryHarness(input: {
  readonly checklistItemCompletions?: readonly ReturnType<typeof createChecklistItemCompletion>[];
  readonly checklistRuns?: readonly ReturnType<typeof createChecklistRun>[];
  readonly issues?: readonly ReturnType<typeof createOperationIssue>[];
  readonly learningBites?: readonly ReturnType<typeof createOperationLearningBite>[];
} = {}): OperationsRepositoryPort {
  const checklistRuns = [...(input.checklistRuns ?? [])];
  const checklistItemCompletions = [...(input.checklistItemCompletions ?? [])];
  const issues = [...(input.issues ?? [])];
  const learningBites = [...(input.learningBites ?? [])];

  return {
    findChecklistRunById(id) {
      return Promise.resolve(checklistRuns.find((run) => run.id === id));
    },
    listChecklistItemCompletions() {
      return Promise.resolve(checklistItemCompletions);
    },
    listChecklistRuns() {
      return Promise.resolve(checklistRuns);
    },
    listIssues() {
      return Promise.resolve(issues);
    },
    listLearningBites() {
      return Promise.resolve(learningBites);
    },
    saveChecklistItemCompletion(completion) {
      const currentIndex = checklistItemCompletions.findIndex((candidate) => candidate.id === completion.id);

      if (currentIndex >= 0) {
        checklistItemCompletions[currentIndex] = completion;
      } else {
        checklistItemCompletions.push(completion);
      }

      return Promise.resolve(completion);
    },
    saveChecklistRun(run) {
      const currentIndex = checklistRuns.findIndex((candidate) => candidate.id === run.id);

      if (currentIndex >= 0) {
        checklistRuns[currentIndex] = run;
      } else {
        checklistRuns.push(run);
      }

      return Promise.resolve(run);
    },
    saveIssue(issue) {
      const currentIndex = issues.findIndex((candidate) => candidate.id === issue.id);

      if (currentIndex >= 0) {
        issues[currentIndex] = issue;
      } else {
        issues.push(issue);
      }

      return Promise.resolve(issue);
    },
    saveLearningBite(learningBite) {
      const currentIndex = learningBites.findIndex((candidate) => candidate.id === learningBite.id);

      if (currentIndex >= 0) {
        learningBites[currentIndex] = learningBite;
      } else {
        learningBites.push(learningBite);
      }

      return Promise.resolve(learningBite);
    },
  };
}

function fail(message: string): never {
  throw new Error(message);
}
