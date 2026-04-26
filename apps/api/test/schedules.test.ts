import { describe, expect, it } from "vitest";

import {
  InMemoryAuditLogSink,
  createDevelopmentSessionToken,
  developmentSessionTokens,
} from "@engaja/security";

import { createApiApp } from "../src/index.js";

const counterpartCollaboratorToken = createDevelopmentSessionToken({
  role: "colaborador",
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_colaborador_2",
});

describe("schedule routes", () => {
  it("returns the leader planner with coverage gaps and pending approvals", async () => {
    const response = await createApiApp().request("/schedules/planner", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "x-request-id": "req_schedule_planner_leader",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        coverageAlerts: expect.arrayContaining([
          expect.objectContaining({
            id: "coverage_friday_opening",
            severity: "warning",
          }),
        ]),
        pendingApprovalCount: 2,
        requests: expect.arrayContaining([
          expect.objectContaining({
            id: "request_availability_collaborator",
            kind: "availability",
            status: "pending",
          }),
          expect.objectContaining({
            id: "request_swap_weekend",
            kind: "swap",
            status: "accepted",
          }),
        ]),
      },
      requestId: "req_schedule_planner_leader",
    });
  });

  it("denies collaborator access to the leader planner route", async () => {
    const response = await createApiApp().request("/schedules/planner", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_schedule_planner_forbidden",
      },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "not_found_or_forbidden",
      },
      requestId: "req_schedule_planner_forbidden",
    });
  });

  it("publishes draft shifts, creates notifications and records an audit event", async () => {
    const auditSink = new InMemoryAuditLogSink();
    const app = createApiApp({
      auditSink,
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    const publishResponse = await app.request("/schedules/publish", {
      body: JSON.stringify({
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        shiftIds: ["shift_friday_collaborator", "shift_friday_carla"],
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_publish",
      },
      method: "POST",
    });

    expect(publishResponse.status).toBe(200);
    await expect(publishResponse.json()).resolves.toMatchObject({
      data: {
        notificationCount: 2,
        publishedCount: 2,
      },
      requestId: "req_schedule_publish",
    });
    expect(auditSink.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "schedule.publish",
          actorUserId: "user_demo_lider",
        }),
      ]),
    );

    const collaboratorViewResponse = await app.request("/schedules/collaborator-view", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_schedule_collaborator_after_publish",
      },
    });

    expect(collaboratorViewResponse.status).toBe(200);
    await expect(collaboratorViewResponse.json()).resolves.toMatchObject({
      data: {
        notifications: expect.arrayContaining([
          expect.objectContaining({
            shiftId: "shift_friday_collaborator",
            type: "schedule_published",
          }),
        ]),
        upcomingShifts: expect.arrayContaining([
          expect.objectContaining({
            id: "shift_friday_collaborator",
            status: "published",
          }),
        ]),
      },
      requestId: "req_schedule_collaborator_after_publish",
    });
  });

  it("supports availability, time-off and swap workflows through HTTP routes", async () => {
    const app = createApiApp({
      now: () => new Date("2026-04-23T12:00:00.000Z"),
    });

    const availabilityResponse = await app.request("/schedules/availability", {
      body: JSON.stringify({
        endsAt: "2026-04-28T15:00:00.000Z",
        note: "Posso cobrir a abertura da terca.",
        preferredPeriods: ["opening"],
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        startsAt: "2026-04-28T06:00:00.000Z",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_availability_create",
      },
      method: "POST",
    });
    const availabilityPayload = (await availabilityResponse.json()) as {
      data: {
        id: string;
        status: string;
      };
    };

    expect(availabilityResponse.status).toBe(200);
    expect(availabilityPayload.data.status).toBe("pending");

    const timeOffResponse = await app.request("/schedules/time-off", {
      body: JSON.stringify({
        endsAt: "2026-04-26T20:00:00.000Z",
        reason: "Compromisso pessoal no pico da tarde.",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        startsAt: "2026-04-26T11:00:00.000Z",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_time_off_create",
      },
      method: "POST",
    });
    const timeOffPayload = (await timeOffResponse.json()) as {
      data: {
        id: string;
        status: string;
      };
    };

    expect(timeOffResponse.status).toBe(200);
    expect(timeOffPayload.data.status).toBe("pending");

    const reviewAvailabilityResponse = await app.request("/schedules/requests/review", {
      body: JSON.stringify({
        decision: "approve",
        requestId: availabilityPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_availability_review",
      },
      method: "POST",
    });
    const reviewTimeOffResponse = await app.request("/schedules/requests/review", {
      body: JSON.stringify({
        decision: "reject",
        requestId: timeOffPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_time_off_review",
      },
      method: "POST",
    });

    expect(reviewAvailabilityResponse.status).toBe(200);
    await expect(reviewAvailabilityResponse.json()).resolves.toMatchObject({
      data: {
        id: availabilityPayload.data.id,
        status: "approved",
      },
      requestId: "req_schedule_availability_review",
    });
    expect(reviewTimeOffResponse.status).toBe(200);
    await expect(reviewTimeOffResponse.json()).resolves.toMatchObject({
      data: {
        id: timeOffPayload.data.id,
        status: "rejected",
      },
      requestId: "req_schedule_time_off_review",
    });

    const proposeSwapResponse = await app.request("/schedules/swaps", {
      body: JSON.stringify({
        note: "Topo trocar meu pico da tarde pela abertura.",
        scope: {
          departmentId: "dept_flv",
          organizationId: "org_demo",
          storeId: "store_001",
        },
        sourceShiftId: "shift_saturday_collaborator",
        targetShiftId: "shift_saturday_mateus",
        targetUserId: "user_demo_colaborador_2",
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_swap_propose",
      },
      method: "POST",
    });
    const proposeSwapPayload = (await proposeSwapResponse.json()) as {
      data: {
        id: string;
        status: string;
      };
    };

    expect(proposeSwapResponse.status).toBe(200);
    expect(proposeSwapPayload.data.status).toBe("pending");

    const respondSwapResponse = await app.request("/schedules/swaps/respond", {
      body: JSON.stringify({
        requestId: proposeSwapPayload.data.id,
        response: "accept",
      }),
      headers: {
        authorization: `Bearer ${counterpartCollaboratorToken}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_swap_respond",
      },
      method: "POST",
    });

    expect(respondSwapResponse.status).toBe(200);
    await expect(respondSwapResponse.json()).resolves.toMatchObject({
      data: {
        id: proposeSwapPayload.data.id,
        status: "accepted",
      },
      requestId: "req_schedule_swap_respond",
    });

    const approveSwapResponse = await app.request("/schedules/swaps/approve", {
      body: JSON.stringify({
        requestId: proposeSwapPayload.data.id,
      }),
      headers: {
        authorization: `Bearer ${developmentSessionTokens["lider-setor"]}`,
        "content-type": "application/json",
        "x-request-id": "req_schedule_swap_approve",
      },
      method: "POST",
    });

    expect(approveSwapResponse.status).toBe(200);
    await expect(approveSwapResponse.json()).resolves.toMatchObject({
      data: {
        id: proposeSwapPayload.data.id,
        status: "approved",
      },
      requestId: "req_schedule_swap_approve",
    });

    const collaboratorViewResponse = await app.request("/schedules/collaborator-view", {
      headers: {
        authorization: `Bearer ${developmentSessionTokens.colaborador}`,
        "x-request-id": "req_schedule_collaborator_final",
      },
    });

    expect(collaboratorViewResponse.status).toBe(200);
    await expect(collaboratorViewResponse.json()).resolves.toMatchObject({
      data: {
        notifications: expect.arrayContaining([
          expect.objectContaining({
            requestId: availabilityPayload.data.id,
            type: "availability_reviewed",
          }),
          expect.objectContaining({
            requestId: timeOffPayload.data.id,
            type: "time_off_reviewed",
          }),
          expect.objectContaining({
            requestId: proposeSwapPayload.data.id,
            type: "swap_approved",
          }),
        ]),
        requests: expect.arrayContaining([
          expect.objectContaining({
            id: availabilityPayload.data.id,
            status: "approved",
          }),
          expect.objectContaining({
            id: timeOffPayload.data.id,
            status: "rejected",
          }),
          expect.objectContaining({
            id: proposeSwapPayload.data.id,
            status: "approved",
          }),
        ]),
        upcomingShifts: expect.arrayContaining([
          expect.objectContaining({
            id: "shift_saturday_mateus",
            userId: "user_demo_colaborador",
          }),
        ]),
      },
      requestId: "req_schedule_collaborator_final",
    });
  });
});
