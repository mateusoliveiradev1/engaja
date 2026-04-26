import type {
  OperationRoutineIdPayload,
  OperationsChecklistItemCompleteRequestPayload,
  OperationsChecklistItemPayload,
  OperationsIssueCreateRequestPayload,
  OperationsIssuePayload,
  OperationsIssueSeverityPayload,
  OperationsLearningBitePayload,
  OperationsLearningCompleteRequestPayload,
  OperationsQualityStandardPayload,
  OperationsRoutinePayload,
  OperationsShiftSummaryPayload,
  OperationsViewPayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import type { MobileSession } from "./providers.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();
const defaultShiftId = "shift_today_collaborator";

export type OperationRoutineId = OperationRoutineIdPayload;
export type CollaboratorOperationsView = OperationsViewPayload;

export interface CompleteChecklistItemInput {
  readonly evidencePhotoUrl?: string;
  readonly itemId: string;
  readonly note?: string;
  readonly pendingSync?: boolean;
  readonly routineId: OperationRoutineId;
  readonly shiftId?: string;
}

export interface CreateOperationsIssueInput {
  readonly category: string;
  readonly evidencePhotoUrls?: readonly string[];
  readonly note?: string;
  readonly pendingSync?: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly severity: OperationsIssueSeverityPayload;
  readonly shiftId?: string;
}

export interface CompleteLearningBiteInput {
  readonly learningBiteId: string;
  readonly pendingSync?: boolean;
}

export interface OperationsService {
  completeChecklistItem(input: CompleteChecklistItemInput): Promise<CollaboratorOperationsView>;
  completeLearningBite(input: CompleteLearningBiteInput): Promise<CollaboratorOperationsView>;
  createIssue(input: CreateOperationsIssueInput): Promise<CollaboratorOperationsView>;
  getCollaboratorView(): Promise<CollaboratorOperationsView>;
}

interface OperationsDemoStore {
  readonly requestCounter: number;
  readonly view: CollaboratorOperationsView;
}

let demoStore: OperationsDemoStore = createOperationsDemoStore();

export function createOperationsService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): OperationsService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientOperationsFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async completeChecklistItem(input) {
      const response = await apiClient.request("operations.checklist.complete", {
        body: {
          ...(input.evidencePhotoUrl === undefined
            ? {}
            : { evidencePhotoUrl: input.evidencePhotoUrl }),
          itemId: input.itemId,
          ...(input.note === undefined ? {} : { note: input.note }),
          ...(input.pendingSync === undefined ? {} : { pendingSync: input.pendingSync }),
          routineId: input.routineId,
          scope: session.scope,
          ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
        },
      });

      return response.data;
    },
    async completeLearningBite(input) {
      const response = await apiClient.request("operations.learning.complete", {
        body: {
          learningBiteId: input.learningBiteId,
          ...(input.pendingSync === undefined ? {} : { pendingSync: input.pendingSync }),
          scope: session.scope,
        },
      });

      return response.data;
    },
    async createIssue(input) {
      const response = await apiClient.request("operations.issue.create", {
        body: {
          category: input.category,
          ...(input.evidencePhotoUrls === undefined
            ? {}
            : { evidencePhotoUrls: [...input.evidencePhotoUrls] }),
          ...(input.note === undefined ? {} : { note: input.note }),
          ...(input.pendingSync === undefined ? {} : { pendingSync: input.pendingSync }),
          ...(input.productName === undefined ? {} : { productName: input.productName }),
          ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
          scope: session.scope,
          severity: input.severity,
          ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
        },
      });

      return response.data;
    },
    async getCollaboratorView() {
      const response = await apiClient.request("operations.view", {
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
  };
}

function createResilientOperationsFetcher(
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

      return handleMockOperationsRequest(input, init, session);
    }
  };
}

