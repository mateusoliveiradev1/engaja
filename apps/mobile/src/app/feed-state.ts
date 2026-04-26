import type {
  FeedAnnouncementPayload,
  FeedCategoryPayload,
  FeedCommentPayload,
  FeedFeedbackCategoryPayload,
  FeedHomePayload,
  FeedPollPayload,
  FeedPostPayload,
  FeedReactionSummaryPayload,
  FeedReactionTypePayload,
  RecognitionCategoryPayload,
  VisibilityScopePayload,
} from "@engaja/contracts";

import type { MobileSession } from "./providers.js";

export type FeedSourceSelection = "camera" | "gallery";

export interface FeedComposerDraft {
  readonly caption: string;
  readonly category: FeedCategoryPayload;
  readonly missionId: string;
  readonly missionTitle: string;
  readonly recognitionCategory: RecognitionCategoryPayload | "none";
  readonly rewardPoints: string;
  readonly routineTitle: string;
  readonly source: FeedSourceSelection;
  readonly title: string;
  readonly visibility: VisibilityScopePayload;
}

export interface FeedFeedbackDraft {
  readonly category: FeedFeedbackCategoryPayload;
  readonly message: string;
}

const reactionLabels: Record<FeedReactionTypePayload, string> = {
  aplauso: "Aplauso",
  duvida: "Duvida",
  inspirador: "Inspirador",
  like: "Curtir",
};

export function createDefaultFeedComposerDraft(): FeedComposerDraft {
  return {
    caption: "",
    category: "quality",
    missionId: "",
    missionTitle: "",
    recognitionCategory: "none",
    rewardPoints: "",
    routineTitle: "",
    source: "camera",
    title: "",
    visibility: "department",
  };
}

export function createDefaultFeedFeedbackDraft(): FeedFeedbackDraft {
  return {
    category: "idea",
    message: "",
  };
}

export function mergeFeedHomePages(pages: readonly FeedHomePayload[]): FeedHomePayload {
  const postsById = new Map<string, FeedPostPayload>();
  const announcementsById = new Map<string, FeedAnnouncementPayload>();
  const pollsById = new Map<string, FeedPollPayload>();
  let feedbackInboxCount = 0;
  let nextCursor: string | undefined;

  for (const page of pages) {
    feedbackInboxCount = Math.max(feedbackInboxCount, page.feedbackInboxCount);
    nextCursor = page.nextCursor;

    for (const announcement of page.announcements) {
      announcementsById.set(announcement.id, announcement);
    }

    for (const poll of page.polls) {
      pollsById.set(poll.id, poll);
    }

    for (const post of page.posts) {
      postsById.set(post.id, post);
    }
  }

  const mergedPosts = [...postsById.values()].sort(compareFeedPosts);
  const mergedAnnouncements = [...announcementsById.values()].sort((left, right) =>
    compareIsoDates(right.publishedAt ?? "", left.publishedAt ?? ""),
  );
  const mergedPolls = [...pollsById.values()].sort((left, right) =>
    left.title.localeCompare(right.title),
  );

  return {
    announcements: mergedAnnouncements,
    feedbackInboxCount,
    ...(nextCursor === undefined ? {} : { nextCursor }),
    polls: mergedPolls,
    posts: mergedPosts,
  };
}

export function prependFeedPost(home: FeedHomePayload, post: FeedPostPayload): FeedHomePayload {
  return mergeFeedHomePages([
    {
      ...home,
      posts: [post, ...home.posts],
    },
  ]);
}

export function replaceFeedPost(home: FeedHomePayload, post: FeedPostPayload): FeedHomePayload {
  return {
    ...home,
    posts: home.posts.map((currentPost) => (currentPost.id === post.id ? post : currentPost)),
  };
}

export function toggleReactionInFeedHome(
  home: FeedHomePayload,
  postId: string,
  reactionType: FeedReactionTypePayload,
): FeedHomePayload {
  return {
    ...home,
    posts: home.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            reactions: toggleReactionSummaries(post.reactions, reactionType),
          }
        : post,
    ),
  };
}

export function addCommentToFeedHome(
  home: FeedHomePayload,
  postId: string,
  comment: FeedCommentPayload,
): FeedHomePayload {
  return {
    ...home,
    posts: home.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [...post.comments, comment].sort((left, right) =>
              compareIsoDates(left.createdAt, right.createdAt),
            ),
          }
        : post,
    ),
  };
}

export function acknowledgeAnnouncementInFeedHome(
  home: FeedHomePayload,
  announcementId: string,
): FeedHomePayload {
  return {
    ...home,
    announcements: home.announcements.map((announcement) =>
      announcement.id === announcementId
        ? {
            ...announcement,
            acknowledged: true,
          }
        : announcement,
    ),
  };
}

