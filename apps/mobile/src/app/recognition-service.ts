import type {
  RecognitionCategoryPayload,
  RecognitionFeedPostRequestPayload,
  RecognitionProfilePayload,
  RecognitionRankingPayload,
  RecognitionSendRequestPayload,
  RecognitionSendResultPayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import type { MobileSession } from "./providers.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();

export type CollaboratorRecognitionProfile = RecognitionProfilePayload;
export type HealthyRecognitionRanking = RecognitionRankingPayload;

interface RecognitionService {
  getProfile(input?: { readonly userId?: string }): Promise<CollaboratorRecognitionProfile>;
  getRanking(input?: { readonly limit?: number }): Promise<HealthyRecognitionRanking>;
  recognizeFeedPost(
    input: RecognitionFeedPostRequestPayload,
  ): Promise<RecognitionSendResultPayload>;
  sendRecognition(input: {
    readonly category: RecognitionCategoryPayload;
    readonly message: string;
    readonly recipientUserId: string;
  }): Promise<RecognitionSendResultPayload>;
}

interface RecognitionDemoStore {
  profile: CollaboratorRecognitionProfile;
  ranking: HealthyRecognitionRanking;
  requestCounter: number;
  sentEvents: RecognitionSendResultPayload[];
}

let demoStore: RecognitionDemoStore = createRecognitionDemoStore();

export function createRecognitionService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): RecognitionService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientRecognitionFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async getProfile(input) {
      const response = await apiClient.request("recognition.profile", {
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
    async getRanking(input) {
      const response = await apiClient.request("recognition.ranking", {
        query: {
          ...(session.scope.departmentId === undefined
            ? {}
            : { departmentId: session.scope.departmentId }),
          ...(input?.limit === undefined ? {} : { limit: input.limit }),
          organizationId: session.scope.organizationId,
          ...(session.scope.storeId === undefined ? {} : { storeId: session.scope.storeId }),
        },
      });

      return response.data;
    },
    async recognizeFeedPost(input) {
      const response = await apiClient.request("recognition.feedPost", {
        body: input,
      });

      return response.data;
    },
    async sendRecognition(input) {
      const response = await apiClient.request("recognition.send", {
        body: {
          category: input.category,
          message: input.message,
          recipientUserId: input.recipientUserId,
          scope: session.scope,
        },
      });

      return response.data;
    },
  };
}

function createResilientRecognitionFetcher(
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

      return handleMockRecognitionRequest(input, init, session);
    }
  };
}

async function handleMockRecognitionRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/recognition/profile" && method === "GET") {
    return jsonResponse(clonePayload(demoStore.profile));
  }

  if (url.pathname === "/recognition/ranking" && method === "GET") {
    const limit = Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "5", 10) || 5);

    return jsonResponse({
      ...clonePayload(demoStore.ranking),
      entries: demoStore.ranking.entries.slice(0, limit),
    });
  }

  if (url.pathname === "/recognition/events" && method === "POST") {
    const body =
      (await readJsonBody<RecognitionSendRequestPayload>(init)) ??
      fail("Missing recognition body.");

    if (
      countRecentRecognitionForRecipient(session.userId, body.recipientUserId, body.category) >= 2
    ) {
      return errorResponse("rate_limited", "Limite de reconhecimento atingido.", 429);
    }

    return jsonResponse(createMockRecognitionResult(session, body));
  }

  if (url.pathname === "/recognition/feed-posts" && method === "POST") {
    const body =
      (await readJsonBody<RecognitionFeedPostRequestPayload>(init)) ??
      fail("Missing feed recognition body.");

    return jsonResponse(
      createMockRecognitionResult(
        session,
        {
          category: "quality",
          message: body.message ?? "Destaque do feed aprovado virou reconhecimento publico.",
          recipientUserId: "user_demo_colaborador",
          scope: session.scope,
        },
        body.postId,
      ),
    );
  }

  return errorResponse("not_found", "Nao foi possivel carregar os reconhecimentos agora.", 404);
}

