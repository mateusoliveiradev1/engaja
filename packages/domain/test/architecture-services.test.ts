import { describe, expect, it } from "vitest";

import {
  createCoverageRequirement,
  createDomainId,
  createFeedPost,
  createPointsLedgerEntry,
  createRewardRule,
  createShift,
  createTenantScope,
  buildHealthyRanking,
  decideFeedModeration,
  evaluateDomainPolicy,
  evaluateRewardGrant,
  validateSchedulePlan,
} from "../src/index.js";

const flvScope = createTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

describe("domain architecture services", () => {
  it("evaluates authorization policies with scoped department rules", () => {
    const leader = {
      role: "lider-setor" as const,
      scope: flvScope,
      userId: createDomainId<"user">("user_lider"),
    };

    expect(
      evaluateDomainPolicy(leader, {
        action: "feed.moderate",
        resource: flvScope,
      }),
    ).toEqual({
      allowed: true,
      reason: "allowed",
    });

    expect(
      evaluateDomainPolicy(leader, {
        action: "feed.moderate",
        resource: createTenantScope({
          departmentId: "dept_padaria",
          organizationId: "org_demo",
          storeId: "store_001",
        }),
      }),
    ).toEqual({
      allowed: false,
      reason: "outside_scope",
    });
  });

  it("detects overlapping shifts and coverage gaps", () => {
    const result = validateSchedulePlan(
      [
        createShift({
          breakMinutes: 15,
          endsAt: new Date("2026-04-23T13:00:00.000Z"),
          id: "shift_a",
          role: "colaborador",
          scope: flvScope,
          startsAt: new Date("2026-04-23T09:00:00.000Z"),
          status: "published",
          title: "Abertura",
          userId: "user_demo_colaborador",
        }),
        createShift({
          breakMinutes: 15,
          endsAt: new Date("2026-04-23T17:00:00.000Z"),
          id: "shift_b",
          role: "colaborador",
          scope: flvScope,
          startsAt: new Date("2026-04-23T12:00:00.000Z"),
          status: "published",
          title: "Reposicao",
          userId: "user_demo_colaborador",
        }),
      ],
      [
        createCoverageRequirement({
          endsAt: new Date("2026-04-23T17:00:00.000Z"),
          id: "coverage_opening",
          label: "Cobertura da abertura",
          role: "colaborador",
          requiredHeadcount: 3,
          scope: flvScope,
          startsAt: new Date("2026-04-23T09:00:00.000Z"),
        }),
      ],
    );

    expect(result.valid).toBe(false);
    expect(result.coverageGapCount).toBe(1);
    expect(result.overlappingAssignmentCount).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "overlapping_shift",
      "coverage_gap",
    ]);
  });

  it("applies reward windows to block score inflation", () => {
    const rewardRule = createRewardRule({
      code: "feed-quality",
      maxAwardsPerWindow: 1,
      points: 20,
      reason: "Post aprovado com qualidade premium",
      source: "feed_post",
      windowDays: 7,
    });

    const existingEntry = createPointsLedgerEntry({
      amount: 20,
      id: "ledger_existing",
      occurredAt: new Date("2026-04-22T09:00:00.000Z"),
      reason: "Post aprovado com qualidade premium",
      scope: flvScope,
      source: "feed_post",
      sourceId: "post_demo",
      userId: "user_demo_colaborador",
    });

    expect(
      evaluateRewardGrant({
        existingEntries: [existingEntry],
        occurredAt: new Date("2026-04-23T09:00:00.000Z"),
        recipientUserId: "user_demo_colaborador",
        rule: rewardRule,
        scope: flvScope,
        sourceId: "post_demo",
      }),
    ).toEqual({
      granted: false,
      reason: "window_limit_reached",
    });
  });

  it("blocks duplicate reward sources before creating another ledger entry", () => {
    const rewardRule = createRewardRule({
      code: "feed-quality",
      maxAwardsPerWindow: 5,
      points: 20,
      reason: "Post aprovado com qualidade premium",
      source: "feed_post",
      windowDays: 7,
    });
    const existingEntry = createPointsLedgerEntry({
      amount: 20,
      id: "ledger_existing_duplicate",
      occurredAt: new Date("2026-04-22T09:00:00.000Z"),
      reason: "Post aprovado com qualidade premium",
      scope: flvScope,
      source: "feed_post",
      sourceId: "post_demo",
      userId: "user_demo_colaborador",
    });

    expect(
      evaluateRewardGrant({
        existingEntries: [existingEntry],
        occurredAt: new Date("2026-04-23T09:00:00.000Z"),
        recipientUserId: "user_demo_colaborador",
        rule: rewardRule,
        scope: flvScope,
        sourceId: "post_demo",
      }),
    ).toEqual({
      granted: false,
      reason: "duplicate_source",
    });
  });

  it("builds healthy rankings from positive eligible scores only", () => {
    const ranking = buildHealthyRanking({
      candidates: [
        {
          badgeCount: 1,
          displayName: "Colaborador A",
          eligible: true,
          points: 80,
          recognitionCount: 2,
          userId: createDomainId<"user">("user_a"),
        },
        {
          badgeCount: 0,
          displayName: "Colaborador B",
          eligible: true,
          points: 0,
          recognitionCount: 0,
          userId: createDomainId<"user">("user_b"),
        },
        {
          badgeCount: 3,
          displayName: "Colaborador C",
          eligible: false,
          points: 120,
          recognitionCount: 3,
          userId: createDomainId<"user">("user_c"),
        },
      ],
      teamGoalPoints: 200,
    });

    expect(ranking.entries).toEqual([
      expect.objectContaining({
        displayName: "Colaborador A",
        points: 80,
        position: 1,
      }),
    ]);
    expect(ranking.totalPositivePoints).toBe(80);
    expect(ranking.teamProgressPercent).toBe(40);
  });

  it("turns leader moderation decisions into visible feed states", () => {
    const post = createFeedPost({
      authorName: "Equipe FLV",
      authorUserId: "user_demo_colaborador",
      caption: "Banca pronta para aprovacao.",
      category: "mission",
      createdAt: new Date("2026-04-22T12:00:00.000Z"),
      id: "post_pending",
      scope: flvScope,
      status: "pending_moderation",
      title: "Banca pronta",
      updatedAt: new Date("2026-04-22T12:00:00.000Z"),
      visibility: "department",
    });

    const decision = decideFeedModeration(
      post,
      {
        role: "lider-setor",
        scope: flvScope,
        userId: createDomainId<"user">("user_lider"),
      },
      "approve",
      new Date("2026-04-22T12:05:00.000Z"),
    );

    expect(decision.allowed).toBe(true);
    expect(decision.nextPost?.status).toBe("published");
    expect(decision.nextPost?.publishedAt?.toISOString()).toBe("2026-04-22T12:05:00.000Z");
  });

  it("rejects invalid domain data before it reaches adapters", () => {
    expect(() =>
      createFeedPost({
        authorName: "Equipe FLV",
        authorUserId: "user_demo_colaborador",
        caption: "Legenda valida",
        category: "mission",
        createdAt: new Date("2026-04-22T12:00:00.000Z"),
        id: "post_invalid_title",
        scope: flvScope,
        status: "draft",
        title: " ",
        updatedAt: new Date("2026-04-22T12:00:00.000Z"),
        visibility: "department",
      }),
    ).toThrow("title cannot be empty.");

    expect(() =>
      createShift({
        breakMinutes: 15,
        endsAt: new Date("2026-04-23T09:00:00.000Z"),
        id: "shift_invalid_window",
        role: "colaborador",
        scope: flvScope,
        startsAt: new Date("2026-04-23T10:00:00.000Z"),
        status: "published",
        title: "Janela invalida",
        userId: "user_demo_colaborador",
      }),
    ).toThrow("endsAt must be after startsAt.");
  });
});
