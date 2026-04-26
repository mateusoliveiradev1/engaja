import { sql, type SQL } from "drizzle-orm";

import type { EngajaDatabase } from "../client.js";

export const seedIds = {
  organization: "6a64dca7-6f68-4b26-80d1-0f72e9f42001",
  store: "6a64dca7-6f68-4b26-80d1-0f72e9f42002",
  department: "6a64dca7-6f68-4b26-80d1-0f72e9f42003",
  users: {
    colaborador: "6a64dca7-6f68-4b26-80d1-0f72e9f42101",
    liderSetor: "6a64dca7-6f68-4b26-80d1-0f72e9f42102",
    gerenteLoja: "6a64dca7-6f68-4b26-80d1-0f72e9f42103",
    adminOrganizacao: "6a64dca7-6f68-4b26-80d1-0f72e9f42104",
    auditor: "6a64dca7-6f68-4b26-80d1-0f72e9f42105",
  },
  roles: {
    colaborador: "6a64dca7-6f68-4b26-80d1-0f72e9f42201",
    liderSetor: "6a64dca7-6f68-4b26-80d1-0f72e9f42202",
    gerenteLoja: "6a64dca7-6f68-4b26-80d1-0f72e9f42203",
    adminOrganizacao: "6a64dca7-6f68-4b26-80d1-0f72e9f42204",
    auditor: "6a64dca7-6f68-4b26-80d1-0f72e9f42205",
  },
  memberships: {
    colaborador: "6a64dca7-6f68-4b26-80d1-0f72e9f42211",
    liderSetor: "6a64dca7-6f68-4b26-80d1-0f72e9f42212",
    gerenteLoja: "6a64dca7-6f68-4b26-80d1-0f72e9f42213",
    adminOrganizacao: "6a64dca7-6f68-4b26-80d1-0f72e9f42214",
    auditor: "6a64dca7-6f68-4b26-80d1-0f72e9f42215",
  },
  authCredentials: {
    adminOrganizacao: "6a64dca7-6f68-4b26-80d1-0f72e9f42221",
  },
  invites: {
    pendingCollaborator: "6a64dca7-6f68-4b26-80d1-0f72e9f42231",
  },
  media: "6a64dca7-6f68-4b26-80d1-0f72e9f42301",
  mission: "6a64dca7-6f68-4b26-80d1-0f72e9f42302",
  feedPost: "6a64dca7-6f68-4b26-80d1-0f72e9f42303",
  shift: "6a64dca7-6f68-4b26-80d1-0f72e9f42401",
  checklist: "6a64dca7-6f68-4b26-80d1-0f72e9f42501",
  checklistItem: "6a64dca7-6f68-4b26-80d1-0f72e9f42502",
  checklistRun: "6a64dca7-6f68-4b26-80d1-0f72e9f42503",
  standard: "6a64dca7-6f68-4b26-80d1-0f72e9f42504",
  recognition: "6a64dca7-6f68-4b26-80d1-0f72e9f42601",
  badge: "6a64dca7-6f68-4b26-80d1-0f72e9f42602",
  achievement: "6a64dca7-6f68-4b26-80d1-0f72e9f42603",
  campaigns: {
    approvedPhotoParticipation: "6a64dca7-6f68-4b26-80d1-0f72e9f42701",
    validatedBancaSetup: "6a64dca7-6f68-4b26-80d1-0f72e9f42702",
  },
  eligibleEvents: {
    approvedPhotoParticipation: "6a64dca7-6f68-4b26-80d1-0f72e9f42801",
    validatedBancaSetup: "6a64dca7-6f68-4b26-80d1-0f72e9f42802",
  },
  rewardGrants: {
    validatedBancaSetupWinner: "6a64dca7-6f68-4b26-80d1-0f72e9f42901",
  },
  archiveItems: {
    validatedBancaSetupWin: "6a64dca7-6f68-4b26-80d1-0f72e9f42902",
    validatedBancaSetupPrize: "6a64dca7-6f68-4b26-80d1-0f72e9f42903",
  },
} as const;

