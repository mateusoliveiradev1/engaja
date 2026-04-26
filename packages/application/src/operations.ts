import type {
  ChecklistItemCompletion,
  ChecklistRun,
  CompletionStatus,
  DomainId,
  EvidenceRequirementMode,
  IssueSeverity,
  IssueStatus,
  OperationLearningBite,
  OperationRoutineId,
  OperationIssue,
  TenantScope,
} from "@engaja/domain";
import type { AuthorizationRequest, SecurityActor } from "@engaja/security";

import {
  createChecklistItemCompletion,
  createChecklistRun,
  createOperationIssue,
  createOperationLearningBite,
} from "@engaja/domain";
import { assertAuthorized } from "@engaja/security";

import type { ActorContext } from "./context.js";
import type { OperationsRepositoryPort } from "./ports.js";
import type { OperationsSummaryResult } from "./use-cases.js";

interface OperationChecklistDefinition {
  readonly evidenceLabel: string;
  readonly evidenceMode: EvidenceRequirementMode;
  readonly helper?: string;
  readonly id: string;
  readonly label: string;
  readonly standardId: DomainId<"quality-standard">;
}

interface OperationRoutineDefinition {
  readonly checklistTitle: string;
  readonly description: string;
  readonly focusChips: readonly string[];
  readonly id: OperationRoutineId;
  readonly items: readonly OperationChecklistDefinition[];
  readonly label: string;
  readonly note: string;
}

interface QualityStandardDefinition {
  readonly category: string;
  readonly checkpoints: readonly string[];
  readonly id: DomainId<"quality-standard">;
  readonly instructions: string;
  readonly referenceLabel: string;
  readonly relatedActionLabels: readonly string[];
  readonly title: string;
}

interface IssueCategoryDefinition {
  readonly evidenceMode: EvidenceRequirementMode;
  readonly label: string;
  readonly severityHint: IssueSeverity;
}

export interface OperationsChecklistItemResult {
  readonly completedAt?: Date;
  readonly completedByUserId?: DomainId<"user">;
  readonly completedByUserName?: string;
  readonly evidenceMode: EvidenceRequirementMode;
  readonly evidencePhotoUrl?: string;
  readonly helper?: string;
  readonly id: string;
  readonly label: string;
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly shiftId?: DomainId<"shift">;
  readonly status: CompletionStatus;
}

export interface OperationsRoutineResult {
  readonly checklistTitle: string;
  readonly description: string;
  readonly evidence: {
    readonly label: string;
    readonly status: string;
  };
  readonly focusChips: readonly string[];
  readonly id: OperationRoutineId;
  readonly items: readonly OperationsChecklistItemResult[];
  readonly label: string;
  readonly note: string;
  readonly standardIds: readonly DomainId<"quality-standard">[];
}

export interface OperationsQualityStandardResult {
  readonly category: string;
  readonly checkpoints: readonly string[];
  readonly id: DomainId<"quality-standard">;
  readonly instructions: string;
  readonly referenceLabel: string;
  readonly relatedActionLabels: readonly string[];
  readonly title: string;
}

export interface OperationsIssueResult {
  readonly category: string;
  readonly createdAt: Date;
  readonly evidencePhotoUrls: readonly string[];
  readonly id: DomainId<"issue">;
  readonly note?: string;
  readonly pendingSync: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly reportedByUserId?: DomainId<"user">;
  readonly reportedByUserName?: string;
  readonly severity: IssueSeverity;
  readonly shiftId?: DomainId<"shift">;
  readonly status: IssueStatus;
}

export interface OperationsLearningBiteResult {
  readonly completed: boolean;
  readonly completedAt?: Date;
  readonly completedByUserId?: DomainId<"user">;
  readonly completedByUserName?: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly feedPostId?: DomainId<"feed-post">;
  readonly id: DomainId<"learning-bite">;
  readonly missionTitle?: string;
  readonly pendingSync: boolean;
  readonly pointsAwarded?: number;
  readonly standardId?: DomainId<"quality-standard">;
  readonly title: string;
}