async function handleMockOperationsRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/operations/view" && method === "GET") {
    return jsonResponse(clonePayload(demoStore.view));
  }

  if (url.pathname === "/operations/checklist-items/complete" && method === "POST") {
    const body =
      (await readJsonBody<OperationsChecklistItemCompleteRequestPayload>(init)) ??
      fail("Missing checklist completion body.");

    try {
      const nextView = completeMockChecklistItem(body, session);

      demoStore = {
        requestCounter: demoStore.requestCounter,
        view: nextView,
      };

      return jsonResponse(clonePayload(nextView));
    } catch (error) {
      return errorResponse("bad_request", toErrorMessage(error), 400);
    }
  }

  if (url.pathname === "/operations/issues" && method === "POST") {
    const body =
      (await readJsonBody<OperationsIssueCreateRequestPayload>(init)) ??
      fail("Missing issue creation body.");

    try {
      const nextView = createMockIssue(body, session);

      demoStore = {
        requestCounter: demoStore.requestCounter,
        view: nextView,
      };

      return jsonResponse(clonePayload(nextView));
    } catch (error) {
      return errorResponse("bad_request", toErrorMessage(error), 400);
    }
  }

  if (url.pathname === "/operations/learning-bites/complete" && method === "POST") {
    const body =
      (await readJsonBody<OperationsLearningCompleteRequestPayload>(init)) ??
      fail("Missing learning completion body.");

    const nextView = completeMockLearningBite(body, session);

    demoStore = {
      requestCounter: demoStore.requestCounter,
      view: nextView,
    };

    return jsonResponse(clonePayload(nextView));
  }

  return errorResponse("not_found", "Nao foi possivel carregar as rotinas agora.", 404);
}

function completeMockChecklistItem(
  input: OperationsChecklistItemCompleteRequestPayload,
  session: MobileSession,
): CollaboratorOperationsView {
  const nextView = clonePayload(demoStore.view);
  const routine =
    nextView.routines.find((candidate) => candidate.id === input.routineId) ??
    fail("Routine not found.");
  const item =
    routine.items.find((candidate) => candidate.id === input.itemId) ??
    fail("Checklist item not found.");

  if (item.evidenceMode === "required" && input.evidencePhotoUrl === undefined) {
    throw new Error("Esta acao exige foto de evidencia para ser concluida.");
  }

  const now = new Date().toISOString();

  item.completedAt = now;
  item.completedByUserId = session.userId;
  item.completedByUserName = session.displayName;
  item.pendingSync = input.pendingSync ?? false;
  item.shiftId = input.shiftId ?? defaultShiftId;
  item.status = "completed";

  if (input.note !== undefined) {
    item.note = input.note;
  }

  if (input.evidencePhotoUrl !== undefined) {
    item.evidencePhotoUrl = input.evidencePhotoUrl;
  }

  return normalizeOperationsView(nextView);
}

function createMockIssue(
  input: OperationsIssueCreateRequestPayload,
  session: MobileSession,
): CollaboratorOperationsView {
  if (requiresIssueEvidence(input.category) && (input.evidencePhotoUrls?.length ?? 0) === 0) {
    throw new Error("Inclua uma foto de evidencia para registrar este desvio.");
  }

  const nextView = clonePayload(demoStore.view);
  const createdAt = buildOfflineIssueTimestamp(nextView.issues);

  nextView.issues = [
    {
      category: normalizeIssueCategory(input.category),
      createdAt,
      evidencePhotoUrls: [...(input.evidencePhotoUrls ?? [])],
      id: `issue_mobile_${Date.now()}`,
      ...(input.note === undefined ? {} : { note: input.note }),
      pendingSync: input.pendingSync ?? false,
      ...(input.productName === undefined ? {} : { productName: input.productName }),
      ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
      reportedByUserId: session.userId,
      reportedByUserName: session.displayName,
      severity: input.severity,
      ...(input.shiftId === undefined ? { shiftId: defaultShiftId } : { shiftId: input.shiftId }),
      status: "open",
    },
    ...nextView.issues,
  ];

  return normalizeOperationsView(nextView);
}

function completeMockLearningBite(
  input: OperationsLearningCompleteRequestPayload,
  session: MobileSession,
): CollaboratorOperationsView {
  const nextView = clonePayload(demoStore.view);
  const bite =
    nextView.learningBites.find((candidate) => candidate.id === input.learningBiteId) ??
    fail("Learning bite not found.");

  bite.completed = true;
  bite.completedAt = new Date().toISOString();
  bite.completedByUserId = session.userId;
  bite.completedByUserName = session.displayName;
  bite.pendingSync = input.pendingSync ?? false;

  return normalizeOperationsView(nextView);
}

