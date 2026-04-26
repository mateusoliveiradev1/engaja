import type {
  EngagementArchiveItemPayload,
  EngagementArchivePayload,
  EngagementCampaignClosurePayload,
  EngagementCampaignCreateRequestPayload,
  EngagementCampaignPayload,
  EngagementCampaignViewPayload,
  EngagementRewardGrantPayload,
  EngagementRewardGrantStatusPayload,
  EngagementRewardGrantUpdateRequestPayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import type { MobileSession } from "./providers.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();

const demoScope = {
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
} as const;

const demoCollaboratorUserIds = [
  "user_demo_colaborador",
  "user_demo_colaborador_2",
  "user_demo_colaborador_3",
  "user_demo_colaborador_4",
] as const;

export type CollaboratorAchievementArchive = EngagementArchivePayload;
export type EngagementCampaignClosure = EngagementCampaignClosurePayload;
export type EngagementCampaignView = EngagementCampaignViewPayload;
export type EngagementRewardGrant = EngagementRewardGrantPayload;

interface EngagementService {
  closeCampaign(input: { readonly campaignId: string }): Promise<EngagementCampaignClosure>;
  createCampaign(input: EngagementCampaignCreateRequestPayload): Promise<EngagementCampaignPayload>;
  getArchive(input?: { readonly userId?: string }): Promise<CollaboratorAchievementArchive>;
  listCampaigns(): Promise<readonly EngagementCampaignView[]>;
  updateRewardGrantStatus(
    input: EngagementRewardGrantUpdateRequestPayload,
  ): Promise<EngagementRewardGrant>;
}

interface EngagementDemoStore {
  archiveItems: EngagementArchiveItemPayload[];
  campaigns: EngagementCampaignView[];
  requestCounter: number;
  rewardGrants: EngagementRewardGrantPayload[];
}

let demoStore: EngagementDemoStore = createEngagementDemoStore();

export function createEngagementService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): EngagementService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientEngagementFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async closeCampaign(input) {
      const response = await apiClient.request("engagement.campaigns.close", {
        body: input,
      });

      return response.data;
    },
    async createCampaign(input) {
      const response = await apiClient.request("engagement.campaigns.create", {
        body: input,
      });

      return response.data;
    },
    async getArchive(input) {
      const response = await apiClient.request("engagement.archive", {
        query: {
          ...(session.scope.departmentId === undefined
            ? {}
            : { departmentId: session.scope.departmentId }),
          organizationId: session.scope.organizationId,
          ...(session.scope.storeId === undefined ? {} : { storeId: session.scope.storeId }),
          ...(input?.userId === undefined ? {} : { userId: input.userId }),
        },
      });

      return response.data;
    },
    async listCampaigns() {
      const response = await apiClient.request("engagement.campaigns.list", {
        query: {
          ...(session.scope.departmentId === undefined
            ? {}
            : { departmentId: session.scope.departmentId }),
          organizationId: session.scope.organizationId,
          ...(session.scope.storeId === undefined ? {} : { storeId: session.scope.storeId }),
        },
      });

      return response.data;
    },
    async updateRewardGrantStatus(input) {
      const response = await apiClient.request("engagement.rewardGrants.update", {
        body: input,
      });

      return response.data;
    },
  };
}

function createResilientEngagementFetcher(
  session: MobileSession,
  primaryFetcher?: typeof fetch,
  offlineFallback = false,
): typeof fetch {
  const fetcher = primaryFetcher ?? fetch;

  return async (input, init) => {
    try {
      return await fetcher(input, init);
    } catch (error) {
      if (!offlineFallback) {
        throw error;
      }

      return handleMockEngagementRequest(input, init, session);
    }
  };
}

async function handleMockEngagementRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/engagement/archive" && method === "GET") {
    const targetUserId = url.searchParams.get("userId") ?? session.userId;

    return jsonResponse(buildArchiveForUser(targetUserId));
  }

  if (url.pathname === "/engagement/campaigns" && method === "GET") {
    return jsonResponse(
      demoStore.campaigns.map((campaignView) =>
        decorateCampaignView(
          campaignView,
          session.role === "colaborador" ? session.userId : undefined,
        ),
      ),
    );
  }

  if (url.pathname === "/engagement/campaigns" && method === "POST") {
    const body =
      (await readJsonBody<EngagementCampaignCreateRequestPayload>(init)) ??
      fail("Missing campaign body.");
    const nextCampaignView = createMockCampaignView(body, session);

    demoStore = {
      ...demoStore,
      campaigns: [nextCampaignView, ...demoStore.campaigns].sort(compareCampaignViews),
    };

    return jsonResponse(clonePayload(nextCampaignView.campaign));
  }

  if (url.pathname === "/engagement/campaigns/close" && method === "POST") {
    const body = (await readJsonBody<{ campaignId: string }>(init)) ?? fail("Missing close body.");

    return jsonResponse(closeMockCampaign(body.campaignId, session.userId));
  }

  if (url.pathname === "/engagement/reward-grants/status" && method === "POST") {
    const body =
      (await readJsonBody<EngagementRewardGrantUpdateRequestPayload>(init)) ??
      fail("Missing reward grant body.");

    return jsonResponse(
      updateMockRewardGrantStatus(body.rewardGrantId, body.status, session.userId),
    );
  }

  return errorResponse("not_found", "Nao foi possivel carregar o reconhecimento agora.", 404);
}