export const developmentSeedUsers = [
  {
    email: "camila.colaborador@engaja.local",
    id: seedIds.users.colaborador,
    name: "Camila Santos",
    role: "colaborador",
  },
  {
    email: "rafael.lider@engaja.local",
    id: seedIds.users.liderSetor,
    name: "Rafael Oliveira",
    role: "lider-setor",
  },
  {
    email: "marina.gerente@engaja.local",
    id: seedIds.users.gerenteLoja,
    name: "Marina Costa",
    role: "gerente-loja",
  },
  {
    email: "admin.organizacao@engaja.local",
    id: seedIds.users.adminOrganizacao,
    name: "Andru Admin",
    role: "admin-organizacao",
  },
  {
    email: "auditoria@engaja.local",
    id: seedIds.users.auditor,
    name: "Equipe Auditoria",
    role: "auditor",
  },
] as const;

export const developmentSeedBudget = {
  maxFeedPosts: 2,
  maxMediaObjects: 2,
  maxRecognitionEvents: 2,
  maxScheduleRows: 2,
  maxTotalMediaBytes: 75_000,
  maxUsers: 5,
} as const;

export const developmentSeedSummary = {
  archiveItemCount: 2,
  collaboratorCount: 1,
  departmentName: "FLV",
  engagementCampaignCount: 2,
  feedPostCount: 1,
  includesRoles: developmentSeedUsers.map((user) => user.role),
  mediaObjectCount: 1,
  organizationSlug: "andru-market",
  rewardGrantCount: 1,
  storeCode: "loja-centro",
  totalRecognitionEvents: 1,
  totalScheduleRows: 1,
  totalSeedMediaBytes: 48_211,
  totalUsers: developmentSeedUsers.length,
  pendingInviteCount: 1,
} as const;

interface SeedStatement {
  readonly label: string;
  readonly statement: SQL;
}

interface SeedResult {
  readonly insertedLabels: readonly string[];
}

const roleDescriptions = {
  colaborador: "Acessa escala propria, feed permitido, rotinas atribuidas e recompensas proprias.",
  "lider-setor": "Modera feed, rotinas, checklists, escala e reconhecimento no escopo FLV.",
  "gerente-loja": "Gerencia dashboards, liderancas e aprovacoes escaladas da loja.",
  "admin-organizacao":
    "Administra organizacao, lojas, departamentos, usuarios, papeis e integracoes.",
  auditor: "Acessa logs, evidencias e relatorios sensiveis em modo somente leitura.",
} as const;

function toJsonb(value: unknown): SQL {
  return sql`${JSON.stringify(value)}::jsonb`;
}