function normalizeOperationsView(view: CollaboratorOperationsView): CollaboratorOperationsView {
  const normalizedRoutines = view.routines.map((routine) => ({
    ...routine,
    evidence: buildRoutineEvidence(routine),
  }));
  const normalizedIssues = [...view.issues].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const normalizedLearningBites = [...view.learningBites].sort((left, right) =>
    left.title.localeCompare(right.title, "pt-BR"),
  );
  const summary = buildSummary(normalizedRoutines, normalizedIssues, normalizedLearningBites);
  const shiftSummary = buildShiftSummary(
    normalizedRoutines,
    normalizedIssues,
    normalizedLearningBites,
    summary,
  );

  return {
    highlight: buildOperationsHighlight(summary),
    issues: normalizedIssues,
    learningBites: normalizedLearningBites,
    routines: normalizedRoutines,
    shiftSummary,
    standards: view.standards,
    summary,
  };
}

function buildRoutineEvidence(
  routine: OperationsRoutinePayload,
): OperationsRoutinePayload["evidence"] {
  const evidenceItems = routine.items.filter((item) => item.evidenceMode !== "none");
  const completedEvidenceCount = evidenceItems.filter(
    (item) => item.evidencePhotoUrl !== undefined,
  ).length;
  const requiredEvidencePendingCount = evidenceItems.filter(
    (item) => item.evidenceMode === "required" && item.evidencePhotoUrl === undefined,
  ).length;

  return {
    label: evidenceItems[0]?.label ?? routine.items[0]?.label ?? "Evidencia da rotina",
    status:
      requiredEvidencePendingCount > 0
        ? `${requiredEvidencePendingCount} foto(s) obrigatoria(s) pendente(s)`
        : completedEvidenceCount > 0
          ? `${completedEvidenceCount} evidencia(s) registrada(s)`
          : "Sem evidencia registrada",
  };
}

function buildSummary(
  routines: readonly OperationsRoutinePayload[],
  issues: readonly OperationsIssuePayload[],
  learningBites: readonly OperationsLearningBitePayload[],
): CollaboratorOperationsView["summary"] {
  const completedRoutineCount = routines.filter((routine) =>
    routine.items.every(isCompletedChecklistItem),
  ).length;
  const overdueRoutineCount = routines.filter((routine) =>
    routine.items.some((item) => item.status === "overdue"),
  ).length;
  const openIssueCount = issues.filter(
    (issue) => issue.status === "open" || issue.status === "in_review",
  ).length;
  const pendingSyncCount =
    routines.flatMap((routine) => routine.items).filter((item) => item.pendingSync).length +
    issues.filter((issue) => issue.pendingSync).length +
    learningBites.filter((bite) => bite.pendingSync).length;

  return {
    completedRoutineCount,
    openIssueCount,
    overdueRoutineCount,
    pendingSyncCount,
  };
}

function buildShiftSummary(
  routines: readonly OperationsRoutinePayload[],
  issues: readonly OperationsIssuePayload[],
  learningBites: readonly OperationsLearningBitePayload[],
  summary: CollaboratorOperationsView["summary"],
): OperationsShiftSummaryPayload {
  const overdueItems = routines.flatMap((routine) =>
    routine.items
      .filter((item) => item.status === "overdue")
      .map((item) => `${routine.label}: ${item.label}`),
  );
  const evidenceItems = routines.flatMap((routine) =>
    routine.items
      .filter((item) => item.evidencePhotoUrl !== undefined)
      .map((item) => ({
        id: `${routine.id}:${item.id}`,
        label: `${routine.label}: ${item.label}`,
        ...(item.evidencePhotoUrl === undefined ? {} : { photoUrl: item.evidencePhotoUrl }),
        status: item.pendingSync ? "Aguardando envio" : "Registrada",
      })),
  );
  const openIssues = issues
    .filter((issue) => issue.status === "open" || issue.status === "in_review")
    .map((issue) => ({
      id: issue.id,
      label:
        issue.productName === undefined
          ? issue.category
          : `${issue.category} / ${issue.productName}`,
      severity: issue.severity,
      status: issue.status,
    }));
  const wins = buildShiftWins(routines, learningBites, evidenceItems.length);
  const shiftId =
    routines.flatMap((routine) => routine.items).find((item) => item.shiftId !== undefined)
      ?.shiftId ?? issues.find((issue) => issue.shiftId !== undefined)?.shiftId;

  return {
    completedRoutineCount: summary.completedRoutineCount,
    evidenceCount: evidenceItems.length,
    evidenceItems,
    openIssueCount: openIssues.length,
    openIssues,
    overdueItemCount: overdueItems.length,
    overdueItems,
    pendingSyncCount: summary.pendingSyncCount,
    ...(shiftId === undefined ? {} : { shiftId }),
    title: "Resumo do turno FLV",
    wins,
  };
}