export function votePollInFeedHome(
  home: FeedHomePayload,
  pollId: string,
  optionId: string,
): FeedHomePayload {
  return {
    ...home,
    polls: home.polls.map((poll) => {
      if (poll.id !== pollId || poll.viewerVoteOptionId === optionId) {
        return poll;
      }

      const previousVoteOptionId = poll.viewerVoteOptionId;
      const options = poll.options.map((option) => {
        if (option.id === optionId) {
          return {
            ...option,
            voteCount: option.voteCount + 1,
          };
        }

        if (previousVoteOptionId !== undefined && option.id === previousVoteOptionId) {
          return {
            ...option,
            voteCount: Math.max(0, option.voteCount - 1),
          };
        }

        return option;
      });
      const totalVotes = previousVoteOptionId === undefined ? poll.totalVotes + 1 : poll.totalVotes;

      return {
        ...poll,
        options,
        totalVotes,
        viewerVoteOptionId: optionId,
      };
    }),
  };
}

export function countPendingFeedItems(home: FeedHomePayload): number {
  return home.posts.reduce((total, post) => {
    const pendingComments = post.comments.filter((comment) => comment.pendingSync).length;

    return total + (post.pendingSync ? 1 : 0) + pendingComments;
  }, 0);
}

export function createPendingFeedPost(
  session: MobileSession,
  draft: FeedComposerDraft,
): FeedPostPayload {
  const now = new Date().toISOString();
  const id = `pending-post-${session.userId}-${Date.now()}`;
  const missionLink = toMissionLinkPayload(draft);

  return {
    authorName: session.displayName,
    caption: normalizeNonEmpty(
      draft.caption,
      "Registro preparado para sincronizar assim que a rede voltar.",
    ),
    category: draft.category,
    comments: [],
    createdAt: now,
    id,
    ...(missionLink === undefined ? {} : { missionLink }),
    pendingSync: true,
    photoUrl: `https://images.engaja.local/feed/${id}.jpg`,
    publishedAt: now,
    reactions: createReactionSummaries(),
    status: "pending_moderation",
    title: normalizeNonEmpty(draft.title, "Novo registro FLV"),
    visibility: draft.visibility,
  };
}

export function createPendingFeedComment(session: MobileSession, body: string): FeedCommentPayload {
  return {
    authorName: session.displayName,
    body: normalizeNonEmpty(body, "Comentario pendente de envio."),
    createdAt: new Date().toISOString(),
    id: `pending-comment-${session.userId}-${Date.now()}`,
    pendingSync: true,
    status: "pending",
  };
}

export function createReactionSummaries(
  selectedReactionType?: FeedReactionTypePayload,
): FeedReactionSummaryPayload[] {
  return (Object.keys(reactionLabels) as FeedReactionTypePayload[]).map((type) => ({
    count: selectedReactionType === type ? 1 : 0,
    label: reactionLabels[type],
    selected: selectedReactionType === type,
    type,
  }));
}

function toggleReactionSummaries(
  reactions: FeedReactionSummaryPayload[],
  reactionType: FeedReactionTypePayload,
): FeedReactionSummaryPayload[] {
  const selectedReaction = reactions.find((reaction) => reaction.selected);
  const shouldClearSelection = selectedReaction?.type === reactionType;

  return reactions.map((reaction) => {
    if (reaction.type === reactionType) {
      return {
        ...reaction,
        count: shouldClearSelection
          ? Math.max(0, reaction.count - 1)
          : reaction.selected
            ? reaction.count
            : reaction.count + 1,
        selected: !shouldClearSelection,
      };
    }

    if (reaction.selected) {
      return {
        ...reaction,
        count: Math.max(0, reaction.count - 1),
        selected: false,
      };
    }

    return reaction;
  });
}

function toMissionLinkPayload(
  draft: FeedComposerDraft,
): FeedPostPayload["missionLink"] | undefined {
  const rewardPoints = parseIntegerOrUndefined(draft.rewardPoints);
  const recognitionCategory =
    draft.recognitionCategory === "none" ? undefined : draft.recognitionCategory;

  if (
    draft.missionId.trim().length === 0 &&
    draft.missionTitle.trim().length === 0 &&
    draft.routineTitle.trim().length === 0 &&
    rewardPoints === undefined &&
    recognitionCategory === undefined
  ) {
    return undefined;
  }

  return {
    ...(draft.missionId.trim().length === 0 ? {} : { missionId: draft.missionId.trim() }),
    ...(draft.missionTitle.trim().length === 0 ? {} : { missionTitle: draft.missionTitle.trim() }),
    ...(recognitionCategory === undefined ? {} : { recognitionCategory }),
    recognitionEligible: false,
    rewardEligible: false,
    ...(rewardPoints === undefined ? {} : { rewardPoints }),
    ...(draft.routineTitle.trim().length === 0 ? {} : { routineTitle: draft.routineTitle.trim() }),
  };
}

function parseIntegerOrUndefined(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizeNonEmpty(value: string, fallbackValue: string): string {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : fallbackValue;
}

function compareFeedPosts(left: FeedPostPayload, right: FeedPostPayload): number {
  return compareIsoDates(right.publishedAt ?? right.createdAt, left.publishedAt ?? left.createdAt);
}

function compareIsoDates(left: string, right: string): number {
  return left.localeCompare(right);
}
