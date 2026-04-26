import type {
  FeedAnnouncementPayload,
  FeedCommentCreateRequestPayload,
  FeedCommentPayload,
  FeedFeedbackCreateRequestPayload,
  FeedFeedbackPayload,
  FeedHomePayload,
  FeedModerationActionPayload,
  FeedPollPayload,
  FeedPostCreateRequestPayload,
  FeedPostPayload,
  FeedReactionRequestPayload,
  FeedReactionTypePayload,
} from "@engaja/contracts";

import { createTypedApiClient } from "@engaja/data/mobile";

import {
  acknowledgeAnnouncementInFeedHome,
  addCommentToFeedHome,
  createPendingFeedComment,
  createReactionSummaries,
  mergeFeedHomePages,
  toggleReactionInFeedHome,
  votePollInFeedHome,
} from "./feed-state.js";
import { isMobileDemoFallbackEnabled } from "./demo-fallback.js";
import type { MobileSession } from "./providers.js";

const DEFAULT_API_BASE_URL = resolveApiBaseUrl();
const PAGE_SIZE = 4;

interface EngagementDemoStore {
  announcements: FeedAnnouncementPayload[];
  feedback: FeedFeedbackPayload[];
  polls: FeedPollPayload[];
  posts: FeedPostPayload[];
  requestCounter: number;
}

interface EngagementFeedService {
  acknowledgeAnnouncement(announcementId: string): Promise<FeedAnnouncementPayload>;
  addComment(input: FeedCommentCreateRequestPayload): Promise<FeedPostPayload>;
  createPost(input: FeedPostCreateRequestPayload): Promise<FeedPostPayload>;
  deletePost(postId: string): Promise<FeedPostPayload>;
  getHome(input?: { readonly cursor?: string; readonly limit?: number }): Promise<FeedHomePayload>;
  moderatePost(input: {
    readonly action: FeedModerationActionPayload;
    readonly postId: string;
  }): Promise<FeedPostPayload>;
  submitFeedback(input: FeedFeedbackCreateRequestPayload): Promise<FeedFeedbackPayload>;
  toggleReaction(input: FeedReactionRequestPayload): Promise<FeedPostPayload>;
  updateVisibility(input: {
    readonly postId: string;
    readonly visibility: FeedPostPayload["visibility"];
  }): Promise<FeedPostPayload>;
  votePoll(input: { readonly optionId: string; readonly pollId: string }): Promise<FeedPollPayload>;
}

let demoStore: EngagementDemoStore = createEngagementDemoStore();

export function createEngagementFeedService(
  session: MobileSession,
  options: {
    readonly fetcher?: typeof fetch;
    readonly offlineFallback?: boolean;
  } = {},
): EngagementFeedService {
  const apiClient = createTypedApiClient({
    accessTokenProvider: () => session.accessToken,
    baseUrl: DEFAULT_API_BASE_URL,
    fetcher: createResilientFeedFetcher(
      session,
      options.fetcher,
      options.offlineFallback ?? isMobileDemoFallbackEnabled(),
    ),
  });

  return {
    async acknowledgeAnnouncement(announcementId) {
      const response = await apiClient.request("feed.announcement.read", {
        body: {
          announcementId,
        },
      });

      return response.data;
    },
    async addComment(input) {
      const response = await apiClient.request("feed.comment.create", {
        body: input,
      });

      return response.data;
    },
    async createPost(input) {
      const response = await apiClient.request("feed.create", {
        body: input,
      });

      return response.data;
    },
    async deletePost(postId) {
      const response = await apiClient.request("feed.delete", {
        body: {
          postId,
        },
      });

      return response.data;
    },
    async getHome(input) {
      const response = await apiClient.request("feed.home", {
        query: {
          ...(input?.cursor === undefined ? {} : { cursor: input.cursor }),
          ...(input?.limit === undefined ? {} : { limit: input.limit }),
        },
      });

      return response.data;
    },
    async moderatePost(input) {
      const response = await apiClient.request("feed.moderation.action", {
        body: input,
      });

      return response.data;
    },
    async submitFeedback(input) {
      const response = await apiClient.request("feed.feedback.create", {
        body: input,
      });

      return response.data;
    },
    async toggleReaction(input) {
      const response = await apiClient.request("feed.reaction.toggle", {
        body: input,
      });

      return response.data;
    },
    async updateVisibility(input) {
      const response = await apiClient.request("feed.visibility.update", {
        body: input,
      });

      return response.data;
    },
    async votePoll(input) {
      const response = await apiClient.request("feed.poll.vote", {
        body: input,
      });

      return response.data;
    },
  };
}

