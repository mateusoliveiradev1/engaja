import { describe, expect, it } from "vitest";

import {
  createDevelopmentFlvRepositories,
  fromFeedAnnouncement,
  fromFeedPoll,
  fromFeedPost,
  toFeedAnnouncement,
  toFeedPost,
} from "../src/index.js";

describe("FLV repository adapters", () => {
  it("maps feed records into domain entities and back", async () => {
    const repositories = createDevelopmentFlvRepositories();
    const [post] = await repositories.feedRepository.listPosts({
      departmentId: "dept_flv" as string & { readonly __brand: "department" },
      organizationId: "org_demo" as string & { readonly __brand: "organization" },
      storeId: "store_001" as string & { readonly __brand: "store" },
    });

    expect(post?.title).toBe("Missao foto da bancada impecavel");
    expect(post?.status).toBe("published");
    expect(post === undefined ? undefined : fromFeedPost(post)).toMatchObject({
      id: "post_demo_photo_mission",
      organizationId: "org_demo",
      storeId: "store_001",
    });
  });

  it("provides development repositories aligned with section 7 summaries", async () => {
    const repositories = createDevelopmentFlvRepositories();
    const scope = {
      departmentId: "dept_flv" as string & { readonly __brand: "department" },
      organizationId: "org_demo" as string & { readonly __brand: "organization" },
      storeId: "store_001" as string & { readonly __brand: "store" },
    };

    await expect(repositories.feedRepository.countPostsByStatus("pending_moderation", scope)).resolves.toBe(4);
    await expect(
      repositories.scheduleRepository.countPendingRequestsForUser(
        "user_demo_colaborador" as string & { readonly __brand: "user" },
        scope,
      ),
    ).resolves.toBe(2);
    await expect(repositories.metricsRepository.listAttentionAreas(scope)).resolves.toHaveLength(2);
    await expect(repositories.feedRepository.listAnnouncements(scope)).resolves.toHaveLength(1);
    await expect(repositories.feedRepository.listPolls(scope)).resolves.toHaveLength(1);
  });

  it("exposes enriched operations records for routines, issues and learning", async () => {
    const repositories = createDevelopmentFlvRepositories();
    const scope = {
      departmentId: "dept_flv" as string & { readonly __brand: "department" },
      organizationId: "org_demo" as string & { readonly __brand: "organization" },
      storeId: "store_001" as string & { readonly __brand: "store" },
    };

    const checklistRuns = await repositories.operationsRepository.listChecklistRuns(scope);
    const checklistItemCompletions =
      await repositories.operationsRepository.listChecklistItemCompletions(scope);
    const issues = await repositories.operationsRepository.listIssues(scope);
    const learningBites = await repositories.operationsRepository.listLearningBites(scope);

    expect(checklistRuns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "checklist_run_1",
          routineId: "opening",
        }),
        expect.objectContaining({
          id: "checklist_run_4",
          routineId: "cleaning",
          status: "overdue",
        }),
      ]),
    );
    expect(checklistItemCompletions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidencePhotoUrl: "https://images.engaja.local/operations/opening-front.jpg",
          itemId: "opening-front",
          runId: "checklist_run_1",
        }),
      ]),
    );
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "Perda e quebra",
          productName: "Tomate grape",
          quantity: 6,
        }),
      ]),
    );
    expect(learningBites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "learning_bite_1",
          title: "Triagem expressa de frutas sensiveis",
        }),
      ]),
    );
  });

  it("creates domain feed posts from plain record payloads", () => {
    expect(
      toFeedPost({
        authorName: "Equipe FLV",
        authorUserId: "user_demo_colaborador",
        caption: "Registro de teste",
        category: "quality",
        createdAt: "2026-04-22T12:00:00.000Z",
        departmentId: "dept_flv",
        id: "record_demo",
        organizationId: "org_demo",
        publishedAt: "2026-04-22T12:10:00.000Z",
        status: "published",
        storeId: "store_001",
        title: "Registro validado",
        updatedAt: "2026-04-22T12:10:00.000Z",
        visibility: "department",
      }).title,
    ).toBe("Registro validado");
  });

  it("maps announcements and polls for engagement surface adapters", async () => {
    const repositories = createDevelopmentFlvRepositories();
    const scope = {
      departmentId: "dept_flv" as string & { readonly __brand: "department" },
      organizationId: "org_demo" as string & { readonly __brand: "organization" },
      storeId: "store_001" as string & { readonly __brand: "store" },
    };
    const [announcement] = await repositories.feedRepository.listAnnouncements(scope);
    const [poll] = await repositories.feedRepository.listPolls(scope);

    expect(announcement?.requiredAcknowledgement).toBe(true);
    expect(announcement === undefined ? undefined : fromFeedAnnouncement(announcement)).toMatchObject({
      id: "announcement_shift_push",
      organizationId: "org_demo",
    });
    expect(poll === undefined ? undefined : fromFeedPoll(poll)).toMatchObject({
      id: "poll_layout_priority",
      options: [
        expect.objectContaining({ id: "poll_option_a" }),
        expect.objectContaining({ id: "poll_option_b" }),
      ],
    });
  });

  it("creates announcements from plain record payloads", () => {
    expect(
      toFeedAnnouncement({
        body: "Reforcar a frente fria antes do pico.",
        createdAt: "2026-04-23T09:00:00.000Z",
        departmentId: "dept_flv",
        id: "announcement_demo",
        organizationId: "org_demo",
        readByUserIds: [],
        requiredAcknowledgement: true,
        status: "active",
        storeId: "store_001",
        title: "Aviso premium",
      }).title,
    ).toBe("Aviso premium");
  });
});