function createMockRecognitionResult(
  session: MobileSession,
  input: RecognitionSendRequestPayload,
  sourceFeedPostId?: string,
): RecognitionSendResultPayload {
  const now = new Date().toISOString();
  const recognitionId = `recognition_mobile_${session.userId}_${input.recipientUserId}_${Date.now()}`;
  const ledgerEntry = {
    actorUserId: session.userId,
    amount: sourceFeedPostId === undefined ? 20 : 120,
    id: `points_mobile_${recognitionId}`,
    occurredAt: now,
    reason:
      sourceFeedPostId === undefined
        ? "Reconhecimento significativo enviado pela equipe"
        : "Post aprovado no feed virou reconhecimento",
    source: sourceFeedPostId === undefined ? ("recognition" as const) : ("feed_post" as const),
    ...(sourceFeedPostId === undefined ? {} : { sourceId: sourceFeedPostId }),
  };
  const result: RecognitionSendResultPayload = {
    awardedBadges: [],
    ledgerEntry,
    recognition: {
      category: input.category,
      categoryLabel: categoryLabel(input.category),
      createdAt: now,
      id: recognitionId,
      message: input.message,
      pointsAwarded: ledgerEntry.amount,
      recipientUserId: input.recipientUserId,
      senderUserId: session.userId,
      ...(sourceFeedPostId === undefined ? {} : { sourceFeedPostId }),
    },
  };

  demoStore = {
    ...demoStore,
    profile:
      input.recipientUserId === session.userId
        ? appendRecognitionToProfile(demoStore.profile, result)
        : demoStore.profile,
    ranking: updateRanking(input.recipientUserId, ledgerEntry.amount),
    sentEvents: [result, ...demoStore.sentEvents],
  };

  return clonePayload(result);
}

function appendRecognitionToProfile(
  profile: CollaboratorRecognitionProfile,
  result: RecognitionSendResultPayload,
): CollaboratorRecognitionProfile {
  return {
    ...profile,
    ledger:
      result.ledgerEntry === undefined ? profile.ledger : [result.ledgerEntry, ...profile.ledger],
    recognitionHistory: [result.recognition, ...profile.recognitionHistory],
    rewardExplanations:
      result.ledgerEntry === undefined
        ? profile.rewardExplanations
        : [
            {
              grantedAt: result.ledgerEntry.occurredAt,
              points: result.ledgerEntry.amount,
              reason: result.ledgerEntry.reason,
              source: result.ledgerEntry.source,
              ...(result.ledgerEntry.sourceId === undefined
                ? {}
                : { sourceId: result.ledgerEntry.sourceId }),
              title:
                result.ledgerEntry.source === "feed_post"
                  ? "Post aprovado no feed"
                  : "Reconhecimento recebido",
            },
            ...profile.rewardExplanations,
          ],
    summary: {
      badgeCount: profile.badges.length,
      points: profile.summary.points + (result.ledgerEntry?.amount ?? 0),
      recentRecognitionCount: profile.summary.recentRecognitionCount + 1,
    },
  };
}

function updateRanking(userId: string, amount: number): HealthyRecognitionRanking {
  const entries = demoStore.ranking.entries.map((entry) =>
    entry.userId === userId
      ? {
          ...entry,
          points: entry.points + amount,
          recognitionCount: entry.recognitionCount + 1,
        }
      : entry,
  );
  const sortedEntries = entries
    .filter((entry) => entry.points > 0)
    .sort((left, right) => right.points - left.points)
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
  const totalPositivePoints = sortedEntries.reduce((sum, entry) => sum + entry.points, 0);

  return {
    ...demoStore.ranking,
    entries: sortedEntries,
    teamProgressPercent: Math.min(
      100,
      Math.round((totalPositivePoints / demoStore.ranking.teamGoalPoints) * 100),
    ),
    totalPositivePoints,
  };
}

