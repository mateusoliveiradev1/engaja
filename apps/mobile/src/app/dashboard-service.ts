import type {
  DashboardAttentionAreaPayload,
  DashboardChecklistMonitorPayload,
  DashboardContentItemPayload,
  DashboardContentTypePayload,
  DashboardMetricPayload,
  DashboardSummaryPayload,
  FeedPostPayload,
  LeaderSchedulePlannerPayload,
  OperationRoutineIdPayload,
  OperationsViewPayload,
  RecognitionRankingPayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import { createEngagementFeedService } from "./feed-service.js";
import { createOperationsService } from "./operations-service.js";
import type { MobileSession } from "./providers.js";
import { createRecognitionService } from "./recognition-service.js";
import { createScheduleService } from "./schedule-service.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();
const DEMO_NOW = "2026-04-23T12:00:00.000Z";

export interface LeaderDashboardFilters {
  readonly contentType?: DashboardContentTypePayload;
  readonly endsAt?: string;
  readonly routineCategory?: OperationRoutineIdPayload;
  readonly shiftId?: string;
  readonly startsAt?: string;
  readonly storeId?: string;
  readonly teamMemberId?: string;
}

export interface LeaderDashboardService {
  getSummary(input?: LeaderDashboardFilters): Promise<DashboardSummaryPayload>;
}

export function createLeaderDashboardService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): LeaderDashboardService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientDashboardFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async getSummary(input) {
      const response = await apiClient.request("dashboard.summary", {
        query: {
          ...(input?.contentType === undefined ? {} : { contentType: input.contentType }),
          ...(input?.endsAt === undefined ? {} : { endsAt: input.endsAt }),
          ...(input?.routineCategory === undefined
            ? {}
            : { routineCategory: input.routineCategory }),
          ...(input?.shiftId === undefined ? {} : { shiftId: input.shiftId }),
          ...(input?.startsAt === undefined ? {} : { startsAt: input.startsAt }),
          ...(input?.storeId === undefined ? {} : { storeId: input.storeId }),
          ...(input?.teamMemberId === undefined ? {} : { teamMemberId: input.teamMemberId }),
        },
      });

      return response.data;
    },
  };
}

function createResilientDashboardFetcher(
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

      return handleMockDashboardRequest(input, init, session, fetcher);
    }
  };
}

async function handleMockDashboardRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
  fetcher: typeof fetch,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname !== "/dashboard/summary" || method !== "GET") {
    return errorResponse("not_found", "Nao foi possivel carregar o painel agora.", 404);
  }

  const [feedHome, planner, operationsView, recognitionRanking] = await Promise.all([
    createEngagementFeedService(session, { fetcher, offlineFallback: true }).getHome({
      limit: 12,
    }),
    createScheduleService(session, { fetcher, offlineFallback: true }).getLeaderPlanner(),
    createOperationsService(session, { fetcher, offlineFallback: true }).getCollaboratorView(),
    createRecognitionService(session, { fetcher, offlineFallback: true }).getRanking({
      limit: 8,
    }),
  ]);
  const selected = readDashboardFilters(url, session);

  return jsonResponse(
    buildDashboardSummary({
      feedPosts: feedHome.posts,
      filters: selected,
      operationsView,
      planner,
      polls: feedHome.polls.length,
      recognitionRanking,
      requiredAnnouncements: feedHome.announcements.length,
      session,
    }),
  );
}