export interface OperationsShiftSummaryResult {
  readonly completedRoutineCount: number;
  readonly evidenceCount: number;
  readonly evidenceItems: readonly {
    readonly id: string;
    readonly label: string;
    readonly photoUrl?: string;
    readonly status: string;
  }[];
  readonly openIssueCount: number;
  readonly openIssues: readonly {
    readonly id: DomainId<"issue">;
    readonly label: string;
    readonly severity: IssueSeverity;
    readonly status: IssueStatus;
  }[];
  readonly overdueItemCount: number;
  readonly overdueItems: readonly string[];
  readonly pendingSyncCount: number;
  readonly shiftId?: DomainId<"shift">;
  readonly title: string;
  readonly wins: readonly string[];
}

export interface OperationsViewResult {
  readonly highlight: string;
  readonly issues: readonly OperationsIssueResult[];
  readonly learningBites: readonly OperationsLearningBiteResult[];
  readonly routines: readonly OperationsRoutineResult[];
  readonly shiftSummary: OperationsShiftSummaryResult;
  readonly standards: readonly OperationsQualityStandardResult[];
  readonly summary: OperationsSummaryResult;
}

export async function getOperationsView(input: {
  readonly actor: ActorContext;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly scope: TenantScope;
}): Promise<OperationsViewResult> {
  assertOperationsAuthorized(input.actor, {
    action: "operations.routine.read",
    resource: input.scope,
  });

  return readOperationsViewState(input.operationsRepository, input.scope);
}