function createResilientFeedFetcher(
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

      return handleMockFeedRequest(input, init, session);
    }
  };
}

async function handleMockFeedRequest(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  session: MobileSession,
): Promise<Response> {
  const url = toUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/feed/home" && method === "GET") {
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const parsedLimit = url.searchParams.get("limit");
    const limit =
      parsedLimit === null ? PAGE_SIZE : Math.max(1, Number.parseInt(parsedLimit, 10) || PAGE_SIZE);

    return jsonResponse(buildFeedHomePage(cursor, limit));
  }

  if (url.pathname === "/feed/posts" && method === "POST") {
    const body =
      (await readJsonBody<FeedPostCreateRequestPayload>(init)) ?? fail("Missing post body.");
    const createdPost = createMockPost(body, session);
    demoStore = {
      ...demoStore,
      posts: [createdPost, ...demoStore.posts].sort(compareFeedPosts),
    };

    return jsonResponse(clonePayload(createdPost));
  }

  if (url.pathname === "/feed/posts/visibility" && method === "POST") {
    const body =
      (await readJsonBody<{ postId: string; visibility: FeedPostPayload["visibility"] }>(init)) ??
      fail("Missing visibility body.");
    const post = findPost(body.postId);
    const updatedPost = {
      ...post,
      visibility: body.visibility,
    };

    demoStore = {
      ...demoStore,
      posts: replacePostInStore(updatedPost),
    };

    return jsonResponse(clonePayload(updatedPost));
  }

  if (url.pathname === "/feed/posts/delete" && method === "POST") {
    const body = (await readJsonBody<{ postId: string }>(init)) ?? fail("Missing delete body.");
    const post = findPost(body.postId);
    const deletedPost = {
      ...post,
      status: "removed" as const,
    };

    demoStore = {
      ...demoStore,
      posts: replacePostInStore(deletedPost),
    };

    return jsonResponse(clonePayload(deletedPost));
  }

  if (url.pathname === "/feed/reactions" && method === "POST") {
    const body =
      (await readJsonBody<FeedReactionRequestPayload>(init)) ?? fail("Missing reaction body.");
    const updatedHome = toggleReactionInFeedHome(buildFullHome(), body.postId, body.type);
    const updatedPost =
      updatedHome.posts.find((post) => post.id === body.postId) ?? fail("Post not found.");

    demoStore = {
      ...demoStore,
      posts: updatedHome.posts,
    };

    return jsonResponse(clonePayload(updatedPost));
  }

  if (url.pathname === "/feed/comments" && method === "POST") {
    const body =
      (await readJsonBody<FeedCommentCreateRequestPayload>(init)) ?? fail("Missing comment body.");
    const comment = createCommentPayload(body, session);
    const updatedHome = addCommentToFeedHome(buildFullHome(), body.postId, comment);
    const updatedPost =
      updatedHome.posts.find((post) => post.id === body.postId) ?? fail("Post not found.");

    demoStore = {
      ...demoStore,
      posts: updatedHome.posts,
    };

    return jsonResponse(clonePayload(updatedPost));
  }

  if (url.pathname === "/feed/moderation" && method === "POST") {
    const body =
      (await readJsonBody<{ action: FeedModerationActionPayload; postId: string }>(init)) ??
      fail("Missing moderation body.");
    const updatedPost = moderateMockPost(body.postId, body.action);

    demoStore = {
      ...demoStore,
      posts: replacePostInStore(updatedPost),
    };

    return jsonResponse(clonePayload(updatedPost));
  }

  if (url.pathname === "/feed/announcements/read" && method === "POST") {
    const body =
      (await readJsonBody<{ announcementId: string }>(init)) ?? fail("Missing announcement body.");
    const updatedHome = acknowledgeAnnouncementInFeedHome(buildFullHome(), body.announcementId);
    const announcement =
      updatedHome.announcements.find((item) => item.id === body.announcementId) ??
      fail("Announcement not found.");

    demoStore = {
      ...demoStore,
      announcements: updatedHome.announcements,
    };

    return jsonResponse(clonePayload(announcement));
  }

  if (url.pathname === "/feed/polls/votes" && method === "POST") {
    const body =
      (await readJsonBody<{ optionId: string; pollId: string }>(init)) ??
      fail("Missing poll body.");
    const updatedHome = votePollInFeedHome(buildFullHome(), body.pollId, body.optionId);
    const poll =
      updatedHome.polls.find((item) => item.id === body.pollId) ?? fail("Poll not found.");

    demoStore = {
      ...demoStore,
      polls: updatedHome.polls,
    };

    return jsonResponse(clonePayload(poll));
  }

  if (url.pathname === "/feed/feedback" && method === "POST") {
    const body =
      (await readJsonBody<FeedFeedbackCreateRequestPayload>(init)) ??
      fail("Missing feedback body.");
    const feedback = createFeedbackPayload(body, session);

    demoStore = {
      ...demoStore,
      feedback: [feedback, ...demoStore.feedback],
    };

    return jsonResponse(clonePayload(feedback));
  }

  return errorResponse("not_found", "Nao foi possivel carregar o mural agora.", 404);
}