function buildDashboardSummary(input: {
  readonly feedPosts: readonly FeedPostPayload[];
  readonly filters: Required<Pick<LeaderDashboardFilters, "endsAt" | "startsAt">> &
    LeaderDashboardFilters;
  readonly operationsView: OperationsViewPayload;
  readonly planner: LeaderSchedulePlannerPayload;
  readonly polls: number;
  readonly recognitionRanking: RecognitionRankingPayload;
  readonly requiredAnnouncements: number;
  readonly session: MobileSession;
}): DashboardSummaryPayload {
  const selectedStoreId = input.filters.storeId ?? input.session.scope.storeId;
  const moderationQueue = input.feedPosts.filter((post) => post.status === "pending_moderation");
  const scheduleGapCount = input.planner.coverageAlerts.filter(
    (alert) => alert.severity !== "ok",
  ).length;
  const checklistMonitor = buildChecklistMonitor(input.operationsView);
  const attentionAreas = buildAttentionAreas({
    checklistMonitor,
    engagementRate: 0.76,
    moderationQueue,
    now: input.filters.endsAt,
    planner: input.planner,
  });
  const contentItems = buildContentItems(input);
  const overview = buildOverviewMetrics({
    checklistMonitor,
    feedPostCount: input.feedPosts.length,
    generatedAt: input.filters.endsAt,
    moderationQueueCount: moderationQueue.length,
    recognitionRanking: input.recognitionRanking,
    scheduleGapCount,
  });

  return {
    attentionAreaCount: attentionAreas.length,
    attentionAreas,
    checklistMonitor,
    contentItems,
    engagementRate: 0.76,
    filters: {
      contentTypes: [
        { id: "announcement", label: "Comunicados" },
        { id: "photo_mission", label: "Missoes foto" },
        { id: "poll", label: "Enquetes" },
        { id: "learning_card", label: "Cards de aprendizado" },
      ],
      routineCategories: [
        { id: "opening", label: "Abertura" },
        { id: "replenishment", label: "Reposicao" },
        { id: "quality-review", label: "Qualidade" },
        { id: "cleaning", label: "Limpeza" },
        { id: "labels", label: "Etiquetas" },
        { id: "closing", label: "Fechamento" },
      ],
      selected: {
        ...(input.filters.contentType === undefined
          ? {}
          : { contentType: input.filters.contentType }),
        dateRangeLabel: `${formatShortDate(input.filters.startsAt)}-${formatShortDate(input.filters.endsAt)}`,
        endsAt: input.filters.endsAt,
        ...(input.filters.routineCategory === undefined
          ? {}
          : { routineCategory: input.filters.routineCategory }),
        ...(input.filters.shiftId === undefined ? {} : { shiftId: input.filters.shiftId }),
        startsAt: input.filters.startsAt,
        ...(selectedStoreId === undefined ? {} : { storeId: selectedStoreId }),
        ...(input.filters.teamMemberId === undefined
          ? {}
          : { teamMemberId: input.filters.teamMemberId }),
      },
      shifts: input.planner.shifts.map((shift) => ({
        id: shift.id,
        label: `${shift.title} / ${formatShortDate(shift.startsAt)}`,
      })),
      stores:
        input.session.scope.storeId === undefined
          ? []
          : [{ id: input.session.scope.storeId, label: `Loja ${input.session.scope.storeId}` }],
      teamMembers: input.planner.teamMembers.map((member) => ({
        id: member.userId,
        label: member.displayName,
      })),
    },
    memberInsights: input.planner.teamMembers.map((member) => {
      const rankingEntry = input.recognitionRanking.entries.find(
        (entry) => entry.userId === member.userId,
      );

      return {
        completedActionCount: input.operationsView.routines
          .flatMap((routine) => routine.items)
          .filter((item) => item.completedByUserId === member.userId && item.status === "completed")
          .length,
        displayName: member.displayName,
        engagementCount: input.feedPosts.filter((post) => post.authorName === member.displayName)
          .length,
        points: rankingEntry?.points ?? 0,
        recognitionCount: rankingEntry?.recognitionCount ?? 0,
        role: member.role,
        scaleLabel: `${input.planner.shifts.filter((shift) => shift.userId === member.userId).length} turno(s) no recorte`,
        userId: member.userId,
      };
    }),
    moderationQueue,
    openModerationCount: moderationQueue.length,
    overview,
    scheduleConsole: input.planner,
    scheduleGapCount,
  };
}

function buildChecklistMonitor(view: OperationsViewPayload): DashboardChecklistMonitorPayload {
  const routines = view.routines.map((routine) => ({
    completedCount: routine.items.filter((item) => item.status === "completed").length,
    id: routine.id,
    label: routine.label,
    overdueCount: routine.items.filter((item) => item.status === "overdue").length,
    totalCount: routine.items.length,
  }));
  const totalCount = routines.reduce((sum, routine) => sum + routine.totalCount, 0);
  const completedCount = routines.reduce((sum, routine) => sum + routine.completedCount, 0);
  const overdueCount = routines.reduce((sum, routine) => sum + routine.overdueCount, 0);

  return {
    completedCount,
    completionRate: totalCount === 0 ? 1 : Math.round((completedCount / totalCount) * 100) / 100,
    overdueCount,
    requiredEvidenceMissingCount: view.routines
      .flatMap((routine) => routine.items)
      .filter(
        (item) =>
          item.evidenceMode === "required" &&
          item.evidencePhotoUrl === undefined &&
          item.status !== "completed",
      ).length,
    routines,
    totalCount,
    unresolvedIssueCount: view.issues.filter(
      (issue) => issue.status === "open" || issue.status === "in_review",
    ).length,
  };
}