export async function completeChecklistItem(input: {
  readonly actor: ActorContext;
  readonly evidencePhotoUrl?: string;
  readonly itemId: string;
  readonly note?: string;
  readonly now?: Date;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly pendingSync?: boolean;
  readonly routineId: OperationRoutineId;
  readonly scope: TenantScope;
  readonly shiftId?: DomainId<"shift">;
}): Promise<OperationsViewResult> {
  assertOperationsAuthorized(input.actor, {
    action: "operations.routine.complete",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const routineDefinition = requireRoutineDefinition(input.routineId);
  const itemDefinition =
    routineDefinition.items.find((item) => item.id === input.itemId) ??
    fail(`Unknown checklist item: ${input.itemId}.`);

  if (itemDefinition.evidenceMode === "required" && input.evidencePhotoUrl === undefined) {
    throw new Error("A foto de evidencia e obrigatoria para concluir esta acao.");
  }

  const now = input.now ?? new Date();
  const checklistRuns = await input.operationsRepository.listChecklistRuns(input.scope);
  const existingRun = checklistRuns.find((run) => run.routineId === input.routineId);
  const run =
    existingRun ??
    createChecklistRun({
      assignedUserId: input.actor.userId,
      dueAt: new Date(now.getTime() + 20 * 60 * 1000),
      id: `run_${input.routineId}`,
      pendingSync: input.pendingSync ?? false,
      routineId: input.routineId,
      scope: input.scope,
      ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
      status: "pending",
    });
  const currentCompletions = await input.operationsRepository.listChecklistItemCompletions(input.scope);
  const completionId = createChecklistItemCompletionId(run.id, itemDefinition.id);
  const savedCompletion = await input.operationsRepository.saveChecklistItemCompletion(
    createChecklistItemCompletion({
      completedAt: now,
      completedByUserId: input.actor.userId,
      evidenceMode: itemDefinition.evidenceMode,
      ...(input.evidencePhotoUrl === undefined ? {} : { evidencePhotoUrl: input.evidencePhotoUrl }),
      id: completionId,
      itemId: itemDefinition.id,
      ...(input.note === undefined ? {} : { note: input.note }),
      pendingSync: input.pendingSync ?? false,
      runId: run.id,
      scope: input.scope,
      ...(input.shiftId === undefined
        ? run.shiftId === undefined
          ? {}
          : { shiftId: run.shiftId }
        : { shiftId: input.shiftId }),
      status: "completed",
    }),
  );
  const completionsForRun = [
    ...currentCompletions.filter((completion) => completion.runId === run.id && completion.id !== completionId),
    savedCompletion,
  ];
  const requiredItemIds = routineDefinition.items.map((item) => item.id);
  const runPendingSync = completionsForRun.some((completion) => completion.pendingSync);
  const allItemsCompleted = requiredItemIds.every((itemId) =>
    completionsForRun.some(
      (completion) => completion.itemId === itemId && completion.status === "completed",
    ),
  );
  const updatedRun = createChecklistRun({
    ...(run.assignedUserId === undefined ? {} : { assignedUserId: run.assignedUserId }),
    ...(allItemsCompleted ? { completedAt: now } : {}),
    dueAt: run.dueAt,
    id: run.id,
    pendingSync: runPendingSync,
    routineId: run.routineId,
    scope: run.scope,
    ...(run.shiftId === undefined ? {} : { shiftId: run.shiftId }),
    status: allItemsCompleted
      ? "completed"
      : now.getTime() > run.dueAt.getTime()
        ? "overdue"
        : "pending",
  });

  await input.operationsRepository.saveChecklistRun(updatedRun);

  return readOperationsViewState(input.operationsRepository, input.scope);
}

export async function createOperationsIssue(input: {
  readonly actor: ActorContext;
  readonly category: string;
  readonly evidencePhotoUrls?: readonly string[];
  readonly note?: string;
  readonly now?: Date;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly pendingSync?: boolean;
  readonly productName?: string;
  readonly quantity?: number;
  readonly scope: TenantScope;
  readonly severity: IssueSeverity;
  readonly shiftId?: DomainId<"shift">;
}): Promise<OperationsViewResult> {
  assertOperationsAuthorized(input.actor, {
    action: "operations.issue.create",
    resource: input.scope,
  });

  const issueDefinition = resolveIssueCategory(input.category);

  if (
    issueDefinition.evidenceMode === "required" &&
    (input.evidencePhotoUrls === undefined || input.evidencePhotoUrls.length === 0)
  ) {
    throw new Error("A foto de evidencia e obrigatoria para este tipo de desvio.");
  }

  await input.operationsRepository.saveIssue(
    createOperationIssue({
      category: issueDefinition.label,
      createdAt: input.now ?? new Date(),
      ...(input.evidencePhotoUrls === undefined
        ? {}
        : { evidencePhotoUrls: input.evidencePhotoUrls }),
      id: createOperationsIssueId(input.actor.userId, input.now ?? new Date()),
      ...(input.note === undefined ? {} : { note: input.note }),
      pendingSync: input.pendingSync ?? false,
      ...(input.productName === undefined ? {} : { productName: input.productName }),
      ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
      reportedByUserId: input.actor.userId,
      scope: input.scope,
      severity: input.severity,
      ...(input.shiftId === undefined ? {} : { shiftId: input.shiftId }),
      status: "open",
    }),
  );

  return readOperationsViewState(input.operationsRepository, input.scope);
}

export async function completeLearningBite(input: {
  readonly actor: ActorContext;
  readonly learningBiteId: DomainId<"learning-bite">;
  readonly now?: Date;
  readonly operationsRepository: OperationsRepositoryPort;
  readonly pendingSync?: boolean;
  readonly scope: TenantScope;
}): Promise<OperationsViewResult> {
  assertOperationsAuthorized(input.actor, {
    action: "operations.routine.complete",
    resource: {
      ...input.scope,
      targetUserId: input.actor.userId,
    },
  });

  const learningBites = await input.operationsRepository.listLearningBites(input.scope);
  const bite =
    learningBites.find((currentBite) => currentBite.id === input.learningBiteId) ??
    fail(`Unknown learning bite: ${input.learningBiteId}.`);
  const completedAt = input.now ?? new Date();

  await input.operationsRepository.saveLearningBite(
    createOperationLearningBite({
      completedAt,
      completedByUserId: input.actor.userId,
      description: bite.description,
      durationMinutes: bite.durationMinutes,
      ...(bite.feedPostId === undefined ? {} : { feedPostId: bite.feedPostId }),
      id: bite.id,
      ...(bite.missionTitle === undefined ? {} : { missionTitle: bite.missionTitle }),
      pendingSync: input.pendingSync ?? false,
      ...(bite.pointsAwarded === undefined ? {} : { pointsAwarded: bite.pointsAwarded }),
      scope: bite.scope,
      ...(bite.standardId === undefined ? {} : { standardId: bite.standardId }),
      title: bite.title,
    }),
  );

  return readOperationsViewState(input.operationsRepository, input.scope);
}

const qualityStandards = [
  {
    category: "Frescor",
    checkpoints: ["Cor viva", "Firmeza compativel", "Sem avarias expostas"],
    id: "standard_freshness_opening" as DomainId<"quality-standard">,
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
    id: "standard_replenishment_peak" as DomainId<"quality-standard">,
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
    id: "standard_quality_review" as DomainId<"quality-standard">,
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
    id: "standard_cleaning_flow" as DomainId<"quality-standard">,
    instructions:
      "A limpeza deve proteger seguranca e frescor percebido sem travar a operacao.",
    referenceLabel: "Corredor seco e sinalizado",
    relatedActionLabels: [
      "Limpar bancada de corte e utensilios",
      "Trocar aparas e revisar piso do corredor",
    ],
    title: "Higiene de superficie e fluxo",
  },
  {
    category: "Comunicacao",
    checkpoints: ["Preco legivel", "Origem visivel", "Promocao coerente"],
    id: "standard_labels_sell" as DomainId<"quality-standard">,
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
    id: "standard_closing_handover" as DomainId<"quality-standard">,
    instructions:
      "Fechamento bom transfere contexto, reduz ruptura da abertura seguinte e deixa o setor legivel para o proximo time.",
    referenceLabel: "Resumo visual do fechamento",
    relatedActionLabels: [
      "Consolidar sobras, quebra e perdas do turno",
      "Encerrar checklist final com observacoes do setor",
    ],
    title: "Handover de fechamento FLV",
  },
] as const satisfies readonly QualityStandardDefinition[];

const routineDefinitions = [
  {
    checklistTitle: "Abertura do setor",
    description:
      "Primeira passada para deixar banca, parede fria e ilha central prontas antes do fluxo pesado.",
    focusChips: ["06:00-07:30", "Banca premium", "Parede fria"],
    id: "opening",
    items: [
      {
        evidenceLabel: "Painel frio no padrao",
        helper: "Garantir faixa segura e leitura estavel logo no inicio do turno.",
        id: "opening-temperature",
        label: "Conferir temperatura e umidade da parede fria",
        standardId: "standard_freshness_opening" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
      {
        evidenceLabel: "Foto da banca premium",
        helper: "Montar frente viva para folhas, ervas e mix de alto giro.",
        id: "opening-front",
        label: "Organizar frente premium com leitura limpa",
        standardId: "standard_freshness_opening" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Registro da quebra separada",
        helper: "Separar perda da madrugada antes da reposicao principal.",
        id: "opening-breakage",
        label: "Triar quebra e retirar item sem padrao",
        standardId: "standard_freshness_opening" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Corredor liberado",
        helper: "Confirmar piso, base e ilhas sem excesso de umidade.",
        id: "opening-cleanline",
        label: "Liberar corredor central para a abertura",
        standardId: "standard_cleaning_flow" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
    ],
    label: "Abertura",
    note:
      "A abertura precisa deixar o setor apresentavel e facil de ler em poucos segundos para cliente e lideranca.",
  },
  {
    checklistTitle: "Reposicao no pico",
    description:
      "Rotina de reposicao pensada para segurar giro alto sem perder leitura visual nem travar o corredor.",
    focusChips: ["Pico do almoco", "Ilha central", "Berry wall"],
    id: "replenishment",
    items: [
      {
        evidenceLabel: "Foto antes e depois da ilha",
        helper: "Priorizar ruptura visivel na frente da loja.",
        id: "replenishment-berries",
        label: "Repor berries e folhas de alto giro",
        standardId: "standard_replenishment_peak" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Ruptura eliminada",
        helper: "Fechar vazios sem misturar lote ou maturacao fora do padrao.",
        id: "replenishment-gaps",
        label: "Eliminar vazios de banana, tomate e citricos",
        standardId: "standard_replenishment_peak" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Apoio solicitado",
        helper: "Apoio rapido evita queda visual no segundo pico.",
        id: "replenishment-support",
        label: "Acionar reforco se a ruptura passar de 15 min",
        standardId: "standard_replenishment_peak" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
      {
        evidenceLabel: "Altura ajustada",
        helper: "Manter volume coerente sem bloquear a circulacao.",
        id: "replenishment-height",
        label: "Ajustar altura da ilha promocional",
        standardId: "standard_replenishment_peak" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
    ],
    label: "Reposicao",
    note:
      "Reposicao boa em FLV e quase invisivel para o cliente: fecha vazio, preserva a leitura e mantem o fluxo leve.",
  },
  {
    checklistTitle: "Revisao de qualidade",
    description:
      "Checagem curta e recorrente de frescor, maturacao e apresentacao para evitar desvio no horario mais sensivel.",
    focusChips: ["Maturacao", "Triagem", "Exposicao viva"],
    id: "quality-review",
    items: [
      {
        evidenceLabel: "Lote revisado",
        helper: "Olhar lote, firmeza e cor antes de manter o item na frente.",
        id: "quality-ripeness",
        label: "Revisar maturacao de abacate, manga e tomate",
        standardId: "standard_quality_review" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
      {
        evidenceLabel: "Foto de avaria separada",
        helper: "Produto amassado derruba a percepcao geral da banca.",
        id: "quality-damaged",
        label: "Retirar item avariado ou sem brilho",
        standardId: "standard_quality_review" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Comparativo com referencia",
        helper: "Comparar o resultado com o padrao visual esperado do setor.",
        id: "quality-reference",
        label: "Conferir leitura da exposicao com referencia da lideranca",
        standardId: "standard_quality_review" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Desvio escalado",
        helper: "Se o ajuste depender de decisao, deixar o contexto pronto para quem revisa.",
        id: "quality-escalation",
        label: "Sinalizar desvio de frescor que exige apoio",
        standardId: "standard_quality_review" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
    ],
    label: "Qualidade",
    note:
      "A revisao precisa ser simples, rapida e rigorosa: cliente percebe o setor primeiro pela qualidade aparente.",
  },
  {
    checklistTitle: "Limpeza operacional",
    description:
      "Higiene recorrente para manter piso, bancada e utensilios prontos sem transformar a rotina em tarefa invisivel.",
    focusChips: ["Piso", "Bancada", "Utensilios"],
    id: "cleaning",
    items: [
      {
        evidenceLabel: "Bancada limpa",
        helper: "Comecar pelos pontos mais visiveis e de maior risco.",
        id: "cleaning-bench",
        label: "Limpar bancada de corte e utensilios",
        standardId: "standard_cleaning_flow" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Piso sem residuos",
        helper: "Residuos pequenos comprometem seguranca e leitura de cuidado.",
        id: "cleaning-floor",
        label: "Trocar aparas e revisar piso do corredor",
        standardId: "standard_cleaning_flow" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Drenos revisados",
        helper: "Fechar pontos de umidade antes da troca de time.",
        id: "cleaning-drain",
        label: "Higienizar drenos e base das cubas",
        standardId: "standard_cleaning_flow" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
    ],
    label: "Limpeza",
    note:
      "Limpeza em FLV sustenta seguranca, frescor percebido e velocidade de operacao ao longo do dia inteiro.",
  },
  {
    checklistTitle: "Etiquetas e comunicacao",
    description:
      "Bloco rapido para manter preco, origem e destaque comercial legiveis em toda a banca.",
    focusChips: ["Promocao", "Origem", "Preco frontal"],
    id: "labels",
    items: [
      {
        evidenceLabel: "Promocao validada",
        helper: "Toda promocao precisa ficar entendivel sem esforco.",
        id: "labels-promo",
        label: "Conferir etiqueta frontal da promocao",
        standardId: "standard_labels_sell" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Preco corrigido",
        helper: "Preco trocado vira ruido operacional e reclamacao imediata.",
        id: "labels-price",
        label: "Corrigir preco divergente na banca de frutas",
        standardId: "standard_labels_sell" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Origem exposta",
        helper: "Origem e lote visiveis reforcam confianca e rastreabilidade.",
        id: "labels-origin",
        label: "Validar origem e lote legivel",
        standardId: "standard_labels_sell" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
    ],
    label: "Etiquetas",
    note:
      "Comunicacao bem resolvida protege venda, evita atrito no caixa e reduz duvida recorrente da equipe.",
  },
  {
    checklistTitle: "Fechamento do turno",
    description:
      "Ultimo bloco para consolidar pendencias, preparar o dia seguinte e deixar o setor legivel para a proxima equipe.",
    focusChips: ["Passagem de turno", "Quebra", "Preparo de abertura"],
    id: "closing",
    items: [
      {
        evidenceLabel: "Perda consolidada",
        helper: "Separar sobra, perda e ponto de atencao antes de sair da area.",
        id: "closing-waste",
        label: "Consolidar sobras, quebra e perdas do turno",
        standardId: "standard_closing_handover" as DomainId<"quality-standard">,
        evidenceMode: "required",
      },
      {
        evidenceLabel: "Apoio pronto para abertura",
        helper: "Deixar o essencial pronto reduz pressao na primeira hora da abertura.",
        id: "closing-prep",
        label: "Preparar frente e apoio para a abertura seguinte",
        standardId: "standard_closing_handover" as DomainId<"quality-standard">,
        evidenceMode: "optional",
      },
      {
        evidenceLabel: "Resumo do turno registrado",
        helper: "Fechar contexto facilita a continuidade e reduz retrabalho.",
        id: "closing-handover",
        label: "Encerrar checklist final com observacoes do setor",
        standardId: "standard_closing_handover" as DomainId<"quality-standard">,
        evidenceMode: "none",
      },
    ],
    label: "Fechamento",
    note:
      "Fechamento forte nao e so limpar e sair: e transferir contexto, reduzir ruptura e proteger a abertura seguinte.",
  },
] as const satisfies readonly OperationRoutineDefinition[];

const issueCategories = {
  avaria: {
    evidenceMode: "required",
    label: "Avaria de produto",
    severityHint: "high",
  },
  bloqueio: {
    evidenceMode: "optional",
    label: "Bloqueio operacional",
    severityHint: "medium",
  },
  etiqueta: {
    evidenceMode: "required",
    label: "Etiqueta divergente",
    severityHint: "medium",
  },
  perda: {
    evidenceMode: "optional",
    label: "Perda e quebra",
    severityHint: "medium",
  },
  ruptura: {
    evidenceMode: "required",
    label: "Ruptura de exposicao",
    severityHint: "high",
  },
} as const satisfies Readonly<Record<string, IssueCategoryDefinition>>;

async function readOperationsViewState(
  operationsRepository: OperationsRepositoryPort,
  scope: TenantScope,
): Promise<OperationsViewResult> {
  const [checklistRuns, checklistItemCompletions, issues, learningBites] = await Promise.all([
    operationsRepository.listChecklistRuns(scope),
    operationsRepository.listChecklistItemCompletions(scope),
    operationsRepository.listIssues(scope),
    operationsRepository.listLearningBites(scope),
  ]);

  const routines = buildRoutineResults(checklistRuns, checklistItemCompletions);
  const summary = summarizeOperationsState(routines, issues, learningBites);
  const shiftSummary = buildShiftSummary(routines, issues, learningBites, summary);

  return {
    highlight: buildOperationsHighlight(summary),
    issues: issues
      .map((issue) => ({
        category: issue.category,
        createdAt: issue.createdAt,
        evidencePhotoUrls: issue.evidencePhotoUrls,
        id: issue.id,
        ...(issue.note === undefined ? {} : { note: issue.note }),
        pendingSync: issue.pendingSync,
        ...(issue.productName === undefined ? {} : { productName: issue.productName }),
        ...(issue.quantity === undefined ? {} : { quantity: issue.quantity }),
        ...(issue.reportedByUserId === undefined ? {} : { reportedByUserId: issue.reportedByUserId }),
        ...(issue.reportedByUserId === undefined
          ? {}
          : { reportedByUserName: resolveUserName(issue.reportedByUserId) }),
        severity: issue.severity,
        ...(issue.shiftId === undefined ? {} : { shiftId: issue.shiftId }),
        status: issue.status,
      }))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    learningBites: learningBites
      .map((bite) => ({
        completed: bite.completedAt !== undefined,
        ...(bite.completedAt === undefined ? {} : { completedAt: bite.completedAt }),
        ...(bite.completedByUserId === undefined ? {} : { completedByUserId: bite.completedByUserId }),
        ...(bite.completedByUserId === undefined
          ? {}
          : { completedByUserName: resolveUserName(bite.completedByUserId) }),
        description: bite.description,
        durationMinutes: bite.durationMinutes,
        ...(bite.feedPostId === undefined ? {} : { feedPostId: bite.feedPostId }),
        id: bite.id,
        ...(bite.missionTitle === undefined ? {} : { missionTitle: bite.missionTitle }),
        pendingSync: bite.pendingSync,
        ...(bite.pointsAwarded === undefined ? {} : { pointsAwarded: bite.pointsAwarded }),
        ...(bite.standardId === undefined ? {} : { standardId: bite.standardId }),
        title: bite.title,
      }))
      .sort((left, right) => left.title.localeCompare(right.title, "pt-BR")),
    routines,
    shiftSummary,
    standards: qualityStandards,
    summary,
  };
}

function buildRoutineResults(
  checklistRuns: readonly ChecklistRun[],
  checklistItemCompletions: readonly ChecklistItemCompletion[],
): readonly OperationsRoutineResult[] {
  return routineDefinitions.map((routineDefinition) => {
    const run = checklistRuns.find((candidateRun) => candidateRun.routineId === routineDefinition.id);
    const items = routineDefinition.items.map((itemDefinition) => {
      const completion =
        run === undefined
          ? undefined
          : checklistItemCompletions.find(
              (candidateCompletion) =>
                candidateCompletion.runId === run.id && candidateCompletion.itemId === itemDefinition.id,
            );
      const itemStatus =
        completion?.status ??
        (run !== undefined && run.status === "overdue" ? "overdue" : "pending");

      return {
        ...(completion?.completedAt === undefined ? {} : { completedAt: completion.completedAt }),
        ...(completion?.completedByUserId === undefined
          ? {}
          : { completedByUserId: completion.completedByUserId }),
        ...(completion?.completedByUserId === undefined
          ? {}
          : { completedByUserName: resolveUserName(completion.completedByUserId) }),
        evidenceMode: itemDefinition.evidenceMode,
        ...(completion?.evidencePhotoUrl === undefined
          ? {}
          : { evidencePhotoUrl: completion.evidencePhotoUrl }),
        ...(itemDefinition.helper === undefined ? {} : { helper: itemDefinition.helper }),
        id: itemDefinition.id,
        label: itemDefinition.label,
        ...(completion?.note === undefined ? {} : { note: completion.note }),
        pendingSync: completion?.pendingSync ?? false,
        ...(completion?.shiftId === undefined ? {} : { shiftId: completion.shiftId }),
        status: itemStatus,
      } satisfies OperationsChecklistItemResult;
    });
    const evidenceItems = items.filter((item) => item.evidenceMode !== "none");
    const completedEvidenceCount = evidenceItems.filter(
      (item) => item.evidencePhotoUrl !== undefined,
    ).length;
    const requiredEvidencePendingCount = evidenceItems.filter(
      (item) => item.evidenceMode === "required" && item.evidencePhotoUrl === undefined,
    ).length;

    return {
      checklistTitle: routineDefinition.checklistTitle,
      description: routineDefinition.description,
      evidence: {
        label:
          evidenceItems[0]?.label ??
          routineDefinition.items[0]?.evidenceLabel ??
          "Evidencia da rotina",
        status:
          requiredEvidencePendingCount > 0
            ? `${requiredEvidencePendingCount} foto(s) obrigatoria(s) pendente(s)`
            : completedEvidenceCount > 0
              ? `${completedEvidenceCount} evidencia(s) registrada(s)`
              : "Sem evidencia registrada",
      },
      focusChips: routineDefinition.focusChips,
      id: routineDefinition.id,
      items,
      label: routineDefinition.label,
      note: routineDefinition.note,
      standardIds: [...new Set(routineDefinition.items.map((item) => item.standardId))],
    } satisfies OperationsRoutineResult;
  });
}

function summarizeOperationsState(
  routines: readonly OperationsRoutineResult[],
  issues: readonly OperationIssue[],
  learningBites: readonly OperationLearningBite[],
): OperationsSummaryResult {
  const completedRoutineCount = routines.filter((routine) =>
    routine.items.every((item) => item.status === "completed"),
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
  routines: readonly OperationsRoutineResult[],
  issues: readonly OperationIssue[],
  learningBites: readonly OperationLearningBite[],
  summary: OperationsSummaryResult,
): OperationsShiftSummaryResult {
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
        status: item.pendingSync ? "Aguardando sync" : "Registrada",
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
    routines
      .flatMap((routine) => routine.items)
      .find((item) => item.shiftId !== undefined)
      ?.shiftId ??
    issues.find((issue) => issue.shiftId !== undefined)?.shiftId;

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
  routines: readonly OperationsRoutineResult[],
  learningBites: readonly OperationLearningBite[],
  evidenceCount: number,
): readonly string[] {
  const wins: string[] = [];
  const completedRoutineLabels = routines
    .filter((routine) => routine.items.every((item) => item.status === "completed"))
    .map((routine) => routine.label);
  const completedLearningTitles = learningBites
    .filter((bite) => bite.completedAt !== undefined)
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

function buildOperationsHighlight(summary: OperationsSummaryResult): string {
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

function resolveIssueCategory(category: string): IssueCategoryDefinition {
  const normalizedCategory = category.trim().toLowerCase();

  return issueCategories[normalizedCategory as keyof typeof issueCategories] ?? {
    evidenceMode: "optional",
    label: category.trim(),
    severityHint: "medium",
  };
}

function requireRoutineDefinition(routineId: OperationRoutineId): OperationRoutineDefinition {
  return (
    routineDefinitions.find((routineDefinition) => routineDefinition.id === routineId) ??
    fail(`Unknown routine definition: ${routineId}.`)
  );
}

function resolveUserName(userId: DomainId<"user">): string {
  if (userId === "user_demo_colaborador") {
    return "Colaborador FLV";
  }

  if (userId === "user_demo_lider") {
    return "Lider FLV";
  }

  if (userId === "user_demo_gerente") {
    return "Gerente FLV";
  }

  if (userId === "user_demo_admin") {
    return "Admin Organizacao";
  }

  return "Equipe FLV";
}

function createChecklistItemCompletionId(
  runId: DomainId<"checklist-run">,
  itemId: string,
): string {
  return `${runId}:${itemId}`;
}

function createOperationsIssueId(userId: string, now: Date): string {
  return `issue_${userId}_${now.getTime()}`;
}

function assertOperationsAuthorized(actor: ActorContext, request: AuthorizationRequest): void {
  assertAuthorized(toSecurityActor(actor), request);
}

function toSecurityActor(actor: ActorContext): SecurityActor {
  return {
    ...(actor.additionalScopes === undefined ? {} : { additionalScopes: actor.additionalScopes }),
    role: actor.role,
    scope: actor.scope,
    userId: actor.userId,
  };
}

function fail(message: string): never {
  throw new Error(message);
}
