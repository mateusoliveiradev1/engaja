import type {
  AvailabilityPeriodPayload,
  CollaboratorScheduleViewPayload,
  DashboardContentTypePayload,
  DashboardSummaryPayload,
  EngagementArchiveItemStatusPayload,
  EngagementArchiveItemTypePayload,
  EngagementCampaignCreateRequestPayload,
  EngagementMetricTypePayload,
  EngagementRewardGrantStatusPayload,
  FeedHomePayload,
  FeedMissionLinkRequestPayload,
  FeedModerationActionPayload,
  FeedReactionTypePayload,
  FlvRole,
  LeaderSchedulePlannerPayload,
  OperationRoutineIdPayload,
  ScheduleCoverageAlertPayload,
  ScheduleNotificationPayload,
  SchedulePlannerIssuePayload,
  ScheduleRequestPayload,
  ScheduleShiftPayload,
} from "@engaja/contracts";
import type { Href } from "expo-router";
import type { ReactNode } from "react";

import { Redirect } from "expo-router";
import React, { startTransition, useCallback, useDeferredValue, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { flvPalette, flvSemanticColors, radiusScale, spacingScale } from "@engaja/ui";
import {
  Badge,
  Button,
  CampaignProgressCard,
  Card,
  ChecklistCard,
  Chip,
  CoverageDecisionCard,
  CoverageIndicator,
  EvidenceBlock,
  EmptyStateCard,
  EngajaWordmark,
  ErrorStateCard,
  FlvText,
  IconButton,
  InviteMemberRow,
  Input,
  MetricTile,
  OfflineStateCard,
  PostSkeleton,
  RequestStatusChip,
  RankingList,
  RecognitionCard,
  ScreenScaffold,
  SectionHeader,
  ShiftCard,
  ShiftSummaryCard,
  SuccessStateCard,
  Tabs,
  Toast,
  WeeklyTimeline,
} from "@engaja/ui/native";

import { getHomeHrefForSession } from "../navigation/routes.js";
import { feedListPerformanceProps } from "../performance/list-policy.js";
import {
  CollaboratorHomeChrome,
  LeaderHomeChrome,
  ProductAccessStateScreen,
  collaboratorTabOptions,
  leaderTabOptions,
  type CollaboratorTabId,
  type LeaderTabId,
  type ProductUserContextDescriptor,
} from "./product-shell.js";
import {
  acknowledgeAnnouncementInFeedHome,
  addCommentToFeedHome,
  countPendingFeedItems,
  createDefaultFeedComposerDraft,
  createDefaultFeedFeedbackDraft,
  createPendingFeedComment,
  createPendingFeedPost,
  mergeFeedHomePages,
  prependFeedPost,
  replaceFeedPost,
  toggleReactionInFeedHome,
  votePollInFeedHome,
} from "./feed-state.js";
import {
  CampaignHighlightsSection,
  FeedComposerCard,
  FeedPostCard,
  FeedSupportModules,
  LeaderModerationPanel,
} from "./feed-ui.js";
import { createLeaderDashboardService, type LeaderDashboardFilters } from "./dashboard-service.js";
import {
  createEngagementService,
  type CollaboratorAchievementArchive,
  type EngagementCampaignClosure,
  type EngagementCampaignView,
  type EngagementRewardGrant,
} from "./engagement-service.js";
import { createEngagementFeedService } from "./feed-service.js";
import {
  createOperationsService,
  type CollaboratorOperationsView,
  type OperationRoutineId,
} from "./operations-service.js";
import {
  createRecognitionService,
  type CollaboratorRecognitionProfile,
  type HealthyRecognitionRanking,
} from "./recognition-service.js";
import { createScheduleService } from "./schedule-service.js";
import { offlineCopy } from "./copy.js";
import { useOfflineStatus, useSession, type MobileSession } from "./providers.js";
import { TeamAccessPanel } from "./team-access.js";

export { InviteSignupScreen, SignInScreen } from "./auth-screens.js";

interface FeedToastState {
  readonly message: string;
  readonly title: string;
  readonly tone: "danger" | "info" | "success" | "warning";
}

type OperationsRoutineView = CollaboratorOperationsView["routines"][number];
type OperationsChecklistItemView = OperationsRoutineView["items"][number];
type OperationsIssueView = CollaboratorOperationsView["issues"][number];
type OperationsLearningBiteView = CollaboratorOperationsView["learningBites"][number];
type OperationsIssueSeverity = OperationsIssueView["severity"];
type AchievementArchiveItemView = CollaboratorAchievementArchive["items"][number];
type ActiveCampaignView = CollaboratorAchievementArchive["activeCampaigns"][number];

const operationsIssueCategoryOptions = [
  { id: "perda", label: "Perda" },
  { id: "avaria", label: "Avaria" },
  { id: "ruptura", label: "Ruptura" },
  { id: "etiqueta", label: "Etiqueta" },
  { id: "bloqueio", label: "Bloqueio" },
] as const;

const operationsSeverityOptions: readonly OperationsIssueSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export function RootRedirect(): ReactNode {
  const { session, sessionStatus } = useSession();

  if (sessionStatus === "restoring") {
    return (
      <ProductAccessStateScreen
        description="Estamos confirmando sua sessao salva e preparando a area certa para o seu perfil."
        isLoading
        title="Abrindo o Engaja"
      />
    );
  }

  return <Redirect href={getHomeHrefForSession(session) as Href} />;
}

export function CollaboratorHomeScreen(): ReactNode {
  const { logout, session } = useSession();
  const { isOffline } = useOfflineStatus();
  const [activeTab, setActiveTab] = useState<CollaboratorTabId>("feed");
  const deferredTab = useDeferredValue(activeTab);
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [feedHome, setFeedHome] = useState<FeedHomePayload | null>(null);
  const [feedError, setFeedError] = useState<string>();
  const [isLoadingFeed, setLoadingFeed] = useState(true);
  const [isRefreshingFeed, setRefreshingFeed] = useState(false);
  const [isLoadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [isSubmittingPost, setSubmittingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [composerDraft, setComposerDraft] = useState(createDefaultFeedComposerDraft());
  const [feedbackDraft, setFeedbackDraft] = useState(createDefaultFeedFeedbackDraft());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<FeedToastState>();
  const [scheduleView, setScheduleView] = useState<CollaboratorScheduleViewPayload | null>(null);
  const [scheduleError, setScheduleError] = useState<string>();
  const [isLoadingSchedule, setLoadingSchedule] = useState(true);
  const [isSubmittingScheduleAction, setSubmittingScheduleAction] = useState(false);
  const [operationsView, setOperationsView] = useState<CollaboratorOperationsView | null>(null);
  const [operationsError, setOperationsError] = useState<string>();
  const [isLoadingOperations, setLoadingOperations] = useState(true);
  const [isSubmittingOperationsAction, setSubmittingOperationsAction] = useState(false);
  const [achievementArchive, setAchievementArchive] =
    useState<CollaboratorAchievementArchive | null>(null);
  const [engagementError, setEngagementError] = useState<string>();
  const [isLoadingEngagement, setLoadingEngagement] = useState(true);
  const [recognitionProfile, setRecognitionProfile] =
    useState<CollaboratorRecognitionProfile | null>(null);
  const [recognitionRanking, setRecognitionRanking] = useState<HealthyRecognitionRanking | null>(
    null,
  );
  const [recognitionError, setRecognitionError] = useState<string>();
  const [isLoadingRecognition, setLoadingRecognition] = useState(true);
  const [isSubmittingRecognition, setSubmittingRecognition] = useState(false);

  useEffect(() => {
    if (session === null) {
      return;
    }

    const currentSession = session;
    let cancelled = false;

    async function loadFeed(): Promise<void> {
      try {
        setLoadingFeed(true);
        setFeedError(undefined);

        const home = await createEngagementFeedService(currentSession).getHome();

        if (!cancelled) {
          setFeedHome(home);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedError(toErrorMessage(error, "Nao foi possivel abrir o feed."));
        }
      } finally {
        if (!cancelled) {
          setLoadingFeed(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    session?.displayName,
    session?.role,
    session?.scope.departmentId,
    session?.scope.organizationId,
    session?.scope.storeId,
    session?.userId,
  ]);

  useEffect(() => {
    if (session === null) {
      return;
    }

    const currentSession = session;
    let cancelled = false;

    async function loadEngagement(): Promise<void> {
      try {
        setLoadingEngagement(true);
        setEngagementError(undefined);

        const archive = await createEngagementService(currentSession).getArchive();

        if (!cancelled) {
          setAchievementArchive(archive);
        }
      } catch (error) {
        if (!cancelled) {
          setEngagementError(
            toErrorMessage(error, "Nao foi possivel abrir o arquivo de conquistas."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEngagement(false);
        }
      }
    }

    void loadEngagement();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    session?.displayName,
    session?.role,
    session?.scope.departmentId,
    session?.scope.organizationId,
    session?.scope.storeId,
    session?.userId,
  ]);

  useEffect(() => {
    if (session === null) {
      return;
    }

    const currentSession = session;
    let cancelled = false;

    async function loadOperations(): Promise<void> {
      try {
        setLoadingOperations(true);
        setOperationsError(undefined);

        const view = await createOperationsService(currentSession).getCollaboratorView();

        if (!cancelled) {
          setOperationsView(view);
        }
      } catch (error) {
        if (!cancelled) {
          setOperationsError(toErrorMessage(error, "Nao foi possivel abrir as rotinas."));
        }
      } finally {
        if (!cancelled) {
          setLoadingOperations(false);
        }
      }
    }

    void loadOperations();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    session?.displayName,
    session?.role,
    session?.scope.departmentId,
    session?.scope.organizationId,
    session?.scope.storeId,
    session?.userId,
  ]);

  useEffect(() => {
    if (session === null) {
      return;
    }

    const currentSession = session;
    let cancelled = false;

    async function loadSchedule(): Promise<void> {
      try {
        setLoadingSchedule(true);
        setScheduleError(undefined);

        const view = await createScheduleService(currentSession).getCollaboratorView();

        if (!cancelled) {
          setScheduleView(view);
        }
      } catch (error) {
        if (!cancelled) {
          setScheduleError(toErrorMessage(error, "Nao foi possivel abrir a escala."));
        }
      } finally {
        if (!cancelled) {
          setLoadingSchedule(false);
        }
      }
    }

    void loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    session?.displayName,
    session?.role,
    session?.scope.departmentId,
    session?.scope.organizationId,
    session?.scope.storeId,
    session?.userId,
  ]);

  useEffect(() => {
    if (session === null) {
      return;
    }

    const currentSession = session;
    let cancelled = false;

    async function loadRecognition(): Promise<void> {
      try {
        setLoadingRecognition(true);
        setRecognitionError(undefined);

        const recognitionService = createRecognitionService(currentSession);
        const [profile, ranking] = await Promise.all([
          recognitionService.getProfile(),
          recognitionService.getRanking({
            limit: 5,
          }),
        ]);

        if (!cancelled) {
          setRecognitionProfile(profile);
          setRecognitionRanking(ranking);
        }
      } catch (error) {
        if (!cancelled) {
          setRecognitionError(toErrorMessage(error, "Nao foi possivel abrir os reconhecimentos."));
        }
      } finally {
        if (!cancelled) {
          setLoadingRecognition(false);
        }
      }
    }

    void loadRecognition();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    session?.displayName,
    session?.role,
    session?.scope.departmentId,
    session?.scope.organizationId,
    session?.scope.storeId,
    session?.userId,
  ]);

  const handleLogout = useCallback(async (): Promise<void> => {
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  }, [logout]);

  if (session === null) {
    return <Redirect href={"/(auth)/sign-in" as Href} />;
  }

  if (isLoggingOut) {
    return (
      <ProductAccessStateScreen
        description="Estamos encerrando este acesso no aparelho e voltando para a entrada segura."
        isLoading
        title="Saindo do Engaja"
      />
    );
  }

  const collaboratorTabs = [
    {
      badge:
        feedHome === null ? "..." : `${feedHome.posts.length + countPendingFeedItems(feedHome)}`,
      id: "feed",
      label: "Engajar",
    },
    { badge: buildCollaboratorScheduleBadge(scheduleView), id: "schedule", label: "Escala" },
    {
      badge: buildCollaboratorOperationsBadge(operationsView, isLoadingOperations),
      id: "operations",
      label: "Rotinas",
    },
    {
      badge: buildCollaboratorRecognitionBadge(recognitionProfile, isLoadingRecognition),
      id: "recognition",
      label: "Reconhecer",
    },
  ] as const;

  const pendingCount = feedHome === null ? 0 : countPendingFeedItems(feedHome);
  const userContext = buildProductUserContext(session);

  const handleRefreshFeed = async (): Promise<void> => {
    try {
      setRefreshingFeed(true);
      setFeedError(undefined);

      const home = await createEngagementFeedService(session).getHome();

      setFeedHome(home);
      void handleRefreshEngagement();
    } catch (error) {
      setFeedError(toErrorMessage(error, "Nao foi possivel atualizar o feed."));
    } finally {
      setRefreshingFeed(false);
    }
  };

  const handleRefreshSchedule = async (): Promise<void> => {
    try {
      setLoadingSchedule(true);
      setScheduleError(undefined);

      const view = await createScheduleService(session).getCollaboratorView();

      setScheduleView(view);
    } catch (error) {
      setScheduleError(toErrorMessage(error, "Nao foi possivel atualizar a escala."));
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleRefreshOperations = async (): Promise<void> => {
    try {
      setLoadingOperations(true);
      setOperationsError(undefined);

      const view = await createOperationsService(session).getCollaboratorView();

      setOperationsView(view);
    } catch (error) {
      setOperationsError(toErrorMessage(error, "Nao foi possivel atualizar as rotinas."));
    } finally {
      setLoadingOperations(false);
    }
  };

  const handleRefreshEngagement = async (): Promise<void> => {
    try {
      setLoadingEngagement(true);
      setEngagementError(undefined);

      const archive = await createEngagementService(session).getArchive();

      setAchievementArchive(archive);
    } catch (error) {
      setEngagementError(
        toErrorMessage(error, "Nao foi possivel atualizar o arquivo de conquistas."),
      );
    } finally {
      setLoadingEngagement(false);
    }
  };

  const handleRefreshRecognition = async (): Promise<void> => {
    try {
      setLoadingRecognition(true);
      setRecognitionError(undefined);

      const recognitionService = createRecognitionService(session);
      const [profile, ranking] = await Promise.all([
        recognitionService.getProfile(),
        recognitionService.getRanking({
          limit: 5,
        }),
      ]);

      setRecognitionProfile(profile);
      setRecognitionRanking(ranking);
      void handleRefreshEngagement();
    } catch (error) {
      setRecognitionError(toErrorMessage(error, "Nao foi possivel atualizar os reconhecimentos."));
    } finally {
      setLoadingRecognition(false);
    }
  };

  const handleOpenAchievementArchive = (): void => {
    startTransition(() => setActiveTab("recognition"));
  };

  const handleSendPeerRecognition = async (): Promise<void> => {
    try {
      setSubmittingRecognition(true);

      const result = await createRecognitionService(session).sendRecognition({
        category: "teamwork",
        message: "Apoio no pico e reposicao com leitura limpa para o time.",
        recipientUserId:
          recognitionRanking?.entries.find((entry) => entry.userId !== session.userId)?.userId ??
          "user_demo_colaborador_2",
      });

      await handleRefreshRecognition();
      setToast({
        message: `Reconhecimento enviado com +${result.ledgerEntry?.amount ?? 0} pts elegiveis.`,
        title: "Reconhecimento enviado",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel enviar este reconhecimento."),
        title: "Falha no reconhecimento",
        tone: "danger",
      });
    } finally {
      setSubmittingRecognition(false);
    }
  };

  const handleLoadMoreFeed = async (): Promise<void> => {
    if (feedHome?.nextCursor === undefined || isLoadingMoreFeed) {
      return;
    }

    try {
      setLoadingMoreFeed(true);

      const nextPage = await createEngagementFeedService(session).getHome({
        cursor: feedHome.nextCursor,
      });

      setFeedHome((currentHome) =>
        currentHome === null ? nextPage : mergeFeedHomePages([currentHome, nextPage]),
      );
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel carregar a proxima pagina."),
        title: "Feed incompleto",
        tone: "warning",
      });
    } finally {
      setLoadingMoreFeed(false);
    }
  };

  const handleCreatePost = async (): Promise<void> => {
    if (composerDraft.title.trim().length === 0 || composerDraft.caption.trim().length === 0) {
      setToast({
        message: "Titulo e legenda sao obrigatorios para registrar uma foto do setor.",
        title: "Complete o post",
        tone: "warning",
      });
      return;
    }

    if (isOffline) {
      const pendingPost = createPendingFeedPost(session, composerDraft);

      setFeedHome((currentHome) =>
        prependFeedPost(currentHome ?? createEmptyFeedHome(), pendingPost),
      );
      setComposerDraft(createDefaultFeedComposerDraft());
      setUploadProgress(0);
      setToast({
        message: offlineCopy.postQueued,
        title: "Post salvo offline",
        tone: "warning",
      });
      return;
    }

    try {
      setSubmittingPost(true);
      setUploadProgress(24);
      await pause(90);
      setUploadProgress(68);

      const createdPost = await createEngagementFeedService(session).createPost({
        authorName: session.displayName,
        caption: composerDraft.caption.trim(),
        category: composerDraft.category,
        ...(toMissionLinkRequest(composerDraft) === undefined
          ? {}
          : { missionLink: toMissionLinkRequest(composerDraft) }),
        photoUrl: createComposerPhotoUrl(session, composerDraft.source),
        scope: session.scope,
        title: composerDraft.title.trim(),
        visibility: composerDraft.visibility,
      });

      setUploadProgress(100);
      setFeedHome((currentHome) =>
        prependFeedPost(currentHome ?? createEmptyFeedHome(), createdPost),
      );
      setComposerDraft(createDefaultFeedComposerDraft());
      setToast({
        message:
          createdPost.status === "pending_moderation"
            ? "O registro foi enviado com foto e entrou na fila de moderacao."
            : "O registro foi publicado e ja aparece no mural da equipe.",
        title: "Post criado",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel publicar este post."),
        title: "Falha no envio",
        tone: "danger",
      });
    } finally {
      setSubmittingPost(false);
      setUploadProgress(0);
    }
  };

  const handleToggleReaction = async (
    postId: string,
    reactionType: FeedReactionTypePayload,
  ): Promise<void> => {
    setFeedHome((currentHome) =>
      currentHome === null
        ? currentHome
        : toggleReactionInFeedHome(currentHome, postId, reactionType),
    );

    if (isOffline) {
      setToast({
        message: offlineCopy.reactionQueued,
        title: "Reacao em fila",
        tone: "warning",
      });
      return;
    }

    try {
      const updatedPost = await createEngagementFeedService(session).toggleReaction({
        postId,
        type: reactionType,
      });

      setFeedHome((currentHome) =>
        currentHome === null ? currentHome : replaceFeedPost(currentHome, updatedPost),
      );
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel registrar a reacao."),
        title: "Falha na reacao",
        tone: "danger",
      });
      await handleRefreshFeed();
    }
  };

  const handleSubmitComment = async (postId: string): Promise<void> => {
    const commentBody = commentDrafts[postId]?.trim() ?? "";

    if (commentBody.length === 0) {
      return;
    }

    if (isOffline) {
      const pendingComment = createPendingFeedComment(session, commentBody);

      setFeedHome((currentHome) =>
        currentHome === null
          ? currentHome
          : addCommentToFeedHome(currentHome, postId, pendingComment),
      );
      setCommentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [postId]: "",
      }));
      setToast({
        message: offlineCopy.commentQueued,
        title: "Comentario em fila",
        tone: "warning",
      });
      return;
    }

    try {
      const updatedPost = await createEngagementFeedService(session).addComment({
        authorName: session.displayName,
        body: commentBody,
        postId,
      });

      setFeedHome((currentHome) =>
        currentHome === null ? currentHome : replaceFeedPost(currentHome, updatedPost),
      );
      setCommentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [postId]: "",
      }));
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel enviar o comentario."),
        title: "Falha no comentario",
        tone: "danger",
      });
    }
  };

  const handleAcknowledgeAnnouncement = async (announcementId: string): Promise<void> => {
    setFeedHome((currentHome) =>
      currentHome === null
        ? currentHome
        : acknowledgeAnnouncementInFeedHome(currentHome, announcementId),
    );

    if (isOffline) {
      setToast({
        message: offlineCopy.announcementQueued,
        title: "Leitura em fila",
        tone: "warning",
      });
      return;
    }

    try {
      const announcement =
        await createEngagementFeedService(session).acknowledgeAnnouncement(announcementId);

      setFeedHome((currentHome) =>
        currentHome === null
          ? currentHome
          : {
              ...currentHome,
              announcements: currentHome.announcements.map((currentAnnouncement) =>
                currentAnnouncement.id === announcement.id ? announcement : currentAnnouncement,
              ),
            },
      );
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel registrar a leitura do anuncio."),
        title: "Falha no anuncio",
        tone: "danger",
      });
      await handleRefreshFeed();
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string): Promise<void> => {
    setFeedHome((currentHome) =>
      currentHome === null ? currentHome : votePollInFeedHome(currentHome, pollId, optionId),
    );

    if (isOffline) {
      setToast({
        message: offlineCopy.voteQueued,
        title: "Voto em fila",
        tone: "warning",
      });
      return;
    }

    try {
      const poll = await createEngagementFeedService(session).votePoll({
        optionId,
        pollId,
      });

      setFeedHome((currentHome) =>
        currentHome === null
          ? currentHome
          : {
              ...currentHome,
              polls: currentHome.polls.map((currentPoll) =>
                currentPoll.id === poll.id ? poll : currentPoll,
              ),
            },
      );
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel registrar o voto."),
        title: "Falha na votacao",
        tone: "danger",
      });
      await handleRefreshFeed();
    }
  };

  const handleSubmitFeedback = async (): Promise<void> => {
    if (feedbackDraft.message.trim().length === 0) {
      setToast({
        message: "Descreva o bloqueio ou a ideia para a lideranca entender o contexto.",
        title: "Feedback vazio",
        tone: "warning",
      });
      return;
    }

    if (isOffline) {
      setFeedHome((currentHome) =>
        currentHome === null
          ? currentHome
          : {
              ...currentHome,
              feedbackInboxCount: currentHome.feedbackInboxCount + 1,
            },
      );
      setFeedbackDraft(createDefaultFeedFeedbackDraft());
      setToast({
        message: offlineCopy.feedbackQueued,
        title: "Feedback em fila",
        tone: "warning",
      });
      return;
    }

    try {
      await createEngagementFeedService(session).submitFeedback({
        category: feedbackDraft.category,
        message: feedbackDraft.message.trim(),
        scope: session.scope,
      });
      setFeedHome((currentHome) =>
        currentHome === null
          ? currentHome
          : {
              ...currentHome,
              feedbackInboxCount: currentHome.feedbackInboxCount + 1,
            },
      );
      setFeedbackDraft(createDefaultFeedFeedbackDraft());
      setToast({
        message: "O relato foi entregue para a lideranca sem aparecer no mural.",
        title: "Feedback privado enviado",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel enviar o feedback privado."),
        title: "Falha no feedback",
        tone: "danger",
      });
    }
  };

  const handleScheduleAction = async (
    action: () => Promise<void>,
    messages: {
      readonly failureTitle: string;
      readonly successMessage: string;
      readonly successTitle: string;
    },
  ): Promise<void> => {
    try {
      setSubmittingScheduleAction(true);
      await action();
      await handleRefreshSchedule();
      setToast({
        message: messages.successMessage,
        title: messages.successTitle,
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel atualizar a escala."),
        title: messages.failureTitle,
        tone: "danger",
      });
    } finally {
      setSubmittingScheduleAction(false);
    }
  };

  const handleSubmitAvailability = async (): Promise<void> => {
    const requestWindow = createSuggestedAvailabilityRequest(scheduleView);

    await handleScheduleAction(
      async () => {
        await createScheduleService(session).submitAvailability(requestWindow);
      },
      {
        failureTitle: "Falha na disponibilidade",
        successMessage: "A disponibilidade foi enviada para revisao da lideranca.",
        successTitle: "Disponibilidade registrada",
      },
    );
  };

  const handleSubmitTimeOff = async (): Promise<void> => {
    const requestWindow = createSuggestedTimeOffRequest(scheduleView);

    await handleScheduleAction(
      async () => {
        await createScheduleService(session).submitTimeOff(requestWindow);
      },
      {
        failureTitle: "Falha no pedido de folga",
        successMessage: "O pedido de folga entrou na fila de aprovacao do setor.",
        successTitle: "Folga solicitada",
      },
    );
  };

  const handleProposeShiftSwap = async (): Promise<void> => {
    const scheduleService = createScheduleService(session);
    const candidate = scheduleService.getSuggestedSwapCandidate(session.userId);

    if (candidate === undefined) {
      setToast({
        message: "Nao encontramos um turno compativel para propor troca agora.",
        title: "Sem candidato para troca",
        tone: "warning",
      });
      return;
    }

    await handleScheduleAction(
      async () => {
        await scheduleService.proposeSwap({
          note: `Topo trocar ${candidate.sourceShiftLabel} por ${candidate.targetShiftLabel}.`,
          sourceShiftId: candidate.sourceShiftId,
          targetShiftId: candidate.targetShiftId,
          targetUserId: candidate.targetUserId,
        });
      },
      {
        failureTitle: "Falha na troca",
        successMessage: `A proposta foi enviada para ${candidate.targetUserName} e aguarda resposta.`,
        successTitle: "Troca proposta",
      },
    );
  };

  const handleRespondToSwap = async (
    requestId: string,
    response: "accept" | "reject",
  ): Promise<void> => {
    await handleScheduleAction(
      async () => {
        await createScheduleService(session).respondToSwap({
          requestId,
          response,
        });
      },
      {
        failureTitle: "Falha na resposta",
        successMessage:
          response === "accept"
            ? "A troca foi aceita e seguiu para aprovacao da lideranca."
            : "A proposta de troca foi recusada e a escala atual segue valendo.",
        successTitle: response === "accept" ? "Troca aceita" : "Troca recusada",
      },
    );
  };

  const handleOperationsAction = async (
    action: () => Promise<CollaboratorOperationsView>,
    messages: {
      readonly failureTitle: string;
      readonly offlineMessage: string;
      readonly offlineTitle: string;
      readonly successMessage: string;
      readonly successTitle: string;
    },
  ): Promise<void> => {
    try {
      setSubmittingOperationsAction(true);
      setOperationsError(undefined);

      const nextView = await action();

      setOperationsView(nextView);
      setToast({
        message: isOffline ? messages.offlineMessage : messages.successMessage,
        title: isOffline ? messages.offlineTitle : messages.successTitle,
        tone: isOffline ? "warning" : "success",
      });
    } catch (error) {
      const message = toErrorMessage(error, "Nao foi possivel atualizar as rotinas.");

      setOperationsError(message);
      setToast({
        message,
        title: messages.failureTitle,
        tone: "danger",
      });
    } finally {
      setSubmittingOperationsAction(false);
    }
  };

  const handleCompleteChecklistItem = async (input: {
    readonly evidencePhotoUrl?: string;
    readonly item: OperationsChecklistItemView;
    readonly note?: string;
    readonly routineId: OperationRoutineId;
  }): Promise<void> => {
    const note = input.note?.trim();
    const evidencePhotoUrl = input.evidencePhotoUrl?.trim();

    if (
      input.item.evidenceMode === "required" &&
      (evidencePhotoUrl === undefined || evidencePhotoUrl.length === 0)
    ) {
      setToast({
        message: "Esta acao exige uma foto de evidencia para concluir o checklist.",
        title: "Evidencia obrigatoria",
        tone: "warning",
      });
      return;
    }

    await handleOperationsAction(
      () =>
        createOperationsService(session).completeChecklistItem({
          ...(evidencePhotoUrl === undefined || evidencePhotoUrl.length === 0
            ? {}
            : { evidencePhotoUrl }),
          itemId: input.item.id,
          ...(note === undefined || note.length === 0 ? {} : { note }),
          pendingSync: isOffline,
          routineId: input.routineId,
          ...(input.item.shiftId === undefined ? {} : { shiftId: input.item.shiftId }),
        }),
      {
        failureTitle: "Falha no checklist",
        offlineMessage: offlineCopy.routineItemQueued,
        offlineTitle: "Checklist salvo offline",
        successMessage:
          "O item entrou no resumo do turno com responsavel, horario e contexto do turno.",
        successTitle: "Checklist atualizado",
      },
    );
  };

  const handleCreateOperationsIssue = async (input: {
    readonly category: string;
    readonly evidenceUrl?: string;
    readonly note?: string;
    readonly productName?: string;
    readonly quantity?: number;
    readonly severity: OperationsIssueSeverity;
  }): Promise<void> => {
    const note = input.note?.trim();
    const productName = input.productName?.trim();
    const evidenceUrl = input.evidenceUrl?.trim();

    if (
      operationIssueRequiresEvidence(input.category) &&
      (evidenceUrl === undefined || evidenceUrl.length === 0)
    ) {
      setToast({
        message: "Esse tipo de desvio pede foto de evidencia para apoiar a lideranca.",
        title: "Foto obrigatoria",
        tone: "warning",
      });
      return;
    }

    await handleOperationsAction(
      () =>
        createOperationsService(session).createIssue({
          category: input.category,
          ...(evidenceUrl === undefined || evidenceUrl.length === 0
            ? {}
            : { evidencePhotoUrls: [evidenceUrl] }),
          ...(note === undefined || note.length === 0 ? {} : { note }),
          pendingSync: isOffline,
          ...(productName === undefined || productName.length === 0 ? {} : { productName }),
          ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
          severity: input.severity,
          ...(operationsView?.shiftSummary.shiftId === undefined
            ? {}
            : { shiftId: operationsView.shiftSummary.shiftId }),
        }),
      {
        failureTitle: "Falha ao registrar desvio",
        offlineMessage: "O desvio foi salvo no aparelho e segue no radar ate ser enviado.",
        offlineTitle: "Desvio salvo offline",
        successMessage: "O desvio ja aparece no resumo operacional da lideranca.",
        successTitle: "Desvio registrado",
      },
    );
  };

  const handleCompleteLearningBite = async (bite: OperationsLearningBiteView): Promise<void> => {
    if (bite.completed) {
      setToast({
        message: "Este aprendizado ja foi concluido e segue disponivel para consulta.",
        title: "Aprendizado ja concluido",
        tone: "info",
      });
      return;
    }

    await handleOperationsAction(
      () =>
        createOperationsService(session).completeLearningBite({
          learningBiteId: bite.id,
          pendingSync: isOffline,
        }),
      {
        failureTitle: "Falha no aprendizado",
        offlineMessage: offlineCopy.learningQueued,
        offlineTitle: "Aprendizado salvo offline",
        successMessage: "O card foi concluido e o turno ganhou mais contexto operacional.",
        successTitle: "Aprendizado concluido",
      },
    );
  };

  if (deferredTab === "feed") {
    return (
      <CollaboratorFeedScreen
        activeTab={activeTab}
        achievementArchive={achievementArchive}
        commentDrafts={commentDrafts}
        composerDraft={composerDraft}
        engagementError={engagementError}
        feedError={feedError}
        feedHome={feedHome}
        feedbackDraft={feedbackDraft}
        isLoadingFeed={isLoadingFeed}
        isLoadingEngagement={isLoadingEngagement}
        isLoadingMoreFeed={isLoadingMoreFeed}
        isOffline={isOffline}
        isRefreshingFeed={isRefreshingFeed}
        isSubmittingPost={isSubmittingPost}
        onAnnouncementRead={handleAcknowledgeAnnouncement}
        onCommentChange={(postId, value) =>
          setCommentDrafts((currentDrafts) => ({
            ...currentDrafts,
            [postId]: value,
          }))
        }
        onCommentSubmit={handleSubmitComment}
        onComposerChange={setComposerDraft}
        onCreatePost={handleCreatePost}
        onFeedbackChange={setFeedbackDraft}
        onFeedbackSubmit={handleSubmitFeedback}
        onLoadMore={handleLoadMoreFeed}
        onLogout={handleLogout}
        onOpenAchievementArchive={handleOpenAchievementArchive}
        onReactionPress={handleToggleReaction}
        onRefresh={handleRefreshFeed}
        onTabChange={(nextTabId) =>
          startTransition(() => setActiveTab(nextTabId as CollaboratorTabId))
        }
        onVotePoll={handleVotePoll}
        operationsMetricValue={buildCollaboratorOperationsBadge(
          operationsView,
          isLoadingOperations,
        )}
        pendingCount={pendingCount}
        scheduleMetricValue={buildCollaboratorMetricValue(scheduleView)}
        session={session}
        tabs={collaboratorTabs}
        toast={toast}
        uploadProgress={uploadProgress}
        userContext={userContext}
      />
    );
  }

  return (
    <ScreenScaffold
      eyebrow={isOffline ? "Modo offline" : "Hoje no FLV"}
      subtitle="Fotos do turno, escala da equipe e rotinas essenciais em uma interface mais calorosa e menos generica."
      title="Minha rotina"
      topAction={
        <View style={styles.inlineActions}>
          <IconButton
            accessibilityLabel="Abrir arquivo de conquistas"
            icon="ME"
            onPress={handleOpenAchievementArchive}
          />
          <IconButton
            accessibilityLabel="Sair do Engaja"
            icon="OFF"
            onPress={() => {
              void handleLogout();
            }}
          />
        </View>
      }
    >
      <CollaboratorHomeChrome
        activeTab={activeTab}
        isOffline={isOffline}
        onTabChange={(nextTabId) =>
          startTransition(() => setActiveTab(nextTabId as CollaboratorTabId))
        }
        operationsMetricValue={buildCollaboratorOperationsBadge(
          operationsView,
          isLoadingOperations,
        )}
        pendingCount={pendingCount}
        postCount={feedHome?.posts.length ?? 0}
        scheduleMetricValue={buildCollaboratorMetricValue(scheduleView)}
        tabs={collaboratorTabs}
        userContext={userContext}
      />

      {deferredTab === "schedule" ? (
        <CollaboratorSchedulePanel
          isLoadingSchedule={isLoadingSchedule}
          isSubmittingAction={isSubmittingScheduleAction}
          onProposeSwap={handleProposeShiftSwap}
          onRefresh={handleRefreshSchedule}
          onRespondToSwap={handleRespondToSwap}
          onSubmitAvailability={handleSubmitAvailability}
          onSubmitTimeOff={handleSubmitTimeOff}
          scheduleError={scheduleError}
          scheduleView={scheduleView}
          session={session}
        />
      ) : null}
      {deferredTab === "operations" ? (
        <CollaboratorOperationsPanel
          isLoadingOperations={isLoadingOperations}
          isOffline={isOffline}
          isSubmittingAction={isSubmittingOperationsAction}
          onCompleteChecklistItem={handleCompleteChecklistItem}
          onCompleteLearningBite={handleCompleteLearningBite}
          onCreateIssue={handleCreateOperationsIssue}
          onRefresh={handleRefreshOperations}
          operationsError={operationsError}
          operationsView={operationsView}
          scheduleView={scheduleView}
        />
      ) : null}
      {deferredTab === "recognition" ? (
        <CollaboratorRecognitionPanel
          achievementArchive={achievementArchive}
          engagementError={engagementError}
          isLoadingEngagement={isLoadingEngagement}
          isLoadingRecognition={isLoadingRecognition}
          isSubmittingRecognition={isSubmittingRecognition}
          onRefreshArchive={handleRefreshEngagement}
          onRefresh={handleRefreshRecognition}
          onSendPeerRecognition={handleSendPeerRecognition}
          recognitionError={recognitionError}
          recognitionProfile={recognitionProfile}
          recognitionRanking={recognitionRanking}
          session={session}
        />
      ) : null}

      <Card tone="muted">
        <FlvText tone="accent" variant="eyebrow">
          Padrao visual do setor
        </FlvText>
        <FlvText tone="muted">
          Fotos, evidencias e prioridades aparecem sempre perto da acao do turno.
        </FlvText>
      </Card>

      {toast === undefined ? null : (
        <Toast message={toast.message} title={toast.title} tone={toast.tone} />
      )}
    </ScreenScaffold>
  );
}