function buildShiftWins(
  routines: readonly OperationsRoutinePayload[],
  learningBites: readonly OperationsLearningBitePayload[],
  evidenceCount: number,
): string[] {
  const wins: string[] = [];
  const completedRoutineLabels = routines
    .filter((routine) => routine.items.every(isCompletedChecklistItem))
    .map((routine) => routine.label);
  const completedLearningTitles = learningBites
    .filter((bite) => bite.completed)
    .map((bite) => bite.title);

  if (completedRoutineLabels.length > 0) {
    wins.push(`Rotinas fechadas: ${completedRoutineLabels.join(", ")}.`);
  }

  if (evidenceCount > 0) {
    wins.push(`${evidenceCount} evidencia(s) reforcam o handover do turno.`);
  }

  if (completedLearningTitles.length > 0) {
    wins.push(`Aprendizados concluidos: ${completedLearningTitles.join(", ")}.`);
  }

  if (wins.length === 0) {
    wins.push("Turno com contexto registrado para a proxima equipe.");
  }

  return wins;
}

function buildOperationsHighlight(summary: CollaboratorOperationsView["summary"]): string {
  if (summary.pendingSyncCount > 0) {
    return `${summary.pendingSyncCount} acao(oes) aguardam sincronizacao local antes do fechamento do turno.`;
  }

  if (summary.overdueRoutineCount > 0) {
    return `${summary.overdueRoutineCount} rotina(s) seguem fora da janela ideal e pedem revisao rapida.`;
  }

  if (summary.openIssueCount > 0) {
    return `${summary.openIssueCount} desvio(s) seguem em aberto e entram no radar da lideranca.`;
  }

  return "As rotinas do turno seguem em leitura limpa, com padrao FLV, evidencias e resumo prontos para passagem.";
}

function createOperationsDemoStore(): OperationsDemoStore {
  return {
    requestCounter: 0,
    view: normalizeOperationsView({
      highlight: "",
      issues: [
        {
          category: "Perda e quebra",
          createdAt: "2026-04-23T11:00:00.000Z",
          evidencePhotoUrls: ["https://images.engaja.local/operations/loss-issue.jpg"],
          id: "issue_open_1",
          note: "Tomate grape com quebra no segundo pico. Lote separado e lider avisado.",
          pendingSync: false,
          productName: "Tomate grape",
          quantity: 6,
          reportedByUserId: "user_demo_colaborador",
          reportedByUserName: "Colaborador FLV",
          severity: "medium",
          shiftId: defaultShiftId,
          status: "open",
        },
        {
          category: "Etiqueta divergente",
          createdAt: "2026-04-23T08:40:00.000Z",
          evidencePhotoUrls: ["https://images.engaja.local/operations/label-issue.jpg"],
          id: "issue_resolved_1",
          note: "Preco ajustado antes da abertura da loja.",
          pendingSync: false,
          productName: "Manga palmer",
          quantity: 1,
          reportedByUserId: "user_demo_colaborador",
          reportedByUserName: "Colaborador FLV",
          severity: "low",
          shiftId: defaultShiftId,
          status: "resolved",
        },
      ],
      learningBites: [
        {
          completed: true,
          completedAt: "2026-04-23T09:55:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          description:
            "Aprenda a comparar cor, firmeza e brilho antes de manter frutas sensiveis na frente.",
          durationMinutes: 4,
          feedPostId: "post_demo_photo_mission",
          id: "learning_bite_1",
          missionTitle: "Missao abertura impecavel",
          pendingSync: false,
          pointsAwarded: 30,
          standardId: "standard_quality_review",
          title: "Triagem expressa de frutas sensiveis",
        },
        {
          completed: false,
          description:
            "Veja como reforcar a ilha central sem perder leitura, fluxo e altura comercial.",
          durationMinutes: 3,
          feedPostId: "post_demo_photo_mission",
          id: "learning_bite_2",
          missionTitle: "Missao pico sem ruptura",
          pendingSync: false,
          pointsAwarded: 20,
          standardId: "standard_replenishment_peak",
          title: "Reposicao invisivel no pico",
        },
        {
          completed: false,
          description:
            "Revise como documentar quebra, observacoes e evidencias para a troca de time.",
          durationMinutes: 5,
          id: "learning_bite_3",
          pendingSync: false,
          standardId: "standard_closing_handover",
          title: "Passagem de turno com contexto",
        },
      ],
      routines: createDemoRoutines(),
      shiftSummary: {
        completedRoutineCount: 0,
        evidenceCount: 0,
        evidenceItems: [],
        openIssueCount: 0,
        openIssues: [],
        overdueItemCount: 0,
        overdueItems: [],
        pendingSyncCount: 0,
        shiftId: defaultShiftId,
        title: "Resumo do turno FLV",
        wins: [],
      },
      standards: createDemoStandards(),
      summary: {
        completedRoutineCount: 0,
        openIssueCount: 0,
        overdueRoutineCount: 0,
        pendingSyncCount: 0,
      },
    }),
  };
}

