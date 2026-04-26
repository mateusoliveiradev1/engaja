import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertValidDate,
} from "./base.js";
import { type DomainId, type Entity, createDomainId } from "./ids.js";
import type { RecognitionCategory } from "./recognition.js";
import { type TenantScope, type VisibilityScope } from "./scope.js";

export const feedCategories = [
  "display",
  "quality",
  "routine",
  "mission",
  "announcement",
] as const;

export type FeedCategory = (typeof feedCategories)[number];

export const feedPostStatuses = [
  "draft",
  "pending_moderation",
  "published",
  "hidden",
  "removed",
  "featured",
] as const;

export type FeedPostStatus = (typeof feedPostStatuses)[number];

export const feedModerationActions = [
  "submit",
  "approve",
  "hide",
  "pin",
  "feature",
  "remove",
] as const;

export type FeedModerationAction = (typeof feedModerationActions)[number];

export const feedReactionTypes = [
  "like",
  "aplauso",
  "inspirador",
  "duvida",
] as const;

export type FeedReactionType = (typeof feedReactionTypes)[number];

export const feedCommentStatuses = [
  "pending",
  "visible",
  "hidden",
  "removed",
] as const;

export type FeedCommentStatus = (typeof feedCommentStatuses)[number];

export const feedContentStatuses = [
  "draft",
  "scheduled",
  "active",
  "closed",
  "archived",
] as const;

export type FeedContentStatus = (typeof feedContentStatuses)[number];

export const feedFeedbackCategories = [
  "blocker",
  "idea",
  "routine",
  "improvement",
] as const;

export type FeedFeedbackCategory = (typeof feedFeedbackCategories)[number];

export const feedFeedbackStatuses = [
  "new",
  "reviewed",
  "resolved",
] as const;

export type FeedFeedbackStatus = (typeof feedFeedbackStatuses)[number];

export interface FeedMissionLink {
  readonly missionId?: DomainId<"mission">;
  readonly missionTitle?: string;
  readonly recognitionCategory?: RecognitionCategory;
  readonly rewardPoints?: number;
  readonly routineTitle?: string;
}

export interface FeedPost extends Entity<DomainId<"feed-post">> {
  readonly authorName: string;
  readonly authorUserId: DomainId<"user">;
  readonly caption: string;
  readonly category: FeedCategory;
  readonly createdAt: Date;
  readonly featuredAt?: Date;
  readonly missionLink?: FeedMissionLink;
  readonly pendingSync?: boolean;
  readonly photoUrl?: string;
  readonly pinnedAt?: Date;
  readonly publishedAt?: Date;
  readonly scope: TenantScope;
  readonly status: FeedPostStatus;
  readonly title: string;
  readonly updatedAt: Date;
  readonly visibility: VisibilityScope;
}

export interface FeedReaction extends Entity<DomainId<"feed-reaction">> {
  readonly createdAt: Date;
  readonly postId: DomainId<"feed-post">;
  readonly scope: TenantScope;
  readonly type: FeedReactionType;
  readonly userId: DomainId<"user">;
}

export interface FeedComment extends Entity<DomainId<"feed-comment">> {
  readonly authorName: string;
  readonly authorUserId: DomainId<"user">;
  readonly body: string;
  readonly createdAt: Date;
  readonly moderationReason?: string;
  readonly pendingSync?: boolean;
  readonly postId: DomainId<"feed-post">;
  readonly scope: TenantScope;
  readonly status: FeedCommentStatus;
  readonly updatedAt: Date;
}

export interface FeedAnnouncement extends Entity<DomainId<"announcement">> {
  readonly body: string;
  readonly createdAt: Date;
  readonly createdByUserId?: DomainId<"user">;
  readonly publishedAt?: Date;
  readonly readByUserIds: readonly DomainId<"user">[];
  readonly requiredAcknowledgement: boolean;
  readonly scope: TenantScope;
  readonly status: FeedContentStatus;
  readonly title: string;
}

export interface FeedPollOption extends Entity<DomainId<"poll-option">> {
  readonly label: string;
  readonly sortOrder: number;
}

export interface FeedPollVote extends Entity<DomainId<"poll-vote">> {
  readonly createdAt: Date;
  readonly optionId: DomainId<"poll-option">;
  readonly pollId: DomainId<"poll">;
  readonly userId: DomainId<"user">;
}

export interface FeedPoll extends Entity<DomainId<"poll">> {
  readonly closesAt?: Date;
  readonly createdAt: Date;
  readonly createdByUserId?: DomainId<"user">;
  readonly options: readonly FeedPollOption[];
  readonly prompt: string;
  readonly scope: TenantScope;
  readonly status: FeedContentStatus;
  readonly title: string;
  readonly votes: readonly FeedPollVote[];
}