export function LeaderHomeScreen(): ReactNode {
  const { logout, session } = useSession();
  const { isOffline } = useOfflineStatus();

  if (session === null) {
    return <Redirect href={"/(auth)/sign-in" as Href} />;
  }

  if (!isLeaderRole(session.role)) {
    return <Redirect href={"/(collaborator)" as Href} />;
  }

  return <LeaderHomeAuthenticated isOffline={isOffline} logout={logout} session={session} />;
}

function LeaderHomeAuthenticated({
  isOffline,
  logout,
  session: effectiveSession,
}: {
  readonly isOffline: boolean;
  readonly logout: () => Promise<void>;
  readonly session: MobileSession;
}): ReactNode {
  const [inviteCount, setInviteCount] = useState(0);
  const [activeTab, setActiveTab] = useState<LeaderTabId>("overview");
  const deferredTab = useDeferredValue(activeTab);
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<LeaderDashboardFilters>({});
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryPayload | null>(null);
  const [dashboardError, setDashboardError] = useState<string>();
  const [isLoadingDashboard, setLoadingDashboard] = useState(true);
  const [campaignViews, setCampaignViews] = useState<readonly EngagementCampaignView[] | null>(
    null,
  );
  const [campaignClosures, setCampaignClosures] = useState<
    Record<string, EngagementCampaignClosure>
  >({});
  const [campaignError, setCampaignError] = useState<string>();
  const [isLoadingCampaigns, setLoadingCampaigns] = useState(true);
  const [isSubmittingCampaignAction, setSubmittingCampaignAction] = useState(false);
  const [feedHome, setFeedHome] = useState<FeedHomePayload | null>(null);
  const [isLoadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string>();
  const [moderatingPostId, setModeratingPostId] = useState<string>();
  const [toast, setToast] = useState<FeedToastState>();
  const [planner, setPlanner] = useState<LeaderSchedulePlannerPayload | null>(null);
  const [plannerError, setPlannerError] = useState<string>();
  const [isLoadingPlanner, setLoadingPlanner] = useState(true);
  const [isSubmittingPlannerAction, setSubmittingPlannerAction] = useState(false);
  const [leaderOperationsView, setLeaderOperationsView] =
    useState<CollaboratorOperationsView | null>(null);
  const [leaderOperationsError, setLeaderOperationsError] = useState<string>();
  const [isLoadingLeaderOperations, setLoadingLeaderOperations] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(): Promise<void> {
      try {
        setLoadingDashboard(true);
        setDashboardError(undefined);

        const summary =
          await createLeaderDashboardService(effectiveSession).getSummary(dashboardFilters);

        if (!cancelled) {
          setDashboardSummary(summary);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(toErrorMessage(error, "Nao foi possivel abrir o painel da lideranca."));
        }
      } finally {
        if (!cancelled) {
          setLoadingDashboard(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    dashboardFilters.contentType,
    dashboardFilters.endsAt,
    dashboardFilters.routineCategory,
    dashboardFilters.shiftId,
    dashboardFilters.startsAt,
    dashboardFilters.storeId,
    dashboardFilters.teamMemberId,
    effectiveSession.accessToken,
    effectiveSession.displayName,
    effectiveSession.role,
    effectiveSession.scope.departmentId,
    effectiveSession.scope.organizationId,
    effectiveSession.scope.storeId,
    effectiveSession.userId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns(): Promise<void> {
      try {
        setLoadingCampaigns(true);
        setCampaignError(undefined);

        const nextCampaignViews = await createEngagementService(effectiveSession).listCampaigns();

        if (!cancelled) {
          setCampaignViews(nextCampaignViews);
        }
      } catch (error) {
        if (!cancelled) {
          setCampaignError(toErrorMessage(error, "Nao foi possivel abrir as campanhas."));
        }
      } finally {
        if (!cancelled) {
          setLoadingCampaigns(false);
        }
      }
    }

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveSession.accessToken,
    effectiveSession.displayName,
    effectiveSession.role,
    effectiveSession.scope.departmentId,
    effectiveSession.scope.organizationId,
    effectiveSession.scope.storeId,
    effectiveSession.userId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed(): Promise<void> {
      try {
        setLoadingFeed(true);
        setFeedError(undefined);

        const home = await createEngagementFeedService(effectiveSession).getHome();

        if (!cancelled) {
          setFeedHome(home);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedError(toErrorMessage(error, "Nao foi possivel abrir a fila de moderacao."));
        }
      } finally {
        if (!cancelled) {
          setLoadingFeed(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveSession.accessToken,
    effectiveSession.displayName,
    effectiveSession.role,
    effectiveSession.scope.departmentId,
    effectiveSession.scope.organizationId,
    effectiveSession.scope.storeId,
    effectiveSession.userId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlanner(): Promise<void> {
      try {
        setLoadingPlanner(true);
        setPlannerError(undefined);

        const nextPlanner = await createScheduleService(effectiveSession).getLeaderPlanner();

        if (!cancelled) {
          setPlanner(nextPlanner);
        }
      } catch (error) {
        if (!cancelled) {
          setPlannerError(toErrorMessage(error, "Nao foi possivel abrir o planner da escala."));
        }
      } finally {
        if (!cancelled) {
          setLoadingPlanner(false);
        }
      }
    }

    void loadPlanner();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveSession.accessToken,
    effectiveSession.displayName,
    effectiveSession.role,
    effectiveSession.scope.departmentId,
    effectiveSession.scope.organizationId,
    effectiveSession.scope.storeId,
    effectiveSession.userId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadOperations(): Promise<void> {
      try {
        setLoadingLeaderOperations(true);
        setLeaderOperationsError(undefined);

        const nextOperationsView =
          await createOperationsService(effectiveSession).getCollaboratorView();

        if (!cancelled) {
          setLeaderOperationsView(nextOperationsView);
        }
      } catch (error) {
        if (!cancelled) {
          setLeaderOperationsError(
            toErrorMessage(error, "Nao foi possivel abrir o resumo operacional."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLeaderOperations(false);
        }
      }
    }

    void loadOperations();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveSession.accessToken,
    effectiveSession.displayName,
    effectiveSession.role,
    effectiveSession.scope.departmentId,
    effectiveSession.scope.organizationId,
    effectiveSession.scope.storeId,
    effectiveSession.userId,
  ]);

  const leaderTabs = [
    {
      badge: dashboardSummary === null ? "..." : `${dashboardSummary.attentionAreaCount}`,
      id: "overview",
      label: "Painel",
    },
    {
      badge:
        campaignViews === null
          ? "..."
          : `${campaignViews.filter((campaignView) => campaignView.campaign.status === "active").length}`,
      id: "campaigns",
      label: "Campanhas",
    },
    {
      badge: `${feedHome?.posts.filter((post) => post.status === "pending_moderation").length ?? 0}`,
      id: "moderation",
      label: "Moderacao",
    },
    { badge: `${countCriticalCoverageAlerts(planner)}`, id: "coverage", label: "Escala" },
    { badge: `${inviteCount}`, id: "team", label: "Time" },
  ] as const;

  const handleRefreshDashboard = async (): Promise<void> => {
    try {
      setLoadingDashboard(true);
      setDashboardError(undefined);

      const summary =
        await createLeaderDashboardService(effectiveSession).getSummary(dashboardFilters);

      setDashboardSummary(summary);
    } catch (error) {
      setDashboardError(toErrorMessage(error, "Nao foi possivel atualizar o painel."));
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleDashboardContentTypeFilter = (contentType: DashboardContentTypePayload): void => {
    setDashboardFilters((currentFilters) => ({
      ...withoutFilterKey(currentFilters, "contentType"),
      ...(currentFilters.contentType === contentType ? {} : { contentType }),
    }));
  };

  const handleDashboardRoutineFilter = (routineCategory: OperationRoutineIdPayload): void => {
    setDashboardFilters((currentFilters) => ({
      ...withoutFilterKey(currentFilters, "routineCategory"),
      ...(currentFilters.routineCategory === routineCategory ? {} : { routineCategory }),
    }));
  };

  const handleDashboardMemberFilter = (teamMemberId: string): void => {
    setDashboardFilters((currentFilters) => ({
      ...withoutFilterKey(currentFilters, "teamMemberId"),
      ...(currentFilters.teamMemberId === teamMemberId ? {} : { teamMemberId }),
    }));
  };

  const handleRefreshCampaigns = async (): Promise<void> => {
    try {
      setLoadingCampaigns(true);
      setCampaignError(undefined);

      const nextCampaignViews = await createEngagementService(effectiveSession).listCampaigns();

      setCampaignViews(nextCampaignViews);
    } catch (error) {
      setCampaignError(toErrorMessage(error, "Nao foi possivel atualizar as campanhas."));
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleRefreshFeed = async (): Promise<void> => {
    try {
      setLoadingFeed(true);
      setFeedError(undefined);

      const home = await createEngagementFeedService(effectiveSession).getHome();

      setFeedHome(home);
    } catch (error) {
      setFeedError(toErrorMessage(error, "Nao foi possivel atualizar a fila de moderacao."));
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleCreateCampaign = async (
    input: EngagementCampaignCreateRequestPayload,
  ): Promise<void> => {
    try {
      setSubmittingCampaignAction(true);

      await createEngagementService(effectiveSession).createCampaign(input);
      await handleRefreshCampaigns();
      startTransition(() => setActiveTab("campaigns"));
      setToast({
        message: "A campanha ficou pronta com regras, premio e area da equipe alinhados.",
        title: "Campanha criada",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel criar esta campanha."),
        title: "Falha na campanha",
        tone: "danger",
      });
    } finally {
      setSubmittingCampaignAction(false);
    }
  };

  const handleCloseCampaign = async (campaignId: string): Promise<void> => {
    try {
      setSubmittingCampaignAction(true);

      const closure = await createEngagementService(effectiveSession).closeCampaign({
        campaignId,
      });

      setCampaignClosures((currentClosures) => ({
        ...currentClosures,
        [campaignId]: closure,
      }));
      await handleRefreshCampaigns();
      startTransition(() => setActiveTab("campaigns"));
      setToast({
        message: "O fechamento registrou vencedores, historico e status de premio para revisao.",
        title: "Campanha encerrada",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel fechar a campanha."),
        title: "Falha no fechamento",
        tone: "danger",
      });
    } finally {
      setSubmittingCampaignAction(false);
    }
  };

  const handleUpdateRewardGrantStatus = async (
    rewardGrantId: string,
    status: "approved-for-fulfillment" | "fulfilled" | "canceled",
  ): Promise<void> => {
    try {
      setSubmittingCampaignAction(true);

      const updatedGrant = await createEngagementService(effectiveSession).updateRewardGrantStatus({
        rewardGrantId,
        status,
      });

      setCampaignClosures((currentClosures) =>
        Object.fromEntries(
          Object.entries(currentClosures).map(([campaignId, closure]) => [
            campaignId,
            applyRewardGrantUpdateToClosure(closure, updatedGrant),
          ]),
        ),
      );
      await handleRefreshCampaigns();
      setToast({
        message: `O premio manual foi movido para ${formatRewardGrantStatus(status).toLowerCase()}.`,
        title: "Status atualizado",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel atualizar o status do premio."),
        title: "Falha no premio",
        tone: "danger",
      });
    } finally {
      setSubmittingCampaignAction(false);
    }
  };

  const handleModerationAction = async (
    postId: string,
    action: FeedModerationActionPayload,
  ): Promise<void> => {
    try {
      setModeratingPostId(postId);
      const updatedPost = await createEngagementFeedService(effectiveSession).moderatePost({
        action,
        postId,
      });

      setFeedHome((currentHome) =>
        currentHome === null ? currentHome : replaceFeedPost(currentHome, updatedPost),
      );
      const recognitionResult =
        action === "approve" && updatedPost.missionLink?.recognitionEligible === true
          ? await createRecognitionService(effectiveSession).recognizeFeedPost({
              message: `Post aprovado e reconhecido: ${updatedPost.title}.`,
              postId: updatedPost.id,
            })
          : undefined;

      setToast({
        message:
          recognitionResult === undefined
            ? `${formatModerationAction(action)} aplicada ao post e refletida na fila visual.`
            : `${formatModerationAction(action)} aplicada e gerou +${recognitionResult.ledgerEntry?.amount ?? 0} pts de reconhecimento.`,
        title: "Moderacao concluida",
        tone: "success",
      });
      void handleRefreshCampaigns();
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel concluir a acao de moderacao."),
        title: "Falha na moderacao",
        tone: "danger",
      });
    } finally {
      setModeratingPostId(undefined);
    }
  };

  const handleRefreshPlanner = async (): Promise<void> => {
    try {
      setLoadingPlanner(true);
      setPlannerError(undefined);

      const nextPlanner = await createScheduleService(effectiveSession).getLeaderPlanner();

      setPlanner(nextPlanner);
    } catch (error) {
      setPlannerError(toErrorMessage(error, "Nao foi possivel atualizar o planner."));
    } finally {
      setLoadingPlanner(false);
    }
  };

  const handleRefreshLeaderOperations = async (): Promise<void> => {
    try {
      setLoadingLeaderOperations(true);
      setLeaderOperationsError(undefined);

      const nextOperationsView =
        await createOperationsService(effectiveSession).getCollaboratorView();

      setLeaderOperationsView(nextOperationsView);
    } catch (error) {
      setLeaderOperationsError(
        toErrorMessage(error, "Nao foi possivel atualizar o resumo operacional."),
      );
    } finally {
      setLoadingLeaderOperations(false);
    }
  };

  const handleRefreshLeaderSummary = async (): Promise<void> => {
    await Promise.all([
      handleRefreshDashboard(),
      handleRefreshPlanner(),
      handleRefreshLeaderOperations(),
    ]);
  };

  const handlePlannerAction = async (
    action: () => Promise<void>,
    messages: {
      readonly failureTitle: string;
      readonly successMessage: string;
      readonly successTitle: string;
    },
  ): Promise<void> => {
    try {
      setSubmittingPlannerAction(true);
      await action();
      await handleRefreshPlanner();
      setToast({
        message: messages.successMessage,
        title: messages.successTitle,
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel atualizar o planner."),
        title: messages.failureTitle,
        tone: "danger",
      });
    } finally {
      setSubmittingPlannerAction(false);
    }
  };

  const handleCreateDraftShift = async (): Promise<void> => {
    const draftInput = createSuggestedShiftDraft(planner);

    await handlePlannerAction(
      async () => {
        await createScheduleService(effectiveSession).upsertShift(draftInput);
      },
      {
        failureTitle: "Falha ao criar rascunho",
        successMessage: `O turno ${draftInput.title} entrou como rascunho para ajuste fino da lideranca.`,
        successTitle: "Rascunho criado",
      },
    );
  };

  const handleAdjustDraftShift = async (): Promise<void> => {
    const editableShift = selectEditableShift(planner);

    if (editableShift === undefined) {
      setToast({
        message: "Nao ha rascunho aberto agora. Crie um novo reforco primeiro.",
        title: "Sem rascunho para ajustar",
        tone: "warning",
      });
      return;
    }

    const adjustedShift = createAdjustedShiftDraft(editableShift);

    await handlePlannerAction(
      async () => {
        await createScheduleService(effectiveSession).upsertShift(adjustedShift);
      },
      {
        failureTitle: "Falha no ajuste",
        successMessage: `O turno ${editableShift.title} foi ajustado e continua como rascunho.`,
        successTitle: "Rascunho atualizado",
      },
    );
  };

  const handlePublishSchedule = async (): Promise<void> => {
    const draftShiftIds = planner?.shifts
      .filter((shift) => shift.status === "draft")
      .map((shift) => shift.id);

    if (draftShiftIds === undefined || draftShiftIds.length === 0) {
      setToast({
        message: "Nao ha rascunhos pendentes para publicar nesta semana.",
        title: "Nada para publicar",
        tone: "warning",
      });
      return;
    }

    try {
      setSubmittingPlannerAction(true);
      const publishResult = await createScheduleService(effectiveSession).publishSchedule({
        shiftIds: draftShiftIds,
      });

      await handleRefreshPlanner();
      setToast({
        message: `${publishResult.publishedCount} turno(s) publicados com ${publishResult.notificationCount} notificacao(oes) disparada(s).`,
        title: "Escala publicada",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: toErrorMessage(error, "Nao foi possivel publicar os rascunhos."),
        title: "Falha na publicacao",
        tone: "danger",
      });
    } finally {
      setSubmittingPlannerAction(false);
    }
  };

  const handleReviewRequest = async (
    requestId: string,
    decision: "approve" | "reject",
  ): Promise<void> => {
    await handlePlannerAction(
      async () => {
        await createScheduleService(effectiveSession).reviewRequest({
          decision,
          requestId,
        });
      },
      {
        failureTitle: "Falha na revisao",
        successMessage:
          decision === "approve"
            ? "O pedido foi aprovado e a pessoa ja recebeu o retorno."
            : "O pedido foi rejeitado e a pessoa ja recebeu o retorno.",
        successTitle: decision === "approve" ? "Pedido aprovado" : "Pedido rejeitado",
      },
    );
  };

  const handleApproveSwap = async (requestId: string): Promise<void> => {
    await handlePlannerAction(
      async () => {
        await createScheduleService(effectiveSession).approveSwap({
          requestId,
        });
      },
      {
        failureTitle: "Falha na aprovacao",
        successMessage: "A troca foi aprovada e os turnos envolvidos foram atualizados.",
        successTitle: "Troca aprovada",
      },
    );
  };

  const userContext = buildProductUserContext(effectiveSession);

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  if (isLoggingOut) {
    return (
      <ProductAccessStateScreen
        description="Estamos encerrando este acesso de lideranca e limpando o caminho para uma nova entrada."
        isLoading
        title="Saindo do Engaja"
      />
    );
  }

  return (
    <ScreenScaffold
      eyebrow="Lideranca FLV"
      subtitle="Comando visual do setor com moderacao, cobertura e leitura operacional na mesma linguagem de produto."
      title="Comando do setor"
      topAction={
        <View style={styles.inlineActions}>
          <Button
            fullWidth={false}
            icon="+"
            label="Nova campanha"
            onPress={() => {
              startTransition(() => setActiveTab("campaigns"));
            }}
            tone="accent"
          />
          <IconButton
            accessibilityLabel="Sair do Engaja"
            icon="OFF"
            onPress={() => {
              void handleLogout();
            }}
          />
        </View>
      }
    >
      <LeaderHomeChrome
        activeTab={activeTab}
        isOffline={isOffline}
        metrics={selectLeaderOverviewMetrics(dashboardSummary, feedHome, planner)}
        onTabChange={(nextTabId) => startTransition(() => setActiveTab(nextTabId as LeaderTabId))}
        tabs={leaderTabs}
        userContext={userContext}
      />

      {deferredTab === "overview" ? (
        <LeaderDashboardOverviewPanel
          dashboardError={dashboardError}
          dashboardSummary={dashboardSummary}
          feedHome={feedHome}
          inviteCount={inviteCount}
          isLoadingDashboard={isLoadingDashboard}
          onOpenTab={(nextTabId) => startTransition(() => setActiveTab(nextTabId))}
          onContentTypeFilter={handleDashboardContentTypeFilter}
          onRefresh={handleRefreshDashboard}
          onRoutineFilter={handleDashboardRoutineFilter}
          operationsView={leaderOperationsView}
          planner={planner}
        />
      ) : null}
      {deferredTab === "campaigns" ? (
        <LeaderCampaignsPanel
          campaignClosures={campaignClosures}
          campaignError={campaignError}
          campaignViews={campaignViews}
          isLoadingCampaigns={isLoadingCampaigns}
          isSubmittingAction={isSubmittingCampaignAction}
          onCloseCampaign={handleCloseCampaign}
          onCreateCampaign={handleCreateCampaign}
          onRefresh={handleRefreshCampaigns}
          onUpdateRewardGrantStatus={handleUpdateRewardGrantStatus}
          planner={planner}
          session={effectiveSession}
        />
      ) : null}
      {deferredTab === "moderation" ? (
        <LeaderModerationPanel
          feedError={feedError}
          feedHome={feedHome}
          isLoadingFeed={isLoadingFeed}
          onModerationAction={handleModerationAction}
          onRefresh={handleRefreshFeed}
          submittingPostId={moderatingPostId}
        />
      ) : null}
      {deferredTab === "coverage" ? (
        <LeaderCoveragePanel
          isLoadingPlanner={isLoadingPlanner}
          isSubmittingAction={isSubmittingPlannerAction}
          onAdjustDraftShift={handleAdjustDraftShift}
          onApproveSwap={handleApproveSwap}
          onCreateDraftShift={handleCreateDraftShift}
          onPublishSchedule={handlePublishSchedule}
          onRefresh={handleRefreshPlanner}
          onReviewRequest={handleReviewRequest}
          planner={planner}
          plannerError={plannerError}
        />
      ) : null}
      {deferredTab === "team" ? (
        <LeaderTeamPanel
          dashboardError={dashboardError}
          dashboardSummary={dashboardSummary}
          isLoadingDashboard={isLoadingDashboard}
          isLoadingOperations={isLoadingLeaderOperations}
          onMemberFilter={handleDashboardMemberFilter}
          onRefresh={handleRefreshLeaderSummary}
          operationsError={leaderOperationsError}
          operationsView={leaderOperationsView}
          planner={planner}
          plannerError={plannerError}
          session={effectiveSession}
          onInviteCountChange={setInviteCount}
        />
      ) : null}

      {toast === undefined ? null : (
        <Toast message={toast.message} title={toast.title} tone={toast.tone} />
      )}
    </ScreenScaffold>
  );
}

function CollaboratorFeedScreen(props: {
  readonly activeTab: CollaboratorTabId;
  readonly achievementArchive: CollaboratorAchievementArchive | null;
  readonly commentDrafts: Readonly<Record<string, string>>;
  readonly composerDraft: ReturnType<typeof createDefaultFeedComposerDraft>;
  readonly engagementError: string | undefined;
  readonly feedError: string | undefined;
  readonly feedHome: FeedHomePayload | null;
  readonly feedbackDraft: ReturnType<typeof createDefaultFeedFeedbackDraft>;
  readonly isLoadingFeed: boolean;
  readonly isLoadingEngagement: boolean;
  readonly isLoadingMoreFeed: boolean;
  readonly isOffline: boolean;
  readonly isRefreshingFeed: boolean;
  readonly isSubmittingPost: boolean;
  readonly onAnnouncementRead: (announcementId: string) => Promise<void>;
  readonly onCommentChange: (postId: string, value: string) => void;
  readonly onCommentSubmit: (postId: string) => Promise<void>;
  readonly onComposerChange: (draft: ReturnType<typeof createDefaultFeedComposerDraft>) => void;
  readonly onCreatePost: () => Promise<void>;
  readonly onFeedbackChange: (draft: ReturnType<typeof createDefaultFeedFeedbackDraft>) => void;
  readonly onFeedbackSubmit: () => Promise<void>;
  readonly onLoadMore: () => Promise<void>;
  readonly onLogout: () => Promise<void>;
  readonly onOpenAchievementArchive: () => void;
  readonly onReactionPress: (
    postId: string,
    reactionType: FeedReactionTypePayload,
  ) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly onTabChange: (nextTabId: string) => void;
  readonly onVotePoll: (pollId: string, optionId: string) => Promise<void>;
  readonly operationsMetricValue: string;
  readonly pendingCount: number;
  readonly scheduleMetricValue: string;
  readonly session: MobileSession;
  readonly tabs: readonly {
    readonly badge: string;
    readonly id: string;
    readonly label: string;
  }[];
  readonly toast: FeedToastState | undefined;
  readonly uploadProgress: number;
  readonly userContext: ProductUserContextDescriptor;
}): ReactNode {
  const [isComposerExpanded, setComposerExpanded] = useState(false);
  const feedPosts = props.feedHome?.posts ?? [];
  const renderFeedPost = useCallback(
    ({ item }: { readonly item: FeedHomePayload["posts"][number] }) => (
      <FeedPostCard
        commentDraft={props.commentDrafts[item.id] ?? ""}
        onCommentChange={(value) => props.onCommentChange(item.id, value)}
        onCommentSubmit={() => props.onCommentSubmit(item.id)}
        onReactionPress={(reactionType) => props.onReactionPress(item.id, reactionType)}
        post={item}
        session={props.session}
      />
    ),
    [
      props.commentDrafts,
      props.onCommentChange,
      props.onCommentSubmit,
      props.onReactionPress,
      props.session,
    ],
  );

  return (
    <View style={styles.feedScreen}>
      <View style={styles.backgroundBand} />
      <View style={styles.backgroundAccentRail} />
      <View style={styles.backgroundSignalBand} />
      <FlatList
        {...feedListPerformanceProps}
        contentContainerStyle={styles.feedListContent}
        data={feedPosts}
        keyExtractor={(post) => post.id}
        ListEmptyComponent={
          props.isLoadingFeed ? (
            <View style={styles.sectionStack}>
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : props.feedError !== undefined ? (
            <ErrorStateCard
              actionLabel="Atualizar feed"
              description="A lista nao carregou, mas o restante da tela continua util."
              onActionPress={() => {
                void props.onRefresh();
              }}
              title={props.feedError}
            />
          ) : (
            <EmptyStateCard
              actionLabel="Publicar primeira foto"
              description="Quando o setor ainda nao publicou nada, o composer continua sendo o principal convite para agir."
              onActionPress={() => setComposerExpanded(true)}
              title="Nenhum post visivel por enquanto"
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footerStack}>
            {props.feedHome?.nextCursor !== undefined ? (
              <Button
                disabled={props.isLoadingMoreFeed}
                label={props.isLoadingMoreFeed ? "Carregando..." : "Carregar mais"}
                onPress={() => {
                  void props.onLoadMore();
                }}
                tone="secondary"
              />
            ) : null}
            {props.pendingCount > 0 ? (
              <Card tone="muted">
                <FlvText tone="accent" variant="eyebrow">
                  Itens pendentes
                </FlvText>
                <FlvText tone="muted">
                  {props.pendingCount} item(ns) aguardando envio entre posts e comentarios.
                </FlvText>
              </Card>
            ) : null}
            <FeedSupportModules
              achievementArchive={props.achievementArchive}
              announcements={props.feedHome?.announcements ?? []}
              engagementError={props.engagementError}
              feedbackDraft={props.feedbackDraft}
              feedbackInboxCount={props.feedHome?.feedbackInboxCount ?? 0}
              isLoadingEngagement={props.isLoadingEngagement}
              onAcknowledge={props.onAnnouncementRead}
              onFeedbackChange={props.onFeedbackChange}
              onFeedbackSubmit={props.onFeedbackSubmit}
              onOpenAchievementArchive={props.onOpenAchievementArchive}
              onVotePoll={props.onVotePoll}
              polls={props.feedHome?.polls ?? []}
            />
            {props.isOffline && props.feedHome !== null ? <OfflineStateCard /> : null}
          </View>
        }
        ListHeaderComponent={
          <View style={styles.sectionStack}>
            <View style={styles.screenHeader}>
              <View style={styles.screenHeaderCopy}>
                <EngajaWordmark compact />
                <FlvText tone="accent" variant="eyebrow">
                  {props.isOffline ? "Modo offline" : "Hoje no FLV"}
                </FlvText>
                <FlvText accessibilityRole="header" variant="headline">
                  Feed do FLV
                </FlvText>
                <FlvText style={styles.screenSubtitle} tone="muted">
                  Fotos do turno, comentarios e sinais importantes em uma timeline do setor.
                </FlvText>
              </View>
              <View style={styles.inlineActions}>
                <IconButton
                  accessibilityLabel="Abrir arquivo de conquistas"
                  icon="ME"
                  onPress={props.onOpenAchievementArchive}
                />
                <IconButton
                  accessibilityLabel="Sair do Engaja"
                  icon="OFF"
                  onPress={() => {
                    void props.onLogout();
                  }}
                />
              </View>
            </View>

            <CollaboratorHomeChrome
              activeTab={props.activeTab}
              isOffline={props.isOffline}
              onTabChange={props.onTabChange}
              operationsMetricValue={props.operationsMetricValue}
              pendingCount={props.pendingCount}
              postCount={props.feedHome?.posts.length ?? 0}
              scheduleMetricValue={props.scheduleMetricValue}
              tabs={props.tabs}
              userContext={props.userContext}
            />

            <FeedComposerCard
              draft={props.composerDraft}
              expanded={isComposerExpanded}
              isSubmitting={props.isSubmittingPost}
              onChange={props.onComposerChange}
              onExpandedChange={setComposerExpanded}
              onSubmit={props.onCreatePost}
              session={props.session}
              uploadProgress={props.uploadProgress}
            />

            {props.toast === undefined ? null : (
              <Toast
                message={props.toast.message}
                title={props.toast.title}
                tone={props.toast.tone}
              />
            )}

            {props.isOffline && props.feedHome === null ? <OfflineStateCard /> : null}
          </View>
        }
        onEndReached={() => {
          void props.onLoadMore();
        }}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void props.onRefresh();
            }}
            refreshing={props.isRefreshingFeed}
            tintColor={flvPalette.leaf}
          />
        }
        renderItem={renderFeedPost}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function LeaderDashboardOverviewPanel(props: {
  readonly dashboardError: string | undefined;
  readonly dashboardSummary: DashboardSummaryPayload | null;
  readonly feedHome: FeedHomePayload | null;
  readonly inviteCount: number;
  readonly isLoadingDashboard: boolean;
  readonly onContentTypeFilter: (contentType: DashboardContentTypePayload) => void;
  readonly onOpenTab: (tabId: LeaderTabId) => void;
  readonly onRefresh: () => Promise<void>;
  readonly onRoutineFilter: (routineCategory: OperationRoutineIdPayload) => void;
  readonly operationsView: CollaboratorOperationsView | null;
  readonly planner: LeaderSchedulePlannerPayload | null;
}): ReactNode {
  if (props.isLoadingDashboard && props.dashboardSummary === null) {
    return (
      <View style={styles.sectionStack}>
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Painel da lideranca
          </FlvText>
          <FlvText variant="headline">Consolidando feed, escala e rotinas</FlvText>
          <FlvText tone="muted">
            A leitura do periodo esta sincronizando as filas que exigem decisao.
          </FlvText>
        </Card>
        <PostSkeleton />
      </View>
    );
  }

  if (props.dashboardError !== undefined && props.dashboardSummary === null) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar painel"
        description="A leitura de lideranca falhou sem bloquear as outras telas do app."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title={props.dashboardError}
      />
    );
  }

  if (props.dashboardSummary === null) {
    return (
      <EmptyStateCard
        actionLabel="Atualizar painel"
        description="Quando o consolidado chegar, ele aparece com prioridades, filtros e filas do periodo."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title="Painel ainda sem consolidado"
      />
    );
  }

  const selectedContentType = props.dashboardSummary.filters.selected.contentType;
  const selectedRoutineCategory = props.dashboardSummary.filters.selected.routineCategory;
  const pendingModerationCount =
    props.feedHome?.posts.filter((post) => post.status === "pending_moderation").length ?? 0;
  const criticalCoverageCount = countCriticalCoverageAlerts(props.planner);
  const routineCompletionPercent = Math.round(
    props.dashboardSummary.checklistMonitor.completionRate * 100,
  );
  const teamActionCount =
    props.inviteCount +
    (props.planner?.pendingApprovalCount ?? 0) +
    (props.operationsView?.shiftSummary.openIssueCount ?? 0);
  const primaryAttentionArea = props.dashboardSummary.attentionAreas[0];

  return (
    <View style={styles.sectionStack}>
      {props.dashboardError === undefined ? null : (
        <ErrorStateCard
          actionLabel="Atualizar painel"
          description="Os dados abaixo seguem visiveis enquanto tentamos atualizar a ultima leitura."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title={props.dashboardError}
        />
      )}

      <Card tone="muted">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Visao de comando
            </FlvText>
            <FlvText variant="headline">Prioridades do recorte</FlvText>
            <FlvText tone="muted">
              Atualizado em{" "}
              {formatNotificationTimestamp(props.dashboardSummary.overview.generatedAt)}.
            </FlvText>
          </View>
          <Button
            fullWidth={false}
            icon=">"
            label="Atualizar"
            onPress={() => {
              void props.onRefresh();
            }}
            tone="secondary"
          />
        </View>
        <View style={styles.inlineWrap}>
          <Chip label={props.dashboardSummary.filters.selected.dateRangeLabel} tone="neutral" />
          {props.dashboardSummary.filters.selected.storeId === undefined ? null : (
            <Chip label={`Loja ${props.dashboardSummary.filters.selected.storeId}`} tone="fresh" />
          )}
          <Chip
            label={`${props.dashboardSummary.attentionAreaCount} area(s) de atencao`}
            tone={props.dashboardSummary.attentionAreaCount === 0 ? "success" : "warning"}
          />
        </View>
      </Card>

      <View style={styles.metricRow}>
        <MetricTile
          label="Atencao"
          note="sinais abertos"
          tone={props.dashboardSummary.attentionAreaCount === 0 ? "fresh" : "warm"}
          value={`${props.dashboardSummary.attentionAreaCount}`}
        />
        <MetricTile
          label="Moderacao"
          note="posts na fila"
          tone={pendingModerationCount === 0 ? "fresh" : "warm"}
          value={`${pendingModerationCount}`}
        />
        <MetricTile
          label="Cobertura"
          note="alertas criticos"
          tone={criticalCoverageCount === 0 ? "fresh" : "accent"}
          value={`${criticalCoverageCount}`}
        />
      </View>

      <Card>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Decisao agora
            </FlvText>
            <FlvText variant="headline">
              {primaryAttentionArea?.title ?? "Operacao sob controle no recorte"}
            </FlvText>
            <FlvText tone="muted">
              {primaryAttentionArea?.description ??
                "Sem alerta critico aberto; mantenha a leitura de moderacao, cobertura e time no mesmo fluxo."}
            </FlvText>
          </View>
          <Badge
            label={
              primaryAttentionArea === undefined
                ? "Estavel"
                : formatAttentionSeverity(primaryAttentionArea.severity)
            }
            tone={
              primaryAttentionArea === undefined
                ? "success"
                : toAttentionSeverityTone(primaryAttentionArea.severity)
            }
          />
        </View>
        <View style={styles.inlineWrap}>
          <Chip label={`${routineCompletionPercent}% rotinas`} tone="fresh" />
          <Chip label={`${teamActionCount} acao(oes) de time`} tone="warm" />
          <Chip
            label={`${props.planner?.pendingApprovalCount ?? 0} aprovacao(oes)`}
            tone="neutral"
          />
        </View>
        <View style={styles.inlineActions}>
          <Button
            fullWidth={false}
            label="Revisar fila"
            onPress={() => props.onOpenTab("moderation")}
            tone={pendingModerationCount === 0 ? "secondary" : "primary"}
          />
          <Button
            fullWidth={false}
            label="Cobertura"
            onPress={() => props.onOpenTab("coverage")}
            tone={criticalCoverageCount === 0 ? "secondary" : "accent"}
          />
          <Button
            fullWidth={false}
            label="Time"
            onPress={() => props.onOpenTab("team")}
            tone="secondary"
          />
        </View>
      </Card>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Indicadores" title="Sinais operacionais" />
        {props.dashboardSummary.overview.metrics.map((metric) => (
          <Card key={metric.key} tone="muted">
            <View style={styles.splitRow}>
              <View style={styles.flexColumn}>
                <FlvText tone="accent" variant="eyebrow">
                  {metric.label}
                </FlvText>
                <FlvText tone="muted">{metric.note}</FlvText>
              </View>
              <Badge label={metric.value} tone={toMetricBadgeTone(metric.tone)} />
            </View>
          </Card>
        ))}
      </View>

      <Card>
        <SectionHeader eyebrow="Filtros" title="Conteudo e rotina" />
        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Conteudo</FlvText>
          <View style={styles.inlineWrap}>
            {props.dashboardSummary.filters.contentTypes.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                onPress={() => props.onContentTypeFilter(option.id as DashboardContentTypePayload)}
                selected={selectedContentType === option.id}
                tone={selectedContentType === option.id ? "bold" : "neutral"}
              />
            ))}
          </View>
        </View>
        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Rotina</FlvText>
          <View style={styles.inlineWrap}>
            {props.dashboardSummary.filters.routineCategories.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                onPress={() => props.onRoutineFilter(option.id as OperationRoutineIdPayload)}
                selected={selectedRoutineCategory === option.id}
                tone={selectedRoutineCategory === option.id ? "bold" : "neutral"}
              />
            ))}
          </View>
        </View>
      </Card>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Conteudo" title="Comunicados, enquetes e missoes" />
        {props.dashboardSummary.contentItems.length === 0 ? (
          <EmptyStateCard
            actionLabel="Limpar filtro"
            description="Nenhum item apareceu no filtro atual."
            title="Sem conteudo neste recorte"
          />
        ) : (
          props.dashboardSummary.contentItems.map((item) => (
            <Card key={`${item.type}-${item.id}`}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    {formatDashboardContentType(item.type)}
                  </FlvText>
                  <FlvText variant="label">{item.title}</FlvText>
                </View>
                <RequestStatusChip
                  label={formatDashboardContentStatus(item.status)}
                  tone={toDashboardContentStatusTone(item.status)}
                />
              </View>
              <View style={styles.inlineWrap}>
                <Chip label={item.metricLabel} tone="fresh" />
                {item.ownerLabel === undefined ? null : (
                  <Chip label={item.ownerLabel} tone="neutral" />
                )}
                {item.scheduledFor === undefined ? null : (
                  <Chip label={formatIsoShortDate(item.scheduledFor)} tone="warm" />
                )}
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Checklists" title="Rotinas monitoradas" />
        <ShiftSummaryCard
          completed={`${props.dashboardSummary.checklistMonitor.completedCount}/${props.dashboardSummary.checklistMonitor.totalCount}`}
          overdue={`${props.dashboardSummary.checklistMonitor.overdueCount}`}
          wins={`${props.dashboardSummary.overview.teamProgressPercent}%`}
        />
        <CoverageIndicator
          label="Conclusao dos checklists"
          note={`${props.dashboardSummary.checklistMonitor.requiredEvidenceMissingCount} evidencia(s) obrigatoria(s) ainda sem foto.`}
          progress={Math.round(props.dashboardSummary.checklistMonitor.completionRate * 100)}
        />
        {props.dashboardSummary.checklistMonitor.routines.map((routine) => (
          <Card key={routine.id} tone="muted">
            <View style={styles.splitRow}>
              <View style={styles.flexColumn}>
                <FlvText variant="label">{routine.label}</FlvText>
                <FlvText tone="muted" variant="caption">
                  {routine.completedCount}/{routine.totalCount} item(ns) fechados
                </FlvText>
              </View>
              <Badge
                label={`${routine.overdueCount} atraso(s)`}
                tone={routine.overdueCount === 0 ? "success" : "warning"}
              />
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Atencao" title="Decisoes sugeridas" />
        {props.dashboardSummary.attentionAreas.length === 0 ? (
          <SuccessStateCard
            actionLabel="Atualizar painel"
            description="Nenhum sinal critico apareceu no recorte atual."
            onActionPress={() => {
              void props.onRefresh();
            }}
            title="Setor sem alerta aberto"
          />
        ) : (
          props.dashboardSummary.attentionAreas.map((area) => (
            <Card key={area.id}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    {formatAttentionKind(area.kind)}
                  </FlvText>
                  <FlvText variant="label">{area.title}</FlvText>
                </View>
                <RequestStatusChip
                  label={formatAttentionSeverity(area.severity)}
                  tone={toAttentionSeverityTone(area.severity)}
                />
              </View>
              <FlvText tone="muted">{area.description}</FlvText>
              <View style={styles.inlineWrap}>
                <Chip label={`${area.sourceCount} origem(ns)`} tone="neutral" />
                <Chip label={formatIsoShortDate(area.createdAt)} tone="warm" />
              </View>
            </Card>
          ))
        )}
      </View>
    </View>
  );
}

function LeaderCampaignsPanel(props: {
  readonly campaignClosures: Record<string, EngagementCampaignClosure>;
  readonly campaignError: string | undefined;
  readonly campaignViews: readonly EngagementCampaignView[] | null;
  readonly isLoadingCampaigns: boolean;
  readonly isSubmittingAction: boolean;
  readonly onCloseCampaign: (campaignId: string) => Promise<void>;
  readonly onCreateCampaign: (input: EngagementCampaignCreateRequestPayload) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly onUpdateRewardGrantStatus: (
    rewardGrantId: string,
    status: "approved-for-fulfillment" | "fulfilled" | "canceled",
  ) => Promise<void>;
  readonly planner: LeaderSchedulePlannerPayload | null;
  readonly session: MobileSession;
}): ReactNode {
  const [draft, setDraft] = useState(createDefaultCampaignDraft());
  const eligibleUserIds =
    props.planner?.teamMembers
      .filter((member) => !isLeaderRole(member.role))
      .map((member) => member.userId) ?? [];
  const reviewClosures = Object.values(props.campaignClosures).sort((left, right) =>
    right.campaign.endsAt.localeCompare(left.campaign.endsAt),
  );
  const activeCampaignCount =
    props.campaignViews?.filter((campaignView) => campaignView.campaign.status === "active")
      .length ?? 0;
  const scheduledCampaignCount =
    props.campaignViews?.filter((campaignView) => campaignView.campaign.status === "scheduled")
      .length ?? 0;
  const openCampaignCount =
    props.campaignViews?.filter((campaignView) => campaignView.campaign.status !== "closed")
      .length ?? 0;
  const primaryCampaign =
    props.campaignViews?.find((campaignView) => campaignView.campaign.status === "active") ??
    props.campaignViews?.find((campaignView) => campaignView.campaign.status === "scheduled") ??
    props.campaignViews?.[0];

  const handleCreateCampaign = async (): Promise<void> => {
    await props.onCreateCampaign(buildCampaignCreateRequest(draft, props.session, eligibleUserIds));
    setDraft(createDefaultCampaignDraft());
  };

  return (
    <View style={styles.sectionStack}>
      <View style={styles.metricRow}>
        <MetricTile
          label="Ativas"
          note="em andamento"
          tone={activeCampaignCount === 0 ? "warm" : "fresh"}
          value={`${activeCampaignCount}`}
        />
        <MetricTile
          label="Agendadas"
          note="proximos ciclos"
          tone="accent"
          value={`${scheduledCampaignCount}`}
        />
        <MetricTile
          label="Abertas"
          note="com decisao"
          tone={openCampaignCount === 0 ? "warm" : "fresh"}
          value={`${openCampaignCount}`}
        />
      </View>

      {primaryCampaign === undefined ? (
        <EmptyStateCard
          actionLabel={undefined}
          description="Crie um desafio com publico, periodo, recompensa e regra de encerramento antes de publicar para o setor."
          title="Nenhuma campanha em foco"
        />
      ) : (
        <Card tone="muted">
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderCopy}>
              <FlvText tone="accent" variant="eyebrow">
                Campanha em foco
              </FlvText>
              <FlvText variant="headline">{primaryCampaign.campaign.title}</FlvText>
              <FlvText tone="muted">{primaryCampaign.campaign.objective}</FlvText>
            </View>
            <Badge
              label={formatCampaignStatus(primaryCampaign.campaign.status)}
              tone={toCampaignStatusTone(primaryCampaign.campaign.status)}
            />
          </View>
          <View style={styles.inlineWrap}>
            <Chip
              label={`${primaryCampaign.participantCount} pessoa(s) no publico`}
              tone="neutral"
            />
            <Chip label={formatCampaignReward(primaryCampaign.campaign)} tone="warm" />
            <Chip
              label={formatCampaignWindow(
                primaryCampaign.campaign.startsAt,
                primaryCampaign.campaign.endsAt,
              )}
              tone="fresh"
            />
          </View>
          {primaryCampaign.campaign.status === "active" ? (
            <Button
              disabled={props.isSubmittingAction}
              fullWidth={false}
              label="Fechar e revisar vencedores"
              onPress={() => {
                void props.onCloseCampaign(primaryCampaign.campaign.id);
              }}
              tone="primary"
            />
          ) : null}
        </Card>
      )}

      <Card>
        <SectionHeader eyebrow="Nova campanha" title="Desafio oficial do setor" />
        <Input
          label="Titulo"
          onChangeText={(value) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              title: value,
            }))
          }
          placeholder="Ex.: Sprint de foto aprovada"
          value={draft.title}
        />
        <Input
          label="Objetivo"
          onChangeText={(value) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              objective: value,
            }))
          }
          placeholder="Ex.: Premiar quem mantiver mais fotos aprovadas no pico."
          value={draft.objective}
        />
        <Input
          label="Descricao"
          multiline
          onChangeText={(value) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              description: value,
            }))
          }
          placeholder="Explique a regra, a evidencia exigida e o tom positivo da campanha."
          value={draft.description}
        />

        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Metrica principal</FlvText>
          <View style={styles.inlineWrap}>
            {(
              [
                "approved-photo-post",
                "validated-banca-setup",
                "checklist-linked-evidence",
                "consistency-streak",
              ] as const
            ).map((metricType) => (
              <Chip
                key={metricType}
                label={formatEngagementMetricType(metricType)}
                onPress={() =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    metricType,
                  }))
                }
                selected={draft.metricType === metricType}
                tone={draft.metricType === metricType ? "fresh" : "neutral"}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Periodo</FlvText>
          <View style={styles.inlineWrap}>
            {(["weekly", "monthly", "custom"] as const).map((periodPreset) => (
              <Chip
                key={periodPreset}
                label={formatPeriodPreset(periodPreset)}
                onPress={() =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    periodPreset,
                  }))
                }
                selected={draft.periodPreset === periodPreset}
                tone={draft.periodPreset === periodPreset ? "warm" : "neutral"}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Recompensa oficial</FlvText>
          <View style={styles.inlineWrap}>
            {(["digital", "manual-company-approved"] as const).map((rewardType) => (
              <Chip
                key={rewardType}
                label={rewardType === "digital" ? "Digital" : "Manual com aprovacao"}
                onPress={() =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    rewardType,
                  }))
                }
                selected={draft.rewardType === rewardType}
                tone={draft.rewardType === rewardType ? "bold" : "neutral"}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionStackCompact}>
          <FlvText variant="label">Status inicial</FlvText>
          <View style={styles.inlineWrap}>
            {(["draft", "scheduled", "active"] as const).map((status) => (
              <Chip
                key={status}
                label={formatCampaignStatus(status)}
                onPress={() =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    status,
                  }))
                }
                selected={draft.status === status}
                tone={draft.status === status ? "fresh" : "neutral"}
              />
            ))}
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          <Input
            label="Titulo do premio"
            onChangeText={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                rewardTitle: value,
              }))
            }
            placeholder="Ex.: Badge e destaque do ciclo"
            value={draft.rewardTitle}
          />
          <Input
            keyboardType="number-pad"
            label="Pts por evento"
            onChangeText={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                pointsPerEligibleEvent: value,
              }))
            }
            placeholder="20"
            value={draft.pointsPerEligibleEvent}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <Input
            keyboardType="number-pad"
            label={draft.rewardType === "digital" ? "Pts do premio" : "Janela (dias)"}
            onChangeText={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                rewardValue: value,
              }))
            }
            placeholder={draft.rewardType === "digital" ? "160" : "7"}
            value={draft.rewardValue}
          />
          <Input
            keyboardType="number-pad"
            label="Numero de vencedores"
            onChangeText={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                winnerCount: value,
              }))
            }
            placeholder="1"
            value={draft.winnerCount}
          />
        </View>

        {draft.rewardType === "digital" ? null : (
          <Input
            label="Codigo de aprovacao"
            onChangeText={(value) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                approvalPolicyCode: value,
              }))
            }
            placeholder="Ex.: hr-folga-flv"
            value={draft.approvalPolicyCode}
          />
        )}

        <FlvText tone="muted" variant="caption">
          Recompensas oficiais de mundo real so entram no app com aprovacao interna rastreavel.
        </FlvText>

        <View style={styles.inlineActions}>
          <Button
            disabled={props.isSubmittingAction}
            label={props.isSubmittingAction ? "Salvando..." : "Criar campanha"}
            onPress={() => {
              void handleCreateCampaign();
            }}
            tone="primary"
          />
          <Button
            fullWidth={false}
            label="Atualizar lista"
            onPress={() => {
              void props.onRefresh();
            }}
            tone="secondary"
          />
        </View>
      </Card>

      {props.campaignError !== undefined && props.campaignViews === null ? (
        <ErrorStateCard
          actionLabel="Atualizar campanhas"
          description="A criacao continua disponivel mesmo quando a leitura do consolidado falha."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title={props.campaignError}
        />
      ) : null}

      {props.isLoadingCampaigns && props.campaignViews === null ? (
        <Card tone="muted">
          <SectionHeader eyebrow="Campanhas" title="Carregando desafios do setor" />
          <FlvText tone="muted">
            Buscando status, ranking saudavel e ultimas revisoes publicadas no recorte.
          </FlvText>
        </Card>
      ) : null}

      {props.campaignViews === null ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Campanhas" title="Ativas, rascunhos e encerradas" />
          {props.campaignViews.map((campaignView) => (
            <Card
              key={campaignView.campaign.id}
              tone={campaignView.campaign.status === "closed" ? "muted" : "default"}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    {formatEngagementMetricType(campaignView.campaign.scoringRule.metricType)}
                  </FlvText>
                  <FlvText variant="headline">{campaignView.campaign.title}</FlvText>
                  <FlvText tone="muted">{campaignView.campaign.objective}</FlvText>
                </View>
                <Badge
                  label={formatCampaignStatus(campaignView.campaign.status)}
                  tone={toCampaignStatusTone(campaignView.campaign.status)}
                />
              </View>
              <View style={styles.inlineWrap}>
                <Chip label={formatCampaignReward(campaignView.campaign)} tone="warm" />
                <Chip
                  label={`${campaignView.participantCount} pessoa(s) no publico`}
                  tone="neutral"
                />
                <Chip
                  label={formatCampaignWindow(
                    campaignView.campaign.startsAt,
                    campaignView.campaign.endsAt,
                  )}
                  tone="neutral"
                />
              </View>
              {campaignView.leaderboard.length === 0 ? (
                <FlvText tone="muted">
                  Ainda sem score elegivel publicado para este desafio.
                </FlvText>
              ) : (
                <View style={styles.sectionStackCompact}>
                  {campaignView.leaderboard.slice(0, 3).map((entry) => (
                    <View key={entry.userId} style={styles.listRow}>
                      <View style={styles.rankPill}>
                        <FlvText tone="accent" variant="label">
                          #{entry.position}
                        </FlvText>
                      </View>
                      <View style={styles.flexColumn}>
                        <FlvText variant="label">{entry.displayName}</FlvText>
                        <FlvText tone="muted" variant="caption">
                          {entry.score} pts elegiveis no ranking saudavel
                        </FlvText>
                      </View>
                      <Badge label={`${entry.score} pts`} tone="success" />
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.inlineActions}>
                {campaignView.campaign.status === "active" ? (
                  <Button
                    disabled={props.isSubmittingAction}
                    label="Fechar e revisar vencedores"
                    onPress={() => {
                      void props.onCloseCampaign(campaignView.campaign.id);
                    }}
                    tone="primary"
                  />
                ) : null}
                <Button
                  fullWidth={false}
                  label="Atualizar"
                  onPress={() => {
                    void props.onRefresh();
                  }}
                  tone="secondary"
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Revisao" title="Vencedores e entrega manual" />
        {reviewClosures.length === 0 ? (
          <Card tone="muted">
            <FlvText tone="muted">
              Feche uma campanha aqui no mobile para revisar vencedores, aprovacoes e entrega sem
              sair do fluxo.
            </FlvText>
          </Card>
        ) : (
          reviewClosures.map((closure) => (
            <Card key={closure.campaign.id} tone="muted">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    Encerrada
                  </FlvText>
                  <FlvText variant="label">{closure.campaign.title}</FlvText>
                  <FlvText tone="muted" variant="caption">
                    {formatCampaignWindow(closure.campaign.startsAt, closure.campaign.endsAt)}
                  </FlvText>
                </View>
                <Badge
                  label={`${closure.rewardGrants.length} premio(s)`}
                  tone={closure.rewardGrants.length === 0 ? "info" : "success"}
                />
              </View>

              <View style={styles.inlineWrap}>
                {closure.archiveItems.map((archiveItem) => (
                  <Chip
                    key={archiveItem.id}
                    label={`${formatArchiveType(archiveItem.type)} / ${formatArchiveStatus(archiveItem.status)}`}
                    tone="neutral"
                  />
                ))}
              </View>

              {closure.rewardGrants.length === 0 ? (
                <FlvText tone="muted">
                  Este fechamento nao gerou premio oficial pronto para entrega.
                </FlvText>
              ) : (
                closure.rewardGrants.map((rewardGrant) => (
                  <Card key={rewardGrant.id}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderCopy}>
                        <FlvText variant="label">{rewardGrant.reward.title}</FlvText>
                        <FlvText tone="muted" variant="caption">
                          {lookupCampaignWinnerLabel(closure, rewardGrant.userId)} / posicao #
                          {rewardGrant.position}
                        </FlvText>
                      </View>
                      <Badge
                        label={formatRewardGrantStatus(rewardGrant.status)}
                        tone={toRewardGrantBadgeTone(rewardGrant.status)}
                      />
                    </View>
                    <FlvText tone="muted">{buildRewardGrantSummary(rewardGrant)}</FlvText>
                    <View style={styles.inlineActions}>
                      {buildRewardGrantActions(rewardGrant.status).map((action) => (
                        <Button
                          disabled={props.isSubmittingAction}
                          fullWidth={false}
                          key={`${rewardGrant.id}_${action.status}`}
                          label={action.label}
                          onPress={() => {
                            void props.onUpdateRewardGrantStatus(rewardGrant.id, action.status);
                          }}
                          tone={action.tone}
                        />
                      ))}
                    </View>
                  </Card>
                ))
              )}
            </Card>
          ))
        )}
      </View>
    </View>
  );
}

function CollaboratorRecognitionPanel(props: {
  readonly achievementArchive: CollaboratorAchievementArchive | null;
  readonly engagementError: string | undefined;
  readonly isLoadingEngagement: boolean;
  readonly isLoadingRecognition: boolean;
  readonly isSubmittingRecognition: boolean;
  readonly onRefresh: () => Promise<void>;
  readonly onRefreshArchive: () => Promise<void>;
  readonly onSendPeerRecognition: () => Promise<void>;
  readonly recognitionError: string | undefined;
  readonly recognitionProfile: CollaboratorRecognitionProfile | null;
  readonly recognitionRanking: HealthyRecognitionRanking | null;
  readonly session: MobileSession;
}): ReactNode {
  const [archiveTypeFilter, setArchiveTypeFilter] = useState<
    "all" | "challenge" | "evidence" | "recognition" | "reward"
  >("all");
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<
    "all" | EngagementArchiveItemStatusPayload
  >("all");
  const [selectedArchiveItemId, setSelectedArchiveItemId] = useState<string>();

  const filteredArchiveItems =
    props.achievementArchive?.items.filter(
      (item) =>
        matchesArchiveTypeFilter(item, archiveTypeFilter) &&
        matchesArchiveStatusFilter(item, archiveStatusFilter),
    ) ?? [];
  const selectedArchiveItem =
    filteredArchiveItems.find((item) => item.id === selectedArchiveItemId) ??
    filteredArchiveItems[0];

  useEffect(() => {
    if (filteredArchiveItems.length === 0) {
      if (selectedArchiveItemId !== undefined) {
        setSelectedArchiveItemId(undefined);
      }

      return;
    }

    if (
      selectedArchiveItemId === undefined ||
      !filteredArchiveItems.some((item) => item.id === selectedArchiveItemId)
    ) {
      setSelectedArchiveItemId(filteredArchiveItems[0]?.id);
    }
  }, [filteredArchiveItems, selectedArchiveItemId]);

  if (
    props.isLoadingRecognition &&
    props.isLoadingEngagement &&
    props.recognitionProfile === null &&
    props.achievementArchive === null
  ) {
    return (
      <View style={styles.sectionStack}>
        <PostSkeleton />
        <PostSkeleton />
      </View>
    );
  }

  if (
    props.recognitionProfile === null &&
    props.achievementArchive === null &&
    (props.recognitionError !== undefined || props.engagementError !== undefined)
  ) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar conquistas"
        description="O arquivo do perfil fica isolado para nao afetar feed, escala ou rotinas."
        onActionPress={() => {
          void Promise.all([props.onRefresh(), props.onRefreshArchive()]);
        }}
        title={props.engagementError ?? props.recognitionError ?? "Falha ao abrir conquistas."}
      />
    );
  }

  if (
    props.recognitionProfile === null ||
    props.recognitionRanking === null ||
    props.achievementArchive === null
  ) {
    return (
      <EmptyStateCard
        actionLabel="Atualizar"
        description="Assim que houver pontos, campanhas ou premios governados, eles aparecem com explicacao do motivo."
        onActionPress={() => {
          void Promise.all([props.onRefresh(), props.onRefreshArchive()]);
        }}
        title="Arquivo de conquistas ainda vazio"
      />
    );
  }

  const viewerRankingEntry = props.recognitionRanking.entries.find(
    (entry) => entry.userId === props.session.userId,
  );
  const primaryCampaign = props.achievementArchive.activeCampaigns[0];
  const primaryRewardGrant = props.achievementArchive.rewardGrants[0];

  return (
    <View style={styles.sectionStack}>
      <Card>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Reconhecimento do ciclo
            </FlvText>
            <FlvText variant="headline">
              {props.recognitionProfile.summary.points} pts /{" "}
              {viewerRankingEntry === undefined
                ? "ranking em atualizacao"
                : `#${viewerRankingEntry.position} no time`}
            </FlvText>
            <FlvText tone="muted">
              {primaryCampaign === undefined
                ? "Sem campanha ativa no momento. O arquivo segue registrando conquistas, premios e reconhecimentos."
                : `${primaryCampaign.campaign.title}: ${primaryCampaign.viewerProgress?.score ?? 0} pts elegiveis.`}
            </FlvText>
          </View>
          <Badge
            label={
              primaryRewardGrant === undefined
                ? "Sem premio pendente"
                : formatRewardGrantStatus(primaryRewardGrant.status)
            }
            tone={
              primaryRewardGrant === undefined
                ? "info"
                : toRewardGrantBadgeTone(primaryRewardGrant.status)
            }
          />
        </View>
        <View style={styles.inlineWrap}>
          <Chip
            label={`${props.achievementArchive.summary.activeStreakDays} dia(s) ativos`}
            tone="fresh"
          />
          <Chip
            label={`${props.achievementArchive.summary.activeCampaignCount} campanha(s)`}
            tone="warm"
          />
          <Chip
            label={`${props.achievementArchive.summary.pendingRewardCount} premio(s) pendente(s)`}
            tone={props.achievementArchive.summary.pendingRewardCount > 0 ? "bold" : "neutral"}
          />
          <Chip
            label={`${props.recognitionProfile.summary.badgeCount} conquista(s)`}
            tone="neutral"
          />
        </View>
        <View style={styles.inlineActions}>
          <Button
            disabled={props.isSubmittingRecognition}
            fullWidth={false}
            label="Reconhecer apoio"
            loading={props.isSubmittingRecognition}
            onPress={() => {
              void props.onSendPeerRecognition();
            }}
            tone="primary"
          />
          <Button
            disabled={props.isSubmittingRecognition || props.isLoadingEngagement}
            fullWidth={false}
            label="Atualizar"
            onPress={() => {
              void Promise.all([props.onRefresh(), props.onRefreshArchive()]);
            }}
            tone="secondary"
          />
        </View>
      </Card>

      {primaryCampaign === undefined ? null : (
        <CampaignProgressCard
          actionLabel="Ver campanha"
          note={`${formatCampaignReward(primaryCampaign.campaign)} / ${formatCampaignWindow(
            primaryCampaign.campaign.startsAt,
            primaryCampaign.campaign.endsAt,
          )}`}
          onActionPress={() => {
            if (filteredArchiveItems[0] !== undefined) {
              setSelectedArchiveItemId(filteredArchiveItems[0].id);
            }
          }}
          progress={buildCampaignProgressPercent(primaryCampaign)}
          title={primaryCampaign.campaign.title}
        />
      )}

      <View style={styles.metricRow}>
        <MetricTile
          label="Pontos"
          note="saldo positivo"
          tone="fresh"
          value={`${props.recognitionProfile.summary.points}`}
        />
        <MetricTile
          label="Vitorias"
          note="campanhas"
          tone="accent"
          value={`${props.achievementArchive.summary.challengeWinCount}`}
        />
        <MetricTile
          label="Ranking"
          note="posicao"
          tone="warm"
          value={viewerRankingEntry === undefined ? "--" : `#${viewerRankingEntry.position}`}
        />
      </View>

      <Card tone="muted">
        <SectionHeader eyebrow="Arquivo" title="Conquistas, regras e recompensas" />
        <FlvText tone="muted">
          {selectedArchiveItem?.sourceAction ??
            props.recognitionProfile.rewardExplanations[0]?.reason ??
            "Cada conquista mostra a acao de origem, a regra usada e o status da recompensa."}
        </FlvText>
        <View style={styles.inlineActions}>
          <Button
            disabled={props.isSubmittingRecognition || props.isLoadingEngagement}
            label="Atualizar arquivo"
            onPress={() => {
              void Promise.all([props.onRefresh(), props.onRefreshArchive()]);
            }}
            tone="secondary"
          />
        </View>
        {props.engagementError === undefined && props.recognitionError === undefined ? null : (
          <FlvText tone="muted" variant="caption">
            {props.engagementError ?? props.recognitionError}
          </FlvText>
        )}
      </Card>

      <CampaignHighlightsSection
        campaigns={props.achievementArchive.activeCampaigns}
        engagementError={props.engagementError}
        isLoadingEngagement={props.isLoadingEngagement}
        onOpenAchievementArchive={() => {
          if (filteredArchiveItems[0] !== undefined) {
            setSelectedArchiveItemId(filteredArchiveItems[0].id);
          }
        }}
      />

      <Card>
        <SectionHeader eyebrow="Filtros" title="Linha do tempo do arquivo" />
        <View style={styles.inlineWrap}>
          {[
            { id: "all", label: "Tudo" },
            { id: "challenge", label: "Campanhas" },
            { id: "reward", label: "Premios" },
            { id: "evidence", label: "Evidencias" },
            { id: "recognition", label: "Reconhecimento" },
          ].map((filterOption) => (
            <Chip
              key={filterOption.id}
              label={filterOption.label}
              onPress={() => setArchiveTypeFilter(filterOption.id as typeof archiveTypeFilter)}
              selected={archiveTypeFilter === filterOption.id}
              tone={archiveTypeFilter === filterOption.id ? "warm" : "neutral"}
            />
          ))}
        </View>
        <View style={styles.inlineWrap}>
          {[
            { id: "all", label: "Todos" },
            { id: "recorded", label: "Registrados" },
            { id: "corrected", label: "Corrigidos" },
            { id: "revoked", label: "Revogados" },
          ].map((filterOption) => (
            <Chip
              key={filterOption.id}
              label={filterOption.label}
              onPress={() => setArchiveStatusFilter(filterOption.id as typeof archiveStatusFilter)}
              selected={archiveStatusFilter === filterOption.id}
              tone={archiveStatusFilter === filterOption.id ? "fresh" : "neutral"}
            />
          ))}
        </View>
      </Card>

      {filteredArchiveItems.length === 0 ? (
        <EmptyStateCard
          actionLabel="Limpar filtros"
          description="Nenhum item do arquivo bate com esse filtro agora."
          onActionPress={() => {
            setArchiveStatusFilter("all");
            setArchiveTypeFilter("all");
          }}
          title="Sem item neste recorte"
        />
      ) : (
        <View style={styles.sectionStackCompact}>
          {filteredArchiveItems.map((item) => (
            <Card key={item.id} tone={selectedArchiveItem?.id === item.id ? "muted" : "default"}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    {formatArchiveType(item.type)}
                  </FlvText>
                  <FlvText variant="label">{item.title}</FlvText>
                  <FlvText tone="muted" variant="caption">
                    {formatIsoShortDate(item.occurredAt)} / {item.grantingRule}
                  </FlvText>
                </View>
                <Badge
                  label={formatArchiveStatus(item.status)}
                  tone={toArchiveStatusTone(item.status)}
                />
              </View>
              <View style={styles.inlineWrap}>
                <Chip label={formatEngagementSourceType(item.sourceType)} tone="neutral" />
                {item.rewardStatus === undefined ? null : (
                  <Chip
                    label={formatRewardGrantStatus(item.rewardStatus)}
                    tone={toRewardGrantTone(item.rewardStatus)}
                  />
                )}
              </View>
              <FlvText tone="muted">{item.sourceAction}</FlvText>
              <Button
                fullWidth={false}
                label={selectedArchiveItem?.id === item.id ? "Item aberto" : "Ver detalhe"}
                onPress={() => {
                  setSelectedArchiveItemId(item.id);
                }}
                tone={selectedArchiveItem?.id === item.id ? "secondary" : "primary"}
              />
            </Card>
          ))}
        </View>
      )}

      {selectedArchiveItem === undefined ? null : (
        <Card tone="muted">
          <SectionHeader eyebrow="Detalhe" title={selectedArchiveItem.title} />
          <FlvText tone="muted">{selectedArchiveItem.sourceAction}</FlvText>
          <View style={styles.sectionStackCompact}>
            <FlvText variant="label">Regra de concessao</FlvText>
            <FlvText tone="muted">{selectedArchiveItem.grantingRule}</FlvText>
          </View>
          <View style={styles.inlineWrap}>
            <Chip label={formatEngagementSourceType(selectedArchiveItem.sourceType)} tone="fresh" />
            <Chip
              label={formatArchiveStatus(selectedArchiveItem.status)}
              tone={toArchiveStatusChipTone(selectedArchiveItem.status)}
            />
            {selectedArchiveItem.rewardStatus === undefined ? null : (
              <Chip
                label={formatRewardGrantStatus(selectedArchiveItem.rewardStatus)}
                tone={toRewardGrantTone(selectedArchiveItem.rewardStatus)}
              />
            )}
          </View>
          {selectedArchiveItem.relatedContentReference === undefined ? null : (
            <FlvText tone="muted" variant="caption">
              Conteudo relacionado disponivel no historico do setor.
            </FlvText>
          )}
          {selectedArchiveItem.responsibleApproverUserId === undefined ? null : (
            <FlvText tone="muted" variant="caption">
              Responsavel: {formatUserDisplayName(selectedArchiveItem.responsibleApproverUserId)}
            </FlvText>
          )}
          {Object.entries(selectedArchiveItem.metadata).length === 0 ? null : (
            <View style={styles.inlineWrap}>
              {Object.entries(selectedArchiveItem.metadata).map(([key, value]) => (
                <Chip
                  key={`${selectedArchiveItem.id}_${key}`}
                  label={`${formatMetadataKeyLabel(key)}: ${String(value)}`}
                  tone="neutral"
                />
              ))}
            </View>
          )}
        </Card>
      )}

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Conquistas" title="Arquivo ativo" />
        {props.recognitionProfile.badges.map((badge) => (
          <Card key={badge.id}>
            <View style={styles.splitRow}>
              <View style={styles.flexColumn}>
                <FlvText variant="headline">{badge.title}</FlvText>
                <FlvText tone="muted">{badge.description}</FlvText>
              </View>
              <Badge label={formatIsoShortDate(badge.awardedAt)} tone="success" />
            </View>
            <FlvText tone="muted" variant="caption">
              {badge.explanation}
            </FlvText>
          </Card>
        ))}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Ranking saudavel" title="Progresso positivo do time" />
        <FlvText tone="muted">{props.recognitionRanking.framing}</FlvText>
        <RankingList
          items={props.recognitionRanking.entries.map((entry) => ({
            helper: `${entry.badgeCount} conquista(s) / ${entry.recognitionCount} reconhecimento(s)`,
            id: entry.userId,
            label: entry.displayName,
            rank: entry.position,
            value: `${entry.points} pts`,
          }))}
        />
      </View>

      {props.achievementArchive.rewardGrants.length === 0 ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Premios" title="Status de entrega" />
          {props.achievementArchive.rewardGrants.map((rewardGrant) => (
            <Card key={rewardGrant.id} tone="muted">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText variant="label">{rewardGrant.reward.title}</FlvText>
                  <FlvText tone="muted" variant="caption">
                    Posicao #{rewardGrant.position} / {rewardGrant.winningScore} pts
                  </FlvText>
                </View>
                <Badge
                  label={formatRewardGrantStatus(rewardGrant.status)}
                  tone={toRewardGrantBadgeTone(rewardGrant.status)}
                />
              </View>
              <FlvText tone="muted">{buildRewardGrantSummary(rewardGrant)}</FlvText>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Historico" title="Ultimos reconhecimentos" />
        {props.recognitionProfile.recognitionHistory.map((event) => (
          <RecognitionCard
            {...(event.sourceFeedPostId === undefined ? {} : { campaignLabel: "Ligado ao mural" })}
            fromInitials={buildInitials(
              formatUserDisplayName(event.senderUserId ?? "user_demo_lider"),
            )}
            fromName={formatUserDisplayName(event.senderUserId ?? "user_demo_lider")}
            key={event.id}
            message={event.message}
            pointsLabel={`+${event.pointsAwarded} pts`}
            toName={
              event.recipientUserId === undefined || event.recipientUserId === props.session.userId
                ? "voce"
                : formatUserDisplayName(event.recipientUserId)
            }
          />
        ))}
      </View>
    </View>
  );
}

function CollaboratorSchedulePanel(props: {
  readonly isLoadingSchedule: boolean;
  readonly isSubmittingAction: boolean;
  readonly onProposeSwap: () => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly onRespondToSwap: (requestId: string, response: "accept" | "reject") => Promise<void>;
  readonly onSubmitAvailability: () => Promise<void>;
  readonly onSubmitTimeOff: () => Promise<void>;
  readonly scheduleError: string | undefined;
  readonly scheduleView: CollaboratorScheduleViewPayload | null;
  readonly session: MobileSession;
}): ReactNode {
  if (props.isLoadingSchedule) {
    return (
      <View style={styles.sectionStack}>
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Escala da semana
          </FlvText>
          <FlvText variant="headline">Sincronizando turnos e pedidos</FlvText>
          <FlvText tone="muted">
            Estamos abrindo a leitura do dia, dos proximos turnos e das pendencias da escala.
          </FlvText>
        </Card>
      </View>
    );
  }

  if (props.scheduleError !== undefined) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar escala"
        description="A jornada de escala continua isolada para nao derrubar o restante da tela."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title={props.scheduleError}
      />
    );
  }

  if (props.scheduleView === null) {
    return (
      <EmptyStateCard
        actionLabel="Atualizar escala"
        description="Quando a leitura da escala ainda nao chegou, mantemos o proximo passo claro."
        title="Escala indisponivel por enquanto"
      />
    );
  }

  const pendingSwapForViewer = props.scheduleView.requests.find(
    (request) =>
      request.kind === "swap" &&
      request.counterpartUserId === props.session.userId &&
      request.status === "pending",
  );
  const nextShiftForViewer = selectNextShiftAfterToday(props.scheduleView);
  const latestRequest = props.scheduleView.requests[0];

  return (
    <View style={styles.sectionStack}>
      <SectionHeader eyebrow="Escala do colaborador" title="Hoje, proximo turno e pedidos" />

      <Card>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              {props.scheduleView.todayShift === undefined
                ? "Hoje sem turno confirmado"
                : buildTodayShiftEyebrow(props.scheduleView)}
            </FlvText>
            <FlvText variant="headline">
              {props.scheduleView.todayShift === undefined
                ? "Folga, escala em publicacao ou aguardando ajuste"
                : `${formatShiftTimeRangeLabel(props.scheduleView.todayShift)} / ${props.scheduleView.todayShift.title}`}
            </FlvText>
            <FlvText tone="muted">
              {latestRequest === undefined
                ? "Nenhum pedido em aberto. Se sua disponibilidade mudou, envie a atualizacao por aqui."
                : buildScheduleRequestDescription(latestRequest)}
            </FlvText>
          </View>
          <Badge
            label={
              props.scheduleView.todayShift === undefined
                ? "Sem turno"
                : buildShiftStatusLabel(props.scheduleView.todayShift.status)
            }
            tone={props.scheduleView.todayShift === undefined ? "warning" : "success"}
          />
        </View>
        <View style={styles.inlineWrap}>
          <Chip
            label={
              nextShiftForViewer === undefined
                ? "Proximo: sem escala publicada"
                : `Proximo: ${formatShiftDayLabel(nextShiftForViewer.startsAt)} ${formatIsoHourMinute(nextShiftForViewer.startsAt)}`
            }
            tone="neutral"
          />
          <Chip
            label={`${props.scheduleView.pendingRequestCount} pedido(s) em andamento`}
            tone={props.scheduleView.pendingRequestCount > 0 ? "warm" : "fresh"}
          />
          <Chip label={`${props.scheduleView.breakMinutesToday} min de intervalo`} tone="neutral" />
        </View>
        <View style={styles.inlineActions}>
          <Button
            disabled={props.isSubmittingAction}
            fullWidth={false}
            label="Disponibilidade"
            loading={props.isSubmittingAction}
            onPress={() => {
              void props.onSubmitAvailability();
            }}
            tone="secondary"
          />
          <Button
            disabled={props.isSubmittingAction}
            fullWidth={false}
            label="Folga"
            loading={props.isSubmittingAction}
            onPress={() => {
              void props.onSubmitTimeOff();
            }}
            tone="accent"
          />
          <Button
            disabled={props.isSubmittingAction}
            fullWidth={false}
            label="Troca"
            loading={props.isSubmittingAction}
            onPress={() => {
              void props.onProposeSwap();
            }}
            tone="primary"
          />
        </View>
      </Card>

      <WeeklyTimeline days={toWeeklyTimelineDays(props.scheduleView.timelineDays)} />

      <Card tone="muted">
        <SectionHeader eyebrow="Pedido guiado" title="Tres passos visiveis ate a resposta" />
        <FlvText tone="muted">
          A tela valida uma janela sugerida, envia para revisao e mantem o status junto da sua
          escala.
        </FlvText>
        <View style={styles.requestStepList}>
          <View style={styles.requestStep}>
            <Badge label="1" tone="info" />
            <View style={styles.flexColumn}>
              <FlvText variant="label">Conferir periodo</FlvText>
              <FlvText tone="muted" variant="caption">
                {buildScheduleSuggestedWindowLabel(props.scheduleView)}
              </FlvText>
            </View>
          </View>
          <View style={styles.requestStep}>
            <Badge label="2" tone={props.isSubmittingAction ? "warning" : "info"} />
            <View style={styles.flexColumn}>
              <FlvText variant="label">
                {props.isSubmittingAction ? "Enviando pedido" : "Enviar para revisao"}
              </FlvText>
              <FlvText tone="muted" variant="caption">
                Disponibilidade, folga e troca usam a mesma trilha de retorno.
              </FlvText>
            </View>
          </View>
          <View style={styles.requestStep}>
            <Badge
              label="3"
              tone={props.scheduleView.pendingRequestCount > 0 ? "success" : "info"}
            />
            <View style={styles.flexColumn}>
              <FlvText variant="label">Acompanhar status</FlvText>
              <FlvText tone="muted" variant="caption">
                {latestRequest === undefined
                  ? "O proximo pedido aparecera na fila abaixo."
                  : `${buildScheduleRequestStatusLabel(latestRequest.status)} / ${buildScheduleRequestEyebrow(latestRequest)}`}
              </FlvText>
            </View>
          </View>
        </View>
      </Card>

      {props.scheduleView.requests.length === 0 ? (
        <EmptyStateCard
          actionLabel="Enviar disponibilidade"
          description="Nenhum pedido ativo no momento. A acao principal segue disponivel no topo da escala."
          onActionPress={() => {
            void props.onSubmitAvailability();
          }}
          title="Sem pedidos recentes"
        />
      ) : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Pedidos" title="Status que voltam para voce" />
          {props.scheduleView.requests.slice(0, 4).map((request) => (
            <Card key={request.id}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText tone="accent" variant="eyebrow">
                    {buildScheduleRequestEyebrow(request)}
                  </FlvText>
                  <FlvText variant="label">{buildScheduleRequestTitle(request)}</FlvText>
                </View>
                <RequestStatusChip
                  label={buildScheduleRequestStatusLabel(request.status)}
                  tone={toScheduleRequestTone(request.status)}
                />
              </View>

              <FlvText tone="muted">{buildScheduleRequestDescription(request)}</FlvText>

              <View style={styles.inlineWrap}>
                <Chip label={formatScheduleRequestWindow(request)} tone="neutral" />
                {request.preferredPeriods?.map((period) => (
                  <Chip key={period} label={formatAvailabilityPeriod(period)} tone="neutral" />
                ))}
                {request.counterpartUserName !== undefined ? (
                  <Chip label={request.counterpartUserName} tone="fresh" />
                ) : null}
              </View>

              {request.kind === "swap" &&
              request.counterpartUserId === props.session.userId &&
              request.status === "pending" ? (
                <View style={styles.inlineActions}>
                  <Button
                    disabled={props.isSubmittingAction}
                    label="Aceitar troca"
                    onPress={() => {
                      void props.onRespondToSwap(request.id, "accept");
                    }}
                    tone="primary"
                  />
                  <Button
                    disabled={props.isSubmittingAction}
                    label="Recusar"
                    onPress={() => {
                      void props.onRespondToSwap(request.id, "reject");
                    }}
                    tone="secondary"
                  />
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}

      {pendingSwapForViewer === undefined ? null : (
        <Card tone="muted">
          <FlvText variant="label">Troca aguardando sua resposta</FlvText>
          <FlvText tone="muted">{buildScheduleRequestDescription(pendingSwapForViewer)}</FlvText>
        </Card>
      )}

      {props.scheduleView.notifications.length === 0 ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Avisos da escala" title="Publicacoes e respostas recentes" />
          {props.scheduleView.notifications.map((notification) => (
            <Card key={notification.id} tone="muted">
              <FlvText tone="accent" variant="eyebrow">
                {buildScheduleNotificationEyebrow(notification)}
              </FlvText>
              <FlvText variant="label">{notification.message}</FlvText>
              <FlvText tone="muted" variant="caption">
                {formatNotificationTimestamp(notification.createdAt)}
              </FlvText>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function CollaboratorOperationsPanel(props: {
  readonly isLoadingOperations: boolean;
  readonly isOffline: boolean;
  readonly isSubmittingAction: boolean;
  readonly onCompleteChecklistItem: (input: {
    readonly evidencePhotoUrl?: string;
    readonly item: OperationsChecklistItemView;
    readonly note?: string;
    readonly routineId: OperationRoutineId;
  }) => Promise<void>;
  readonly onCompleteLearningBite: (bite: OperationsLearningBiteView) => Promise<void>;
  readonly onCreateIssue: (input: {
    readonly category: string;
    readonly evidenceUrl?: string;
    readonly note?: string;
    readonly productName?: string;
    readonly quantity?: number;
    readonly severity: OperationsIssueSeverity;
  }) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly operationsError: string | undefined;
  readonly operationsView: CollaboratorOperationsView | null;
  readonly scheduleView: CollaboratorScheduleViewPayload | null;
}): ReactNode {
  const [activeRoutineId, setActiveRoutineId] = useState<OperationRoutineId | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [itemEvidence, setItemEvidence] = useState<Record<string, string>>({});
  const [issueDraft, setIssueDraft] = useState<{
    readonly category: string;
    readonly evidenceUrl: string;
    readonly note: string;
    readonly productName: string;
    readonly quantity: string;
    readonly severity: OperationsIssueSeverity;
  }>({
    category: "perda",
    evidenceUrl: "",
    note: "",
    productName: "",
    quantity: "",
    severity: "medium",
  });

  useEffect(() => {
    if (props.operationsView === null || props.operationsView.routines.length === 0) {
      return;
    }

    if (
      activeRoutineId !== null &&
      !props.operationsView.routines.some((routine) => routine.id === activeRoutineId)
    ) {
      setActiveRoutineId(null);
    }
  }, [activeRoutineId, props.operationsView]);

  if (props.isLoadingOperations) {
    return (
      <View style={styles.sectionStack}>
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Rotinas FLV
          </FlvText>
          <FlvText variant="headline">Montando checklists do turno</FlvText>
          <FlvText tone="muted">
            Estamos puxando abertura, reposicao, qualidade, limpeza, etiquetas e fechamento.
          </FlvText>
        </Card>
      </View>
    );
  }

  if (props.operationsError !== undefined && props.operationsView === null) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar rotinas"
        description="A tela de operacao falhou, mas a retomada continua simples."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title={props.operationsError}
      />
    );
  }

  if (props.operationsView === null || props.operationsView.routines.length === 0) {
    return (
      <EmptyStateCard
        actionLabel="Atualizar rotinas"
        description="As rotinas ainda nao chegaram, mas o turno segue com caminho claro para retomar."
        title="Nenhum checklist carregado"
      />
    );
  }

  const fallbackRoutine =
    props.operationsView.routines[0] ?? fail("Expected at least one FLV routine.");
  const priorityRoutine = selectPriorityRoutine(props.operationsView) ?? fallbackRoutine;
  const activeRoutine =
    activeRoutineId === null
      ? priorityRoutine
      : (props.operationsView.routines.find((routine) => routine.id === activeRoutineId) ??
        priorityRoutine);
  const nextChecklistItem = selectNextChecklistItem(activeRoutine);
  const activeRoutineCompletedCount = countCompletedChecklistItems(activeRoutine.items);
  const activeRoutineProgressPercent = buildRoutineProgressPercent(activeRoutine.items);
  const activeRoutineProgressLabel = `${activeRoutineCompletedCount}/${activeRoutine.items.length}`;
  const activeRoutineEvidenceCount = activeRoutine.items.filter(
    (item) => item.evidencePhotoUrl !== undefined,
  ).length;
  const activeRoutineRequiredEvidencePendingCount = activeRoutine.items.filter(
    (item) => item.evidenceMode === "required" && item.evidencePhotoUrl === undefined,
  ).length;
  const activeRoutinePendingSyncCount = activeRoutine.items.filter(
    (item) => item.pendingSync,
  ).length;
  const activeRoutineOpenIssueCount = openIssuesForRoutine(props.operationsView, activeRoutine);
  const activeStandards = props.operationsView.standards.filter((standard) =>
    activeRoutine.standardIds.includes(standard.id),
  );
  const openIssues = props.operationsView.issues.filter(
    (issue) => issue.status === "open" || issue.status === "in_review",
  );

  return (
    <View style={styles.sectionStack}>
      {props.isOffline ? <OfflineStateCard /> : null}

      <SectionHeader eyebrow="Rotinas FLV" title="Prioridade, evidencia e desvio" />

      <Card>
        <FlvText tone="accent" variant="eyebrow">
          {buildOperationsShiftEyebrow(props.scheduleView)}
        </FlvText>
        <FlvText variant="headline">{buildOperationsShiftTitle(props.scheduleView)}</FlvText>
        <FlvText tone="muted">{props.operationsView.highlight}</FlvText>
        <View style={styles.inlineWrap}>
          <Chip
            label={`${props.operationsView.summary.completedRoutineCount} rotina(s) fechadas`}
            tone="fresh"
          />
          <Chip
            label={`${props.operationsView.summary.overdueRoutineCount} atrasada(s)`}
            tone={props.operationsView.summary.overdueRoutineCount > 0 ? "warning" : "neutral"}
          />
          <Chip
            label={`${props.operationsView.summary.openIssueCount} desvio(s)`}
            tone={props.operationsView.summary.openIssueCount > 0 ? "warm" : "neutral"}
          />
          {props.operationsView.summary.pendingSyncCount > 0 ? (
            <Chip
              label={`${props.operationsView.summary.pendingSyncCount} pendente(s)`}
              tone="bold"
            />
          ) : null}
        </View>
      </Card>

      <Card tone="muted">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Prioridade agora
            </FlvText>
            <FlvText variant="headline">{activeRoutine.checklistTitle}</FlvText>
            <FlvText tone="muted">
              {nextChecklistItem === undefined
                ? "Checklist fechado para este bloco. Revise evidencias, pendencias e desvios antes de trocar o turno."
                : `${nextChecklistItem.label}. ${nextChecklistItem.helper ?? "Proxima acao da rotina."}`}
            </FlvText>
          </View>
          <Badge
            label={`${activeRoutineProgressLabel} itens`}
            tone={activeRoutineCompletedCount === activeRoutine.items.length ? "success" : "info"}
          />
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${activeRoutineProgressPercent}%` }]} />
          </View>
          <FlvText tone="muted" variant="caption">
            {activeRoutineProgressPercent}% do checklist concluido neste bloco.
          </FlvText>
        </View>
        <View style={styles.inlineWrap}>
          <Chip
            label={`${activeRoutineEvidenceCount} evidencia(s)`}
            tone={activeRoutineEvidenceCount > 0 ? "fresh" : "neutral"}
          />
          <Chip
            label={`${activeRoutineRequiredEvidencePendingCount} foto(s) obrigatoria(s)`}
            tone={activeRoutineRequiredEvidencePendingCount > 0 ? "warm" : "neutral"}
          />
          <Chip
            label={`${activeRoutineOpenIssueCount} desvio(s) ligados ao turno`}
            tone={activeRoutineOpenIssueCount > 0 ? "bold" : "neutral"}
          />
          {activeRoutinePendingSyncCount > 0 ? (
            <Chip label={`${activeRoutinePendingSyncCount} aguardando envio`} tone="bold" />
          ) : null}
        </View>
      </Card>

      <Tabs
        activeTabId={activeRoutine.id}
        onTabChange={(nextTabId) => setActiveRoutineId(nextTabId as OperationRoutineId)}
        tabs={props.operationsView.routines.map((routine) => ({
          badge: buildOperationRoutineBadge(routine.items),
          id: routine.id,
          label: routine.label,
        }))}
      />

      <Card tone="muted">
        <FlvText tone="accent" variant="eyebrow">
          {activeRoutine.label}
        </FlvText>
        <FlvText variant="headline">{activeRoutine.checklistTitle}</FlvText>
        <FlvText tone="muted">{activeRoutine.description}</FlvText>
        <View style={styles.inlineWrap}>
          {activeRoutine.focusChips.map((chip) => (
            <Chip key={chip} label={chip} tone="neutral" />
          ))}
        </View>
        <FlvText tone="muted" variant="caption">
          {activeRoutine.note}
        </FlvText>
      </Card>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Checklist conectado" title={activeRoutine.checklistTitle} />
        {activeRoutine.items.map((item) => {
          const noteValue = itemNotes[item.id] ?? item.note ?? "";
          const evidenceValue = itemEvidence[item.id] ?? item.evidencePhotoUrl ?? "";

          return (
            <Card key={item.id} tone={item.status === "completed" ? "accent" : "default"}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText variant="label">{item.label}</FlvText>
                  {item.helper !== undefined ? (
                    <FlvText tone="muted" variant="caption">
                      {item.helper}
                    </FlvText>
                  ) : null}
                </View>
                <Badge
                  label={buildOperationsItemStatusLabel(item.status)}
                  tone={buildOperationsItemStatusTone(item.status)}
                />
              </View>
              <View style={styles.inlineWrap}>
                <Chip
                  label={buildOperationsEvidenceModeLabel(item.evidenceMode)}
                  tone={item.evidenceMode === "required" ? "warm" : "neutral"}
                />
                {item.completedByUserName !== undefined ? (
                  <Chip label={`Responsavel: ${item.completedByUserName}`} tone="fresh" />
                ) : null}
                {item.completedAt !== undefined ? (
                  <Chip
                    label={`Horario: ${formatIsoHourMinute(item.completedAt)}`}
                    tone="neutral"
                  />
                ) : null}
                {item.shiftId !== undefined ? (
                  <Chip label="Turno vinculado" tone="neutral" />
                ) : null}
                {item.pendingSync ? <Chip label="Aguardando envio" tone="bold" /> : null}
              </View>
              <Input
                helperText="Observacao curta para enriquecer o resumo do turno."
                label="Observacao"
                multiline
                onChangeText={(value) =>
                  setItemNotes((currentNotes) => ({
                    ...currentNotes,
                    [item.id]: value,
                  }))
                }
                placeholder="Ex.: Frente refeita depois da reposicao do pico."
                value={noteValue}
              />
              {item.evidenceMode === "none" ? null : (
                <Input
                  helperText={
                    item.evidenceMode === "required"
                      ? "Cole a URL da foto de evidencia para concluir este item."
                      : "Se houver foto, ela reforca o handover visual."
                  }
                  label="URL da evidencia"
                  onChangeText={(value) =>
                    setItemEvidence((currentEvidence) => ({
                      ...currentEvidence,
                      [item.id]: value,
                    }))
                  }
                  placeholder="Cole o link da foto de evidencia"
                  value={evidenceValue}
                />
              )}
              {item.evidenceMode === "none" ? null : (
                <EvidenceBlock
                  description={
                    item.evidencePhotoUrl === undefined
                      ? "A foto ainda nao entrou neste item."
                      : "Foto pronta para apoiar a passagem de turno."
                  }
                  label={activeRoutine.evidence.label}
                  {...(item.evidencePhotoUrl === undefined
                    ? {}
                    : { imageUrl: item.evidencePhotoUrl })}
                  status={
                    item.pendingSync
                      ? "Aguardando envio"
                      : item.evidencePhotoUrl === undefined
                        ? "Sem foto anexada"
                        : "Evidencia registrada"
                  }
                />
              )}
              <View style={styles.inlineActions}>
                <Button
                  disabled={props.isSubmittingAction}
                  fullWidth={false}
                  label={item.status === "completed" ? "Atualizar registro" : "Concluir item"}
                  onPress={() => {
                    void props.onCompleteChecklistItem({
                      ...(evidenceValue.trim().length === 0
                        ? {}
                        : { evidencePhotoUrl: evidenceValue }),
                      item,
                      ...(noteValue.trim().length === 0 ? {} : { note: noteValue }),
                      routineId: activeRoutine.id,
                    });
                  }}
                  tone={item.status === "completed" ? "secondary" : "primary"}
                />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Padroes FLV" title="Biblioteca de referencia visual" />
        {activeStandards.map((standard) => (
          <Card key={standard.id} tone="muted">
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <FlvText tone="accent" variant="eyebrow">
                  {standard.category}
                </FlvText>
                <FlvText variant="headline">{standard.title}</FlvText>
              </View>
              <Badge label="Referencia" tone="info" />
            </View>
            <FlvText tone="muted">{standard.instructions}</FlvText>
            <View style={styles.qualityReferenceBox}>
              <FlvText tone="accent" variant="eyebrow">
                Area visual
              </FlvText>
              <FlvText variant="label">{standard.referenceLabel}</FlvText>
              <View style={styles.inlineWrap}>
                {standard.checkpoints.map((checkpoint) => (
                  <Chip key={checkpoint} label={checkpoint} tone="fresh" />
                ))}
              </View>
            </View>
            <View style={styles.inlineWrap}>
              {standard.relatedActionLabels.map((actionLabel) => (
                <Chip key={actionLabel} label={actionLabel} tone="neutral" />
              ))}
            </View>
          </Card>
        ))}
      </View>

      <Card>
        <SectionHeader eyebrow="Registro operacional" title="Perdas, desvios e bloqueios" />
        <View style={styles.inlineWrap}>
          {operationsIssueCategoryOptions.map((category) => (
            <Chip
              key={category.id}
              label={category.label}
              onPress={() =>
                setIssueDraft((currentDraft) => ({
                  ...currentDraft,
                  category: category.id,
                }))
              }
              selected={issueDraft.category === category.id}
              tone={issueDraft.category === category.id ? "bold" : "neutral"}
            />
          ))}
        </View>
        <View style={styles.inlineWrap}>
          {operationsSeverityOptions.map((severity) => (
            <Chip
              key={severity}
              label={buildIssueSeverityLabel(severity)}
              onPress={() =>
                setIssueDraft((currentDraft) => ({
                  ...currentDraft,
                  severity,
                }))
              }
              selected={issueDraft.severity === severity}
              tone={buildIssueSeverityChipTone(severity)}
            />
          ))}
        </View>
        <Input
          label="Produto"
          onChangeText={(value) =>
            setIssueDraft((currentDraft) => ({
              ...currentDraft,
              productName: value,
            }))
          }
          placeholder="Ex.: Tomate grape"
          value={issueDraft.productName}
        />
        <Input
          helperText="Use quantidade inteira quando fizer sentido para perda ou ruptura."
          keyboardType="numeric"
          label="Quantidade"
          onChangeText={(value) =>
            setIssueDraft((currentDraft) => ({
              ...currentDraft,
              quantity: value,
            }))
          }
          placeholder="0"
          value={issueDraft.quantity}
        />
        <Input
          helperText="Descreva contexto, impacto e o que ja foi feito no turno."
          label="Nota operacional"
          multiline
          onChangeText={(value) =>
            setIssueDraft((currentDraft) => ({
              ...currentDraft,
              note: value,
            }))
          }
          placeholder="Ex.: Lote isolado e lider sinalizado para decisao."
          value={issueDraft.note}
        />
        <Input
          helperText="Algumas categorias pedem foto obrigatoria para reforcar a triagem."
          label="URL da evidencia"
          onChangeText={(value) =>
            setIssueDraft((currentDraft) => ({
              ...currentDraft,
              evidenceUrl: value,
            }))
          }
          placeholder="Cole o link da foto do desvio"
          value={issueDraft.evidenceUrl}
        />
        <Button
          disabled={props.isSubmittingAction}
          label={props.isSubmittingAction ? "Salvando..." : "Registrar desvio"}
          onPress={() => {
            const parsedQuantity = Number.parseInt(issueDraft.quantity, 10);

            void props.onCreateIssue({
              category: issueDraft.category,
              ...(issueDraft.evidenceUrl.trim().length === 0
                ? {}
                : { evidenceUrl: issueDraft.evidenceUrl }),
              ...(issueDraft.note.trim().length === 0 ? {} : { note: issueDraft.note }),
              ...(issueDraft.productName.trim().length === 0
                ? {}
                : { productName: issueDraft.productName }),
              ...(Number.isNaN(parsedQuantity) ? {} : { quantity: parsedQuantity }),
              severity: issueDraft.severity,
            });
          }}
          tone="accent"
        />
      </Card>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Desvios ativos" title="Fila operacional do turno" />
        {openIssues.length === 0 ? (
          <SuccessStateCard
            actionLabel="Manter vigia"
            description="Nenhum desvio aberto no momento. O resumo segue limpo para a passagem de turno."
            title="Sem desvio em aberto"
          />
        ) : (
          openIssues.map((issue) => (
            <Card key={issue.id} tone="muted">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderCopy}>
                  <FlvText variant="label">
                    {issue.productName === undefined
                      ? issue.category
                      : `${issue.category} / ${issue.productName}`}
                  </FlvText>
                  {issue.note !== undefined ? (
                    <FlvText tone="muted" variant="caption">
                      {issue.note}
                    </FlvText>
                  ) : null}
                </View>
                <Badge
                  label={buildIssueSeverityLabel(issue.severity)}
                  tone={buildIssueSeverityTone(issue.severity)}
                />
              </View>
              <View style={styles.inlineWrap}>
                {issue.quantity === undefined ? null : (
                  <Chip label={`Qtd: ${issue.quantity}`} tone="neutral" />
                )}
                {issue.reportedByUserName === undefined ? null : (
                  <Chip label={`Por: ${issue.reportedByUserName}`} tone="fresh" />
                )}
                <Chip label={`Status: ${buildIssueStatusLabel(issue.status)}`} tone="warm" />
                {issue.pendingSync ? <Chip label="Aguardando envio" tone="bold" /> : null}
              </View>
              <EvidenceBlock
                description={
                  issue.evidencePhotoUrls.length === 0
                    ? "Sem foto anexada. Adicione uma evidencia quando o desvio exigir decisao visual."
                    : "Registro visual pronto para a lideranca entender o contexto."
                }
                label={
                  issue.evidencePhotoUrls.length === 0
                    ? "Evidencia pendente"
                    : `${issue.evidencePhotoUrls.length} evidencia(s) anexada(s)`
                }
                {...(issue.evidencePhotoUrls[0] === undefined
                  ? {}
                  : { imageUrl: issue.evidencePhotoUrls[0] })}
                status={
                  issue.pendingSync
                    ? "Aguardando envio"
                    : issue.evidencePhotoUrls.length === 0
                      ? "Sem foto"
                      : "Pronto para lideranca"
                }
              />
            </Card>
          ))
        )}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Learning bites" title="Aprendizados ligados ao padrao" />
        {props.operationsView.learningBites.map((bite) => (
          <Card key={bite.id} tone={bite.completed ? "accent" : "default"}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <FlvText variant="label">{bite.title}</FlvText>
                <FlvText tone="muted" variant="caption">
                  {bite.description}
                </FlvText>
              </View>
              <Badge
                label={bite.completed ? "Concluido" : `${bite.durationMinutes} min`}
                tone={bite.completed ? "success" : "info"}
              />
            </View>
            <View style={styles.inlineWrap}>
              {bite.standardId === undefined ? null : (
                <Chip label="Padrao relacionado" tone="neutral" />
              )}
              {bite.missionTitle === undefined ? null : (
                <Chip label={bite.missionTitle} tone="fresh" />
              )}
              {bite.feedPostId === undefined ? null : (
                <Chip label="Ligado ao mural" tone="neutral" />
              )}
              {bite.pointsAwarded === undefined ? null : (
                <Chip label={`+${bite.pointsAwarded} pts`} tone="warm" />
              )}
              {bite.pendingSync ? <Chip label="Aguardando envio" tone="bold" /> : null}
            </View>
            {bite.completedAt === undefined ? null : (
              <FlvText tone="muted" variant="caption">
                Concluido as {formatIsoHourMinute(bite.completedAt)}
                {bite.completedByUserName === undefined ? "" : ` por ${bite.completedByUserName}`}.
              </FlvText>
            )}
            <Button
              disabled={props.isSubmittingAction || bite.completed}
              label={bite.completed ? "Aprendizado concluido" : "Marcar como concluido"}
              onPress={() => {
                void props.onCompleteLearningBite(bite);
              }}
              tone={bite.completed ? "secondary" : "primary"}
            />
          </Card>
        ))}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Resumo do turno" title={props.operationsView.shiftSummary.title} />
        <ShiftSummaryCard
          completed={`${props.operationsView.shiftSummary.completedRoutineCount}`}
          overdue={`${props.operationsView.shiftSummary.overdueItemCount}`}
          wins={`${props.operationsView.shiftSummary.wins.length}`}
        />
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Evidencias do turno
          </FlvText>
          <FlvText tone="muted">
            {props.operationsView.shiftSummary.evidenceCount} registro(s) visuais reforcam a
            passagem de turno.
          </FlvText>
          <View style={styles.sectionStackCompact}>
            {props.operationsView.shiftSummary.evidenceItems.length === 0 ? (
              <FlvText tone="muted" variant="caption">
                Nenhuma evidencia registrada ainda.
              </FlvText>
            ) : (
              props.operationsView.shiftSummary.evidenceItems.map((evidence) => (
                <EvidenceBlock
                  description="Evidencia vinculada ao resumo do turno."
                  key={evidence.id}
                  label={evidence.label}
                  {...(evidence.photoUrl === undefined ? {} : { imageUrl: evidence.photoUrl })}
                  status={evidence.status}
                />
              ))
            )}
          </View>
        </Card>
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Pendencias e wins
          </FlvText>
          <View style={styles.sectionStackCompact}>
            <FlvText variant="label">Itens atrasados</FlvText>
            {props.operationsView.shiftSummary.overdueItems.length === 0 ? (
              <FlvText tone="muted" variant="caption">
                Nenhuma pendencia vencida no momento.
              </FlvText>
            ) : (
              props.operationsView.shiftSummary.overdueItems.map((overdueItem) => (
                <Chip key={overdueItem} label={overdueItem} tone="warning" />
              ))
            )}
          </View>
          <View style={styles.sectionStackCompact}>
            <FlvText variant="label">Wins do turno</FlvText>
            {props.operationsView.shiftSummary.wins.map((win) => (
              <FlvText key={win} tone="muted" variant="caption">
                {win}
              </FlvText>
            ))}
          </View>
        </Card>
      </View>

      <Card tone="muted">
        <FlvText tone="accent" variant="eyebrow">
          Orientacao da rotina
        </FlvText>
        <FlvText tone="muted">{activeRoutine.note}</FlvText>
        <View style={styles.footerStack}>
          <Button
            disabled={props.isSubmittingAction}
            label={props.operationsError === undefined ? "Atualizar painel" : "Tentar novamente"}
            onPress={() => {
              void props.onRefresh();
            }}
            tone="secondary"
          />
        </View>
      </Card>
    </View>
  );
}

function LeaderCoveragePanel(props: {
  readonly isLoadingPlanner: boolean;
  readonly isSubmittingAction: boolean;
  readonly onAdjustDraftShift: () => Promise<void>;
  readonly onApproveSwap: (requestId: string) => Promise<void>;
  readonly onCreateDraftShift: () => Promise<void>;
  readonly onPublishSchedule: () => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly onReviewRequest: (requestId: string, decision: "approve" | "reject") => Promise<void>;
  readonly planner: LeaderSchedulePlannerPayload | null;
  readonly plannerError: string | undefined;
}): ReactNode {
  if (props.isLoadingPlanner) {
    return (
      <View style={styles.sectionStack}>
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Cobertura
          </FlvText>
          <FlvText variant="headline">Abrindo planner semanal</FlvText>
          <FlvText tone="muted">
            Estamos montando lacunas, pedidos pendentes, rascunhos e alertas de conflito.
          </FlvText>
        </Card>
      </View>
    );
  }

  if (props.plannerError !== undefined) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar planner"
        description="A leitura da escala segue protegida para nao contaminar os outros modulos."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title={props.plannerError}
      />
    );
  }

  if (props.planner === null) {
    return (
      <EmptyStateCard
        actionLabel="Atualizar planner"
        description="Sem dados de planner no momento. Ainda assim, o proximo passo permanece claro."
        title="Planner indisponivel"
      />
    );
  }

  const primaryAlert = selectPrimaryCoverageAlert(props.planner.coverageAlerts);
  const reviewableRequests = props.planner.requests.filter(
    (request) => request.kind !== "swap" && request.status === "pending",
  );
  const acceptedSwapRequests = props.planner.requests.filter(
    (request) => request.kind === "swap" && request.status === "accepted",
  );
  const draftShiftCount = props.planner.shifts.filter((shift) => shift.status === "draft").length;

  return (
    <View style={styles.sectionStack}>
      <SectionHeader eyebrow={props.planner.weekLabel} title="Trocas, lacunas e aprovacoes" />

      {primaryAlert === undefined ? (
        <SuccessStateCard
          actionLabel="Seguir monitorando"
          description="A semana atual nao mostra lacuna critica de cobertura dentro do recorte visivel."
          title="Cobertura principal sob controle"
        />
      ) : (
        <CoverageDecisionCard
          gapLabel={primaryAlert.label}
          note={buildCoverageAlertNote(primaryAlert)}
          onPrimaryPress={() => {
            void (draftShiftCount > 0 ? props.onAdjustDraftShift() : props.onCreateDraftShift());
          }}
          onSecondaryPress={() => {
            void props.onPublishSchedule();
          }}
          primaryLabel={draftShiftCount > 0 ? "Ajustar rascunho" : "Criar reforco"}
          riskLabel={formatCoverageSeverity(primaryAlert.severity)}
          secondaryLabel="Publicar rascunhos"
          title="Decidir cobertura antes de publicar"
        />
      )}

      <WeeklyTimeline days={toWeeklyTimelineDays(props.planner.timelineDays)} />

      <Card tone="muted">
        <FlvText variant="label">Planejamento rapido</FlvText>
        <FlvText tone="muted">
          {draftShiftCount} rascunho(s) aberto(s), {props.planner.pendingApprovalCount}{" "}
          aprovacao(oes) pendente(s) e {countCriticalCoverageAlerts(props.planner)} alerta(s)
          critico(s).
        </FlvText>
        <View style={styles.inlineActions}>
          <Button
            disabled={props.isSubmittingAction}
            label="Criar reforco"
            onPress={() => {
              void props.onCreateDraftShift();
            }}
            tone="secondary"
          />
          <Button
            disabled={props.isSubmittingAction}
            label="Ajustar rascunho"
            onPress={() => {
              void props.onAdjustDraftShift();
            }}
            tone="accent"
          />
          <Button
            disabled={props.isSubmittingAction}
            label="Publicar rascunhos"
            onPress={() => {
              void props.onPublishSchedule();
            }}
            tone="primary"
          />
        </View>
      </Card>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Time da semana" title="Atribuicoes e status dos turnos" />
        {props.planner.shifts.slice(0, 6).map((shift) => (
          <ShiftCard
            dayLabel={formatShiftDayLabel(shift.startsAt)}
            key={shift.id}
            roleLabel={`${shift.title} / ${shift.userName}`}
            statusLabel={buildShiftStatusLabel(shift.status)}
            timeRange={formatShiftTimeRangeLabel(shift)}
          />
        ))}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Aprovacoes" title="Pedidos de disponibilidade, folga e troca" />
        {reviewableRequests.length === 0 && acceptedSwapRequests.length === 0 ? (
          <SuccessStateCard
            actionLabel="Seguir acompanhando"
            description="A fila de pedidos revisaveis ficou limpa neste recorte."
            title="Sem aprovacao pendente agora"
          />
        ) : null}
        {reviewableRequests.map((request) => (
          <Card key={request.id}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <FlvText tone="accent" variant="eyebrow">
                  {buildScheduleRequestEyebrow(request)}
                </FlvText>
                <FlvText variant="label">{buildScheduleRequestTitle(request)}</FlvText>
              </View>
              <RequestStatusChip label="Pendente" tone="warning" />
            </View>
            <FlvText tone="muted">{buildScheduleRequestDescription(request)}</FlvText>
            <View style={styles.inlineActions}>
              <Button
                disabled={props.isSubmittingAction}
                label="Aprovar"
                onPress={() => {
                  void props.onReviewRequest(request.id, "approve");
                }}
                tone="primary"
              />
              <Button
                disabled={props.isSubmittingAction}
                label="Rejeitar"
                onPress={() => {
                  void props.onReviewRequest(request.id, "reject");
                }}
                tone="secondary"
              />
            </View>
          </Card>
        ))}
        {acceptedSwapRequests.map((request) => (
          <Card key={request.id} tone="muted">
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <FlvText tone="accent" variant="eyebrow">
                  Troca aceita entre pessoas
                </FlvText>
                <FlvText variant="label">{buildScheduleRequestTitle(request)}</FlvText>
              </View>
              <RequestStatusChip label="Aceita" tone="success" />
            </View>
            <FlvText tone="muted">{buildScheduleRequestDescription(request)}</FlvText>
            <Button
              disabled={props.isSubmittingAction}
              label="Aprovar troca"
              onPress={() => {
                void props.onApproveSwap(request.id);
              }}
              tone="primary"
            />
          </Card>
        ))}
      </View>

      <View style={styles.sectionStackCompact}>
        <SectionHeader eyebrow="Cobertura e conflitos" title="Regras por periodo, papel e rotina" />
        {props.planner.coverageAlerts.map((alert) => (
          <Card key={alert.id} tone="muted">
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <FlvText tone="accent" variant="eyebrow">
                  {alert.periodLabel}
                </FlvText>
                <FlvText variant="label">{alert.label}</FlvText>
              </View>
              <RequestStatusChip
                label={formatCoverageSeverity(alert.severity)}
                tone={
                  alert.severity === "ok"
                    ? "success"
                    : alert.severity === "warning"
                      ? "warning"
                      : "danger"
                }
              />
            </View>
            <FlvText tone="muted">
              {alert.assignedHeadcount}/{alert.requiredHeadcount} pessoas em{" "}
              {formatRoleLabel(alert.requiredRole)}
              {alert.routineResponsibility === undefined
                ? "."
                : ` para ${alert.routineResponsibility}.`}
            </FlvText>
          </Card>
        ))}
        {props.planner.issues.map((issue) => (
          <Card
            key={`${issue.kind}-${issue.shiftId ?? issue.requestId ?? issue.coverageId ?? issue.message}`}
          >
            <FlvText tone="accent" variant="eyebrow">
              {formatPlannerIssueKind(issue)}
            </FlvText>
            <FlvText>{issue.message}</FlvText>
          </Card>
        ))}
      </View>

      {props.planner.notifications.length === 0 ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Notificacoes" title="Ultimos disparos da escala" />
          {props.planner.notifications.slice(0, 4).map((notification) => (
            <Card key={notification.id} tone="muted">
              <FlvText tone="accent" variant="eyebrow">
                {buildScheduleNotificationEyebrow(notification)}
              </FlvText>
              <FlvText>{notification.message}</FlvText>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function LeaderTeamPanel(props: {
  readonly dashboardError: string | undefined;
  readonly dashboardSummary: DashboardSummaryPayload | null;
  readonly isLoadingDashboard: boolean;
  readonly isLoadingOperations: boolean;
  readonly onMemberFilter: (teamMemberId: string) => void;
  readonly onRefresh: () => Promise<void>;
  readonly operationsError: string | undefined;
  readonly operationsView: CollaboratorOperationsView | null;
  readonly onInviteCountChange: (inviteCount: number) => void;
  readonly planner: LeaderSchedulePlannerPayload | null;
  readonly plannerError: string | undefined;
  readonly session: MobileSession;
}): ReactNode {
  const publishedShiftCount =
    props.planner?.shifts.filter((shift) => shift.status === "published").length ?? 0;
  const draftShiftCount =
    props.planner?.shifts.filter((shift) => shift.status === "draft").length ?? 0;

  return (
    <View style={styles.sectionStack}>
      <Card tone="muted">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Perfil e permissoes
            </FlvText>
            <FlvText variant="headline">{formatRoleLabel(props.session.role)}</FlvText>
            <FlvText tone="muted">{buildLeaderRoleDecisionCopy(props.session.role)}</FlvText>
          </View>
          <Badge
            label={props.session.role === "admin-organizacao" ? "Organizacao" : "Setor"}
            tone="info"
          />
        </View>
      </Card>

      <TeamAccessPanel onInviteCountChange={props.onInviteCountChange} session={props.session} />

      {props.isLoadingDashboard && props.dashboardSummary === null ? (
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Time
          </FlvText>
          <FlvText tone="muted">
            Consolidando escala, engajamento e reconhecimento do recorte atual.
          </FlvText>
        </Card>
      ) : null}

      {props.dashboardError !== undefined && props.dashboardSummary === null ? (
        <ErrorStateCard
          actionLabel="Atualizar time"
          description="A leitura individual protegida falhou, mas a escala e as rotinas podem seguir visiveis."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title={props.dashboardError}
        />
      ) : null}

      {props.dashboardSummary === null ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader eyebrow="Time" title="Sinais individuais protegidos" />
          {props.dashboardSummary.memberInsights.length === 0 ? (
            <EmptyStateCard
              actionLabel="Atualizar time"
              description="Nenhuma pessoa apareceu no filtro atual."
              onActionPress={() => {
                void props.onRefresh();
              }}
              title="Sem pessoa neste recorte"
            />
          ) : (
            props.dashboardSummary.memberInsights.map((member) => {
              const selected =
                props.dashboardSummary?.filters.selected.teamMemberId === member.userId;

              return (
                <View key={member.userId} style={styles.memberInsight}>
                  <InviteMemberRow
                    description={`${formatRoleLabel(member.role)} / ${member.scaleLabel}`}
                    initials={createInitials(member.displayName)}
                    name={member.displayName}
                    statusLabel={`${member.points} pts`}
                    statusTone={member.points > 0 ? "success" : "info"}
                  />
                  <View style={styles.inlineWrap}>
                    <Chip label={`${member.completedActionCount} rotina(s)`} tone="fresh" />
                    <Chip label={`${member.engagementCount} post(s)`} tone="neutral" />
                    <Chip label={`${member.recognitionCount} reconhecimento(s)`} tone="warm" />
                  </View>
                  <Button
                    fullWidth={false}
                    label={selected ? "Remover foco" : "Focar pessoa"}
                    onPress={() => props.onMemberFilter(member.userId)}
                    tone={selected ? "secondary" : "primary"}
                  />
                </View>
              );
            })
          )}
        </View>
      )}

      {props.plannerError !== undefined ? (
        <ErrorStateCard
          actionLabel="Recarregar resumo"
          description="Se o consolidado falhar, mantemos a linguagem visual e o caminho de retomada."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title={props.plannerError}
        />
      ) : null}

      {props.planner === null ? (
        <EmptyStateCard
          actionLabel="Atualizar resumo"
          description="Sem dados da escala por enquanto, mas o proximo passo continua legivel."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title="Resumo ainda nao consolidado"
        />
      ) : (
        <>
          <SectionHeader eyebrow="Resumo da escala" title="Publicacoes, conflitos e comunicacao" />
          <ShiftSummaryCard
            completed={`${publishedShiftCount}/${props.planner.shifts.length}`}
            overdue={`${props.planner.pendingApprovalCount}`}
            wins={`+${props.planner.notifications.length}`}
          />
          <ChecklistCard
            items={[
              {
                helper: `${countCriticalCoverageAlerts(props.planner)} alerta(s) critico(s) seguem no radar semanal.`,
                id: "coverage",
                label: "Revisar cobertura critica",
                selected: countCriticalCoverageAlerts(props.planner) === 0,
              },
              {
                helper: `${draftShiftCount} rascunho(s) aguardam ajuste ou publicacao.`,
                id: "drafts",
                label: "Fechar rascunhos de turno",
                selected: draftShiftCount === 0,
              },
              {
                helper: `${props.planner.pendingApprovalCount} pedido(s) seguem pedindo resposta da lideranca.`,
                id: "approvals",
                label: "Esvaziar fila de aprovacao",
                selected: props.planner.pendingApprovalCount === 0,
              },
            ]}
            title="Prioridades desta semana"
          />
          <Card tone="muted">
            <FlvText tone="accent" variant="eyebrow">
              Comunicacao recente
            </FlvText>
            <FlvText tone="muted">
              {props.planner.notifications.length} notificacao(oes) recentes mantiveram
              colaboradoras e lideranca alinhadas sobre publicacoes, revisoes e trocas.
            </FlvText>
          </Card>
        </>
      )}

      {props.isLoadingOperations ? (
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Rotinas do turno
          </FlvText>
          <FlvText tone="muted">
            Consolidando evidencias, desvios e wins operacionais para a leitura da lideranca.
          </FlvText>
        </Card>
      ) : null}
      {props.operationsError !== undefined && props.operationsView === null ? (
        <ErrorStateCard
          actionLabel="Atualizar resumo operacional"
          description="O resumo de rotinas falhou, mas a recuperacao continua simples."
          onActionPress={() => {
            void props.onRefresh();
          }}
          title={props.operationsError}
        />
      ) : null}
      {props.operationsView === null ? null : (
        <View style={styles.sectionStackCompact}>
          <SectionHeader
            eyebrow="Resumo do turno"
            title={props.operationsView.shiftSummary.title}
          />
          <ShiftSummaryCard
            completed={`${props.operationsView.shiftSummary.completedRoutineCount}`}
            overdue={`${props.operationsView.shiftSummary.overdueItemCount}`}
            wins={`${props.operationsView.shiftSummary.wins.length}`}
          />
          <Card tone="muted">
            <FlvText tone="accent" variant="eyebrow">
              Operacao visivel
            </FlvText>
            <FlvText tone="muted">
              {props.operationsView.shiftSummary.openIssueCount} desvio(s) aberto(s),{" "}
              {props.operationsView.shiftSummary.evidenceCount} evidencia(s) e{" "}
              {props.operationsView.summary.pendingSyncCount} acao(oes) aguardando envio.
            </FlvText>
            <View style={styles.inlineWrap}>
              {props.operationsView.shiftSummary.openIssues.map((issue) => (
                <Chip
                  key={issue.id}
                  label={`${issue.label} / ${buildIssueSeverityLabel(issue.severity)}`}
                  tone="warm"
                />
              ))}
            </View>
          </Card>
          <Card tone="muted">
            <FlvText tone="accent" variant="eyebrow">
              Wins do turno
            </FlvText>
            {props.operationsView.shiftSummary.wins.map((win) => (
              <FlvText key={win} tone="muted" variant="caption">
                {win}
              </FlvText>
            ))}
          </Card>
        </View>
      )}

      {props.planner === null ? null : (
        <View style={styles.inlineWrap}>
          {props.planner.teamMembers.map((member) => (
            <Chip
              key={member.userId}
              label={`${member.displayName} / ${formatRoleLabel(member.role)}`}
              tone={isLeaderRole(member.role) ? "warm" : "neutral"}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface LeaderCampaignDraft {
  readonly approvalPolicyCode: string;
  readonly description: string;
  readonly metricType: EngagementMetricTypePayload;
  readonly objective: string;
  readonly periodPreset: "custom" | "monthly" | "weekly";
  readonly pointsPerEligibleEvent: string;
  readonly rewardTitle: string;
  readonly rewardType: "digital" | "manual-company-approved";
  readonly rewardValue: string;
  readonly status: "active" | "draft" | "scheduled";
  readonly title: string;
  readonly winnerCount: string;
}

function createDefaultCampaignDraft(): LeaderCampaignDraft {
  return {
    approvalPolicyCode: "hr-folga-flv",
    description:
      "Desafio positivo, baseado apenas em evidencia aprovada e sem expor desempenho negativo.",
    metricType: "approved-photo-post",
    objective: "Premiar quem sustentar o melhor volume de evidencia elegivel no ciclo.",
    periodPreset: "weekly",
    pointsPerEligibleEvent: "20",
    rewardTitle: "Badge e destaque do ciclo",
    rewardType: "digital",
    rewardValue: "160",
    status: "active",
    title: "Sprint de foto aprovada",
    winnerCount: "1",
  };
}

function buildCampaignCreateRequest(
  draft: LeaderCampaignDraft,
  session: MobileSession,
  eligibleUserIds: readonly string[],
): EngagementCampaignCreateRequestPayload {
  const { endsAt, startsAt } = buildCampaignDateWindow(draft.periodPreset);
  const parsedPointsPerEligibleEvent = Math.max(
    1,
    Number.parseInt(draft.pointsPerEligibleEvent, 10) || 20,
  );
  const parsedWinnerCount = Math.max(1, Number.parseInt(draft.winnerCount, 10) || 1);
  const requiresApprovedFeedPost =
    draft.metricType === "approved-photo-post" || draft.metricType === "approved-before-after";
  const requiresOperationalValidation =
    draft.metricType === "validated-banca-setup" ||
    draft.metricType === "checklist-linked-evidence" ||
    draft.metricType === "consistency-streak";

  return {
    description: draft.description.trim(),
    eligibility: {
      eligibleUserIds: [...eligibleUserIds],
      maxEventsPerDay: draft.metricType === "consistency-streak" ? 1 : 4,
      requiresApprovedFeedPost,
      requiresOperationalValidation,
    },
    endsAt,
    objective: draft.objective.trim(),
    periodPreset: draft.periodPreset,
    reward:
      draft.rewardType === "digital"
        ? {
            highlightLabel: "Destaque do desafio",
            points: Math.max(1, Number.parseInt(draft.rewardValue, 10) || 160),
            title: draft.rewardTitle.trim(),
            type: "digital",
          }
        : {
            approvalPolicyCode:
              draft.approvalPolicyCode.trim().length === 0
                ? "mgr-campaign-approval"
                : draft.approvalPolicyCode.trim(),
            description:
              "Premio oficial com aprovacao interna obrigatoria antes de qualquer entrega.",
            fulfillmentWindowDays: Math.max(1, Number.parseInt(draft.rewardValue, 10) || 7),
            title: draft.rewardTitle.trim(),
            type: "manual-company-approved",
          },
    scoringRule: {
      maxEventsPerUser: draft.metricType === "consistency-streak" ? 7 : 12,
      metricType: draft.metricType,
      pointsPerEligibleEvent: parsedPointsPerEligibleEvent,
      requireUniqueSources: true,
      tieBreakers:
        draft.metricType === "consistency-streak"
          ? [
              { kind: "consistency", priority: 1 },
              { kind: "first-to-finish", priority: 2 },
            ]
          : [
              { kind: "approved-quality", priority: 1 },
              { kind: "consistency", priority: 2 },
            ],
    },
    scope: session.scope,
    settlement: {
      mode: draft.rewardType === "digital" ? "automatic" : "manual-review",
      winnerCount: parsedWinnerCount,
    },
    startsAt,
    status: draft.status,
    title: draft.title.trim(),
  };
}

function buildCampaignDateWindow(periodPreset: LeaderCampaignDraft["periodPreset"]): {
  readonly endsAt: string;
  readonly startsAt: string;
} {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);

  if (periodPreset === "weekly") {
    endsAt.setUTCDate(endsAt.getUTCDate() + 7);
  } else if (periodPreset === "monthly") {
    endsAt.setUTCDate(endsAt.getUTCDate() + 30);
  } else {
    endsAt.setUTCDate(endsAt.getUTCDate() + 10);
  }

  return {
    endsAt: endsAt.toISOString(),
    startsAt: startsAt.toISOString(),
  };
}

function applyRewardGrantUpdateToClosure(
  closure: EngagementCampaignClosure,
  updatedGrant: EngagementRewardGrant,
): EngagementCampaignClosure {
  if (!closure.rewardGrants.some((rewardGrant) => rewardGrant.id === updatedGrant.id)) {
    return closure;
  }

  return {
    ...closure,
    archiveItems: closure.archiveItems.map((archiveItem) =>
      archiveItem.rewardGrantId !== updatedGrant.id
        ? archiveItem
        : {
            ...archiveItem,
            ...(updatedGrant.approvedByUserId === undefined
              ? {}
              : { responsibleApproverUserId: updatedGrant.approvedByUserId }),
            rewardStatus: updatedGrant.status,
          },
    ),
    rewardGrants: closure.rewardGrants.map((rewardGrant) =>
      rewardGrant.id === updatedGrant.id ? updatedGrant : rewardGrant,
    ),
  };
}

function buildRewardGrantActions(status: EngagementRewardGrantStatusPayload): Array<{
  readonly label: string;
  readonly status: "approved-for-fulfillment" | "canceled" | "fulfilled";
  readonly tone: "primary" | "secondary";
}> {
  if (status === "pending-company-approval") {
    return [
      { label: "Aprovar entrega", status: "approved-for-fulfillment", tone: "primary" },
      { label: "Cancelar premio", status: "canceled", tone: "secondary" },
    ];
  }

  if (status === "approved-for-fulfillment") {
    return [
      { label: "Marcar entregue", status: "fulfilled", tone: "primary" },
      { label: "Cancelar premio", status: "canceled", tone: "secondary" },
    ];
  }

  return [];
}

function lookupCampaignWinnerLabel(_closure: EngagementCampaignClosure, userId: string): string {
  return formatUserDisplayName(userId);
}

function buildRewardGrantSummary(rewardGrant: EngagementRewardGrant): string {
  if (rewardGrant.status === "pending-company-approval") {
    return "Premio oficial aguardando aprovacao interna antes de qualquer promessa de entrega.";
  }

  if (rewardGrant.status === "approved-for-fulfillment") {
    return `Premio aprovado${rewardGrant.approvedByUserId === undefined ? "" : ` por ${formatUserDisplayName(rewardGrant.approvedByUserId)}`} e pronto para combinar a entrega.`;
  }

  if (rewardGrant.status === "fulfilled") {
    return `Premio entregue${rewardGrant.fulfilledByUserId === undefined ? "" : ` por ${formatUserDisplayName(rewardGrant.fulfilledByUserId)}`} com historico preservado no arquivo.`;
  }

  if (rewardGrant.status === "canceled") {
    return "Premio cancelado com historico preservado para auditoria.";
  }

  return "Premio digital concedido automaticamente no fechamento da campanha.";
}

function matchesArchiveTypeFilter(
  item: AchievementArchiveItemView,
  filter: "all" | "challenge" | "evidence" | "recognition" | "reward",
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "challenge") {
    return item.type === "challenge-completed" || item.type === "challenge-won";
  }

  if (filter === "reward") {
    return (
      item.type === "badge-awarded" ||
      item.type === "reward-granted" ||
      item.type === "manual-prize"
    );
  }

  if (filter === "recognition") {
    return item.type === "recognition-received";
  }

  return item.type === "featured-post" || item.type === "validated-banca";
}

function matchesArchiveStatusFilter(
  item: AchievementArchiveItemView,
  filter: "all" | EngagementArchiveItemStatusPayload,
): boolean {
  return filter === "all" ? true : item.status === filter;
}

function formatArchiveType(type: EngagementArchiveItemTypePayload): string {
  if (type === "badge-awarded") {
    return "Conquista";
  }

  if (type === "recognition-received") {
    return "Reconhecimento";
  }

  if (type === "featured-post") {
    return "Feed";
  }

  if (type === "validated-banca") {
    return "Banca";
  }

  if (type === "challenge-completed") {
    return "Desafio";
  }

  if (type === "challenge-won") {
    return "Vitoria";
  }

  if (type === "reward-granted") {
    return "Premio digital";
  }

  return "Premio manual";
}

function formatArchiveStatus(status: EngagementArchiveItemStatusPayload): string {
  return status === "recorded" ? "Registrado" : status === "corrected" ? "Corrigido" : "Revogado";
}

function toArchiveStatusTone(
  status: EngagementArchiveItemStatusPayload,
): "danger" | "success" | "warning" {
  return status === "recorded" ? "success" : status === "corrected" ? "warning" : "danger";
}

function toArchiveStatusChipTone(
  status: EngagementArchiveItemStatusPayload,
): "fresh" | "neutral" | "warm" {
  return status === "recorded" ? "fresh" : status === "corrected" ? "warm" : "neutral";
}

function formatCampaignStatus(status: EngagementCampaignView["campaign"]["status"]): string {
  return status === "draft"
    ? "Rascunho"
    : status === "scheduled"
      ? "Agendada"
      : status === "active"
        ? "Ativa"
        : status === "closed"
          ? "Encerrada"
          : "Arquivada";
}

function toCampaignStatusTone(
  status: EngagementCampaignView["campaign"]["status"],
): "danger" | "success" | "warning" {
  return status === "active"
    ? "success"
    : status === "draft" || status === "scheduled"
      ? "warning"
      : "danger";
}

function formatPeriodPreset(periodPreset: LeaderCampaignDraft["periodPreset"]): string {
  return periodPreset === "weekly"
    ? "Semanal"
    : periodPreset === "monthly"
      ? "Mensal"
      : "Personalizado";
}

function formatCampaignReward(campaign: EngagementCampaignView["campaign"]): string {
  if (campaign.reward.type === "digital") {
    return `${campaign.reward.title}${campaign.reward.points === undefined ? "" : ` / ${campaign.reward.points} pts`}`;
  }

  return `${campaign.reward.title} / aprovacao oficial`;
}

function buildCampaignProgressPercent(campaignView: ActiveCampaignView): number {
  const viewerScore = campaignView.viewerProgress?.score ?? 0;
  const leadingScore = campaignView.leaderboard[0]?.score ?? 0;
  const referenceScore = Math.max(
    leadingScore,
    viewerScore,
    campaignView.campaign.scoringRule.pointsPerEligibleEvent,
  );

  if (referenceScore === 0) {
    return 0;
  }

  return Math.min(100, Math.round((viewerScore / referenceScore) * 100));
}

function formatCampaignWindow(startsAt: string, endsAt: string): string {
  return `${formatIsoShortDate(startsAt)}-${formatIsoShortDate(endsAt)}`;
}

function formatEngagementMetricType(metricType: EngagementMetricTypePayload): string {
  if (metricType === "approved-photo-post") {
    return "Foto aprovada";
  }

  if (metricType === "validated-banca-setup") {
    return "Banca validada";
  }

  if (metricType === "approved-before-after") {
    return "Antes e depois";
  }

  if (metricType === "checklist-linked-evidence") {
    return "Checklist com evidencia";
  }

  return "Consistencia";
}

function formatEngagementSourceType(sourceType: AchievementArchiveItemView["sourceType"]): string {
  if (sourceType === "approved-photo-post") {
    return "Foto aprovada";
  }

  if (sourceType === "validated-banca-setup") {
    return "Banca validada";
  }

  if (sourceType === "approved-before-after") {
    return "Antes e depois";
  }

  if (sourceType === "checklist-linked-evidence") {
    return "Checklist";
  }

  if (sourceType === "consistency-streak") {
    return "Consistencia";
  }

  if (sourceType === "recognition") {
    return "Reconhecimento";
  }

  if (sourceType === "reward-grant") {
    return "Premio";
  }

  return "Ajuste manual";
}

function formatRewardGrantStatus(status: EngagementRewardGrantStatusPayload): string {
  return status === "digital-granted"
    ? "Digital concedido"
    : status === "pending-company-approval"
      ? "Aprovacao pendente"
      : status === "approved-for-fulfillment"
        ? "Aprovado para entrega"
        : status === "fulfilled"
          ? "Entregue"
          : "Cancelado";
}

function toRewardGrantTone(
  status: EngagementRewardGrantStatusPayload,
): "fresh" | "neutral" | "warm" {
  return status === "fulfilled" || status === "digital-granted"
    ? "fresh"
    : status === "pending-company-approval" || status === "approved-for-fulfillment"
      ? "warm"
      : "neutral";
}

function toRewardGrantBadgeTone(
  status: EngagementRewardGrantStatusPayload,
): "danger" | "info" | "success" | "warning" {
  return status === "fulfilled"
    ? "success"
    : status === "digital-granted" || status === "approved-for-fulfillment"
      ? "info"
      : status === "pending-company-approval"
        ? "warning"
        : "danger";
}

function formatMetadataKeyLabel(key: string): string {
  if (key === "approvedPhotoCount") {
    return "Fotos";
  }

  if (key === "position") {
    return "Posicao";
  }

  if (key === "previousScore") {
    return "Pontuacao anterior";
  }

  if (key === "score" || key === "winningScore") {
    return "Pontuacao";
  }

  if (key === "streakDays") {
    return "Streak";
  }

  if (key === "validatedBancaCount") {
    return "Bancas";
  }

  return key;
}

function formatUserDisplayName(userId: string): string {
  if (userId === "user_demo_colaborador") {
    return "Julia Lima";
  }

  if (userId === "user_demo_colaborador_2") {
    return "Mateus Rocha";
  }

  if (userId === "user_demo_colaborador_3") {
    return "Rafaela Costa";
  }

  if (userId === "user_demo_colaborador_4") {
    return "Carlos Souza";
  }

  if (userId === "user_demo_lider") {
    return "Lider FLV";
  }

  if (userId === "user_demo_gerente") {
    return "Gerencia da loja";
  }

  return userId;
}

function buildInitials(displayName: string): string {
  const [firstName, secondName] = displayName
    .trim()
    .split(/\s+/)
    .filter((piece) => piece.length > 0);

  return `${firstName?.[0] ?? "E"}${secondName?.[0] ?? firstName?.[1] ?? ""}`.toUpperCase();
}

function buildCollaboratorScheduleBadge(
  scheduleView: CollaboratorScheduleViewPayload | null,
): string {
  if (scheduleView === null) {
    return "...";
  }

  if (scheduleView.todayShift !== undefined) {
    return formatIsoHourMinute(scheduleView.todayShift.startsAt);
  }

  return scheduleView.pendingRequestCount > 0 ? `${scheduleView.pendingRequestCount}` : "Folga";
}

function buildCollaboratorMetricValue(
  scheduleView: CollaboratorScheduleViewPayload | null,
): string {
  if (scheduleView?.todayShift !== undefined) {
    return formatIsoHourMinute(scheduleView.todayShift.startsAt);
  }

  if (scheduleView?.nextShiftStartsAt !== undefined) {
    return formatIsoHourMinute(scheduleView.nextShiftStartsAt);
  }

  return "Folga";
}

function buildCollaboratorOperationsBadge(
  operationsView: CollaboratorOperationsView | null,
  isLoadingOperations: boolean,
): string {
  if (isLoadingOperations || operationsView === null) {
    return "...";
  }

  return `${Math.min(operationsView.summary.completedRoutineCount, operationsView.routines.length)}/${operationsView.routines.length}`;
}

function buildCollaboratorRecognitionBadge(
  recognitionProfile: CollaboratorRecognitionProfile | null,
  isLoadingRecognition: boolean,
): string {
  if (isLoadingRecognition || recognitionProfile === null) {
    return "...";
  }

  return `${recognitionProfile.summary.points}`;
}

function selectNextShiftAfterToday(
  scheduleView: CollaboratorScheduleViewPayload,
): ScheduleShiftPayload | undefined {
  const todayShiftId = scheduleView.todayShift?.id;

  return (
    scheduleView.upcomingShifts.find((shift) => shift.id !== todayShiftId) ??
    scheduleView.upcomingShifts[0]
  );
}

function buildScheduleSuggestedWindowLabel(scheduleView: CollaboratorScheduleViewPayload): string {
  const referenceShift = selectNextShiftAfterToday(scheduleView) ?? scheduleView.todayShift;

  if (referenceShift === undefined) {
    return "Sem janela publicada; a disponibilidade usa a proxima abertura sugerida.";
  }

  return `${formatShiftDayLabel(referenceShift.startsAt)} / ${formatIsoHourMinute(
    referenceShift.startsAt,
  )}-${formatIsoHourMinute(referenceShift.endsAt)}`;
}

function formatScheduleRequestWindow(request: ScheduleRequestPayload): string {
  return `${formatShiftDayLabel(request.startsAt)} / ${formatIsoHourMinute(
    request.startsAt,
  )}-${formatIsoHourMinute(request.endsAt)}`;
}

function buildOperationsShiftEyebrow(scheduleView: CollaboratorScheduleViewPayload | null): string {
  if (scheduleView === null) {
    return "Turno de operacao";
  }

  if (scheduleView.todayShift !== undefined) {
    return buildTodayShiftEyebrow(scheduleView);
  }

  if (scheduleView.nextShiftStartsAt !== undefined) {
    return `Proximo turno / ${weekdayLabelFromIso(scheduleView.nextShiftStartsAt)}`;
  }

  return "Rotina sem turno confirmado";
}

function buildOperationsShiftTitle(scheduleView: CollaboratorScheduleViewPayload | null): string {
  if (scheduleView?.todayShift !== undefined) {
    return `${scheduleView.todayShift.title} / ${formatShiftTimeRangeLabel(scheduleView.todayShift)}`;
  }

  if (scheduleView?.nextShiftStartsAt !== undefined) {
    return `Proxima janela / ${formatShiftDayLabel(scheduleView.nextShiftStartsAt)} ${formatIsoHourMinute(scheduleView.nextShiftStartsAt)}`;
  }

  return "Checklists preparados para abertura, pico e fechamento";
}

function selectPriorityRoutine(
  operationsView: CollaboratorOperationsView,
): OperationsRoutineView | undefined {
  return (
    operationsView.routines.find((routine) =>
      routine.items.some((item) => item.status === "overdue" || item.status === "blocked"),
    ) ??
    operationsView.routines.find((routine) =>
      routine.items.some(
        (item) =>
          item.status !== "completed" &&
          item.evidenceMode === "required" &&
          item.evidencePhotoUrl === undefined,
      ),
    ) ??
    operationsView.routines.find((routine) =>
      routine.items.some((item) => item.status !== "completed"),
    ) ??
    operationsView.routines[0]
  );
}

function selectNextChecklistItem(
  routine: OperationsRoutineView,
): OperationsChecklistItemView | undefined {
  return (
    routine.items.find((item) => item.status === "overdue" || item.status === "blocked") ??
    routine.items.find(
      (item) =>
        item.status !== "completed" &&
        item.evidenceMode === "required" &&
        item.evidencePhotoUrl === undefined,
    ) ??
    routine.items.find((item) => item.status !== "completed")
  );
}

function countCompletedChecklistItems(items: readonly OperationsChecklistItemView[]): number {
  return items.filter((item) => item.status === "completed").length;
}

function buildRoutineProgressPercent(items: readonly OperationsChecklistItemView[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round((countCompletedChecklistItems(items) / items.length) * 100);
}

function openIssuesForRoutine(
  operationsView: CollaboratorOperationsView,
  routine: OperationsRoutineView,
): number {
  const openIssues = operationsView.issues.filter(
    (issue) => issue.status === "open" || issue.status === "in_review",
  );
  const relatedIssues = openIssues.filter((issue) => {
    const issueText = `${issue.category} ${issue.productName ?? ""} ${issue.note ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    if (routine.id === "labels") {
      return issueText.includes("etiqueta") || issueText.includes("preco");
    }

    if (routine.id === "replenishment") {
      return issueText.includes("ruptura") || issueText.includes("reposicao");
    }

    if (routine.id === "quality-review") {
      return (
        issueText.includes("avaria") || issueText.includes("perda") || issueText.includes("quebra")
      );
    }

    if (routine.id === "cleaning") {
      return issueText.includes("bloqueio") || issueText.includes("limpeza");
    }

    return routine.id === "closing" || routine.id === "opening";
  });

  return relatedIssues.length === 0 ? openIssues.length : relatedIssues.length;
}

function buildOperationRoutineBadge(
  items: readonly {
    readonly status: string;
  }[],
): string {
  const completedItemCount = items.filter((item) => item.status === "completed").length;

  return `${completedItemCount}/${items.length}`;
}

function buildOperationsItemStatusLabel(status: OperationsChecklistItemView["status"]): string {
  if (status === "completed") {
    return "Concluido";
  }

  if (status === "overdue") {
    return "Atrasado";
  }

  if (status === "blocked") {
    return "Bloqueado";
  }

  if (status === "skipped") {
    return "Pulou";
  }

  return "Pendente";
}

function buildOperationsItemStatusTone(
  status: OperationsChecklistItemView["status"],
): "info" | "success" | "warning" | "danger" {
  if (status === "completed") {
    return "success";
  }

  if (status === "overdue" || status === "blocked") {
    return "warning";
  }

  return "info";
}

function buildOperationsEvidenceModeLabel(
  mode: OperationsChecklistItemView["evidenceMode"],
): string {
  if (mode === "required") {
    return "Foto obrigatoria";
  }

  if (mode === "optional") {
    return "Foto opcional";
  }

  return "Sem foto";
}

function buildIssueSeverityLabel(severity: OperationsIssueSeverity): string {
  if (severity === "critical") {
    return "Critica";
  }

  if (severity === "high") {
    return "Alta";
  }

  if (severity === "medium") {
    return "Media";
  }

  return "Baixa";
}

function buildIssueSeverityTone(
  severity: OperationsIssueSeverity,
): "danger" | "info" | "success" | "warning" {
  if (severity === "critical" || severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "info";
}

function buildIssueSeverityChipTone(
  severity: OperationsIssueSeverity,
): "bold" | "fresh" | "neutral" | "success" | "warning" | "warm" {
  if (severity === "critical") {
    return "bold";
  }

  if (severity === "high") {
    return "warm";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "neutral";
}

function buildIssueStatusLabel(status: OperationsIssueView["status"]): string {
  if (status === "in_review") {
    return "Em revisao";
  }

  if (status === "resolved") {
    return "Resolvido";
  }

  if (status === "cancelled") {
    return "Cancelado";
  }

  return "Aberto";
}

function operationIssueRequiresEvidence(category: string): boolean {
  return category === "avaria" || category === "ruptura" || category === "etiqueta";
}

function withoutFilterKey(
  filters: LeaderDashboardFilters,
  key: keyof LeaderDashboardFilters,
): LeaderDashboardFilters {
  const nextFilters = { ...filters };
  delete nextFilters[key];

  return nextFilters;
}

function selectLeaderOverviewMetrics(
  dashboardSummary: DashboardSummaryPayload | null,
  feedHome: FeedHomePayload | null,
  planner: LeaderSchedulePlannerPayload | null,
): DashboardSummaryPayload["overview"]["metrics"] {
  if (dashboardSummary !== null) {
    return dashboardSummary.overview.metrics.slice(0, 3);
  }

  const pendingModerationCount = feedHome?.posts.filter(
    (post) => post.status === "pending_moderation",
  ).length;
  const scheduleGapCount = planner?.coverageAlerts.filter(
    (alert) => alert.severity !== "ok",
  ).length;

  return [
    {
      key: "feed",
      label: "Feed",
      note: "posts no recorte",
      tone: "accent",
      value: feedHome === null ? "..." : `${feedHome.posts.length}`,
    },
    {
      key: "schedule",
      label: "Escala",
      note: "gaps de cobertura",
      tone: scheduleGapCount === undefined || scheduleGapCount === 0 ? "fresh" : "warm",
      value: scheduleGapCount === undefined ? "..." : `${scheduleGapCount}`,
    },
    {
      key: "routine",
      label: "Moderacao",
      note: "fila aberta",
      tone: pendingModerationCount === undefined || pendingModerationCount === 0 ? "fresh" : "warm",
      value: pendingModerationCount === undefined ? "..." : `${pendingModerationCount}`,
    },
  ];
}

function toMetricBadgeTone(
  tone: DashboardSummaryPayload["overview"]["metrics"][number]["tone"],
): "info" | "success" | "warning" {
  if (tone === "fresh") {
    return "success";
  }

  if (tone === "warm") {
    return "warning";
  }

  return "info";
}

function formatDashboardContentType(type: DashboardContentTypePayload): string {
  if (type === "announcement") {
    return "Comunicado";
  }

  if (type === "photo_mission") {
    return "Missao foto";
  }

  if (type === "poll") {
    return "Enquete";
  }

  return "Card de aprendizado";
}

function formatDashboardContentStatus(
  status: DashboardSummaryPayload["contentItems"][number]["status"],
): string {
  if (status === "draft") {
    return "Rascunho";
  }

  if (status === "scheduled") {
    return "Agendado";
  }

  if (status === "active") {
    return "Ativo";
  }

  if (status === "closed") {
    return "Fechado";
  }

  return "Arquivado";
}

function toDashboardContentStatusTone(
  status: DashboardSummaryPayload["contentItems"][number]["status"],
): "danger" | "success" | "warning" {
  if (status === "archived") {
    return "danger";
  }

  if (status === "draft" || status === "scheduled") {
    return "warning";
  }

  return "success";
}

function formatAttentionKind(
  kind: DashboardSummaryPayload["attentionAreas"][number]["kind"],
): string {
  if (kind === "coverage_gap") {
    return "Cobertura";
  }

  if (kind === "low_engagement") {
    return "Engajamento";
  }

  if (kind === "moderation_queue") {
    return "Moderacao";
  }

  if (kind === "overdue_routine") {
    return "Rotina";
  }

  return "Desvio repetido";
}

function formatAttentionSeverity(
  severity: DashboardSummaryPayload["attentionAreas"][number]["severity"],
): string {
  if (severity === "critical") {
    return "Critico";
  }

  if (severity === "warning") {
    return "Atencao";
  }

  return "Info";
}

function toAttentionSeverityTone(
  severity: DashboardSummaryPayload["attentionAreas"][number]["severity"],
): "danger" | "success" | "warning" {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "success";
}

function countCriticalCoverageAlerts(planner: LeaderSchedulePlannerPayload | null): number {
  return planner?.coverageAlerts.filter((alert) => alert.severity === "critical").length ?? 0;
}

function selectPrimaryCoverageAlert(
  alerts: readonly ScheduleCoverageAlertPayload[],
): ScheduleCoverageAlertPayload | undefined {
  return alerts.find((alert) => alert.severity !== "ok");
}

function buildCoverageAlertNote(alert: ScheduleCoverageAlertPayload): string {
  return `${alert.assignedHeadcount}/${alert.requiredHeadcount} pessoa(s) em ${formatRoleLabel(alert.requiredRole)} para ${alert.periodLabel}${alert.routineResponsibility === undefined ? "." : ` / rotina ${alert.routineResponsibility}.`}`;
}

function buildCoverageProgress(alert: ScheduleCoverageAlertPayload): number {
  if (alert.requiredHeadcount === 0) {
    return 100;
  }

  return Math.round((alert.assignedHeadcount / alert.requiredHeadcount) * 100);
}

function buildTodayShiftEyebrow(scheduleView: CollaboratorScheduleViewPayload): string {
  if (scheduleView.todayShift === undefined) {
    return "Hoje";
  }

  return scheduleView.todayShiftStatus === "pending-publication"
    ? `Hoje / ${weekdayLabelFromIso(scheduleView.todayShift.startsAt)} / rascunho`
    : `Hoje / ${weekdayLabelFromIso(scheduleView.todayShift.startsAt)}`;
}

function buildShiftStatusLabel(status: ScheduleShiftPayload["status"]): string {
  return status === "draft"
    ? "Rascunho"
    : status === "published"
      ? "Confirmado"
      : status === "completed"
        ? "Concluido"
        : "Cancelado";
}

function formatShiftTimeRangeLabel(shift: {
  readonly endsAt: string;
  readonly startsAt: string;
}): string {
  return `${formatIsoHourMinute(shift.startsAt)} - ${formatIsoHourMinute(shift.endsAt)}`;
}

function formatShiftDayLabel(isoDateTime: string): string {
  return `${weekdayLabelFromIso(isoDateTime)} / ${formatIsoShortDate(isoDateTime)}`;
}

function formatIsoHourMinute(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatIsoShortDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function weekdayLabelFromIso(isoDateTime: string): string {
  const weekday = new Date(isoDateTime).getUTCDay();

  if (weekday === 0) {
    return "Dom";
  }

  if (weekday === 1) {
    return "Seg";
  }

  if (weekday === 2) {
    return "Ter";
  }

  if (weekday === 3) {
    return "Qua";
  }

  if (weekday === 4) {
    return "Qui";
  }

  if (weekday === 5) {
    return "Sex";
  }

  return "Sab";
}

function createSuggestedAvailabilityRequest(scheduleView: CollaboratorScheduleViewPayload | null): {
  readonly endsAt: string;
  readonly note: string;
  readonly preferredPeriods: readonly AvailabilityPeriodPayload[];
  readonly startsAt: string;
} {
  const referenceDate =
    scheduleView?.upcomingShifts.at(-1)?.startsAt ??
    scheduleView?.nextShiftStartsAt ??
    "2026-04-27T06:00:00.000Z";
  const nextDay = addUtcDaysFromIso(referenceDate, 2);

  return {
    endsAt: setUtcHourMinute(nextDay, 15, 0),
    note: "Posso cobrir a abertura do setor neste periodo.",
    preferredPeriods: ["opening"],
    startsAt: setUtcHourMinute(nextDay, 6, 0),
  };
}

function createSuggestedTimeOffRequest(scheduleView: CollaboratorScheduleViewPayload | null): {
  readonly endsAt: string;
  readonly reason: string;
  readonly startsAt: string;
} {
  const targetShift =
    scheduleView?.upcomingShifts.find((shift) => shift.status === "published") ??
    scheduleView?.todayShift;

  if (targetShift !== undefined) {
    return {
      endsAt: targetShift.endsAt,
      reason: "Preciso reorganizar um compromisso pessoal neste periodo.",
      startsAt: targetShift.startsAt,
    };
  }

  const fallbackDate = addUtcDaysFromIso("2026-04-24T09:00:00.000Z", 2);

  return {
    endsAt: setUtcHourMinute(fallbackDate, 18, 0),
    reason: "Preciso reorganizar um compromisso pessoal neste periodo.",
    startsAt: setUtcHourMinute(fallbackDate, 9, 0),
  };
}

function createSuggestedShiftDraft(planner: LeaderSchedulePlannerPayload | null): {
  readonly breakMinutes: number;
  readonly endsAt: string;
  readonly role: FlvRole;
  readonly startsAt: string;
  readonly title: string;
  readonly userId: string;
} {
  const assignee =
    planner?.teamMembers.find((member) => member.role === "colaborador") ??
    fail("Nenhuma pessoa colaboradora disponivel para rascunho.");
  const referenceDate = planner?.shifts.at(-1)?.startsAt ?? "2026-04-26T06:00:00.000Z";
  const nextDay = addUtcDaysFromIso(referenceDate, 2);

  return {
    breakMinutes: 45,
    endsAt: setUtcHourMinute(nextDay, 15, 0),
    role: assignee.role,
    startsAt: setUtcHourMinute(nextDay, 6, 0),
    title: "Reforco de abertura",
    userId: assignee.userId,
  };
}

function selectEditableShift(
  planner: LeaderSchedulePlannerPayload | null,
): ScheduleShiftPayload | undefined {
  return planner?.shifts.find((shift) => shift.status === "draft");
}

function createAdjustedShiftDraft(shift: ScheduleShiftPayload): {
  readonly breakMinutes: number;
  readonly endsAt: string;
  readonly role: FlvRole;
  readonly shiftId: string;
  readonly startsAt: string;
  readonly title: string;
  readonly userId: string;
} {
  return {
    breakMinutes: shift.breakMinutes,
    endsAt: addUtcMinutesToIso(shift.endsAt, 30),
    role: shift.role,
    shiftId: shift.id,
    startsAt: shift.startsAt,
    title: `${shift.title} ajustado`,
    userId: shift.userId,
  };
}

function buildScheduleRequestEyebrow(request: ScheduleRequestPayload): string {
  return request.kind === "availability"
    ? "Disponibilidade"
    : request.kind === "time_off"
      ? "Folga"
      : "Troca";
}

function buildScheduleRequestTitle(request: ScheduleRequestPayload): string {
  if (request.kind === "availability") {
    return `${request.requesterUserName} ofereceu cobertura`;
  }

  if (request.kind === "time_off") {
    return `${request.requesterUserName} pediu folga`;
  }

  return request.counterpartUserName === undefined
    ? `${request.requesterUserName} propÃ´s uma troca`
    : `${request.requesterUserName} quer trocar com ${request.counterpartUserName}`;
}

function buildScheduleRequestDescription(request: ScheduleRequestPayload): string {
  const timeWindow = `${formatShiftDayLabel(request.startsAt)} / ${formatIsoHourMinute(request.startsAt)} - ${formatIsoHourMinute(request.endsAt)}`;

  if (request.kind === "availability") {
    return `${request.requesterUserName} sinalizou disponibilidade para ${timeWindow}${request.note === undefined ? "." : `. ${request.note}`}`;
  }

  if (request.kind === "time_off") {
    return `${request.requesterUserName} pediu folga para ${timeWindow}${request.note === undefined ? "." : `. Motivo: ${request.note}`}`;
  }

  return `${request.requesterUserName} quer trocar o turno ${timeWindow}${request.counterpartUserName === undefined ? "" : ` com ${request.counterpartUserName}`}${request.note === undefined ? "." : `. ${request.note}`}`;
}

function buildScheduleRequestStatusLabel(status: ScheduleRequestPayload["status"]): string {
  return status === "pending"
    ? "Pendente"
    : status === "accepted"
      ? "Aceita"
      : status === "approved"
        ? "Aprovada"
        : status === "rejected"
          ? "Rejeitada"
          : "Cancelada";
}

function toScheduleRequestTone(
  status: ScheduleRequestPayload["status"],
): "danger" | "success" | "warning" {
  return status === "pending"
    ? "warning"
    : status === "accepted" || status === "approved"
      ? "success"
      : "danger";
}

function formatAvailabilityPeriod(period: AvailabilityPeriodPayload): string {
  return period === "opening" ? "Abertura" : period === "midday" ? "Meio do dia" : "Fechamento";
}

function buildScheduleNotificationEyebrow(notification: ScheduleNotificationPayload): string {
  return notification.type === "schedule_published"
    ? "Escala publicada"
    : notification.type === "schedule_changed"
      ? "Turno ajustado"
      : notification.type === "availability_submitted"
        ? "Disponibilidade recebida"
        : notification.type === "availability_reviewed"
          ? "Disponibilidade revisada"
          : notification.type === "time_off_submitted"
            ? "Folga recebida"
            : notification.type === "time_off_reviewed"
              ? "Folga revisada"
              : notification.type === "swap_proposed"
                ? "Troca proposta"
                : notification.type === "swap_responded"
                  ? "Troca respondida"
                  : "Troca aprovada";
}

function formatNotificationTimestamp(createdAt: string): string {
  return `${formatIsoShortDate(createdAt)} ${formatIsoHourMinute(createdAt)}`;
}

function formatCoverageSeverity(severity: ScheduleCoverageAlertPayload["severity"]): string {
  return severity === "ok" ? "OK" : severity === "warning" ? "Atencao" : "Critico";
}

function formatPlannerIssueKind(issue: SchedulePlannerIssuePayload): string {
  return issue.kind === "coverage_gap"
    ? "Gap de cobertura"
    : issue.kind === "overlapping_shift"
      ? "Turno sobreposto"
      : "Conflito com folga";
}

function buildProductUserContext(session: MobileSession): ProductUserContextDescriptor {
  return {
    areaLabel: formatSessionAreaLabel(session.scope),
    displayName: session.displayName,
    roleLabel: formatRoleLabel(session.role),
  };
}

function formatSessionAreaLabel(scope: MobileSession["scope"]): string {
  const pieces = [
    scope.storeId === undefined ? "Organizacao" : "Loja vinculada",
    scope.departmentId === undefined ? undefined : "Setor vinculado",
  ].filter((piece): piece is string => piece !== undefined);

  return pieces.join(" / ");
}

function formatRoleLabel(role: FlvRole): string {
  return role === "colaborador"
    ? "Colaborador"
    : role === "lider-setor"
      ? "Lider de setor"
      : role === "gerente-loja"
        ? "Gerente de loja"
        : role === "admin-organizacao"
          ? "Admin da organizacao"
          : "Auditor";
}

function buildLeaderRoleDecisionCopy(role: FlvRole): string {
  return role === "admin-organizacao"
    ? "Pode enxergar a organizacao, ajustar papeis amplos e manter convites de administracao visiveis."
    : role === "gerente-loja"
      ? "Foca loja e liderancas do setor; convites administrativos ficam fora do fluxo diario."
      : "Foca o setor, colaboradores e convites operacionais sem expor controles de gerencia.";
}

function createInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((piece) => piece[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatModerationAction(action: FeedModerationActionPayload): string {
  return action === "approve"
    ? "Aprovacao"
    : action === "feature"
      ? "Destaque"
      : action === "pin"
        ? "Fixacao"
        : action === "hide"
          ? "Ocultacao"
          : "Remocao";
}

function addUtcDaysFromIso(isoDateTime: string, days: number): string {
  return new Date(new Date(isoDateTime).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function addUtcMinutesToIso(isoDateTime: string, minutes: number): string {
  return new Date(new Date(isoDateTime).getTime() + minutes * 60 * 1000).toISOString();
}

function setUtcHourMinute(isoDateTime: string, hours: number, minutes: number): string {
  const date = new Date(isoDateTime);

  date.setUTCHours(hours, minutes, 0, 0);

  return date.toISOString();
}

function toWeeklyTimelineDays(
  days: readonly {
    readonly emphasis?: "high" | "medium" | undefined;
    readonly id: string;
    readonly label: string;
    readonly shift: string;
  }[],
): Array<{
  readonly emphasis?: "high" | "medium";
  readonly id: string;
  readonly label: string;
  readonly shift: string;
}> {
  return days.map((day) =>
    day.emphasis === undefined
      ? {
          id: day.id,
          label: day.label,
          shift: day.shift,
        }
      : {
          emphasis: day.emphasis,
          id: day.id,
          label: day.label,
          shift: day.shift,
        },
  );
}

function createEmptyFeedHome(): FeedHomePayload {
  return {
    announcements: [],
    feedbackInboxCount: 0,
    polls: [],
    posts: [],
  };
}

function createComposerPhotoUrl(session: MobileSession, source: "camera" | "gallery"): string {
  return `https://images.engaja.local/mobile/${session.userId}-${source}-${Date.now()}.jpg`;
}

function toMissionLinkRequest(
  draft: ReturnType<typeof createDefaultFeedComposerDraft>,
): FeedMissionLinkRequestPayload | undefined {
  const rewardPoints =
    draft.rewardPoints.trim().length === 0 ? undefined : Number.parseInt(draft.rewardPoints, 10);
  const normalizedRewardPoints =
    rewardPoints !== undefined && Number.isFinite(rewardPoints) && rewardPoints >= 0
      ? rewardPoints
      : undefined;

  if (
    draft.missionId.trim().length === 0 &&
    draft.missionTitle.trim().length === 0 &&
    draft.routineTitle.trim().length === 0 &&
    normalizedRewardPoints === undefined &&
    draft.recognitionCategory === "none"
  ) {
    return undefined;
  }

  return {
    ...(draft.missionId.trim().length === 0 ? {} : { missionId: draft.missionId.trim() }),
    ...(draft.missionTitle.trim().length === 0 ? {} : { missionTitle: draft.missionTitle.trim() }),
    ...(draft.recognitionCategory === "none"
      ? {}
      : { recognitionCategory: draft.recognitionCategory }),
    ...(normalizedRewardPoints === undefined ? {} : { rewardPoints: normalizedRewardPoints }),
    ...(draft.routineTitle.trim().length === 0 ? {} : { routineTitle: draft.routineTitle.trim() }),
  };
}

function isLeaderRole(role: FlvRole): boolean {
  return role === "lider-setor" || role === "gerente-loja" || role === "admin-organizacao";
}

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function fail(message: string): never {
  throw new Error(message);
}

async function pause(durationInMilliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, durationInMilliseconds);
  });
}

const styles = StyleSheet.create({
  backgroundAccentRail: {
    backgroundColor: flvPalette.tomato,
    height: 6,
    left: spacingScale.lg,
    pointerEvents: "none",
    position: "absolute",
    right: spacingScale.lg,
    top: 0,
  },
  backgroundBand: {
    backgroundColor: flvPalette.paper,
    height: 164,
    left: 0,
    opacity: 0.6,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: 0,
  },
  backgroundSignalBand: {
    backgroundColor: flvPalette.mist,
    height: 56,
    opacity: 0.72,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: 96,
    width: 112,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: spacingScale.xs,
  },
  cardHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  feedListContent: {
    gap: spacingScale.lg,
    paddingBottom: spacingScale.xxxl,
    paddingHorizontal: spacingScale.lg,
    paddingTop: 72,
  },
  feedScreen: {
    backgroundColor: flvSemanticColors.background,
    flex: 1,
  },
  footerStack: {
    marginTop: spacingScale.sm,
  },
  flexColumn: {
    flex: 1,
    gap: spacingScale.xs,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  inlineWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  memberInsight: {
    gap: spacingScale.sm,
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
    paddingVertical: spacingScale.sm,
  },
  postStack: {
    gap: spacingScale.md,
  },
  progressBlock: {
    gap: spacingScale.sm,
  },
  progressFill: {
    backgroundColor: flvPalette.leaf,
    borderRadius: radiusScale.pill,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.pill,
    height: 10,
    overflow: "hidden",
  },
  qualityReferenceBox: {
    backgroundColor: flvSemanticColors.card,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    gap: spacingScale.sm,
    padding: spacingScale.md,
  },
  rankPill: {
    alignItems: "center",
    backgroundColor: flvPalette.mist,
    borderRadius: radiusScale.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  screenHeader: {
    gap: spacingScale.lg,
  },
  screenHeaderCopy: {
    gap: spacingScale.sm,
  },
  screenSubtitle: {
    maxWidth: 480,
  },
  requestStep: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.md,
  },
  requestStepList: {
    gap: spacingScale.md,
  },
  sectionStack: {
    gap: spacingScale.lg,
  },
  sectionStackCompact: {
    gap: spacingScale.sm,
  },
  splitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  twoColumnRow: {
    gap: spacingScale.md,
  },
});