const seedStatements: readonly SeedStatement[] = [
  {
    label: "organization",
    statement: sql`
      insert into organizations (id, slug, name, status, timezone)
      values (${seedIds.organization}, 'andru-market', 'Andru Market', 'active', 'America/Sao_Paulo')
      on conflict (slug) do nothing
    `,
  },
  {
    label: "store",
    statement: sql`
      insert into stores (id, organization_id, code, name, timezone)
      values (${seedIds.store}, ${seedIds.organization}, 'loja-centro', 'Loja Centro', 'America/Sao_Paulo')
      on conflict (organization_id, code) do nothing
    `,
  },
  {
    label: "department",
    statement: sql`
      insert into departments (id, organization_id, store_id, code, name)
      values (${seedIds.department}, ${seedIds.organization}, ${seedIds.store}, 'flv', 'FLV')
      on conflict (store_id, code) do nothing
    `,
  },
  ...developmentSeedUsers.map((user) => ({
    label: `user:${user.role}`,
    statement: sql`
      insert into users (id, email, display_name, preferred_name, active)
      values (${user.id}, ${user.email}, ${user.name}, split_part(${user.name}, ' ', 1), true)
      on conflict (email) do nothing
    `,
  })),
  ...developmentSeedUsers.map((user) => ({
    label: `role:${user.role}`,
    statement: sql`
      insert into roles (id, organization_id, code, name, description, system_role)
      values (
        ${roleIdFor(user.role)},
        ${seedIds.organization},
        ${user.role},
        ${roleNameFor(user.role)},
        ${roleDescriptions[user.role]},
        true
      )
      on conflict (organization_id, code) do nothing
    `,
  })),
  {
    label: "auth-credential:first-admin",
    statement: sql`
      insert into auth_credentials (
        id,
        user_id,
        email,
        password_hash,
        password_hash_version,
        status
      )
      values (
        ${seedIds.authCredentials.adminOrganizacao},
        ${seedIds.users.adminOrganizacao},
        'admin.organizacao@engaja.local',
        'seed-placeholder-hash-first-admin',
        'seed-placeholder',
        'active'
      )
      on conflict (user_id) do update
        set email = excluded.email,
            password_hash = auth_credentials.password_hash,
            updated_at = now()
    `,
  },
  ...developmentSeedUsers.map((user) => ({
    label: `membership:${user.role}`,
    statement: sql`
      insert into memberships (
        id,
        organization_id,
        store_id,
        department_id,
        user_id,
        role_id,
        status,
        starts_at
      )
      select
        ${membershipIdFor(user.role)},
        ${seedIds.organization},
        ${storeIdFor(user.role)},
        ${departmentIdFor(user.role)},
        ${user.id},
        ${roleIdFor(user.role)},
        'active',
        '2026-04-01'
      where not exists (
        select 1
        from memberships
        where user_id = ${user.id}
          and organization_id = ${seedIds.organization}
          and role_id = ${roleIdFor(user.role)}
          and store_id is not distinct from ${storeIdFor(user.role)}
          and department_id is not distinct from ${departmentIdFor(user.role)}
      )
      on conflict (id) do nothing
    `,
  })),
  {
    label: "access-invite:pending-collaborator",
    statement: sql`
      insert into access_invites (
        id,
        organization_id,
        store_id,
        department_id,
        email,
        role_id,
        role_code,
        token_hash,
        status,
        expires_at,
        invited_by_user_id,
        delivery_channel,
        intended_membership
      )
      values (
        ${seedIds.invites.pendingCollaborator},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        'novo.colaborador@engaja.local',
        ${seedIds.roles.colaborador},
        'colaborador',
        'd4d335ef4ca3fdc18de15ed41d30201f3b3c2cbba9d4f69f6f2c59a38cc36a10',
        'pending',
        now() + interval '14 days',
        ${seedIds.users.liderSetor},
        'manual',
        ${toJsonb({
          departmentId: seedIds.department,
          organizationId: seedIds.organization,
          roleCode: "colaborador",
          storeId: seedIds.store,
        })}
      )
      on conflict (token_hash) do nothing
    `,
  },
  {
    label: "quality-standard",
    statement: sql`
      insert into quality_standards (
        id,
        organization_id,
        store_id,
        department_id,
        title,
        product_category,
        instructions,
        active
      )
      values (
        ${seedIds.standard},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        'Banca de folhas pronta para abertura',
        'folhagens',
        'Remover folhas danificadas, borrifar agua e alinhar etiquetas antes da abertura.',
        true
      )
      on conflict do nothing
    `,
  },
  {
    label: "mission",
    statement: sql`
      insert into photo_missions (
        id,
        organization_id,
        store_id,
        department_id,
        created_by_user_id,
        title,
        prompt,
        reward_points,
        status,
        starts_at,
        ends_at
      )
      values (
        ${seedIds.mission},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.liderSetor},
        'Banca campea da abertura',
        'Poste uma foto da banca de folhas depois da revisao de qualidade.',
        20,
        'active',
        '2026-04-22 07:00:00-03',
        '2026-04-29 22:00:00-03'
      )
      on conflict do nothing
    `,
  },
  {
    label: "media",
    statement: sql`
      insert into media_objects (
        id,
        organization_id,
        store_id,
        department_id,
        owner_user_id,
        storage_provider,
        storage_key,
        content_type,
        byte_size,
        sha256_hash,
        width,
        height,
        target_type,
        access_scope,
        moderation_state,
        finalized_at
      )
      values (
        ${seedIds.media},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        'local-filesystem',
        'seed/flv/banca-folhas.jpg',
        'image/jpeg',
        48211,
        '53bcb86b2d674f9e1f983f49e4ad2ce22cfd8e03d9d4a8e86a15fbdd8bb6dd2d',
        1200,
        900,
        'feed_post',
        'department',
        'approved',
        '2026-04-22 08:35:00-03'
      )
      on conflict (storage_provider, storage_key) do nothing
    `,
  },
  {
    label: "feed-post",
    statement: sql`
      insert into feed_posts (
        id,
        organization_id,
        store_id,
        department_id,
        author_user_id,
        mission_id,
        category,
        caption,
        status,
        visibility_scope,
        published_at
      )
      values (
        ${seedIds.feedPost},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.mission},
        'qualidade',
        'Banca revisada antes da abertura, com folhas hidratadas e etiquetas alinhadas.',
        'published',
        'department',
        '2026-04-22 08:40:00-03'
      )
      on conflict do nothing
    `,
  },
  {
    label: "feed-post-media",
    statement: sql`
      insert into feed_post_media (feed_post_id, media_object_id, sort_order)
      values (${seedIds.feedPost}, ${seedIds.media}, 0)
      on conflict (feed_post_id, media_object_id) do nothing
    `,
  },
  {
    label: "shift",
    statement: sql`
      insert into shifts (
        id,
        organization_id,
        store_id,
        department_id,
        user_id,
        role_code,
        title,
        starts_at,
        ends_at,
        break_minutes,
        status,
        published_at,
        created_by_user_id
      )
      values (
        ${seedIds.shift},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        'colaborador',
        'Abertura FLV',
        '2026-04-23 06:30:00-03',
        '2026-04-23 14:30:00-03',
        60,
        'published',
        '2026-04-22 12:00:00-03',
        ${seedIds.users.liderSetor}
      )
      on conflict do nothing
    `,
  },
  {
    label: "checklist",
    statement: sql`
      insert into checklists (id, organization_id, store_id, department_id, title, frequency, active)
      values (
        ${seedIds.checklist},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        'Abertura FLV',
        'opening',
        true
      )
      on conflict do nothing
    `,
  },
  {
    label: "checklist-item",
    statement: sql`
      insert into checklist_items (
        id,
        checklist_id,
        standard_id,
        sort_order,
        title,
        instructions,
        item_type,
        requires_evidence,
        active
      )
      values (
        ${seedIds.checklistItem},
        ${seedIds.checklist},
        ${seedIds.standard},
        10,
        'Revisar folhas da banca principal',
        'Remover perdas visiveis e fotografar a banca pronta.',
        'photo',
        true,
        true
      )
      on conflict do nothing
    `,
  },
  {
    label: "checklist-run",
    statement: sql`
      insert into checklist_runs (
        id,
        organization_id,
        store_id,
        department_id,
        checklist_id,
        shift_id,
        assigned_user_id,
        status,
        due_at,
        completed_at,
        pending_sync
      )
      values (
        ${seedIds.checklistRun},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.checklist},
        ${seedIds.shift},
        ${seedIds.users.colaborador},
        'completed',
        '2026-04-23 07:30:00-03',
        '2026-04-23 07:12:00-03',
        false
      )
      on conflict do nothing
    `,
  },
  {
    label: "recognition",
    statement: sql`
      insert into recognition_events (
        id,
        organization_id,
        store_id,
        department_id,
        sender_user_id,
        recipient_user_id,
        category,
        message,
        source_feed_post_id,
        source_checklist_run_id,
        points_awarded
      )
      values (
        ${seedIds.recognition},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.liderSetor},
        ${seedIds.users.colaborador},
        'quality',
        'Excelente padrao visual na abertura da banca.',
        ${seedIds.feedPost},
        ${seedIds.checklistRun},
        20
      )
      on conflict do nothing
    `,
  },
  {
    label: "points-ledger",
    statement: sql`
      insert into points_ledger (
        organization_id,
        store_id,
        department_id,
        user_id,
        actor_user_id,
        source,
        source_id,
        amount,
        reason,
        occurred_at
      )
      values (
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.users.liderSetor},
        'recognition',
        ${seedIds.recognition},
        20,
        'Reconhecimento por qualidade na abertura FLV',
        '2026-04-23 08:00:00-03'
      )
      on conflict (organization_id, source, source_id, user_id) do nothing
    `,
  },
  {
    label: "engagement-campaign:approved-photo-participation",
    statement: sql`
      insert into engagement_campaigns (
        id,
        organization_id,
        store_id,
        department_id,
        created_by_user_id,
        title,
        description,
        objective,
        status,
        period_preset,
        metric_type,
        points_per_eligible_event,
        require_unique_sources,
        max_events_per_user,
        tie_breakers,
        eligible_user_ids,
        max_events_per_day,
        requires_approved_feed_post,
        requires_operational_validation,
        settlement_mode,
        winner_count,
        reward_type,
        reward_title,
        reward_config,
        starts_at,
        ends_at
      )
      values (
        ${seedIds.campaigns.approvedPhotoParticipation},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.liderSetor},
        'Semana da Foto Aprovada',
        'Campanha exemplo para destacar quem manteve constancia em fotos aprovadas no feed FLV.',
        'Aumentar a participacao com fotos aprovadas e de boa qualidade durante a semana.',
        'active',
        'weekly',
        'approved-photo-post',
        10,
        true,
        7,
        ${toJsonb([
          { kind: "approved-quality", priority: 1 },
          { kind: "first-to-finish", priority: 2 },
        ])},
        ${toJsonb([seedIds.users.colaborador])},
        1,
        true,
        false,
        'automatic',
        1,
        'digital',
        'Badge Foto Aprovada da Semana',
        ${toJsonb({
          badgeCode: "foto-aprovada-semana",
          highlightLabel: "Destaque no perfil",
          points: 40,
        })},
        '2026-04-22 00:00:00-03',
        '2026-04-29 23:59:00-03'
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "engagement-campaign:validated-banca-setup",
    statement: sql`
      insert into engagement_campaigns (
        id,
        organization_id,
        store_id,
        department_id,
        created_by_user_id,
        title,
        description,
        objective,
        status,
        period_preset,
        metric_type,
        points_per_eligible_event,
        require_unique_sources,
        max_events_per_user,
        tie_breakers,
        eligible_user_ids,
        max_events_per_day,
        requires_approved_feed_post,
        requires_operational_validation,
        settlement_mode,
        winner_count,
        reward_type,
        reward_title,
        reward_config,
        starts_at,
        ends_at
      )
      values (
        ${seedIds.campaigns.validatedBancaSetup},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.liderSetor},
        'Banca Nota 10',
        'Campanha exemplo para premiar a melhor execucao validada de banca FLV.',
        'Reforcar capricho operacional com evidencias validadas de banca pronta para abertura.',
        'closed',
        'weekly',
        'validated-banca-setup',
        15,
        true,
        5,
        ${toJsonb([
          { kind: "approved-quality", priority: 1 },
          { kind: "consistency", priority: 2 },
        ])},
        ${toJsonb([seedIds.users.colaborador])},
        1,
        false,
        true,
        'manual-review',
        1,
        'manual-company-approved',
        'Folga aprovada na escala',
        ${toJsonb({
          approvalPolicyCode: "rh-folga-flv",
          description: "Folga de 1 turno com aprovacao da gerente da loja.",
          fulfillmentWindowDays: 30,
        })},
        '2026-04-16 00:00:00-03',
        '2026-04-23 08:00:00-03'
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "eligible-event:approved-photo-participation",
    statement: sql`
      insert into eligible_engagement_events (
        id,
        organization_id,
        store_id,
        department_id,
        actor_user_id,
        campaign_id,
        source_type,
        source_id,
        rule_label,
        rule_metadata,
        score_value,
        status,
        awarded_at
      )
      values (
        ${seedIds.eligibleEvents.approvedPhotoParticipation},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.campaigns.approvedPhotoParticipation},
        'approved-photo-post',
        ${seedIds.feedPost},
        'Foto publicada e aprovada pela moderacao da campanha semanal.',
        ${toJsonb({
          moderationState: "approved",
          sourceTable: "feed_posts",
        })},
        10,
        'counted',
        '2026-04-22 08:40:00-03'
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "eligible-event:validated-banca-setup",
    statement: sql`
      insert into eligible_engagement_events (
        id,
        organization_id,
        store_id,
        department_id,
        actor_user_id,
        campaign_id,
        source_type,
        source_id,
        rule_label,
        rule_metadata,
        score_value,
        status,
        awarded_at
      )
      values (
        ${seedIds.eligibleEvents.validatedBancaSetup},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.campaigns.validatedBancaSetup},
        'validated-banca-setup',
        ${seedIds.checklistRun},
        'Banca validada com evidencia operacional na abertura.',
        ${toJsonb({
          checklistRunId: seedIds.checklistRun,
          validationSource: "checklist-run",
        })},
        15,
        'counted',
        '2026-04-23 07:12:00-03'
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "reward-grant:validated-banca-setup-winner",
    statement: sql`
      insert into reward_grants (
        id,
        organization_id,
        store_id,
        department_id,
        campaign_id,
        user_id,
        position,
        winning_score,
        reward_type,
        reward_title,
        reward_config,
        status,
        granted_at,
        approved_at,
        approved_by_user_id,
        metadata
      )
      values (
        ${seedIds.rewardGrants.validatedBancaSetupWinner},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.campaigns.validatedBancaSetup},
        ${seedIds.users.colaborador},
        1,
        15,
        'manual-company-approved',
        'Folga aprovada na escala',
        ${toJsonb({
          approvalPolicyCode: "rh-folga-flv",
          description: "Folga de 1 turno com aprovacao da gerente da loja.",
          fulfillmentWindowDays: 30,
        })},
        'approved-for-fulfillment',
        '2026-04-23 08:20:00-03',
        '2026-04-23 09:00:00-03',
        ${seedIds.users.gerenteLoja},
        ${toJsonb({
          campaignObjective: "validated-banca-setup",
          evidenceSource: "checklist-run",
          winningEventId: seedIds.eligibleEvents.validatedBancaSetup,
        })}
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "archive-item:validated-banca-setup-win",
    statement: sql`
      insert into collaborator_archive_items (
        id,
        organization_id,
        store_id,
        department_id,
        user_id,
        campaign_id,
        source_type,
        source_id,
        source_action,
        type,
        title,
        granting_rule,
        related_content_reference,
        status,
        metadata,
        occurred_at
      )
      values (
        ${seedIds.archiveItems.validatedBancaSetupWin},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.campaigns.validatedBancaSetup},
        'validated-banca-setup',
        ${seedIds.checklistRun},
        'Banca validada na apuracao final da campanha.',
        'challenge-won',
        'Vencedora da campanha Banca Nota 10',
        'Maior numero de bancas validadas dentro do periodo da campanha.',
        ${`checklist-run:${seedIds.checklistRun}`},
        'recorded',
        ${toJsonb({
          position: 1,
          winningScore: 15,
        })},
        '2026-04-23 08:20:00-03'
      )
      on conflict (id) do nothing
    `,
  },
  {
    label: "archive-item:validated-banca-setup-prize",
    statement: sql`
      insert into collaborator_archive_items (
        id,
        organization_id,
        store_id,
        department_id,
        user_id,
        campaign_id,
        reward_grant_id,
        source_type,
        source_id,
        source_action,
        type,
        title,
        granting_rule,
        related_content_reference,
        responsible_approver_user_id,
        reward_status,
        status,
        metadata,
        occurred_at
      )
      values (
        ${seedIds.archiveItems.validatedBancaSetupPrize},
        ${seedIds.organization},
        ${seedIds.store},
        ${seedIds.department},
        ${seedIds.users.colaborador},
        ${seedIds.campaigns.validatedBancaSetup},
        ${seedIds.rewardGrants.validatedBancaSetupWinner},
        'reward-grant',
        ${seedIds.rewardGrants.validatedBancaSetupWinner},
        'Premio manual aprovado pela gerente da loja.',
        'manual-prize',
        'Folga aprovada para retirada',
        'Premio oficial da campanha Banca Nota 10 com governanca interna.',
        'Campanha Banca Nota 10',
        ${seedIds.users.gerenteLoja},
        'approved-for-fulfillment',
        'recorded',
        ${toJsonb({
          approvalPolicyCode: "rh-folga-flv",
          fulfillmentWindowDays: 30,
        })},
        '2026-04-23 09:00:00-03'
      )
      on conflict (id) do nothing
    `,
  },
];

export async function applyDevelopmentSeed(db: EngajaDatabase): Promise<SeedResult> {
  for (const seedStatement of seedStatements) {
    await db.execute(seedStatement.statement);
  }

  return {
    insertedLabels: seedStatements.map((seedStatement) => seedStatement.label),
  };
}

export function validateDevelopmentSeedBudget(summary = developmentSeedSummary): {
  readonly errors: readonly string[];
  readonly ok: boolean;
} {
  const errors: string[] = [];

  if (summary.totalUsers > developmentSeedBudget.maxUsers) {
    errors.push(
      `Seed user count ${summary.totalUsers} exceeds the no-spend budget of ${developmentSeedBudget.maxUsers}.`,
    );
  }

  if (summary.mediaObjectCount > developmentSeedBudget.maxMediaObjects) {
    errors.push(
      `Seed media object count ${summary.mediaObjectCount} exceeds the no-spend budget of ${developmentSeedBudget.maxMediaObjects}.`,
    );
  }

  if (summary.totalSeedMediaBytes > developmentSeedBudget.maxTotalMediaBytes) {
    errors.push(
      `Seed media bytes ${summary.totalSeedMediaBytes} exceed the no-spend budget of ${developmentSeedBudget.maxTotalMediaBytes}.`,
    );
  }

  if (summary.feedPostCount > developmentSeedBudget.maxFeedPosts) {
    errors.push(
      `Seed feed post count ${summary.feedPostCount} exceeds the no-spend budget of ${developmentSeedBudget.maxFeedPosts}.`,
    );
  }

  if (summary.totalRecognitionEvents > developmentSeedBudget.maxRecognitionEvents) {
    errors.push(
      `Seed recognition count ${summary.totalRecognitionEvents} exceeds the no-spend budget of ${developmentSeedBudget.maxRecognitionEvents}.`,
    );
  }

  if (summary.totalScheduleRows > developmentSeedBudget.maxScheduleRows) {
    errors.push(
      `Seed schedule row count ${summary.totalScheduleRows} exceeds the no-spend budget of ${developmentSeedBudget.maxScheduleRows}.`,
    );
  }

  return {
    errors,
    ok: errors.length === 0,
  };
}

export function assertDevelopmentSeedWithinBudget(summary = developmentSeedSummary): void {
  const result = validateDevelopmentSeedBudget(summary);

  if (!result.ok) {
    throw new Error(result.errors.join(" "));
  }
}

function roleIdFor(role: (typeof developmentSeedUsers)[number]["role"]): string {
  switch (role) {
    case "admin-organizacao":
      return seedIds.roles.adminOrganizacao;
    case "auditor":
      return seedIds.roles.auditor;
    case "colaborador":
      return seedIds.roles.colaborador;
    case "gerente-loja":
      return seedIds.roles.gerenteLoja;
    case "lider-setor":
      return seedIds.roles.liderSetor;
  }
}

function membershipIdFor(role: (typeof developmentSeedUsers)[number]["role"]): string {
  switch (role) {
    case "admin-organizacao":
      return seedIds.memberships.adminOrganizacao;
    case "auditor":
      return seedIds.memberships.auditor;
    case "colaborador":
      return seedIds.memberships.colaborador;
    case "gerente-loja":
      return seedIds.memberships.gerenteLoja;
    case "lider-setor":
      return seedIds.memberships.liderSetor;
  }
}

function storeIdFor(role: (typeof developmentSeedUsers)[number]["role"]): string | null {
  return role === "admin-organizacao" ? null : seedIds.store;
}

function departmentIdFor(role: (typeof developmentSeedUsers)[number]["role"]): string | null {
  return role === "colaborador" || role === "lider-setor" ? seedIds.department : null;
}

function roleNameFor(role: (typeof developmentSeedUsers)[number]["role"]): string {
  switch (role) {
    case "admin-organizacao":
      return "Admin Organizacao";
    case "auditor":
      return "Auditor";
    case "colaborador":
      return "Colaborador";
    case "gerente-loja":
      return "Gerente Loja";
    case "lider-setor":
      return "Lider Setor";
  }
}
