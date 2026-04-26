import { describe, expect, it } from "vitest";

import {
  acknowledgeAnnouncementInFeedHome,
  addCommentToFeedHome,
  countPendingFeedItems,
  createDefaultFeedComposerDraft,
  createPendingFeedComment,
  createPendingFeedPost,
  mergeFeedHomePages,
  toggleReactionInFeedHome,
  votePollInFeedHome,
} from "../src/app/feed-state.js";
import type { MobileSession } from "../src/app/providers.js";

const collaboratorSession: MobileSession = {
  displayName: "Julia Lima",
  role: "colaborador",
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_colaborador",
};

describe("feed mobile state helpers", () => {
  it("merges paginated feed pages without duplicating posts", () => {
    const merged = mergeFeedHomePages([
      createFeedHome({
        nextCursor: "2",
        posts: [
          createPost({ id: "post-a", publishedAt: "2026-04-23T12:00:00.000Z" }),
          createPost({ id: "post-b", publishedAt: "2026-04-23T12:05:00.000Z" }),
        ],
      }),
      createFeedHome({
        nextCursor: "3",
        posts: [
          createPost({ id: "post-b", publishedAt: "2026-04-23T12:05:00.000Z" }),
          createPost({ id: "post-c", publishedAt: "2026-04-23T12:10:00.000Z" }),
        ],
      }),
    ]);

    expect(merged.nextCursor).toBe("3");
    expect(merged.posts.map((post) => post.id)).toEqual(["post-c", "post-b", "post-a"]);
  });

  it("creates a pending offline post with mission metadata and sync flag", () => {
    const pendingPost = createPendingFeedPost(collaboratorSession, {
      ...createDefaultFeedComposerDraft(),
      caption: "Abertura pronta para sincronizar.",
      missionTitle: "Missao abertura impecavel",
      recognitionCategory: "quality",
      rewardPoints: "120",
      title: "Abertura validada",
    });

    expect(pendingPost.pendingSync).toBe(true);
    expect(pendingPost.status).toBe("pending_moderation");
    expect(pendingPost.missionLink).toMatchObject({
      missionTitle: "Missao abertura impecavel",
      recognitionEligible: false,
      rewardEligible: false,
      rewardPoints: 120,
    });
  });

  it("enforces the one-user reaction policy in optimistic state", () => {
    const home = createFeedHome({
      posts: [
        createPost({
          id: "post-a",
          reactions: [
            { count: 2, label: "Curtir", selected: true, type: "like" },
            { count: 1, label: "Aplauso", selected: false, type: "aplauso" },
            { count: 0, label: "Inspirador", selected: false, type: "inspirador" },
            { count: 0, label: "Duvida", selected: false, type: "duvida" },
          ],
        }),
      ],
    });

    const updatedHome = toggleReactionInFeedHome(home, "post-a", "aplauso");
    const updatedPost = updatedHome.posts[0]!;

    expect(updatedPost.reactions.find((reaction) => reaction.type === "like")).toMatchObject({
      count: 1,
      selected: false,
    });
    expect(updatedPost.reactions.find((reaction) => reaction.type === "aplauso")).toMatchObject({
      count: 2,
      selected: true,
    });
  });

  it("clears the previous reaction when switching and can remove the active reaction", () => {
    const home = createFeedHome({
      posts: [
        createPost({
          id: "post-a",
          reactions: [
            { count: 0, label: "Curtir", selected: false, type: "like" },
            { count: 0, label: "Aplauso", selected: false, type: "aplauso" },
            { count: 0, label: "Inspirador", selected: false, type: "inspirador" },
            { count: 0, label: "Duvida", selected: false, type: "duvida" },
          ],
        }),
      ],
    });

    const likedHome = toggleReactionInFeedHome(home, "post-a", "like");
    const inspiredHome = toggleReactionInFeedHome(likedHome, "post-a", "inspirador");
    const clearedHome = toggleReactionInFeedHome(inspiredHome, "post-a", "inspirador");

    expect(inspiredHome.posts[0]!.reactions).toEqual([
      { count: 0, label: "Curtir", selected: false, type: "like" },
      { count: 0, label: "Aplauso", selected: false, type: "aplauso" },
      { count: 1, label: "Inspirador", selected: true, type: "inspirador" },
      { count: 0, label: "Duvida", selected: false, type: "duvida" },
    ]);
    expect(clearedHome.posts[0]!.reactions.every((reaction) => !reaction.selected)).toBe(true);
    expect(clearedHome.posts[0]!.reactions.every((reaction) => reaction.count >= 0)).toBe(true);
  });

  it("adds pending comments and counts local queue items", () => {
    const home = createFeedHome({
      posts: [createPost({ id: "post-a" })],
    });
    const pendingComment = createPendingFeedComment(
      collaboratorSession,
      "Comentario salvo localmente.",
    );
    const updatedHome = addCommentToFeedHome(home, "post-a", pendingComment);

    expect(updatedHome.posts[0]!.comments).toHaveLength(1);
    expect(updatedHome.posts[0]!.comments[0]).toMatchObject({
      pendingSync: true,
      status: "pending",
    });
    expect(countPendingFeedItems(updatedHome)).toBe(1);
  });

  it("inserts optimistic comments in chronological order and counts all pending sync items", () => {
    const home = createFeedHome({
      posts: [
        createPost({
          comments: [
            createComment({
              body: "Comentario mais antigo.",
              createdAt: "2026-04-23T12:01:00.000Z",
              id: "comment-old",
            }),
          ],
          id: "post-a",
          pendingSync: true,
        }),
      ],
    });
    const pendingComment = {
      ...createPendingFeedComment(collaboratorSession, "Comentario novo em fila."),
      createdAt: "2026-04-23T12:03:00.000Z",
      id: "comment-new",
    };
    const updatedHome = addCommentToFeedHome(home, "post-a", pendingComment);

    expect(updatedHome.posts[0]!.comments.map((comment) => comment.id)).toEqual([
      "comment-old",
      "comment-new",
    ]);
    expect(countPendingFeedItems(updatedHome)).toBe(2);
  });

  it("marks announcements as acknowledged and updates poll votes optimistically", () => {
    const home = createFeedHome({
      announcements: [
        {
          acknowledged: false,
          body: "Reforcar folhas antes das 17h.",
          id: "announcement-1",
          requiredAcknowledgement: true,
          status: "active",
          title: "Pico da tarde",
        },
      ],
      polls: [
        {
          id: "poll-1",
          options: [
            { id: "option-a", label: "Ilha de folhas", voteCount: 1 },
            { id: "option-b", label: "Ponta de berries", voteCount: 0 },
          ],
          prompt: "Qual exposicao precisa de reforco?",
          status: "active",
          title: "Votacao rapida",
          totalVotes: 1,
        },
      ],
    });

    const acknowledgedHome = acknowledgeAnnouncementInFeedHome(home, "announcement-1");
    const votedHome = votePollInFeedHome(acknowledgedHome, "poll-1", "option-b");

    expect(votedHome.announcements[0]!.acknowledged).toBe(true);
    expect(votedHome.polls[0]).toMatchObject({
      totalVotes: 2,
      viewerVoteOptionId: "option-b",
    });
    expect(votedHome.polls[0]!.options.find((option) => option.id === "option-b")?.voteCount).toBe(1);
  });
});

