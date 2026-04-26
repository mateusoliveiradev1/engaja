import { describe, expect, it } from "vitest";

import {
  createAttentionArea,
  createChecklistItemCompletion,
  createChecklistRun,
  createCoverageRequirement,
  createFeedAnnouncement,
  createFeedComment,
  createFeedFeedback,
  createFeedPoll,
  createFeedPost,
  createFeedReaction,
  createMetricSnapshot,
  createOperationIssue,
  createOperationLearningBite,
  createPointsLedgerEntry,
  createRecognitionEvent,
  createScheduleNotification,
  createShift,
  type FlvRole,
  type createScheduleRequest,
} from "@engaja/domain";

import {
  acknowledgeFeedAnnouncementUseCase,
  addFeedTimelineComment,
  createApplicationTenantScope,
  createApplicationUserId,
  createActorContext,
  createFeedTimelinePost,
  getFeedHome,
  listFeedTimeline,
  moderateFeedPost,
  reactToFeedTimelinePost,
  submitPrivateFeedFeedback,
  summarizeDashboard,
  toFeedHomePayload,
  toFeedPostSummaryPayload,
  voteInFeedPollUseCase,
} from "../src/index.js";

const sharedScope = createApplicationTenantScope({
  departmentId: "dept_flv",
  organizationId: "org_demo",
  storeId: "store_001",
});

type FeedScope = typeof sharedScope;
type FeedAnnouncementEntity = ReturnType<typeof createFeedAnnouncement>;
type FeedCommentEntity = ReturnType<typeof createFeedComment>;
type FeedFeedbackEntity = ReturnType<typeof createFeedFeedback>;
type FeedPollEntity = ReturnType<typeof createFeedPoll>;
type FeedPostEntity = ReturnType<typeof createFeedPost>;
type FeedReactionEntity = ReturnType<typeof createFeedReaction>;
type ChecklistItemCompletionEntity = ReturnType<typeof createChecklistItemCompletion>;
type ChecklistRunEntity = ReturnType<typeof createChecklistRun>;
type CoverageRequirementEntity = ReturnType<typeof createCoverageRequirement>;
type OperationIssueEntity = ReturnType<typeof createOperationIssue>;
type OperationLearningBiteEntity = ReturnType<typeof createOperationLearningBite>;
type PointsLedgerEntryEntity = ReturnType<typeof createPointsLedgerEntry>;
type RecognitionEventEntity = ReturnType<typeof createRecognitionEvent>;
type ScheduleNotificationEntity = ReturnType<typeof createScheduleNotification>;
type ScheduleRequestEntity = ReturnType<typeof createScheduleRequest>;
type ShiftEntity = ReturnType<typeof createShift>;
type ScheduleTeamMemberHarness = {
  readonly displayName: string;
  readonly role: FlvRole;
  readonly userId: ReturnType<typeof createApplicationUserId>;
};