function buildArchiveForUser(userId: string): CollaboratorAchievementArchive {
  const activeCampaigns = demoStore.campaigns
    .filter(
      (campaignView) =>
        campaignView.campaign.status === "active" || campaignView.campaign.status === "scheduled",
    )
    .map((campaignView) => decorateCampaignView(campaignView, userId));
  const items = demoStore.archiveItems
    .filter((item) => item.userId === userId)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const rewardGrants = demoStore.rewardGrants
    .filter((grant) => grant.userId === userId)
    .sort((left, right) => right.grantedAt.localeCompare(left.grantedAt));

  return {
    activeCampaigns: clonePayload(activeCampaigns),
    items: clonePayload(items),
    rewardGrants: clonePayload(rewardGrants),
    summary: buildArchiveSummary(activeCampaigns, items, rewardGrants),
  };
}

function buildArchiveSummary(
  activeCampaigns: readonly EngagementCampaignViewPayload[],
  items: readonly EngagementArchiveItemPayload[],
  rewardGrants: readonly EngagementRewardGrantPayload[],
): EngagementArchivePayload["summary"] {
  return {
    activeCampaignCount: activeCampaigns.length,
    activeStreakDays: items.reduce(
      (highestValue, item) =>
        Math.max(highestValue, readNumericMetadata(item.metadata, "streakDays")),
      0,
    ),
    approvedPhotoParticipationCount: items.reduce(
      (count, item) =>
        count +
        (item.sourceType === "approved-photo-post"
          ? Math.max(1, readNumericMetadata(item.metadata, "approvedPhotoCount"))
          : 0),
      0,
    ),
    challengeWinCount: items.filter(
      (item) => item.type === "challenge-won" && item.status !== "revoked",
    ).length,
    ...(items[0] === undefined ? {} : { latestActivityAt: items[0].occurredAt }),
    pendingRewardCount: rewardGrants.filter(
      (grant) =>
        grant.status === "pending-company-approval" || grant.status === "approved-for-fulfillment",
    ).length,
    rewardCount: rewardGrants.filter((grant) => grant.status !== "canceled").length,
    validatedBancaContributionCount: items.reduce(
      (count, item) =>
        count +
        (item.type === "validated-banca"
          ? Math.max(1, readNumericMetadata(item.metadata, "validatedBancaCount"))
          : 0),
      0,
    ),
  };
}

function createMockCampaignView(
  input: EngagementCampaignCreateRequestPayload,
  session: MobileSession,
): EngagementCampaignViewPayload {
  const now = new Date().toISOString();
  const eligibleUserIds =
    input.eligibility?.eligibleUserIds.length === 0 ||
    input.eligibility?.eligibleUserIds === undefined
      ? [...demoCollaboratorUserIds]
      : [...input.eligibility.eligibleUserIds];
  const campaignId = `campaign_mobile_${session.userId}_${Date.now()}`;

  return {
    campaign: {
      createdAt: now,
      createdByUserId: session.userId,
      description: input.description,
      eligibility: {
        eligibleUserIds,
        ...(input.eligibility?.maxEventsPerDay === undefined
          ? {}
          : { maxEventsPerDay: input.eligibility.maxEventsPerDay }),
        requiresApprovedFeedPost: input.eligibility?.requiresApprovedFeedPost ?? true,
        requiresOperationalValidation: input.eligibility?.requiresOperationalValidation ?? false,
      },
      endsAt: input.endsAt,
      id: campaignId,
      objective: input.objective,
      periodPreset: input.periodPreset,
      reward: input.reward,
      scoringRule: {
        ...(input.scoringRule.maxEventsPerUser === undefined
          ? {}
          : { maxEventsPerUser: input.scoringRule.maxEventsPerUser }),
        metricType: input.scoringRule.metricType,
        pointsPerEligibleEvent: input.scoringRule.pointsPerEligibleEvent,
        requireUniqueSources: input.scoringRule.requireUniqueSources,
        tieBreakers: [...input.scoringRule.tieBreakers],
      },
      scope: input.scope,
      settlement: {
        mode: input.settlement?.mode ?? "manual-review",
        winnerCount: input.settlement?.winnerCount ?? 1,
      },
      startsAt: input.startsAt,
      status: input.status ?? "draft",
      title: input.title,
    },
    leaderboard: [],
    participantCount: eligibleUserIds.length,
    ...(eligibleUserIds.includes("user_demo_colaborador")
      ? {
          viewerProgress: {
            eligibleEventCount: 0,
            lastAwardedAt: now,
            score: 0,
            userId: "user_demo_colaborador",
          },
        }
      : {}),
  };
}