function buildContentItems(input: {
  readonly feedPosts: readonly FeedPostPayload[];
  readonly filters: LeaderDashboardFilters;
  readonly operationsView: OperationsViewPayload;
  readonly polls: number;
  readonly requiredAnnouncements: number;
}): DashboardContentItemPayload[] {
  const items: DashboardContentItemPayload[] = [
    {
      id: "content_required_announcements",
      metricLabel: `${input.requiredAnnouncements} ativo(s)`,
      status: "active",
      title: "Comunicados obrigatorios do turno",
      type: "announcement",
    },
    {
      id: "content_active_polls",
      metricLabel: `${input.polls} enquete(s)`,
      status: "active",
      title: "Enquetes rapidas do setor",
      type: "poll",
    },
    ...input.feedPosts
      .filter((post) => post.missionLink?.missionTitle !== undefined)
      .slice(0, 4)
      .map((post) => ({
        id: post.missionLink?.missionId ?? post.id,
        metricLabel:
          post.missionLink?.rewardPoints === undefined
            ? "sem pontos"
            : `${post.missionLink.rewardPoints} pts`,
        ownerLabel: post.authorName,
        scheduledFor: post.publishedAt ?? post.createdAt,
        status:
          post.status === "pending_moderation" || post.status === "draft"
            ? ("draft" as const)
            : post.status === "hidden" || post.status === "removed"
              ? ("archived" as const)
              : ("active" as const),
        title: post.missionLink?.missionTitle ?? post.title,
        type: "photo_mission" as const,
      })),
    ...input.operationsView.learningBites.slice(0, 4).map((bite) => ({
      id: bite.id,
      metricLabel:
        bite.pointsAwarded === undefined
          ? `${bite.durationMinutes} min`
          : `${bite.pointsAwarded} pts`,
      ...(bite.completedByUserName === undefined ? {} : { ownerLabel: bite.completedByUserName }),
      ...(bite.completedAt === undefined ? {} : { scheduledFor: bite.completedAt }),
      status: bite.completed ? ("closed" as const) : ("active" as const),
      title: bite.title,
      type: "learning_card" as const,
    })),
  ];

  return input.filters.contentType === undefined
    ? items
    : items.filter((item) => item.type === input.filters.contentType);
}

function buildAttentionAreas(input: {
  readonly checklistMonitor: DashboardChecklistMonitorPayload;
  readonly engagementRate: number;
  readonly moderationQueue: readonly FeedPostPayload[];
  readonly now: string;
  readonly planner: LeaderSchedulePlannerPayload;
}): DashboardAttentionAreaPayload[] {
  const coverageGaps = input.planner.coverageAlerts.filter((alert) => alert.severity !== "ok");
  const areas: DashboardAttentionAreaPayload[] = [];

  if (input.moderationQueue.length > 0) {
    areas.push({
      createdAt: input.now,
      description: `${input.moderationQueue.length} post(s) precisam de decisao auditavel.`,
      id: "attention_mobile_moderation",
      kind: "moderation_queue",
      severity: input.moderationQueue.length >= 3 ? "critical" : "warning",
      sourceCount: input.moderationQueue.length,
      title: "Fila de moderacao",
    });
  }

  if (coverageGaps.length > 0) {
    areas.push({
      createdAt: input.now,
      description: `${coverageGaps.length} periodo(s) abaixo da cobertura minima.`,
      id: "attention_mobile_coverage",
      kind: "coverage_gap",
      severity: coverageGaps.some((alert) => alert.severity === "critical")
        ? "critical"
        : "warning",
      sourceCount: coverageGaps.length,
      title: "Cobertura em ajuste",
    });
  }

  if (input.checklistMonitor.overdueCount > 0) {
    areas.push({
      createdAt: input.now,
      description: `${input.checklistMonitor.overdueCount} item(ns) de rotina estao atrasados.`,
      id: "attention_mobile_overdue",
      kind: "overdue_routine",
      severity: input.checklistMonitor.overdueCount >= 3 ? "critical" : "warning",
      sourceCount: input.checklistMonitor.overdueCount,
      title: "Rotinas fora da janela",
    });
  }

  if (input.engagementRate < 0.6) {
    areas.push({
      createdAt: input.now,
      description: "A participacao do periodo caiu abaixo da faixa esperada.",
      id: "attention_mobile_engagement",
      kind: "low_engagement",
      severity: "warning",
      sourceCount: Math.round(input.engagementRate * 100),
      title: "Engajamento em queda",
    });
  }

  return areas;
}