describe("application use cases", () => {
  const scope = sharedScope;
  const collaborator = createActorContext({
    role: "colaborador",
    scope: {
      departmentId: "dept_flv",
      organizationId: "org_demo",
      storeId: "store_001",
    },
    userId: "user_demo_colaborador",
  });
  const leader = createActorContext({
    role: "lider-setor",
    scope: {
      departmentId: "dept_flv",
      organizationId: "org_demo",
      storeId: "store_001",
    },
    userId: "user_demo_lider",
  });

  it("lists visible feed posts through repository ports and contract mappers", async () => {
    const feedRepository = createFeedRepositoryHarness({
      posts: [
        createFeedPost({
          authorName: "Equipe FLV",
          authorUserId: "user_demo_colaborador",
          caption: "Missao concluida.",
          category: "mission",
          createdAt: new Date("2026-04-22T12:00:00.000Z"),
          id: "post_demo",
          missionLink: {
            missionId: "mission_demo",
            missionTitle: "Missao foto da bancada impecavel",
            recognitionCategory: "quality",
            rewardPoints: 120,
            routineTitle: "Abertura premium",
          },
          photoUrl: "https://example.com/flv-demo-photo.webp",
          publishedAt: new Date("2026-04-22T12:00:00.000Z"),
          scope,
          status: "published",
          title: "Missao foto da bancada impecavel",
          updatedAt: new Date("2026-04-22T12:00:00.000Z"),
          visibility: "department",
        }),
      ],
    });
    const posts = await listFeedTimeline({
      actor: leader,
      feedRepository,
      scope,
    });

    expect(posts).toHaveLength(1);
    expect(toFeedPostSummaryPayload(posts[0]!)).toEqual({
      authorName: "Equipe FLV",
      category: "mission",
      id: "post_demo",
      photoUrl: "https://example.com/flv-demo-photo.webp",
      publishedAt: "2026-04-22T12:00:00.000Z",
      title: "Missao foto da bancada impecavel",
    });
  });

  it("builds a feed home bundle with hydrated posts, announcements and polls", async () => {
    const now = new Date("2026-04-23T12:05:00.000Z");
    const feedRepository = createFeedRepositoryHarness({
      announcements: [
        createFeedAnnouncement({
          body: "Conferir reforco da ilha fria.",
          createdAt: new Date("2026-04-23T10:00:00.000Z"),
          createdByUserId: "user_demo_lider",
          id: "announcement_1",
          publishedAt: new Date("2026-04-23T10:05:00.000Z"),
          readByUserIds: ["user_demo_lider"],
          requiredAcknowledgement: true,
          scope,
          status: "active",
          title: "Aviso do turno",
        }),
      ],
      comments: [
        createFeedComment({
          authorName: "Lider de Setor",
          authorUserId: "user_demo_lider",
          body: "Boa leitura de cores.",
          createdAt: new Date("2026-04-23T11:00:00.000Z"),
          id: "comment_visible",
          postId: "post_home",
          scope,
          status: "visible",
          updatedAt: new Date("2026-04-23T11:00:00.000Z"),
        }),
      ],
      feedback: [
        createFeedFeedback({
          authorUserId: "user_demo_colaborador",
          category: "blocker",
          createdAt: now,
          id: "feedback_open",
          message: "Faltou etiqueta de reposicao.",
          scope,
        }),
      ],
      polls: [
        createFeedPoll({
          createdAt: now,
          createdByUserId: "user_demo_lider",
          id: "poll_1",
          options: [
            { id: "option_a", label: "Folhas premium" },
            { id: "option_b", label: "Tomate grape" },
          ],
          prompt: "Qual frente merece destaque?",
          scope,
          status: "active",
          title: "Votacao rapida",
          votes: [
            {
              createdAt: now,
              id: "poll_vote_1",
              optionId: "option_a",
              pollId: "poll_1",
              userId: "user_demo_lider",
            },
          ],
        }),
      ],
      posts: [
        createFeedPost({
          authorName: "Equipe FLV",
          authorUserId: "user_demo_colaborador",
          caption: "Foto do turno.",
          category: "mission",
          createdAt: new Date("2026-04-23T09:00:00.000Z"),
          id: "post_home",
          missionLink: {
            missionId: "mission_home",
            missionTitle: "Missao da manha",
            recognitionCategory: "quality",
            rewardPoints: 80,
          },
          photoUrl: "https://example.com/post-home.webp",
          publishedAt: new Date("2026-04-23T09:05:00.000Z"),
          scope,
          status: "published",
          title: "Banca pronta para abrir",
          updatedAt: new Date("2026-04-23T09:05:00.000Z"),
          visibility: "department",
        }),
      ],
      reactions: [
        createFeedReaction({
          createdAt: now,
          id: "reaction_like",
          postId: "post_home",
          scope,
          type: "like",
          userId: "user_demo_colaborador",
        }),
      ],
    });

    const home = await getFeedHome({
      actor: collaborator,
      feedRepository,
      limit: 4,
      scope,
    });

    const homePayload = toFeedHomePayload(home);
    const firstPost = homePayload.posts[0];

    expect(homePayload).toMatchObject({
      announcements: [
        {
          acknowledged: false,
          title: "Aviso do turno",
        },
      ],
      feedbackInboxCount: 1,
      polls: [
        {
          title: "Votacao rapida",
          totalVotes: 1,
        },
      ],
    });
    expect(firstPost?.comments[0]).toMatchObject({
      body: "Boa leitura de cores.",
    });
    expect(firstPost?.missionLink).toMatchObject({
      missionTitle: "Missao da manha",
      recognitionEligible: true,
      rewardEligible: true,
      rewardPoints: 80,
    });
    expect(firstPost?.reactions.find((reaction) => reaction.type === "like")).toMatchObject({
      count: 1,
      selected: true,
    });
    expect(firstPost?.reactions.find((reaction) => reaction.type === "aplauso")).toMatchObject({
      count: 0,
      selected: false,
    });
  });

  it("creates pending feed posts for collaborators and allows leader approval", async () => {
    const feedRepository = createFeedRepositoryHarness();
    const created = await createFeedTimelinePost({
      actor: collaborator,
      authorName: "Julia Lima",
      caption: "Banca alinhada para a abertura.",
      category: "mission",
      feedRepository,
      missionLink: {
        missionId: "mission_opening",
        missionTitle: "Missao abertura impecavel",
        recognitionCategory: "quality",
        rewardPoints: 100,
      },
      now: new Date("2026-04-23T08:00:00.000Z"),
      photoUrl: "https://example.com/new-post.webp",
      scope,
      title: "Abertura validada",
      visibility: "department",
    });

    expect(created.status).toBe("pending_moderation");
    expect(created.missionLink?.rewardEligible).toBe(false);

    await moderateFeedPost({
      action: "approve",
      actor: leader,
      feedRepository,
      now: new Date("2026-04-23T08:05:00.000Z"),
      postId: created.id,
    });

    const approvedHome = await getFeedHome({
      actor: leader,
      feedRepository,
      scope,
    });

    expect(approvedHome.posts[0]?.status).toBe("published");
    expect(approvedHome.posts[0]?.missionLink?.rewardEligible).toBe(true);
    expect(approvedHome.posts[0]?.missionLink?.recognitionEligible).toBe(true);
  });

  it("enforces one reaction per user and replaces the selected reaction optimistically", async () => {
    const feedRepository = createFeedRepositoryHarness({
      posts: [
        createPublishedPost("post_reaction"),
      ],
      reactions: [
        createFeedReaction({
          createdAt: new Date("2026-04-23T09:00:00.000Z"),
          id: "reaction_like",
          postId: "post_reaction",
          scope,
          type: "like",
          userId: "user_demo_colaborador",
        }),
      ],
    });

    const updated = await reactToFeedTimelinePost({
      actor: collaborator,
      feedRepository,
      now: new Date("2026-04-23T09:01:00.000Z"),
      postId: "post_reaction" as string & { readonly __brand: "feed-post" },
      reactionType: "aplauso",
    });

    expect(updated.reactions.find((reaction) => reaction.type === "like")?.count).toBe(0);
    expect(updated.reactions.find((reaction) => reaction.type === "aplauso")?.count).toBe(1);
    expect(updated.reactions.find((reaction) => reaction.type === "aplauso")?.selected).toBe(true);
  });

  it("stores collaborator comments as pending until moderation", async () => {
    const feedRepository = createFeedRepositoryHarness({
      posts: [createPublishedPost("post_comment")],
    });

    const updated = await addFeedTimelineComment({
      actor: collaborator,
      authorName: "Julia Lima",
      body: "Consegui repetir o padrao no segundo pico.",
      feedRepository,
      now: new Date("2026-04-23T09:10:00.000Z"),
      postId: "post_comment" as string & { readonly __brand: "feed-post" },
    });

    expect(updated.comments).toEqual([
      expect.objectContaining({
        body: "Consegui repetir o padrao no segundo pico.",
        status: "pending",
      }),
    ]);
  });

  it("records announcement acknowledgement, poll vote and private feedback", async () => {
    const now = new Date("2026-04-23T12:00:00.000Z");
    const announcement = createFeedAnnouncement({
      body: "Reforcar etiqueta da ilha fria.",
      createdAt: now,
      id: "announcement_ack",
      requiredAcknowledgement: true,
      scope,
      status: "active",
      title: "Recado urgente",
    });
    const poll = createFeedPoll({
      createdAt: now,
      id: "poll_ack",
      options: [
        { id: "poll_ack_a", label: "Folhas" },
        { id: "poll_ack_b", label: "Tomates" },
      ],
      prompt: "Qual ponta destacar?",
      scope,
      status: "active",
      title: "Destaque do turno",
    });
    const feedRepository = createFeedRepositoryHarness({
      announcements: [announcement],
      polls: [poll],
    });

    const acknowledged = await acknowledgeFeedAnnouncementUseCase({
      actor: collaborator,
      announcementId: announcement.id,
      feedRepository,
    });
    const voted = await voteInFeedPollUseCase({
      actor: collaborator,
      feedRepository,
      now,
      optionId: "poll_ack_b" as string & { readonly __brand: "poll-option" },
      pollId: poll.id,
    });
    const feedback = await submitPrivateFeedFeedback({
      actor: collaborator,
      category: "idea",
      feedRepository,
      message: "Podemos destacar folhas premium na frente central.",
      now,
      scope,
    });

    expect(acknowledged.acknowledged).toBe(true);
    expect(voted.viewerVoteOptionId).toBe("poll_ack_b");
    expect(voted.totalVotes).toBe(1);
    expect(feedback.category).toBe("idea");
  });

  it("aggregates dashboard metrics from inverted dependencies", async () => {
    const now = new Date("2026-04-23T12:05:00.000Z");
    const summary = await summarizeDashboard({
      actor: leader,
      feedRepository: createFeedRepositoryHarness({
        posts: [
          createFeedPost({
            authorName: "Equipe FLV",
            authorUserId: "user_demo_colaborador",
            caption: "Fila de moderacao 1",
            category: "quality",
            createdAt: new Date("2026-04-23T12:00:00.000Z"),
            id: "post_pending_1",
            missionLink: {
              missionId: "mission_pending_1",
              missionTitle: "Missao foto da banca premium",
              recognitionCategory: "quality",
              rewardPoints: 80,
            },
            photoUrl: "https://example.com/pending-1.webp",
            scope,
            status: "pending_moderation",
            title: "Pendente 1",
            updatedAt: new Date("2026-04-23T12:00:00.000Z"),
            visibility: "department",
          }),
          createFeedPost({
            authorName: "Equipe FLV",
            authorUserId: "user_demo_colaborador",
            caption: "Fila de moderacao 2",
            category: "quality",
            createdAt: new Date("2026-04-23T12:01:00.000Z"),
            id: "post_pending_2",
            scope,
            status: "pending_moderation",
            title: "Pendente 2",
            updatedAt: new Date("2026-04-23T12:01:00.000Z"),
            visibility: "department",
          }),
          createFeedPost({
            authorName: "Equipe FLV",
            authorUserId: "user_demo_colaborador",
            caption: "Fila de moderacao 3",
            category: "quality",
            createdAt: new Date("2026-04-23T12:02:00.000Z"),
            id: "post_pending_3",
            scope,
            status: "pending_moderation",
            title: "Pendente 3",
            updatedAt: new Date("2026-04-23T12:02:00.000Z"),
            visibility: "department",
          }),
          createFeedPost({
            authorName: "Equipe FLV",
            authorUserId: "user_demo_colaborador",
            caption: "Fila de moderacao 4",
            category: "quality",
            createdAt: new Date("2026-04-23T12:03:00.000Z"),
            id: "post_pending_4",
            scope,
            status: "pending_moderation",
            title: "Pendente 4",
            updatedAt: new Date("2026-04-23T12:03:00.000Z"),
            visibility: "department",
          }),
        ],
      }),
      metricsRepository: {
        listAttentionAreas() {
          return Promise.resolve([
            createAttentionArea({
              createdAt: new Date("2026-04-23T12:00:00.000Z"),
              description: "Pendencias de moderacao",
              id: "attention_1",
              scope,
              severity: "warning",
              title: "Fila pendente",
            }),
            createAttentionArea({
              createdAt: new Date("2026-04-23T12:00:00.000Z"),
              description: "Gap de escala",
              id: "attention_2",
              scope,
              severity: "critical",
              title: "Cobertura",
            }),
          ]);
        },
        listMetricSnapshots() {
          return Promise.resolve([
            createMetricSnapshot({
              capturedAt: new Date("2026-04-23T12:00:00.000Z"),
              id: "metric_engagement",
              key: "engagement_rate",
              scope,
              value: 0.76,
            }),
            createMetricSnapshot({
              capturedAt: new Date("2026-04-23T12:00:00.000Z"),
              id: "metric_schedule_gap",
              key: "schedule_gap_count",
              scope,
              value: 1,
            }),
            createMetricSnapshot({
              capturedAt: new Date("2026-04-23T12:00:00.000Z"),
              id: "metric_team_progress",
              key: "team_progress_percent",
              scope,
              value: 74,
            }),
          ]);
        },
      },
      now,
      operationsRepository: createOperationsRepositoryHarness({
        checklistItemCompletions: [
          createChecklistItemCompletion({
            completedAt: new Date("2026-04-23T10:00:00.000Z"),
            completedByUserId: "user_demo_colaborador",
            evidenceMode: "required",
            evidencePhotoUrl: "https://example.com/evidence.webp",
            id: "item_opening_done",
            itemId: "opening-display",
            pendingSync: false,
            runId: "run_opening",
            scope,
            shiftId: "shift_today",
            status: "completed",
          }),
          createChecklistItemCompletion({
            evidenceMode: "required",
            id: "item_opening_overdue",
            itemId: "opening-labels",
            pendingSync: false,
            runId: "run_opening",
            scope,
            shiftId: "shift_today",
            status: "overdue",
          }),
        ],
        checklistRuns: [
          createChecklistRun({
            assignedUserId: "user_demo_colaborador",
            dueAt: new Date("2026-04-23T11:00:00.000Z"),
            id: "run_opening",
            pendingSync: false,
            routineId: "opening",
            scope,
            shiftId: "shift_today",
            status: "overdue",
          }),
        ],
        issues: [
          createOperationIssue({
            category: "ruptura",
            createdAt: new Date("2026-04-23T09:30:00.000Z"),
            id: "issue_ruptura_1",
            reportedByUserId: "user_demo_colaborador",
            scope,
            severity: "high",
            shiftId: "shift_today",
            status: "open",
          }),
          createOperationIssue({
            category: "ruptura",
            createdAt: new Date("2026-04-23T10:30:00.000Z"),
            id: "issue_ruptura_2",
            reportedByUserId: "user_demo_colaborador",
            scope,
            severity: "medium",
            shiftId: "shift_today",
            status: "in_review",
          }),
        ],
        learningBites: [
          createOperationLearningBite({
            completedAt: new Date("2026-04-23T10:45:00.000Z"),
            completedByUserId: "user_demo_colaborador",
            description: "Padrao visual para ruptura em FLV.",
            durationMinutes: 4,
            id: "learning_dashboard",
            pointsAwarded: 20,
            scope,
            title: "Como tratar ruptura visivel",
          }),
        ],
      }),
      recognitionRepository: createRecognitionRepositoryHarness({
        ledgerEntries: [
          createPointsLedgerEntry({
            actorUserId: "user_demo_lider",
            amount: 120,
            id: "ledger_dashboard",
            occurredAt: new Date("2026-04-23T11:00:00.000Z"),
            reason: "Reconhecimento por padrao visual.",
            scope,
            source: "recognition",
            userId: "user_demo_colaborador",
          }),
        ],
        recognitionEvents: [
          createRecognitionEvent({
            category: "quality",
            createdAt: new Date("2026-04-23T11:00:00.000Z"),
            id: "recognition_dashboard",
            message: "Padrao visual mantido no pico.",
            pointsAwarded: 80,
            recipientUserId: "user_demo_colaborador",
            scope,
            senderUserId: "user_demo_lider",
          }),
        ],
      }),
      scheduleRepository: createScheduleRepositoryHarness({
        coverageRequirements: [
          createCoverageRequirement({
            endsAt: new Date("2026-04-16T14:00:00.000Z"),
            id: "coverage_opening",
            label: "Abertura FLV",
            requiredHeadcount: 2,
            role: "colaborador",
            routineResponsibility: "opening",
            scope,
            startsAt: new Date("2026-04-16T06:00:00.000Z"),
          }),
        ],
        notifications: [
          createScheduleNotification({
            createdAt: new Date("2026-04-16T07:00:00.000Z"),
            id: "notification_schedule",
            message: "Escala publicada para o turno.",
            scope,
            shiftId: "shift_today",
            status: "sent",
            type: "schedule_published",
            userId: "user_demo_colaborador",
          }),
        ],
        shifts: [
          createShift({
            breakMinutes: 45,
            endsAt: new Date("2026-04-16T14:00:00.000Z"),
            id: "shift_today",
            publishedAt: new Date("2026-04-15T12:00:00.000Z"),
            role: "colaborador",
            scope,
            startsAt: new Date("2026-04-16T06:00:00.000Z"),
            status: "published",
            title: "Abertura FLV",
            userId: "user_demo_colaborador",
          }),
        ],
        teamMembers: [
          {
            displayName: "Julia Lima",
            role: "colaborador",
            userId: createApplicationUserId("user_demo_colaborador"),
          },
          {
            displayName: "Lider de Setor",
            role: "lider-setor",
            userId: createApplicationUserId("user_demo_lider"),
          },
        ],
      }),
      scope,
    });

    expect(summary).toMatchObject({
      engagementRate: 0.76,
      openModerationCount: 4,
      scheduleGapCount: 1,
      checklistMonitor: {
        completedCount: 1,
        overdueCount: 1,
        requiredEvidenceMissingCount: 1,
        totalCount: 2,
        unresolvedIssueCount: 2,
      },
      filters: {
        selected: {
          dateRangeLabel: "16/04-23/04",
          storeId: "store_001",
        },
      },
      overview: {
        teamProgressPercent: 74,
      },
    });
    expect(summary.attentionAreas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "moderation_queue",
          severity: "critical",
        }),
        expect.objectContaining({
          kind: "coverage_gap",
        }),
        expect.objectContaining({
          kind: "overdue_routine",
        }),
        expect.objectContaining({
          kind: "repeated_issue",
        }),
      ]),
    );
    expect(summary.contentItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Missao foto da banca premium",
          type: "photo_mission",
        }),
        expect.objectContaining({
          title: "Como tratar ruptura visivel",
          type: "learning_card",
        }),
      ]),
    );
    expect(summary.memberInsights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          completedActionCount: 1,
          displayName: "Julia Lima",
          engagementCount: 4,
          points: 120,
          recognitionCount: 1,
          userId: "user_demo_colaborador",
        }),
      ]),
    );
    expect(summary.moderationQueue).toHaveLength(4);
    expect(summary.scheduleConsole.coverageAlerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
        }),
      ]),
    );
  });

  it("keeps branded user ids for own-scope use cases", () => {
    expect(createApplicationUserId("user_demo_colaborador")).toBe("user_demo_colaborador");
  });
});