function closeMockCampaign(
  campaignId: string,
  actorUserId: string,
): EngagementCampaignClosurePayload {
  const existingCampaignView = findCampaignView(campaignId);
  const existingRewardGrants = demoStore.rewardGrants.filter(
    (grant) => grant.campaignId === campaignId,
  );
  const existingArchiveItems = demoStore.archiveItems.filter(
    (item) => item.campaignId === campaignId,
  );

  if (existingCampaignView.campaign.status === "closed" && existingRewardGrants.length > 0) {
    return {
      archiveItems: clonePayload(existingArchiveItems),
      campaign: clonePayload(existingCampaignView.campaign),
      rewardGrants: clonePayload(existingRewardGrants),
    };
  }

  const closedCampaign = {
    ...existingCampaignView.campaign,
    status: "closed" as const,
  };
  const winners = existingCampaignView.leaderboard.slice(0, closedCampaign.settlement.winnerCount);
  const rewardGrants = isGrantableRewardCampaign(closedCampaign)
    ? winners.map((winner, index) => createRewardGrant(closedCampaign, winner, index + 1))
    : [];
  const archiveItems = winners.flatMap((winner, index) =>
    createWinnerArchiveItems(closedCampaign, winner, rewardGrants[index], actorUserId),
  );

  demoStore = {
    ...demoStore,
    archiveItems: [...archiveItems, ...demoStore.archiveItems].sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    ),
    campaigns: replaceCampaignViewInStore({
      ...existingCampaignView,
      campaign: closedCampaign,
    }),
    rewardGrants: [...rewardGrants, ...demoStore.rewardGrants].sort((left, right) =>
      right.grantedAt.localeCompare(left.grantedAt),
    ),
  };

  return {
    archiveItems: clonePayload(archiveItems),
    campaign: clonePayload(closedCampaign),
    rewardGrants: clonePayload(rewardGrants),
  };
}

function createRewardGrant(
  campaign: EngagementCampaignPayload & {
    readonly reward:
      | Extract<EngagementCampaignPayload["reward"], { readonly type: "digital" }>
      | Extract<EngagementCampaignPayload["reward"], { readonly type: "manual-company-approved" }>;
  },
  winner: EngagementCampaignViewPayload["leaderboard"][number],
  position: number,
): EngagementRewardGrantPayload {
  const grantId = `grant_${campaign.id}_${winner.userId}_${position}`;
  const grantedAt = new Date().toISOString();

  return campaign.reward.type === "digital"
    ? {
        campaignId: campaign.id,
        grantedAt,
        id: grantId,
        metadata: {
          campaignTitle: campaign.title,
          metricType: campaign.scoringRule.metricType,
          rewardTitle: campaign.reward.title,
        },
        position,
        reward: campaign.reward,
        scope: campaign.scope,
        status: "digital-granted",
        userId: winner.userId,
        winningScore: winner.score,
      }
    : {
        campaignId: campaign.id,
        grantedAt,
        id: grantId,
        metadata: {
          approvalPolicyCode: campaign.reward.approvalPolicyCode,
          campaignTitle: campaign.title,
          rewardTitle: campaign.reward.title,
        },
        position,
        reward: campaign.reward,
        scope: campaign.scope,
        status: "pending-company-approval",
        userId: winner.userId,
        winningScore: winner.score,
      };
}

function isGrantableRewardCampaign(
  campaign: EngagementCampaignPayload,
): campaign is EngagementCampaignPayload & {
  readonly reward:
    | Extract<EngagementCampaignPayload["reward"], { readonly type: "digital" }>
    | Extract<EngagementCampaignPayload["reward"], { readonly type: "manual-company-approved" }>;
} {
  return campaign.reward.type === "digital" || campaign.reward.type === "manual-company-approved";
}