function countRecentRecognitionForRecipient(
  senderUserId: string,
  recipientUserId: string,
  category: RecognitionCategoryPayload,
): number {
  return demoStore.sentEvents.filter(
    (event) =>
      event.recognition.senderUserId === senderUserId &&
      event.recognition.recipientUserId === recipientUserId &&
      event.recognition.category === category,
  ).length;
}

function createRecognitionDemoStore(): RecognitionDemoStore {
  return {
    profile: {
      badges: [
        {
          awardedAt: "2026-04-20T12:00:00.000Z",
          code: "consistencia-flv",
          description: "Mantem rotinas completas com constancia durante o ciclo.",
          explanation: "Concedido apos rotinas elegiveis concluidas no periodo.",
          id: "badge_1",
          title: "Consistencia FLV",
        },
        {
          awardedAt: "2026-04-21T12:00:00.000Z",
          code: "qualidade-premium",
          description: "Recebe reconhecimentos por cuidado visual e frescor.",
          explanation: "Concedido por reconhecimentos de qualidade.",
          id: "badge_2",
          title: "Qualidade premium",
        },
      ],
      ledger: [
        {
          actorUserId: "user_demo_lider",
          amount: 20,
          id: "points_1",
          occurredAt: "2026-04-23T08:00:00.000Z",
          reason: "Reconhecimento por qualidade",
          source: "recognition",
          sourceId: "recognition_demo",
        },
        {
          amount: 120,
          id: "points_2",
          occurredAt: "2026-04-15T08:00:00.000Z",
          reason: "Missao concluida",
          source: "feed_post",
          sourceId: "post_demo_photo_mission",
        },
      ],
      recognitionHistory: [
        {
          category: "quality",
          categoryLabel: "Qualidade",
          createdAt: "2026-04-23T08:00:00.000Z",
          id: "recognition_demo",
          message: "Excelente abertura da banca.",
          pointsAwarded: 20,
          recipientUserId: "user_demo_colaborador",
          senderUserId: "user_demo_lider",
          sourceFeedPostId: "post_demo_photo_mission",
        },
      ],
      rewardExplanations: [
        {
          grantedAt: "2026-04-23T08:00:00.000Z",
          points: 20,
          reason: "Reconhecimento por qualidade",
          source: "recognition",
          sourceId: "recognition_demo",
          title: "Reconhecimento recebido",
        },
        {
          grantedAt: "2026-04-15T08:00:00.000Z",
          points: 120,
          reason: "Missao concluida",
          source: "feed_post",
          sourceId: "post_demo_photo_mission",
          title: "Post aprovado no feed",
        },
      ],
      summary: {
        badgeCount: 2,
        points: 140,
        recentRecognitionCount: 1,
      },
    },
    ranking: {
      entries: [
        {
          badgeCount: 2,
          displayName: "Julia Lima",
          points: 140,
          position: 1,
          recognitionCount: 1,
          userId: "user_demo_colaborador",
        },
        {
          badgeCount: 1,
          displayName: "Mateus Rocha",
          points: 80,
          position: 2,
          recognitionCount: 2,
          userId: "user_demo_colaborador_2",
        },
      ],
      framing:
        "Ranking positivo: aparece apenas progresso elegivel, sem expor indicadores negativos.",
      teamGoalPoints: 500,
      teamProgressPercent: 44,
      totalPositivePoints: 220,
    },
    requestCounter: 0,
    sentEvents: [],
  };
}

function categoryLabel(category: RecognitionCategoryPayload): string {
  if (category === "quality") {
    return "Qualidade";
  }

  if (category === "teamwork") {
    return "Trabalho em equipe";
  }

  if (category === "consistency") {
    return "Consistencia";
  }

  if (category === "learning") {
    return "Aprendizado";
  }

  return "Melhoria";
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
      requestId: `req_mobile_recognition_${demoStore.requestCounter}`,
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
      requestId: `req_mobile_recognition_${demoStore.requestCounter}`,
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