function createFeedHome(input?: {
  readonly announcements?: Array<{
    acknowledged: boolean;
    body: string;
    id: string;
    requiredAcknowledgement: boolean;
    status: "active";
    title: string;
  }>;
  readonly nextCursor?: string;
  readonly polls?: Array<{
    id: string;
    options: Array<{
      id: string;
      label: string;
      voteCount: number;
    }>;
    prompt: string;
    status: "active";
    title: string;
    totalVotes: number;
    viewerVoteOptionId?: string;
  }>;
  readonly posts?: Array<ReturnType<typeof createPost>>;
}) {
  return {
    announcements: input?.announcements ?? [],
    feedbackInboxCount: 0,
    ...(input?.nextCursor === undefined ? {} : { nextCursor: input.nextCursor }),
    polls: input?.polls ?? [],
    posts: input?.posts ?? [],
  };
}

function createPost(input?: {
  readonly comments?: Array<ReturnType<typeof createComment>>;
  readonly id?: string;
  readonly pendingSync?: boolean;
  readonly publishedAt?: string;
  readonly reactions?: Array<{
    count: number;
    label: string;
    selected: boolean;
    type: "like" | "aplauso" | "inspirador" | "duvida";
  }>;
}) {
  return {
    authorName: "Julia Lima",
    caption: "Registro do setor.",
    category: "quality" as const,
    comments: input?.comments ?? [],
    createdAt: "2026-04-23T12:00:00.000Z",
    id: input?.id ?? "post-a",
    pendingSync: input?.pendingSync ?? false,
    photoUrl: "https://images.engaja.local/feed/demo-post.jpg",
    publishedAt: input?.publishedAt ?? "2026-04-23T12:05:00.000Z",
    reactions:
      input?.reactions ?? [
        { count: 1, label: "Curtir", selected: false, type: "like" as const },
        { count: 0, label: "Aplauso", selected: false, type: "aplauso" as const },
        { count: 0, label: "Inspirador", selected: false, type: "inspirador" as const },
        { count: 0, label: "Duvida", selected: false, type: "duvida" as const },
      ],
    status: "published" as const,
    title: "Registro FLV",
    visibility: "department" as const,
  };
}

function createComment(input?: {
  readonly body?: string;
  readonly createdAt?: string;
  readonly id?: string;
  readonly pendingSync?: boolean;
}) {
  return {
    authorName: "Mateus Rocha",
    body: input?.body ?? "Comentario do setor.",
    createdAt: input?.createdAt ?? "2026-04-23T12:01:00.000Z",
    id: input?.id ?? "comment-a",
    pendingSync: input?.pendingSync ?? false,
    status: "visible" as const,
  };
}