function buildFeedHomePage(cursor: string | undefined, limit: number): FeedHomePayload {
  const offset = cursor === undefined ? 0 : Math.max(0, Number.parseInt(cursor, 10) || 0);
  const posts = [...demoStore.posts].sort(compareFeedPosts);
  const pagePosts = posts.slice(offset, offset + limit);
  const nextOffset = offset + pagePosts.length;
  const nextCursor = nextOffset < posts.length ? String(nextOffset) : undefined;

  return {
    announcements: clonePayload(demoStore.announcements),
    feedbackInboxCount: demoStore.feedback.filter((item) => item.status !== "resolved").length,
    ...(nextCursor === undefined ? {} : { nextCursor }),
    polls: clonePayload(demoStore.polls),
    posts: clonePayload(pagePosts),
  };
}

function buildFullHome(): FeedHomePayload {
  return mergeFeedHomePages([
    {
      announcements: demoStore.announcements,
      feedbackInboxCount: demoStore.feedback.filter((item) => item.status !== "resolved").length,
      polls: demoStore.polls,
      posts: demoStore.posts,
    },
  ]);
}

function createMockPost(
  input: FeedPostCreateRequestPayload,
  session: MobileSession,
): FeedPostPayload {
  const now = new Date().toISOString();
  const publishedImmediately = session.role !== "colaborador";
  const id = `post-mobile-${session.userId}-${Date.now()}`;
  const missionLink =
    input.missionLink === undefined
      ? undefined
      : {
          ...(input.missionLink.missionId === undefined
            ? {}
            : { missionId: input.missionLink.missionId }),
          ...(input.missionLink.missionTitle === undefined
            ? {}
            : { missionTitle: input.missionLink.missionTitle }),
          ...(input.missionLink.recognitionCategory === undefined
            ? {}
            : { recognitionCategory: input.missionLink.recognitionCategory }),
          recognitionEligible:
            publishedImmediately && input.missionLink.recognitionCategory !== undefined,
          rewardEligible: publishedImmediately && input.missionLink.rewardPoints !== undefined,
          ...(input.missionLink.rewardPoints === undefined
            ? {}
            : { rewardPoints: input.missionLink.rewardPoints }),
          ...(input.missionLink.routineTitle === undefined
            ? {}
            : { routineTitle: input.missionLink.routineTitle }),
        };

  return {
    authorName: input.authorName,
    caption: input.caption,
    category: input.category,
    comments: [],
    createdAt: now,
    id,
    ...(missionLink === undefined ? {} : { missionLink }),
    pendingSync: input.pendingSync ?? false,
    ...(input.photoUrl === undefined ? {} : { photoUrl: input.photoUrl }),
    ...(publishedImmediately ? { publishedAt: now } : {}),
    reactions: createReactionSummaries(),
    status: publishedImmediately ? "published" : "pending_moderation",
    title: input.title,
    visibility: input.visibility,
  };
}

function createCommentPayload(
  input: FeedCommentCreateRequestPayload,
  session: MobileSession,
): FeedCommentPayload {
  if (input.pendingSync === true) {
    return createPendingFeedComment(session, input.body);
  }

  return {
    authorName: input.authorName,
    body: input.body,
    createdAt: new Date().toISOString(),
    id: `comment-mobile-${session.userId}-${Date.now()}`,
    pendingSync: false,
    status: session.role === "colaborador" ? "pending" : "visible",
  };
}