function buildOverviewMetrics(input: {
  readonly checklistMonitor: DashboardChecklistMonitorPayload;
  readonly feedPostCount: number;
  readonly generatedAt: string;
  readonly moderationQueueCount: number;
  readonly recognitionRanking: RecognitionRankingPayload;
  readonly scheduleGapCount: number;
}): DashboardSummaryPayload["overview"] {
  const metrics: DashboardMetricPayload[] = [
    {
      key: "engagement",
      label: "Engajamento",
      note: "periodo atual",
      tone: "fresh",
      value: "76%",
    },
    {
      key: "feed",
      label: "Feed",
      note: "posts no recorte",
      tone: "accent",
      value: String(input.feedPostCount),
    },
    {
      key: "schedule",
      label: "Escala",
      note: "gaps de cobertura",
      tone: input.scheduleGapCount === 0 ? "fresh" : "warm",
      value: String(input.scheduleGapCount),
    },
    {
      key: "routine",
      label: "Rotinas",
      note: "conclusao",
      tone: input.checklistMonitor.completionRate >= 0.8 ? "fresh" : "warm",
      value: `${Math.round(input.checklistMonitor.completionRate * 100)}%`,
    },
    {
      key: "issue",
      label: "Desvios",
      note: "abertos",
      tone: input.checklistMonitor.unresolvedIssueCount === 0 ? "fresh" : "warm",
      value: String(input.checklistMonitor.unresolvedIssueCount),
    },
    {
      key: "recognition",
      label: "Reconhecimento",
      note: "acoes positivas",
      tone: "accent",
      value: String(
        input.recognitionRanking.entries.reduce((sum, entry) => sum + entry.recognitionCount, 0),
      ),
    },
    {
      key: "team-progress",
      label: "Time",
      note: "meta saudavel",
      tone: input.recognitionRanking.teamProgressPercent >= 70 ? "fresh" : "accent",
      value: `${input.recognitionRanking.teamProgressPercent}%`,
    },
  ];

  return {
    generatedAt: input.generatedAt,
    metrics,
    teamProgressPercent: input.recognitionRanking.teamProgressPercent,
  };
}

function readDashboardFilters(
  url: URL,
  session: MobileSession,
): Required<Pick<LeaderDashboardFilters, "endsAt" | "startsAt">> & LeaderDashboardFilters {
  const endsAt = url.searchParams.get("endsAt") ?? DEMO_NOW;
  const startsAt =
    url.searchParams.get("startsAt") ??
    new Date(new Date(endsAt).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const contentType = url.searchParams.get("contentType");
  const routineCategory = url.searchParams.get("routineCategory");
  const shiftId = url.searchParams.get("shiftId");
  const storeId = url.searchParams.get("storeId") ?? session.scope.storeId;
  const teamMemberId = url.searchParams.get("teamMemberId");

  return {
    ...(contentType === null ? {} : { contentType: contentType as DashboardContentTypePayload }),
    endsAt,
    ...(routineCategory === null
      ? {}
      : { routineCategory: routineCategory as OperationRoutineIdPayload }),
    ...(shiftId === null ? {} : { shiftId }),
    startsAt,
    ...(storeId === undefined ? {} : { storeId }),
    ...(teamMemberId === null ? {} : { teamMemberId }),
  };
}

function formatShortDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function jsonResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      data,
      requestId: "req_mobile_dashboard",
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
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
      requestId: "req_mobile_dashboard",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
      status,
    },
  );
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