function createDemoRoutines(): CollaboratorOperationsView["routines"] {
  return [
    {
      checklistTitle: "Abertura do setor",
      description:
        "Primeira passada para deixar banca, parede fria e ilha central prontas antes do fluxo pesado.",
      evidence: {
        label: "Foto da banca premium",
        status: "Referencia visual prevista",
      },
      focusChips: ["06:00-07:30", "Banca premium", "Parede fria"],
      id: "opening",
      items: [
        createChecklistItem({
          completedAt: "2026-04-23T09:05:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "none",
          id: "opening-temperature",
          label: "Conferir temperatura e umidade da parede fria",
          helper: "Garantir faixa segura e leitura estavel logo no inicio do turno.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T09:08:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "required",
          evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
          id: "opening-front",
          label: "Organizar frente premium com leitura limpa",
          helper: "Montar frente viva para folhas, ervas e mix de alto giro.",
          note: "Frente premium pronta com folhas e ervas vivas.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T09:12:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "optional",
          evidencePhotoUrl: "https://images.engaja.local/operations/opening-breakage.jpg",
          id: "opening-breakage",
          label: "Triar quebra e retirar item sem padrao",
          helper: "Separar perda da madrugada antes da reposicao principal.",
          note: "Quebra separada antes da reposicao principal.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T09:20:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "none",
          id: "opening-cleanline",
          label: "Liberar corredor central para a abertura",
          helper: "Confirmar piso, base e ilhas sem excesso de umidade.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
      ],
      label: "Abertura",
      note: "A abertura precisa deixar o setor apresentavel e facil de ler em poucos segundos para cliente e lideranca.",
      standardIds: ["standard_freshness_opening", "standard_cleaning_flow"],
    },
    {
      checklistTitle: "Reposicao no pico",
      description:
        "Rotina de reposicao pensada para segurar giro alto sem perder leitura visual nem travar o corredor.",
      evidence: {
        label: "Ilha central apos reforco",
        status: "Comparativo opcional",
      },
      focusChips: ["Pico do almoco", "Ilha central", "Berry wall"],
      id: "replenishment",
      items: [
        createChecklistItem({
          completedAt: "2026-04-23T11:05:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "optional",
          evidencePhotoUrl: "https://images.engaja.local/operations/replenishment-berries.jpg",
          id: "replenishment-berries",
          label: "Repor berries e folhas de alto giro",
          helper: "Priorizar ruptura visivel na frente da loja.",
          pendingSync: true,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          evidenceMode: "required",
          id: "replenishment-gaps",
          label: "Eliminar vazios de banana, tomate e citricos",
          helper: "Fechar vazios sem misturar lote ou maturacao fora do padrao.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          evidenceMode: "none",
          id: "replenishment-support",
          label: "Acionar reforco se a ruptura passar de 15 min",
          helper: "Apoio rapido evita queda visual no segundo pico.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          evidenceMode: "optional",
          id: "replenishment-height",
          label: "Ajustar altura da ilha promocional",
          helper: "Manter volume coerente sem bloquear a circulacao.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
      ],
      label: "Reposicao",
      note: "Reposicao boa em FLV e quase invisivel para o cliente: fecha vazio, preserva a leitura e mantem o fluxo leve.",
      standardIds: ["standard_replenishment_peak"],
    },
    {
      checklistTitle: "Revisao de qualidade",
      description:
        "Checagem curta e recorrente de frescor, maturacao e apresentacao para evitar desvio no horario mais sensivel.",
      evidence: {
        label: "Tomate grape apos triagem",
        status: "Referencia de qualidade",
      },
      focusChips: ["Maturacao", "Triagem", "Exposicao viva"],
      id: "quality-review",
      items: [
        createChecklistItem({
          completedAt: "2026-04-23T10:04:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "none",
          id: "quality-ripeness",
          label: "Revisar maturacao de abacate, manga e tomate",
          helper: "Olhar lote, firmeza e cor antes de manter o item na frente.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T10:08:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "required",
          evidencePhotoUrl: "https://images.engaja.local/operations/quality-damaged.jpg",
          id: "quality-damaged",
          label: "Retirar item avariado ou sem brilho",
          helper: "Produto amassado derruba a percepcao geral da banca.",
          note: "Avarias retiradas da frente da banca.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T10:12:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "optional",
          evidencePhotoUrl: "https://images.engaja.local/operations/quality-reference.jpg",
          id: "quality-reference",
          label: "Conferir leitura da exposicao com referencia da lideranca",
          helper: "Comparar o resultado com o padrao visual esperado do setor.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T10:20:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "none",
          id: "quality-escalation",
          label: "Sinalizar desvio de frescor que exige apoio",
          helper: "Se o ajuste depender de decisao, deixar o contexto pronto para quem revisa.",
          note: "Sem escalonamento adicional neste ciclo.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
      ],
      label: "Qualidade",
      note: "A revisao precisa ser simples, rapida e rigorosa: cliente percebe o setor primeiro pela qualidade aparente.",
      standardIds: ["standard_quality_review"],
    },
    {
      checklistTitle: "Limpeza operacional",
      description:
        "Higiene recorrente para manter piso, bancada e utensilios prontos sem transformar a rotina em tarefa invisivel.",
      evidence: {
        label: "Corredor seco e sinalizado",
        status: "Comprovacao rapida",
      },
      focusChips: ["Piso", "Bancada", "Utensilios"],
      id: "cleaning",
      items: [
        createChecklistItem({
          evidenceMode: "optional",
          id: "cleaning-bench",
          label: "Limpar bancada de corte e utensilios",
          helper: "Comecar pelos pontos mais visiveis e de maior risco.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "overdue",
        }),
        createChecklistItem({
          evidenceMode: "required",
          id: "cleaning-floor",
          label: "Trocar aparas e revisar piso do corredor",
          helper: "Residuos pequenos comprometem seguranca e leitura de cuidado.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "overdue",
        }),
        createChecklistItem({
          evidenceMode: "none",
          id: "cleaning-drain",
          label: "Higienizar drenos e base das cubas",
          helper: "Fechar pontos de umidade antes da troca de time.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "overdue",
        }),
      ],
      label: "Limpeza",
      note: "Limpeza em FLV sustenta seguranca, frescor percebido e velocidade de operacao ao longo do dia inteiro.",
      standardIds: ["standard_cleaning_flow"],
    },
    {
      checklistTitle: "Etiquetas e comunicacao",
      description:
        "Bloco rapido para manter preco, origem e destaque comercial legiveis em toda a banca.",
      evidence: {
        label: "Etiqueta destaque da semana",
        status: "Revisao visual",
      },
      focusChips: ["Promocao", "Origem", "Preco frontal"],
      id: "labels",
      items: [
        createChecklistItem({
          evidenceMode: "optional",
          id: "labels-promo",
          label: "Conferir etiqueta frontal da promocao",
          helper: "Toda promocao precisa ficar entendivel sem esforco.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          evidenceMode: "required",
          id: "labels-price",
          label: "Corrigir preco divergente na banca de frutas",
          helper: "Preco trocado vira ruido operacional e reclamacao imediata.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          completedAt: "2026-04-23T11:10:00.000Z",
          completedByUserId: "user_demo_colaborador",
          completedByUserName: "Colaborador FLV",
          evidenceMode: "none",
          id: "labels-origin",
          label: "Validar origem e lote legivel",
          helper: "Origem e lote visiveis reforcam confianca e rastreabilidade.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "completed",
        }),
      ],
      label: "Etiquetas",
      note: "Comunicacao bem resolvida protege venda, evita atrito no caixa e reduz duvida recorrente da equipe.",
      standardIds: ["standard_labels_sell"],
    },
    {
      checklistTitle: "Fechamento do turno",
      description:
        "Ultimo bloco para consolidar pendencias, preparar o dia seguinte e deixar o setor legivel para a proxima equipe.",
      evidence: {
        label: "Resumo visual do fechamento",
        status: "Entrega de turno",
      },
      focusChips: ["Passagem de turno", "Quebra", "Preparo de abertura"],
      id: "closing",
      items: [
        createChecklistItem({
          evidenceMode: "required",
          id: "closing-waste",
          label: "Consolidar sobras, quebra e perdas do turno",
          helper: "Separar sobra, perda e ponto de atencao antes de sair da area.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          evidenceMode: "optional",
          id: "closing-prep",
          label: "Preparar frente e apoio para a abertura seguinte",
          helper: "Deixar o essencial pronto reduz pressao na primeira hora da abertura.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
        createChecklistItem({
          evidenceMode: "none",
          id: "closing-handover",
          label: "Encerrar checklist final com observacoes do setor",
          helper: "Fechar contexto facilita a continuidade e reduz retrabalho.",
          pendingSync: false,
          shiftId: defaultShiftId,
          status: "pending",
        }),
      ],
      label: "Fechamento",
      note: "Fechamento forte nao e so limpar e sair: e transferir contexto, reduzir ruptura e proteger a abertura seguinte.",
      standardIds: ["standard_closing_handover"],
    },
  ];
}

function createDemoStandards(): OperationsQualityStandardPayload[] {
  return [
    {
      category: "Frescor",
      checkpoints: ["Cor viva", "Firmeza compativel", "Sem avarias expostas"],
      id: "standard_freshness_opening",
      instructions:
        "Compare cor, brilho e firmeza antes de manter o item na frente. O padrao deve ser legivel em segundos.",
      referenceLabel: "Frente premium pronta para abertura",
      relatedActionLabels: [
        "Conferir temperatura e umidade da parede fria",
        "Organizar frente premium com leitura limpa",
      ],
      title: "Folhas premium prontas para o inicio",
    },
    {
      category: "Reposicao",
      checkpoints: ["Sem vazios", "Fluxo livre", "Volume coerente"],
      id: "standard_replenishment_peak",
      instructions:
        "Repor sem bloquear circulacao, fechar ruptura e manter leitura comercial por familia e maturacao.",
      referenceLabel: "Ilha central reforcada sem ruir a leitura",
      relatedActionLabels: [
        "Repor berries e folhas de alto giro",
        "Eliminar vazios de banana, tomate e citricos",
      ],
      title: "Reposicao com leitura comercial",
    },
    {
      category: "Qualidade",
      checkpoints: ["Cor viva", "Triagem continua", "Escalonar desvio sensivel"],
      id: "standard_quality_review",
      instructions:
        "Frescor aparente e consistencia visual valem mais que volume bruto. Triagem precisa ser curta e rigorosa.",
      referenceLabel: "Tomate grape apos triagem aprovada",
      relatedActionLabels: [
        "Revisar maturacao de abacate, manga e tomate",
        "Conferir leitura da exposicao com referencia da lideranca",
      ],
      title: "Triagem visual de frutas sensiveis",
    },
    {
      category: "Higiene",
      checkpoints: ["Bancada seca", "Piso sem residuo", "Utensilios guardados"],
      id: "standard_cleaning_flow",
      instructions: "A limpeza deve proteger seguranca e frescor percebido sem travar a operacao.",
      referenceLabel: "Corredor seco e sinalizado",
      relatedActionLabels: [
        "Limpar bancada de corte e utensilios",
        "Trocar aparas e revisar piso do corredor",
      ],
      title: "Higiene da banca e fluxo",
    },
    {
      category: "Comunicacao",
      checkpoints: ["Preco legivel", "Origem visivel", "Promocao coerente"],
      id: "standard_labels_sell",
      instructions:
        "Etiqueta precisa informar rapido e sem atrito. Divergencia de preco ou origem gera ruido imediato.",
      referenceLabel: "Etiqueta destaque da semana",
      relatedActionLabels: [
        "Conferir etiqueta frontal da promocao",
        "Validar origem e lote legivel",
      ],
      title: "Etiquetas prontas para vender",
    },
    {
      category: "Passagem de turno",
      checkpoints: ["Quebra separada", "Area pronta", "Contexto registrado"],
      id: "standard_closing_handover",
      instructions:
        "Fechamento bom transfere contexto, reduz ruptura da abertura seguinte e deixa o setor legivel para o proximo time.",
      referenceLabel: "Resumo visual do fechamento",
      relatedActionLabels: [
        "Consolidar sobras, quebra e perdas do turno",
        "Encerrar checklist final com observacoes do setor",
      ],
      title: "Handover de fechamento FLV",
    },
  ];
}

function createChecklistItem(input: {
  readonly completedAt?: string;
  readonly completedByUserId?: string;
  readonly completedByUserName?: string;
  readonly evidenceMode: OperationsChecklistItemPayload["evidenceMode"];
  readonly evidencePhotoUrl?: string;
  readonly helper?: string;
  readonly id: string;
  readonly label: string;
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly shiftId?: string;
  readonly status: OperationsChecklistItemPayload["status"];
}): OperationsChecklistItemPayload {
  return {
    ...(input.completedAt === undefined ? {} : { completedAt: input.completedAt }),
    ...(input.completedByUserId === undefined
      ? {}
      : { completedByUserId: input.completedByUserId }),
    ...(input.completedByUserName === undefined
      ? {}
      : { completedByUserName: input.completedByUserName }),
    evidenceMode: input.evidenceMode,
    ...(input.evidencePhotoUrl === undefined ? {} : { evidencePhotoUrl: input.evidencePhotoUrl }),
    ...(input.helper === undefined ? {} : { helper: input.helper }),
    id: input.id,
    label: input.label,
    ...(input.note === undefined ? {} : { note: input.note }),
    pendingSync: input.pendingSync,
    ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
    status: input.status,
  };
}

function requiresIssueEvidence(category: string): boolean {
  const normalizedCategory = category.trim().toLowerCase();

  return (
    normalizedCategory === "avaria" ||
    normalizedCategory === "ruptura" ||
    normalizedCategory === "etiqueta"
  );
}

function normalizeIssueCategory(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory === "avaria") {
    return "Avaria de produto";
  }

  if (normalizedCategory === "bloqueio") {
    return "Bloqueio operacional";
  }

  if (normalizedCategory === "etiqueta") {
    return "Etiqueta divergente";
  }

  if (normalizedCategory === "perda") {
    return "Perda e quebra";
  }

  if (normalizedCategory === "ruptura") {
    return "Ruptura de exposicao";
  }

  return category.trim();
}

function buildOfflineIssueTimestamp(issues: readonly OperationsIssuePayload[]): string {
  const latestExistingTimestamp = issues.reduce((latest, issue) => {
    const parsedTimestamp = Date.parse(issue.createdAt);

    if (Number.isNaN(parsedTimestamp)) {
      return latest;
    }

    return Math.max(latest, parsedTimestamp);
  }, 0);
  const nextTimestamp = Math.max(Date.now(), latestExistingTimestamp + 1000);

  return new Date(nextTimestamp).toISOString();
}

function isCompletedChecklistItem(item: OperationsChecklistItemPayload): boolean {
  return item.status === "completed";
}

function clonePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonResponse<T>(data: T): Response {
  demoStore = {
    requestCounter: demoStore.requestCounter + 1,
    view: demoStore.view,
  };

  return new Response(
    JSON.stringify({
      data,
      requestId: `req_mobile_operations_${demoStore.requestCounter}`,
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
    requestCounter: demoStore.requestCounter + 1,
    view: demoStore.view,
  };

  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
      requestId: `req_mobile_operations_${demoStore.requestCounter}`,
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

function toErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "Nao foi possivel concluir a acao.";
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