export interface FeedFeedback extends Entity<DomainId<"feed-feedback">> {
  readonly authorUserId: DomainId<"user">;
  readonly category: FeedFeedbackCategory;
  readonly createdAt: Date;
  readonly message: string;
  readonly scope: TenantScope;
  readonly status: FeedFeedbackStatus;
}

export function createFeedPost(input: {
  readonly authorName: string;
  readonly authorUserId: string;
  readonly caption: string;
  readonly category: FeedCategory;
  readonly createdAt: Date;
  readonly featuredAt?: Date;
  readonly id: string;
  readonly missionLink?: {
    readonly missionId?: string | undefined;
    readonly missionTitle?: string | undefined;
    readonly recognitionCategory?: RecognitionCategory | undefined;
    readonly rewardPoints?: number | undefined;
    readonly routineTitle?: string | undefined;
  };
  readonly pendingSync?: boolean;
  readonly photoUrl?: string;
  readonly pinnedAt?: Date;
  readonly publishedAt?: Date;
  readonly scope: TenantScope;
  readonly status: FeedPostStatus;
  readonly title: string;
  readonly updatedAt?: Date;
  readonly visibility: VisibilityScope;
}): FeedPost {
  const createdAt = assertValidDate(input.createdAt, "createdAt");
  const updatedAt = assertValidDate(input.updatedAt ?? input.createdAt, "updatedAt");
  const publishedAt =
    input.publishedAt === undefined ? undefined : assertValidDate(input.publishedAt, "publishedAt");
  const featuredAt =
    input.featuredAt === undefined ? undefined : assertValidDate(input.featuredAt, "featuredAt");
  const pinnedAt = input.pinnedAt === undefined ? undefined : assertValidDate(input.pinnedAt, "pinnedAt");

  if ((input.status === "published" || input.status === "featured") && publishedAt === undefined) {
    throw new Error("publishedAt is required for visible feed posts.");
  }

  return {
    authorName: assertTrimmedLength(input.authorName, "authorName", 1, 120),
    authorUserId: createDomainId<"user">(assertNonEmptyString(input.authorUserId, "authorUserId")),
    caption: assertTrimmedLength(input.caption, "caption", 1, 500),
    category: input.category,
    createdAt,
    ...(featuredAt === undefined ? {} : { featuredAt }),
    id: createDomainId<"feed-post">(assertNonEmptyString(input.id, "id")),
    ...(input.missionLink === undefined
      ? {}
      : { missionLink: createFeedMissionLink(input.missionLink) }),
    ...(input.pendingSync === true ? { pendingSync: true } : {}),
    ...(input.photoUrl === undefined ? {} : { photoUrl: assertNonEmptyString(input.photoUrl, "photoUrl") }),
    ...(pinnedAt === undefined ? {} : { pinnedAt }),
    ...(publishedAt === undefined ? {} : { publishedAt }),
    scope: input.scope,
    status: input.status,
    title: assertTrimmedLength(input.title, "title", 1, 160),
    updatedAt,
    visibility: input.visibility,
  };
}

export function updateFeedPost(
  post: FeedPost,
  patch: Partial<Omit<FeedPost, "id">>,
): FeedPost {
  return createFeedPost({
    authorName: patch.authorName ?? post.authorName,
    authorUserId: patch.authorUserId ?? post.authorUserId,
    caption: patch.caption ?? post.caption,
    category: patch.category ?? post.category,
    createdAt: patch.createdAt ?? post.createdAt,
    ...(patch.featuredAt === undefined && post.featuredAt === undefined
      ? {}
      : { featuredAt: patch.featuredAt ?? post.featuredAt }),
    id: post.id,
    ...(patch.missionLink === undefined && post.missionLink === undefined
      ? {}
      : { missionLink: patch.missionLink ?? post.missionLink }),
    ...((patch.pendingSync ?? post.pendingSync) === undefined
      ? {}
      : { pendingSync: patch.pendingSync ?? post.pendingSync }),
    ...(patch.photoUrl === undefined && post.photoUrl === undefined
      ? {}
      : { photoUrl: patch.photoUrl ?? post.photoUrl }),
    ...(patch.pinnedAt === undefined && post.pinnedAt === undefined
      ? {}
      : { pinnedAt: patch.pinnedAt ?? post.pinnedAt }),
    ...(patch.publishedAt === undefined && post.publishedAt === undefined
      ? {}
      : { publishedAt: patch.publishedAt ?? post.publishedAt }),
    scope: patch.scope ?? post.scope,
    status: patch.status ?? post.status,
    title: patch.title ?? post.title,
    updatedAt: patch.updatedAt ?? new Date(),
    visibility: patch.visibility ?? post.visibility,
  });
}