function createWinnerArchiveItems(
  campaign: EngagementCampaignPayload,
  winner: EngagementCampaignViewPayload["leaderboard"][number],
  rewardGrant: EngagementRewardGrantPayload | undefined,
  actorUserId: string,
): EngagementArchiveItemPayload[] {
  const occurredAt = rewardGrant?.grantedAt ?? new Date().toISOString();
  const baseItem: EngagementArchiveItemPayload = {
    campaignId: campaign.id,
    grantingRule: `Regra principal: ${campaign.objective}`,
    id: `archive_win_${campaign.id}_${winner.userId}`,
    metadata: {
      position: winner.position,
      score: winner.score,
      streakDays:
        campaign.scoringRule.metricType === "consistency-streak"
          ? Math.max(
              1,
              Math.round(winner.score / Math.max(1, campaign.scoringRule.pointsPerEligibleEvent)),
            )
          : 0,
    },
    occurredAt,
    relatedContentReference: `campaign://${campaign.id}`,
    ...(rewardGrant?.reward.type === "manual-company-approved"
      ? { responsibleApproverUserId: actorUserId }
      : {}),
    scope: campaign.scope,
    sourceAction: "Campanha encerrada e vencedores confirmados.",
    sourceId: campaign.id,
    sourceType: campaign.scoringRule.metricType,
    status: "recorded",
    title: `${winner.displayName} entrou no topo de ${campaign.title}`,
    type: "challenge-won",
    userId: winner.userId,
  };

  if (rewardGrant === undefined) {
    return [baseItem];
  }

  return [
    baseItem,
    {
      campaignId: campaign.id,
      grantingRule: `Premio oficial da campanha ${campaign.title}`,
      id: `archive_reward_${rewardGrant.id}`,
      metadata: {
        position: rewardGrant.position,
        rewardTitle: rewardGrant.reward.title,
        winningScore: rewardGrant.winningScore,
      },
      occurredAt,
      relatedContentReference: `reward://${rewardGrant.id}`,
      ...(rewardGrant.reward.type === "manual-company-approved"
        ? { responsibleApproverUserId: actorUserId }
        : {}),
      rewardGrantId: rewardGrant.id,
      rewardStatus: rewardGrant.status,
      scope: rewardGrant.scope,
      sourceAction:
        rewardGrant.reward.type === "digital"
          ? "Recompensa digital concedida no fechamento."
          : "Premio manual criado com aprovacao pendente.",
      sourceId: rewardGrant.id,
      sourceType: "reward-grant",
      status: "recorded",
      title:
        rewardGrant.reward.type === "digital"
          ? `Recompensa digital: ${rewardGrant.reward.title}`
          : `Premio manual: ${rewardGrant.reward.title}`,
      type: rewardGrant.reward.type === "digital" ? "reward-granted" : "manual-prize",
      userId: rewardGrant.userId,
    },
  ];
}

function updateMockRewardGrantStatus(
  rewardGrantId: string,
  status: EngagementRewardGrantStatusPayload,
  actorUserId: string,
): EngagementRewardGrantPayload {
  const currentGrant = findRewardGrant(rewardGrantId);
  const now = new Date().toISOString();

  const updatedGrant: EngagementRewardGrantPayload = {
    ...currentGrant,
    ...(status === "approved-for-fulfillment" || status === "fulfilled"
      ? {
          approvedAt: currentGrant.approvedAt ?? now,
          approvedByUserId: currentGrant.approvedByUserId ?? actorUserId,
        }
      : {}),
    ...(status === "fulfilled"
      ? {
          fulfilledAt: now,
          fulfilledByUserId: actorUserId,
        }
      : {}),
    ...(status === "canceled"
      ? {
          canceledAt: now,
          canceledByUserId: actorUserId,
        }
      : {}),
    status,
  };

  demoStore = {
    ...demoStore,
    archiveItems: demoStore.archiveItems.map((item) =>
      item.rewardGrantId !== rewardGrantId
        ? item
        : {
            ...item,
            ...(status === "approved-for-fulfillment" ||
            status === "fulfilled" ||
            status === "canceled"
              ? { responsibleApproverUserId: actorUserId }
              : {}),
            rewardStatus: status,
          },
    ),
    rewardGrants: demoStore.rewardGrants.map((grant) =>
      grant.id === rewardGrantId ? updatedGrant : grant,
    ),
  };

  return clonePayload(updatedGrant);
}