function createPublishedPost(id: string) {
  return createFeedPost({
    authorName: "Equipe FLV",
    authorUserId: "user_demo_colaborador",
    caption: "Registro publicado.",
    category: "quality",
    createdAt: new Date("2026-04-23T08:00:00.000Z"),
    id,
    photoUrl: "https://example.com/photo.webp",
    publishedAt: new Date("2026-04-23T08:05:00.000Z"),
    scope: sharedScope,
    status: "published",
    title: "Registro publicado",
    updatedAt: new Date("2026-04-23T08:05:00.000Z"),
    visibility: "department",
  });
}

interface FeedRepositoryHarnessInput {
  readonly announcements?: readonly ReturnType<typeof createFeedAnnouncement>[];
  readonly comments?: readonly ReturnType<typeof createFeedComment>[];
  readonly feedback?: readonly ReturnType<typeof createFeedFeedback>[];
  readonly polls?: readonly ReturnType<typeof createFeedPoll>[];
  readonly posts?: readonly ReturnType<typeof createFeedPost>[];
  readonly reactions?: readonly ReturnType<typeof createFeedReaction>[];
}

function createFeedRepositoryHarness(input?: FeedRepositoryHarnessInput) {
  const announcements = [...(input?.announcements ?? [])];
  const comments = [...(input?.comments ?? [])];
  const feedback = [...(input?.feedback ?? [])];
  const polls = [...(input?.polls ?? [])];
  const posts = [...(input?.posts ?? [])];
  const reactions = [...(input?.reactions ?? [])];

  return {
    countPostsByStatus(status: FeedPostEntity["status"], currentScope: FeedScope) {
      return Promise.resolve(
        posts.filter((post) => post.status === status && post.scope.organizationId === currentScope.organizationId)
          .length,
      );
    },
    deleteReaction(postId: FeedReactionEntity["postId"], userId: FeedReactionEntity["userId"]) {
      const currentIndex = reactions.findIndex(
        (reaction) => reaction.postId === postId && reaction.userId === userId,
      );

      if (currentIndex >= 0) {
        reactions.splice(currentIndex, 1);
      }

      return Promise.resolve();
    },
    findAnnouncementById(id: FeedAnnouncementEntity["id"]) {
      return Promise.resolve(announcements.find((announcement) => announcement.id === id));
    },
    findPollById(id: FeedPollEntity["id"]) {
      return Promise.resolve(polls.find((poll) => poll.id === id));
    },
    findPostById(id: FeedPostEntity["id"]) {
      return Promise.resolve(posts.find((post) => post.id === id));
    },
    listAnnouncements(currentScope: FeedScope) {
      return Promise.resolve(
        announcements.filter((announcement) => announcement.scope.organizationId === currentScope.organizationId),
      );
    },
    listComments(postId: FeedCommentEntity["postId"]) {
      return Promise.resolve(comments.filter((comment) => comment.postId === postId));
    },
    listFeedback(currentScope: FeedScope) {
      return Promise.resolve(
        feedback.filter((item) => item.scope.organizationId === currentScope.organizationId),
      );
    },
    listPolls(currentScope: FeedScope) {
      return Promise.resolve(polls.filter((poll) => poll.scope.organizationId === currentScope.organizationId));
    },
    listPosts(currentScope: FeedScope) {
      return Promise.resolve(posts.filter((post) => post.scope.organizationId === currentScope.organizationId));
    },
    listReactions(postId: FeedReactionEntity["postId"]) {
      return Promise.resolve(reactions.filter((reaction) => reaction.postId === postId));
    },
    saveAnnouncement(announcement: FeedAnnouncementEntity) {
      const currentIndex = announcements.findIndex((candidate) => candidate.id === announcement.id);

      if (currentIndex >= 0) {
        announcements[currentIndex] = announcement;
      } else {
        announcements.push(announcement);
      }

      return Promise.resolve(announcement);
    },
    saveComment(comment: FeedCommentEntity) {
      const currentIndex = comments.findIndex((candidate) => candidate.id === comment.id);

      if (currentIndex >= 0) {
        comments[currentIndex] = comment;
      } else {
        comments.push(comment);
      }

      return Promise.resolve(comment);
    },
    saveFeedback(item: FeedFeedbackEntity) {
      const currentIndex = feedback.findIndex((candidate) => candidate.id === item.id);

      if (currentIndex >= 0) {
        feedback[currentIndex] = item;
      } else {
        feedback.push(item);
      }

      return Promise.resolve(item);
    },
    savePoll(poll: FeedPollEntity) {
      const currentIndex = polls.findIndex((candidate) => candidate.id === poll.id);

      if (currentIndex >= 0) {
        polls[currentIndex] = poll;
      } else {
        polls.push(poll);
      }

      return Promise.resolve(poll);
    },
    savePost(post: FeedPostEntity) {
      const currentIndex = posts.findIndex((candidate) => candidate.id === post.id);

      if (currentIndex >= 0) {
        posts[currentIndex] = post;
      } else {
        posts.push(post);
      }

      return Promise.resolve(post);
    },
    saveReaction(reaction: FeedReactionEntity) {
      const currentIndex = reactions.findIndex((candidate) => candidate.id === reaction.id);

      if (currentIndex >= 0) {
        reactions[currentIndex] = reaction;
      } else {
        reactions.push(reaction);
      }

      return Promise.resolve(reaction);
    },
  };
}