export function createFeedReaction(input: {
  readonly createdAt: Date;
  readonly id: string;
  readonly postId: string;
  readonly scope: TenantScope;
  readonly type: FeedReactionType;
  readonly userId: string;
}): FeedReaction {
  return {
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"feed-reaction">(assertNonEmptyString(input.id, "id")),
    postId: createDomainId<"feed-post">(assertNonEmptyString(input.postId, "postId")),
    scope: input.scope,
    type: input.type,
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

export function createFeedComment(input: {
  readonly authorName: string;
  readonly authorUserId: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly id: string;
  readonly moderationReason?: string;
  readonly pendingSync?: boolean;
  readonly postId: string;
  readonly scope: TenantScope;
  readonly status: FeedCommentStatus;
  readonly updatedAt?: Date;
}): FeedComment {
  return {
    authorName: assertTrimmedLength(input.authorName, "authorName", 1, 120),
    authorUserId: createDomainId<"user">(assertNonEmptyString(input.authorUserId, "authorUserId")),
    body: assertTrimmedLength(input.body, "body", 1, 500),
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"feed-comment">(assertNonEmptyString(input.id, "id")),
    ...(input.moderationReason === undefined
      ? {}
      : { moderationReason: assertTrimmedLength(input.moderationReason, "moderationReason", 1, 240) }),
    ...(input.pendingSync === true ? { pendingSync: true } : {}),
    postId: createDomainId<"feed-post">(assertNonEmptyString(input.postId, "postId")),
    scope: input.scope,
    status: input.status,
    updatedAt: assertValidDate(input.updatedAt ?? input.createdAt, "updatedAt"),
  };
}

export function createFeedAnnouncement(input: {
  readonly body: string;
  readonly createdAt: Date;
  readonly createdByUserId?: string;
  readonly id: string;
  readonly publishedAt?: Date;
  readonly readByUserIds?: readonly string[];
  readonly requiredAcknowledgement?: boolean;
  readonly scope: TenantScope;
  readonly status: FeedContentStatus;
  readonly title: string;
}): FeedAnnouncement {
  return {
    body: assertTrimmedLength(input.body, "body", 1, 500),
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    ...(input.createdByUserId === undefined
      ? {}
      : {
          createdByUserId: createDomainId<"user">(
            assertNonEmptyString(input.createdByUserId, "createdByUserId"),
          ),
        }),
    id: createDomainId<"announcement">(assertNonEmptyString(input.id, "id")),
    ...(input.publishedAt === undefined
      ? {}
      : { publishedAt: assertValidDate(input.publishedAt, "publishedAt") }),
    readByUserIds: (input.readByUserIds ?? []).map((userId) =>
      createDomainId<"user">(assertNonEmptyString(userId, "readByUserIds")),
    ),
    requiredAcknowledgement: input.requiredAcknowledgement ?? false,
    scope: input.scope,
    status: input.status,
    title: assertTrimmedLength(input.title, "title", 1, 160),
  };
}

export function acknowledgeFeedAnnouncement(
  announcement: FeedAnnouncement,
  userId: string,
): FeedAnnouncement {
  const nextUserId = createDomainId<"user">(assertNonEmptyString(userId, "userId"));

  if (announcement.readByUserIds.includes(nextUserId)) {
    return announcement;
  }

  return {
    ...announcement,
    readByUserIds: [...announcement.readByUserIds, nextUserId],
  };
}

export function createFeedPoll(input: {
  readonly closesAt?: Date;
  readonly createdAt: Date;
  readonly createdByUserId?: string;
  readonly id: string;
  readonly options: readonly {
    readonly id: string;
    readonly label: string;
    readonly sortOrder?: number;
  }[];
  readonly prompt: string;
  readonly scope: TenantScope;
  readonly status: FeedContentStatus;
  readonly title: string;
  readonly votes?: readonly {
    readonly createdAt: Date;
    readonly id: string;
    readonly optionId: string;
    readonly pollId: string;
    readonly userId: string;
  }[];
}): FeedPoll {
  if (input.options.length < 2) {
    throw new Error("Feed polls require at least two options.");
  }

  const options = input.options
    .map((option, index) => createFeedPollOption({
      id: option.id,
      label: option.label,
      sortOrder: option.sortOrder ?? index,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const pollId = createDomainId<"poll">(assertNonEmptyString(input.id, "id"));
  const votes = (input.votes ?? []).map((vote) =>
    createFeedPollVote({
      createdAt: vote.createdAt,
      id: vote.id,
      optionId: vote.optionId,
      pollId: vote.pollId,
      userId: vote.userId,
    }),
  );

  return {
    ...(input.closesAt === undefined ? {} : { closesAt: assertValidDate(input.closesAt, "closesAt") }),
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    ...(input.createdByUserId === undefined
      ? {}
      : {
          createdByUserId: createDomainId<"user">(
            assertNonEmptyString(input.createdByUserId, "createdByUserId"),
          ),
        }),
    id: pollId,
    options,
    prompt: assertTrimmedLength(input.prompt, "prompt", 1, 240),
    scope: input.scope,
    status: input.status,
    title: assertTrimmedLength(input.title, "title", 1, 160),
    votes,
  };
}

export function voteInFeedPoll(
  poll: FeedPoll,
  input: {
    readonly createdAt: Date;
    readonly id: string;
    readonly optionId: string;
    readonly userId: string;
  },
): FeedPoll {
  if (poll.status === "closed" || poll.status === "archived") {
    throw new Error("This poll no longer accepts votes.");
  }

  const optionId = createDomainId<"poll-option">(assertNonEmptyString(input.optionId, "optionId"));

  if (!poll.options.some((option) => option.id === optionId)) {
    throw new Error("Poll option not found.");
  }

  const userId = createDomainId<"user">(assertNonEmptyString(input.userId, "userId"));
  const nextVote = createFeedPollVote({
    createdAt: input.createdAt,
    id: input.id,
    optionId,
    pollId: poll.id,
    userId,
  });

  return {
    ...poll,
    votes: [...poll.votes.filter((vote) => vote.userId !== userId), nextVote],
  };
}

export function createFeedFeedback(input: {
  readonly authorUserId: string;
  readonly category: FeedFeedbackCategory;
  readonly createdAt: Date;
  readonly id: string;
  readonly message: string;
  readonly scope: TenantScope;
  readonly status?: FeedFeedbackStatus;
}): FeedFeedback {
  return {
    authorUserId: createDomainId<"user">(assertNonEmptyString(input.authorUserId, "authorUserId")),
    category: input.category,
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"feed-feedback">(assertNonEmptyString(input.id, "id")),
    message: assertTrimmedLength(input.message, "message", 1, 500),
    scope: input.scope,
    status: input.status ?? "new",
  };
}

function createFeedMissionLink(input: {
  readonly missionId?: string | undefined;
  readonly missionTitle?: string | undefined;
  readonly recognitionCategory?: RecognitionCategory | undefined;
  readonly rewardPoints?: number | undefined;
  readonly routineTitle?: string | undefined;
}): FeedMissionLink {
  return {
    ...(input.missionId === undefined
      ? {}
      : { missionId: createDomainId<"mission">(assertNonEmptyString(input.missionId, "missionId")) }),
    ...(input.missionTitle === undefined
      ? {}
      : { missionTitle: assertTrimmedLength(input.missionTitle, "missionTitle", 1, 160) }),
    ...(input.recognitionCategory === undefined
      ? {}
      : { recognitionCategory: input.recognitionCategory }),
    ...(input.rewardPoints === undefined
      ? {}
      : { rewardPoints: assertNonNegativeInteger(input.rewardPoints, "rewardPoints") }),
    ...(input.routineTitle === undefined
      ? {}
      : { routineTitle: assertTrimmedLength(input.routineTitle, "routineTitle", 1, 160) }),
  };
}

function createFeedPollOption(input: {
  readonly id: string;
  readonly label: string;
  readonly sortOrder: number;
}): FeedPollOption {
  return {
    id: createDomainId<"poll-option">(assertNonEmptyString(input.id, "id")),
    label: assertTrimmedLength(input.label, "label", 1, 160),
    sortOrder: assertNonNegativeInteger(input.sortOrder, "sortOrder"),
  };
}

function createFeedPollVote(input: {
  readonly createdAt: Date;
  readonly id: string;
  readonly optionId: string;
  readonly pollId: string;
  readonly userId: string;
}): FeedPollVote {
  return {
    createdAt: assertValidDate(input.createdAt, "createdAt"),
    id: createDomainId<"poll-vote">(assertNonEmptyString(input.id, "id")),
    optionId: createDomainId<"poll-option">(assertNonEmptyString(input.optionId, "optionId")),
    pollId: createDomainId<"poll">(assertNonEmptyString(input.pollId, "pollId")),
    userId: createDomainId<"user">(assertNonEmptyString(input.userId, "userId")),
  };
}

function assertTrimmedLength(
  value: string,
  field: string,
  minimum: number,
  maximum: number,
): string {
  const trimmed = assertNonEmptyString(value, field);

  if (trimmed.length < minimum || trimmed.length > maximum) {
    throw new Error(`${field} must contain between ${minimum} and ${maximum} characters.`);
  }

  return trimmed;
}