function decorateCampaignView(
  campaignView: EngagementCampaignViewPayload,
  userId: string | undefined,
): EngagementCampaignViewPayload {
  const clonedCampaignView = clonePayload(campaignView);

  if (userId === undefined) {
    delete (clonedCampaignView as { viewerProgress?: unknown }).viewerProgress;

    return clonedCampaignView;
  }

  const matchingEntry = clonedCampaignView.leaderboard.find((entry) => entry.userId === userId);

  if (matchingEntry !== undefined) {
    return {
      ...clonedCampaignView,
      viewerProgress: {
        eligibleEventCount: Math.round(
          matchingEntry.score /
            Math.max(1, clonedCampaignView.campaign.scoringRule.pointsPerEligibleEvent),
        ),
        lastAwardedAt:
          clonedCampaignView.viewerProgress?.lastAwardedAt ?? clonedCampaignView.campaign.createdAt,
        position: matchingEntry.position,
        score: matchingEntry.score,
        userId,
      },
    };
  }

  if (clonedCampaignView.campaign.eligibility.eligibleUserIds.includes(userId)) {
    return {
      ...clonedCampaignView,
      viewerProgress: {
        eligibleEventCount: 0,
        lastAwardedAt: clonedCampaignView.campaign.createdAt,
        score: 0,
        userId,
      },
    };
  }

  delete (clonedCampaignView as { viewerProgress?: unknown }).viewerProgress;

  return clonedCampaignView;
}

function replaceCampaignViewInStore(
  campaignView: EngagementCampaignViewPayload,
): EngagementCampaignViewPayload[] {
  return demoStore.campaigns
    .map((currentCampaignView) =>
      currentCampaignView.campaign.id === campaignView.campaign.id
        ? campaignView
        : currentCampaignView,
    )
    .sort(compareCampaignViews);
}

function compareCampaignViews(
  left: EngagementCampaignViewPayload,
  right: EngagementCampaignViewPayload,
): number {
  return right.campaign.startsAt.localeCompare(left.campaign.startsAt);
}

function findCampaignView(campaignId: string): EngagementCampaignViewPayload {
  return (
    demoStore.campaigns.find((campaignView) => campaignView.campaign.id === campaignId) ??
    fail("Campaign not found.")
  );
}

function findRewardGrant(rewardGrantId: string): EngagementRewardGrantPayload {
  return (
    demoStore.rewardGrants.find((rewardGrant) => rewardGrant.id === rewardGrantId) ??
    fail("Reward grant not found.")
  );
}

function readNumericMetadata(
  metadata: EngagementArchiveItemPayload["metadata"],
  key: string,
): number {
  const value = metadata[key];

  return typeof value === "number" ? value : 0;
}