function createFeedbackPayload(
  input: FeedFeedbackCreateRequestPayload,
  session: MobileSession,
): FeedFeedbackPayload {
  return {
    category: input.category,
    createdAt: new Date().toISOString(),
    id: `feedback-mobile-${session.userId}-${Date.now()}`,
    message: input.message,
    status: "new",
  };
}

function moderateMockPost(postId: string, action: FeedModerationActionPayload): FeedPostPayload {
  const post = findPost(postId);
  const publishedAt = post.publishedAt ?? new Date().toISOString();
  const missionLink =
    post.missionLink === undefined
      ? undefined
      : {
          ...post.missionLink,
          recognitionEligible: post.missionLink.recognitionCategory !== undefined,
          rewardEligible: post.missionLink.rewardPoints !== undefined,
        };

  if (action === "approve") {
    return {
      ...post,
      ...(missionLink === undefined ? {} : { missionLink }),
      pendingSync: false,
      publishedAt,
      status: "published",
    };
  }

  if (action === "feature") {
    return {
      ...post,
      ...(missionLink === undefined ? {} : { missionLink }),
      pendingSync: false,
      publishedAt,
      status: "featured",
    };
  }

  if (action === "pin") {
    const updatedPost = {
      ...post,
      ...(missionLink === undefined ? {} : { missionLink }),
      pendingSync: false,
      publishedAt,
      status: post.status === "removed" ? "published" : post.status,
    };

    demoStore = {
      ...demoStore,
      posts: [updatedPost, ...demoStore.posts.filter((candidate) => candidate.id !== post.id)],
    };

    return updatedPost;
  }

  if (action === "hide") {
    return {
      ...post,
      status: "hidden",
    };
  }

  return {
    ...post,
    status: "removed",
  };
}

function replacePostInStore(post: FeedPostPayload): FeedPostPayload[] {
  return demoStore.posts
    .map((currentPost) => (currentPost.id === post.id ? post : currentPost))
    .sort(compareFeedPosts);
}

function findPost(postId: string): FeedPostPayload {
  return demoStore.posts.find((post) => post.id === postId) ?? fail("Post not found.");
}