interface OperationsRepositoryHarnessInput {
  readonly checklistItemCompletions?: readonly ChecklistItemCompletionEntity[];
  readonly checklistRuns?: readonly ChecklistRunEntity[];
  readonly issues?: readonly OperationIssueEntity[];
  readonly learningBites?: readonly OperationLearningBiteEntity[];
}

function createOperationsRepositoryHarness(input?: OperationsRepositoryHarnessInput) {
  const checklistItemCompletions = [...(input?.checklistItemCompletions ?? [])];
  const checklistRuns = [...(input?.checklistRuns ?? [])];
  const issues = [...(input?.issues ?? [])];
  const learningBites = [...(input?.learningBites ?? [])];

  return {
    findChecklistRunById(id: ChecklistRunEntity["id"]) {
      return Promise.resolve(checklistRuns.find((run) => run.id === id));
    },
    listChecklistItemCompletions(currentScope: FeedScope) {
      return Promise.resolve(
        checklistItemCompletions.filter((item) => item.scope.organizationId === currentScope.organizationId),
      );
    },
    listChecklistRuns(currentScope: FeedScope) {
      return Promise.resolve(
        checklistRuns.filter((run) => run.scope.organizationId === currentScope.organizationId),
      );
    },
    listIssues(currentScope: FeedScope) {
      return Promise.resolve(
        issues.filter((issue) => issue.scope.organizationId === currentScope.organizationId),
      );
    },
    listLearningBites(currentScope: FeedScope) {
      return Promise.resolve(
        learningBites.filter((bite) => bite.scope.organizationId === currentScope.organizationId),
      );
    },
    saveChecklistItemCompletion(completion: ChecklistItemCompletionEntity) {
      const currentIndex = checklistItemCompletions.findIndex((candidate) => candidate.id === completion.id);

      if (currentIndex >= 0) {
        checklistItemCompletions[currentIndex] = completion;
      } else {
        checklistItemCompletions.push(completion);
      }

      return Promise.resolve(completion);
    },
    saveChecklistRun(run: ChecklistRunEntity) {
      const currentIndex = checklistRuns.findIndex((candidate) => candidate.id === run.id);

      if (currentIndex >= 0) {
        checklistRuns[currentIndex] = run;
      } else {
        checklistRuns.push(run);
      }

      return Promise.resolve(run);
    },
    saveIssue(issue: OperationIssueEntity) {
      const currentIndex = issues.findIndex((candidate) => candidate.id === issue.id);

      if (currentIndex >= 0) {
        issues[currentIndex] = issue;
      } else {
        issues.push(issue);
      }

      return Promise.resolve(issue);
    },
    saveLearningBite(learningBite: OperationLearningBiteEntity) {
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

interface RecognitionRepositoryHarnessInput {
  readonly ledgerEntries?: readonly PointsLedgerEntryEntity[];
  readonly recognitionEvents?: readonly RecognitionEventEntity[];
}

function createRecognitionRepositoryHarness(input?: RecognitionRepositoryHarnessInput) {
  const ledgerEntries = [...(input?.ledgerEntries ?? [])];
  const recognitionEvents = [...(input?.recognitionEvents ?? [])];

  return {
    listBadgeAwardsForUser() {
      return Promise.resolve([]);
    },
    listLedgerEntries(currentScope: FeedScope) {
      return Promise.resolve(
        ledgerEntries.filter((entry) => entry.scope.organizationId === currentScope.organizationId),
      );
    },
    listLedgerEntriesForUser(userId: PointsLedgerEntryEntity["userId"], currentScope: FeedScope) {
      return Promise.resolve(
        ledgerEntries.filter(
          (entry) => entry.userId === userId && entry.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    listRecognitionEvents(currentScope: FeedScope) {
      return Promise.resolve(
        recognitionEvents.filter((event) => event.scope.organizationId === currentScope.organizationId),
      );
    },
    listRecognitionEventsForUser(userId: RecognitionEventEntity["recipientUserId"], currentScope: FeedScope) {
      return Promise.resolve(
        recognitionEvents.filter(
          (event) => event.recipientUserId === userId && event.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    saveBadgeAward<TAward>(award: TAward) {
      return Promise.resolve(award);
    },
    saveLedgerEntry(entry: PointsLedgerEntryEntity) {
      const currentIndex = ledgerEntries.findIndex((candidate) => candidate.id === entry.id);

      if (currentIndex >= 0) {
        ledgerEntries[currentIndex] = entry;
      } else {
        ledgerEntries.push(entry);
      }

      return Promise.resolve(entry);
    },
    saveRecognitionEvent(event: RecognitionEventEntity) {
      const currentIndex = recognitionEvents.findIndex((candidate) => candidate.id === event.id);

      if (currentIndex >= 0) {
        recognitionEvents[currentIndex] = event;
      } else {
        recognitionEvents.push(event);
      }

      return Promise.resolve(event);
    },
  };
}

interface ScheduleRepositoryHarnessInput {
  readonly coverageRequirements?: readonly CoverageRequirementEntity[];
  readonly notifications?: readonly ScheduleNotificationEntity[];
  readonly requests?: readonly ScheduleRequestEntity[];
  readonly shifts?: readonly ShiftEntity[];
  readonly teamMembers?: readonly ScheduleTeamMemberHarness[];
}

function createScheduleRepositoryHarness(input?: ScheduleRepositoryHarnessInput) {
  const coverageRequirements = [...(input?.coverageRequirements ?? [])];
  const notifications = [...(input?.notifications ?? [])];
  const requests = [...(input?.requests ?? [])];
  const shifts = [...(input?.shifts ?? [])];
  const teamMembers = [...(input?.teamMembers ?? [])];

  return {
    countPendingRequestsForUser(userId: ScheduleRequestEntity["requesterUserId"], currentScope: FeedScope) {
      return Promise.resolve(
        requests.filter(
          (request) =>
            request.requesterUserId === userId &&
            request.status === "pending" &&
            request.scope.organizationId === currentScope.organizationId,
        ).length,
      );
    },
    findRequestById(id: ScheduleRequestEntity["id"]) {
      return Promise.resolve(requests.find((request) => request.id === id));
    },
    findShiftById(id: ShiftEntity["id"]) {
      return Promise.resolve(shifts.find((shift) => shift.id === id));
    },
    listCoverageRequirements(currentScope: FeedScope) {
      return Promise.resolve(
        coverageRequirements.filter((coverage) => coverage.scope.organizationId === currentScope.organizationId),
      );
    },
    listNotifications(currentScope: FeedScope) {
      return Promise.resolve(
        notifications.filter((notification) => notification.scope.organizationId === currentScope.organizationId),
      );
    },
    listNotificationsForUser(userId: ScheduleNotificationEntity["userId"], currentScope: FeedScope) {
      return Promise.resolve(
        notifications.filter(
          (notification) =>
            notification.userId === userId &&
            notification.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    listRequests(currentScope: FeedScope) {
      return Promise.resolve(
        requests.filter((request) => request.scope.organizationId === currentScope.organizationId),
      );
    },
    listRequestsForUser(userId: ScheduleRequestEntity["requesterUserId"], currentScope: FeedScope) {
      return Promise.resolve(
        requests.filter(
          (request) =>
            request.requesterUserId === userId &&
            request.scope.organizationId === currentScope.organizationId,
        ),
      );
    },
    listShifts(currentScope: FeedScope) {
      return Promise.resolve(
        shifts.filter((shift) => shift.scope.organizationId === currentScope.organizationId),
      );
    },
    listShiftsForUser(userId: ShiftEntity["userId"], currentScope: FeedScope) {
      return Promise.resolve(
        shifts.filter((shift) => shift.userId === userId && shift.scope.organizationId === currentScope.organizationId),
      );
    },
    listTeamMembers() {
      return Promise.resolve(teamMembers);
    },
    saveNotification(notification: ScheduleNotificationEntity) {
      const currentIndex = notifications.findIndex((candidate) => candidate.id === notification.id);

      if (currentIndex >= 0) {
        notifications[currentIndex] = notification;
      } else {
        notifications.push(notification);
      }

      return Promise.resolve(notification);
    },
    saveRequest(request: ScheduleRequestEntity) {
      const currentIndex = requests.findIndex((candidate) => candidate.id === request.id);

      if (currentIndex >= 0) {
        requests[currentIndex] = request;
      } else {
        requests.push(request);
      }

      return Promise.resolve(request);
    },
    saveShift(shift: ShiftEntity) {
      const currentIndex = shifts.findIndex((candidate) => candidate.id === shift.id);

      if (currentIndex >= 0) {
        shifts[currentIndex] = shift;
      } else {
        shifts.push(shift);
      }

      return Promise.resolve(shift);
    },
  };
}