function createEngagementDemoStore(): EngagementDemoStore {
  const campaigns: EngagementCampaignViewPayload[] = [
    {
      campaign: {
        createdAt: "2026-04-20T11:00:00.000Z",
        createdByUserId: "user_demo_lider",
        description:
          "Fotos aprovadas de abertura e pico viram ranking positivo com foco em leitura visual.",
        eligibility: {
          eligibleUserIds: [...demoCollaboratorUserIds],
          maxEventsPerDay: 4,
          requiresApprovedFeedPost: true,
          requiresOperationalValidation: false,
        },
        endsAt: "2026-04-27T23:59:00.000Z",
        id: "campaign_active_photo_week",
        objective: "Somar fotos aprovadas que mantenham a banca viva no horario de pico.",
        periodPreset: "weekly",
        reward: {
          badgeCode: "abertura-premium",
          highlightLabel: "Topo da semana",
          points: 160,
          title: "Badge e destaque no mural",
          type: "digital",
        },
        scope: demoScope,
        scoringRule: {
          maxEventsPerUser: 10,
          metricType: "approved-photo-post",
          pointsPerEligibleEvent: 20,
          requireUniqueSources: true,
          tieBreakers: [
            { kind: "approved-quality", priority: 1 },
            { kind: "first-to-finish", priority: 2 },
          ],
        },
        settlement: {
          mode: "automatic",
          winnerCount: 1,
        },
        startsAt: "2026-04-21T06:00:00.000Z",
        status: "active",
        title: "Sprint de fotos aprovadas",
      },
      leaderboard: [
        { displayName: "Julia Lima", position: 1, score: 160, userId: "user_demo_colaborador" },
        { displayName: "Mateus Rocha", position: 2, score: 120, userId: "user_demo_colaborador_2" },
        {
          displayName: "Rafaela Costa",
          position: 3,
          score: 100,
          userId: "user_demo_colaborador_3",
        },
      ],
      participantCount: 8,
      viewerProgress: {
        eligibleEventCount: 8,
        lastAwardedAt: "2026-04-23T11:40:00.000Z",
        position: 1,
        score: 160,
        userId: "user_demo_colaborador",
      },
    },
    {
      campaign: {
        createdAt: "2026-04-18T10:30:00.000Z",
        createdByUserId: "user_demo_lider",
        description:
          "Bancas validadas com checklist e foto contam para um premio manual governado.",
        eligibility: {
          eligibleUserIds: [...demoCollaboratorUserIds],
          maxEventsPerDay: 2,
          requiresApprovedFeedPost: false,
          requiresOperationalValidation: true,
        },
        endsAt: "2026-04-30T22:00:00.000Z",
        id: "campaign_active_banca_april",
        objective: "Validar bancas sem retrabalho e manter consistencia visual no setor.",
        periodPreset: "monthly",
        reward: {
          approvalPolicyCode: "hr-folga-flv",
          description: "Folga simbolica oficial, liberada apenas apos aprovacao interna.",
          fulfillmentWindowDays: 10,
          title: "Folga aprovada",
          type: "manual-company-approved",
        },
        scope: demoScope,
        scoringRule: {
          maxEventsPerUser: 6,
          metricType: "validated-banca-setup",
          pointsPerEligibleEvent: 40,
          requireUniqueSources: true,
          tieBreakers: [
            { kind: "consistency", priority: 1 },
            { kind: "approved-quality", priority: 2 },
          ],
        },
        settlement: {
          mode: "manual-review",
          winnerCount: 1,
        },
        startsAt: "2026-04-15T06:00:00.000Z",
        status: "active",
        title: "Banca validada sem falha",
      },
      leaderboard: [
        { displayName: "Mateus Rocha", position: 1, score: 200, userId: "user_demo_colaborador_2" },
        { displayName: "Julia Lima", position: 2, score: 160, userId: "user_demo_colaborador" },
        { displayName: "Carlos Souza", position: 3, score: 120, userId: "user_demo_colaborador_4" },
      ],
      participantCount: 6,
      viewerProgress: {
        eligibleEventCount: 4,
        lastAwardedAt: "2026-04-22T17:15:00.000Z",
        position: 2,
        score: 160,
        userId: "user_demo_colaborador",
      },
    },
    {
      campaign: {
        createdAt: "2026-04-10T08:00:00.000Z",
        createdByUserId: "user_demo_lider",
        description:
          "A consistencia da semana fechou com revisao manual de qualidade e desempate por constancia.",
        eligibility: {
          eligibleUserIds: [...demoCollaboratorUserIds],
          maxEventsPerDay: 1,
          requiresApprovedFeedPost: false,
          requiresOperationalValidation: true,
        },
        endsAt: "2026-04-18T21:00:00.000Z",
        id: "campaign_closed_consistency_week",
        objective: "Premiar quem sustentou a rotina validada durante todo o recorte semanal.",
        periodPreset: "weekly",
        reward: {
          approvalPolicyCode: "mgr-voucher-weekly",
          description: "Voucher oficial do setor, sujeito a aprovacao da gerencia.",
          fulfillmentWindowDays: 7,
          title: "Voucher do setor",
          type: "manual-company-approved",
        },
        scope: demoScope,
        scoringRule: {
          maxEventsPerUser: 7,
          metricType: "consistency-streak",
          pointsPerEligibleEvent: 20,
          requireUniqueSources: true,
          tieBreakers: [
            { kind: "consistency", priority: 1 },
            { kind: "first-to-finish", priority: 2 },
          ],
        },
        settlement: {
          mode: "manual-review",
          winnerCount: 1,
        },
        startsAt: "2026-04-12T06:00:00.000Z",
        status: "closed",
        title: "Consistencia da semana",
      },
      leaderboard: [
        { displayName: "Julia Lima", position: 1, score: 120, userId: "user_demo_colaborador" },
        { displayName: "Mateus Rocha", position: 2, score: 100, userId: "user_demo_colaborador_2" },
      ],
      participantCount: 5,
      viewerProgress: {
        eligibleEventCount: 6,
        lastAwardedAt: "2026-04-18T19:00:00.000Z",
        position: 1,
        score: 120,
        userId: "user_demo_colaborador",
      },
    },
    {
      campaign: {
        createdAt: "2026-04-01T07:00:00.000Z",
        createdByUserId: "user_demo_lider",
        description:
          "Antes e depois aprovados renderam premio digital com destaque automatico no app.",
        eligibility: {
          eligibleUserIds: [...demoCollaboratorUserIds],
          maxEventsPerDay: 2,
          requiresApprovedFeedPost: true,
          requiresOperationalValidation: false,
        },
        endsAt: "2026-04-15T20:00:00.000Z",
        id: "campaign_closed_before_after",
        objective: "Destacar o melhor antes e depois aprovado do ciclo.",
        periodPreset: "custom",
        reward: {
          highlightLabel: "Destaque do mes",
          points: 180,
          title: "Destaque e pontos extras",
          type: "digital",
        },
        scope: demoScope,
        scoringRule: {
          maxEventsPerUser: 5,
          metricType: "approved-before-after",
          pointsPerEligibleEvent: 60,
          requireUniqueSources: true,
          tieBreakers: [
            { kind: "approved-quality", priority: 1 },
            { kind: "first-to-finish", priority: 2 },
          ],
        },
        settlement: {
          mode: "automatic",
          winnerCount: 1,
        },
        startsAt: "2026-04-03T06:00:00.000Z",
        status: "closed",
        title: "Antes e depois aprovado",
      },
      leaderboard: [
        { displayName: "Julia Lima", position: 1, score: 180, userId: "user_demo_colaborador" },
        {
          displayName: "Rafaela Costa",
          position: 2,
          score: 120,
          userId: "user_demo_colaborador_3",
        },
      ],
      participantCount: 4,
      viewerProgress: {
        eligibleEventCount: 3,
        lastAwardedAt: "2026-04-15T10:00:00.000Z",
        position: 1,
        score: 180,
        userId: "user_demo_colaborador",
      },
    },
  ];

  const rewardGrants: EngagementRewardGrantPayload[] = [
    {
      campaignId: "campaign_closed_consistency_week",
      grantedAt: "2026-04-18T19:10:00.000Z",
      id: "grant_consistency_pending_julia",
      metadata: {
        approvalPolicyCode: "mgr-voucher-weekly",
        campaignTitle: "Consistencia da semana",
        rewardTitle: "Voucher do setor",
      },
      position: 1,
      reward: {
        approvalPolicyCode: "mgr-voucher-weekly",
        description: "Voucher oficial do setor, sujeito a aprovacao da gerencia.",
        fulfillmentWindowDays: 7,
        title: "Voucher do setor",
        type: "manual-company-approved",
      },
      scope: demoScope,
      status: "pending-company-approval",
      userId: "user_demo_colaborador",
      winningScore: 120,
    },
    {
      campaignId: "campaign_closed_before_after",
      grantedAt: "2026-04-15T10:05:00.000Z",
      id: "grant_before_after_julia",
      metadata: {
        campaignTitle: "Antes e depois aprovado",
        rewardTitle: "Destaque e pontos extras",
      },
      position: 1,
      reward: {
        highlightLabel: "Destaque do mes",
        points: 180,
        title: "Destaque e pontos extras",
        type: "digital",
      },
      scope: demoScope,
      status: "digital-granted",
      userId: "user_demo_colaborador",
      winningScore: 180,
    },
  ];

  const archiveItems: EngagementArchiveItemPayload[] = [
    {
      grantingRule: "Badge automatico por qualidade consistente nas aprovacoes do feed.",
      id: "archive_badge_quality_julia",
      metadata: {
        approvedPhotoCount: 6,
        badgeCode: 1,
      },
      occurredAt: "2026-04-20T12:00:00.000Z",
      relatedContentReference: "badge://qualidade-premium",
      scope: demoScope,
      sourceAction: "Historico de qualidade do feed consolidado no perfil.",
      sourceId: "badge_qualidade_premium",
      sourceType: "recognition",
      status: "recorded",
      title: "Badge qualidade premium liberado",
      type: "badge-awarded",
      userId: "user_demo_colaborador",
    },
    {
      campaignId: "campaign_closed_before_after",
      grantingRule: "Maior nota no antes e depois aprovado do ciclo.",
      id: "archive_reward_granted_julia",
      metadata: {
        position: 1,
        rewardTitle: 180,
        winningScore: 180,
      },
      occurredAt: "2026-04-15T10:05:00.000Z",
      relatedContentReference: "reward://grant_before_after_julia",
      rewardGrantId: "grant_before_after_julia",
      rewardStatus: "digital-granted",
      scope: demoScope,
      sourceAction: "Premio digital liberado automaticamente no fechamento da campanha.",
      sourceId: "grant_before_after_julia",
      sourceType: "reward-grant",
      status: "recorded",
      title: "Destaque do mes confirmado no app",
      type: "reward-granted",
      userId: "user_demo_colaborador",
    },
    {
      campaignId: "campaign_closed_consistency_week",
      grantingRule: "Maior streak validada da semana.",
      id: "archive_challenge_win_julia",
      metadata: {
        position: 1,
        score: 120,
        streakDays: 6,
      },
      occurredAt: "2026-04-18T19:00:00.000Z",
      relatedContentReference: "campaign://campaign_closed_consistency_week",
      scope: demoScope,
      sourceAction: "Campanha encerrada com revisao manual dos vencedores.",
      sourceId: "campaign_closed_consistency_week",
      sourceType: "consistency-streak",
      status: "recorded",
      title: "Top 1 em consistencia da semana",
      type: "challenge-won",
      userId: "user_demo_colaborador",
    },
    {
      campaignId: "campaign_closed_consistency_week",
      grantingRule: "Premio oficial da campanha Consistencia da semana.",
      id: "archive_manual_reward_julia",
      metadata: {
        position: 1,
        rewardTitle: 1,
        winningScore: 120,
      },
      occurredAt: "2026-04-18T19:10:00.000Z",
      relatedContentReference: "reward://grant_consistency_pending_julia",
      responsibleApproverUserId: "user_demo_gerente",
      rewardGrantId: "grant_consistency_pending_julia",
      rewardStatus: "pending-company-approval",
      scope: demoScope,
      sourceAction: "Premio manual entrou em aprovacao oficial apos o fechamento.",
      sourceId: "grant_consistency_pending_julia",
      sourceType: "reward-grant",
      status: "recorded",
      title: "Voucher do setor aguardando aprovacao",
      type: "manual-prize",
      userId: "user_demo_colaborador",
    },
    {
      grantingRule: "Post aprovado com destaque de qualidade e boa leitura de banca.",
      id: "archive_featured_post_julia",
      metadata: {
        approvedPhotoCount: 3,
      },
      occurredAt: "2026-04-23T12:20:00.000Z",
      relatedContentReference: "feed://post_demo_photo_mission",
      scope: demoScope,
      sourceAction: "Foto aprovada virou destaque visivel no mural do setor.",
      sourceId: "post_demo_photo_mission",
      sourceType: "approved-photo-post",
      status: "recorded",
      title: "Foto da abertura entrou no destaque",
      type: "featured-post",
      userId: "user_demo_colaborador",
    },
    {
      campaignId: "campaign_active_banca_april",
      grantingRule: "Checklist com foto validado por lideranca dentro da campanha de banca.",
      id: "archive_validated_banca_julia",
      metadata: {
        validatedBancaCount: 2,
      },
      occurredAt: "2026-04-22T17:15:00.000Z",
      relatedContentReference: "operations://banca_validada_22_04",
      responsibleApproverUserId: "user_demo_lider",
      scope: demoScope,
      sourceAction: "Banca do segundo pico foi validada sem retrabalho.",
      sourceId: "banca_validada_22_04",
      sourceType: "validated-banca-setup",
      status: "recorded",
      title: "Banca validada no segundo pico",
      type: "validated-banca",
      userId: "user_demo_colaborador",
    },
    {
      grantingRule:
        "Reconhecimento positivo enviado pela lideranca a partir de evidencia aprovada.",
      id: "archive_recognition_julia",
      metadata: {
        approvedPhotoCount: 1,
      },
      occurredAt: "2026-04-23T08:00:00.000Z",
      relatedContentReference: "recognition://recognition_demo",
      responsibleApproverUserId: "user_demo_lider",
      scope: demoScope,
      sourceAction: "Apoio no pico e qualidade de reposicao foram reconhecidos publicamente.",
      sourceId: "recognition_demo",
      sourceType: "recognition",
      status: "recorded",
      title: "Reconhecimento por apoio no pico",
      type: "recognition-received",
      userId: "user_demo_colaborador",
    },
    {
      campaignId: "campaign_closed_before_after",
      grantingRule: "Uma evidencia duplicada exigiu recalculo do desafio antes e depois.",
      id: "archive_corrected_challenge_julia",
      metadata: {
        approvedPhotoCount: 1,
        previousScore: 80,
      },
      occurredAt: "2026-04-16T09:30:00.000Z",
      relatedContentReference: "campaign://campaign_closed_before_after/correction",
      responsibleApproverUserId: "user_demo_lider",
      scope: demoScope,
      sourceAction: "A moderacao removeu uma evidencia repetida e o historico foi corrigido.",
      sourceId: "campaign_closed_before_after",
      sourceType: "approved-before-after",
      status: "corrected",
      title: "Desafio antes e depois recalculado",
      type: "challenge-completed",
      userId: "user_demo_colaborador",
    },
  ];

  return {
    archiveItems,
    campaigns,
    requestCounter: 0,
    rewardGrants,
  };
}

function clonePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonResponse<T>(data: T): Response {
  demoStore = {
    ...demoStore,
    requestCounter: demoStore.requestCounter + 1,
  };

  return new Response(
    JSON.stringify({
      data,
      requestId: `req_mobile_engagement_${demoStore.requestCounter}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    },
  );
}

function errorResponse(code: string, message: string, status: number): Response {
  demoStore = {
    ...demoStore,
    requestCounter: demoStore.requestCounter + 1,
  };

  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
      requestId: `req_mobile_engagement_${demoStore.requestCounter}`,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status,
    },
  );
}

function readJsonBody<T>(init: Parameters<typeof fetch>[1]): Promise<T | undefined> {
  if (typeof init?.body !== "string") {
    return Promise.resolve(undefined);
  }

  return Promise.resolve(JSON.parse(init.body) as T);
}

function toUrl(input: Parameters<typeof fetch>[0]): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}

function fail(message: string): never {
  throw new Error(message);
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