function createEngagementDemoStore(): EngagementDemoStore {
  return {
    announcements: [
      {
        acknowledged: false,
        body: "Reforcar folhas, tomate e berries antes das 17h para evitar quebra visual no segundo pico.",
        id: "announcement_shift_push",
        publishedAt: "2026-04-23T14:00:00.000Z",
        requiredAcknowledgement: true,
        status: "active",
        title: "Reforco antes do pico da tarde",
      },
    ],
    feedback: [
      {
        category: "blocker",
        createdAt: "2026-04-23T11:15:00.000Z",
        id: "feedback-demo-1",
        message: "Falta bandeja rasa para a ilha de folhas premium na abertura.",
        status: "new",
      },
    ],
    polls: [
      {
        id: "poll_layout_priority",
        options: [
          {
            id: "poll_option_a",
            label: "Ilha de folhas",
            voteCount: 1,
          },
          {
            id: "poll_option_b",
            label: "Ponta de berries",
            voteCount: 0,
          },
          {
            id: "poll_option_c",
            label: "Parede fria",
            voteCount: 0,
          },
        ],
        prompt: "Qual exposicao precisa de reforco visual primeiro?",
        status: "active",
        title: "Votacao rapida do setor",
        totalVotes: 1,
      },
    ],
    posts: [
      createDemoPost({
        authorName: "Julia Lima",
        caption: "Tomate, ervas e folhas revisados com leitura limpa para a abertura premium.",
        category: "mission",
        comments: [
          createDemoComment({
            authorName: "Lider de setor",
            body: "Boa leitura de cores e volume. Mantem este padrao no segundo pico.",
            createdAt: "2026-04-23T12:14:00.000Z",
            id: "comment-demo-1",
            status: "visible",
          }),
        ],
        createdAt: "2026-04-23T12:08:00.000Z",
        id: "post_demo_photo_mission",
        missionLink: {
          missionId: "mission_opening",
          missionTitle: "Missao abertura impecavel",
          recognitionCategory: "quality",
          recognitionEligible: true,
          rewardEligible: true,
          rewardPoints: 120,
          routineTitle: "Frente de banca",
        },
        photoUrl: "https://images.engaja.local/feed/opening-mission.jpg",
        publishedAt: "2026-04-23T12:20:00.000Z",
        reactions: createReactionSet(
          {
            aplauso: 1,
            duvida: 0,
            inspirador: 4,
            like: 12,
          },
          "like",
        ),
        status: "published",
        title: "Reposicao pronta com banca viva",
        visibility: "department",
      }),
      createDemoPost({
        authorName: "Mariana Lopes",
        caption: "Banca reconfigurada com mix alto de folhas e leitura imediata para o cliente.",
        category: "quality",
        comments: [],
        createdAt: "2026-04-23T10:34:00.000Z",
        id: "post-demo-featured-1",
        photoUrl: "https://images.engaja.local/feed/featured-leaves.jpg",
        publishedAt: "2026-04-23T10:50:00.000Z",
        reactions: createReactionSet({
          aplauso: 8,
          duvida: 1,
          inspirador: 6,
          like: 18,
        }),
        status: "featured",
        title: "Frente de folhas com leitura premium",
        visibility: "store",
      }),
      createDemoPost({
        authorName: "Carlos Souza",
        caption: "Padrao de berries revisado, mas ainda falta reforco de altura no lado direito.",
        category: "display",
        comments: [
          createDemoComment({
            authorName: "Ana Prado",
            body: "Concordo com o ajuste, principalmente perto do corredor central.",
            createdAt: "2026-04-23T09:32:00.000Z",
            id: "comment-demo-2",
            status: "visible",
          }),
        ],
        createdAt: "2026-04-23T09:10:00.000Z",
        id: "post-demo-display-1",
        photoUrl: "https://images.engaja.local/feed/berries-wall.jpg",
        publishedAt: "2026-04-23T09:25:00.000Z",
        reactions: createReactionSet({
          aplauso: 3,
          duvida: 2,
          inspirador: 2,
          like: 9,
        }),
        status: "published",
        title: "Parede de berries pronta para revisao",
        visibility: "department",
      }),
      createDemoPost({
        authorName: "Rafaela Costa",
        caption: "Checklist da abertura fechado com foto, limpeza final e placas revisadas.",
        category: "routine",
        comments: [],
        createdAt: "2026-04-23T08:40:00.000Z",
        id: "post-demo-routine-1",
        missionLink: {
          missionTitle: "Checklist visual da abertura",
          recognitionEligible: true,
          rewardEligible: false,
          routineTitle: "Abertura FLV",
        },
        photoUrl: "https://images.engaja.local/feed/opening-checklist.jpg",
        publishedAt: "2026-04-23T08:55:00.000Z",
        reactions: createReactionSet({
          aplauso: 4,
          duvida: 0,
          inspirador: 3,
          like: 14,
        }),
        status: "published",
        title: "Checklist visual concluido",
        visibility: "department",
      }),
      createDemoPost({
        authorName: "Igor Martins",
        caption: "Aguardando revisao da lideranca para a reorganizacao da ponta de citricos.",
        category: "mission",
        comments: [
          createDemoComment({
            authorName: "Igor Martins",
            body: "Se aprovado, replico o padrao no segundo corredor.",
            createdAt: "2026-04-23T07:54:00.000Z",
            id: "comment-demo-3",
            pendingSync: true,
            status: "pending",
          }),
        ],
        createdAt: "2026-04-23T07:45:00.000Z",
        id: "post-demo-pending-1",
        missionLink: {
          missionId: "mission-citrus",
          missionTitle: "Missao citricos vivos",
          recognitionCategory: "teamwork",
          recognitionEligible: false,
          rewardEligible: false,
          rewardPoints: 80,
        },
        photoUrl: "https://images.engaja.local/feed/citrus-pending.jpg",
        publishedAt: "2026-04-23T07:45:00.000Z",
        reactions: createReactionSet({
          aplauso: 0,
          duvida: 1,
          inspirador: 0,
          like: 2,
        }),
        status: "pending_moderation",
        title: "Ponta de citricos pronta para aprovar",
        visibility: "department",
      }),
      createDemoPost({
        authorName: "Fernanda Alves",
        caption: "Frente fria revisada com foco em melancia, manga e etiquetas legiveis.",
        category: "quality",
        comments: [],
        createdAt: "2026-04-22T18:10:00.000Z",
        id: "post-demo-quality-2",
        photoUrl: "https://images.engaja.local/feed/cold-wall.jpg",
        publishedAt: "2026-04-22T18:30:00.000Z",
        reactions: createReactionSet({
          aplauso: 5,
          duvida: 0,
          inspirador: 2,
          like: 11,
        }),
        status: "published",
        title: "Parede fria com leitura limpa",
        visibility: "store",
      }),
      createDemoPost({
        authorName: "Pedro Nunes",
        caption: "Apoio rapido na reposicao da ilha central antes do horario de almoco.",
        category: "display",
        comments: [],
        createdAt: "2026-04-22T16:22:00.000Z",
        id: "post-demo-display-2",
        photoUrl: "https://images.engaja.local/feed/central-island.jpg",
        publishedAt: "2026-04-22T16:40:00.000Z",
        reactions: createReactionSet({
          aplauso: 2,
          duvida: 0,
          inspirador: 1,
          like: 7,
        }),
        status: "published",
        title: "Ilha central pronta para o almoco",
        visibility: "department",
      }),
      createDemoPost({
        authorName: "Aline Rocha",
        caption: "Registro offline aguardando sincronizacao do corredor de raizes e tuberculos.",
        category: "routine",
        comments: [],
        createdAt: "2026-04-22T15:00:00.000Z",
        id: "post-demo-offline-1",
        pendingSync: true,
        photoUrl: "https://images.engaja.local/feed/offline-roots.jpg",
        publishedAt: "2026-04-22T15:00:00.000Z",
        reactions: createReactionSet(),
        status: "pending_moderation",
        title: "Reorganizacao pendente",
        visibility: "department",
      }),
    ],
    requestCounter: 0,
  };
}

function createDemoPost(input: {
  readonly authorName: string;
  readonly caption: string;
  readonly category: FeedPostPayload["category"];
  readonly comments: readonly FeedCommentPayload[];
  readonly createdAt: string;
  readonly id: string;
  readonly missionLink?: FeedPostPayload["missionLink"];
  readonly pendingSync?: boolean;
  readonly photoUrl?: string;
  readonly publishedAt?: string;
  readonly reactions: FeedPostPayload["reactions"];
  readonly status: FeedPostPayload["status"];
  readonly title: string;
  readonly visibility: FeedPostPayload["visibility"];
}): FeedPostPayload {
  return {
    authorName: input.authorName,
    caption: input.caption,
    category: input.category,
    comments: [...input.comments],
    createdAt: input.createdAt,
    id: input.id,
    ...(input.missionLink === undefined ? {} : { missionLink: input.missionLink }),
    pendingSync: input.pendingSync ?? false,
    ...(input.photoUrl === undefined ? {} : { photoUrl: input.photoUrl }),
    ...(input.publishedAt === undefined ? {} : { publishedAt: input.publishedAt }),
    reactions: [...input.reactions],
    status: input.status,
    title: input.title,
    visibility: input.visibility,
  };
}

function createDemoComment(input: {
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
  readonly id: string;
  readonly pendingSync?: boolean;
  readonly status: FeedCommentPayload["status"];
}): FeedCommentPayload {
  return {
    authorName: input.authorName,
    body: input.body,
    createdAt: input.createdAt,
    id: input.id,
    pendingSync: input.pendingSync ?? false,
    status: input.status,
  };
}

function createReactionSet(
  counts?: Partial<Record<FeedReactionTypePayload, number>>,
  selectedReactionType?: FeedReactionTypePayload,
): FeedPostPayload["reactions"] {
  return createReactionSummaries().map((reaction) => ({
    ...reaction,
    count: counts?.[reaction.type] ?? 0,
    selected: reaction.type === selectedReactionType,
  }));
}

function clonePayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function compareFeedPosts(left: FeedPostPayload, right: FeedPostPayload): number {
  return (right.publishedAt ?? right.createdAt).localeCompare(left.publishedAt ?? left.createdAt);
}

function jsonResponse<T>(data: T): Response {
  demoStore = {
    ...demoStore,
    requestCounter: demoStore.requestCounter + 1,
  };

  return new Response(
    JSON.stringify({
      data,
      requestId: `req_mobile_feed_${demoStore.requestCounter}`,
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
      requestId: `req_mobile_feed_${demoStore.requestCounter}`,
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
