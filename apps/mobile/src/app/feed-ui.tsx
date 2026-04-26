import type {
  FeedAnnouncementPayload,
  FeedCategoryPayload,
  FeedHomePayload,
  FeedModerationActionPayload,
  FeedPollPayload,
  FeedPostPayload,
  FeedReactionTypePayload,
} from "@engaja/contracts";
import type { ReactNode } from "react";
import type { FeedPriorityItem } from "@engaja/ui/native";

import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { flvPalette, flvSemanticColors, radiusScale, spacingScale } from "@engaja/ui";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorStateCard,
  FeedPriorityStrip,
  FlvText,
  Input,
  MetricTile,
  PostSkeleton,
  QuickComposer,
  SocialPostCard,
  SuccessStateCard,
} from "@engaja/ui/native";

import { buildSizedImageUrl } from "../performance/image-policy.js";
import {
  createDefaultFeedComposerDraft,
  type FeedComposerDraft,
  type FeedFeedbackDraft,
} from "./feed-state.js";
import type {
  CollaboratorAchievementArchive,
  EngagementCampaignView,
} from "./engagement-service.js";
import type { MobileSession } from "./providers.js";

const feedCategoryLabels: Record<FeedCategoryPayload, string> = {
  announcement: "Aviso",
  display: "Exposicao",
  mission: "Missao",
  quality: "Qualidade",
  routine: "Rotina",
};

const reactionLabels: Record<FeedReactionTypePayload, string> = {
  aplauso: "Aplauso",
  duvida: "Duvida",
  inspirador: "Inspirador",
  like: "Curtir",
};

export function FeedComposerCard(props: {
  readonly draft: FeedComposerDraft;
  readonly expanded: boolean;
  readonly isSubmitting: boolean;
  readonly onChange: (draft: FeedComposerDraft) => void;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly onSubmit: () => Promise<void>;
  readonly session: MobileSession;
  readonly uploadProgress: number;
}): ReactNode {
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const missingTitle = props.draft.title.trim().length === 0;
  const missingCaption = props.draft.caption.trim().length === 0;
  const composerSummary = `${props.draft.source === "camera" ? "Camera" : "Galeria"} / ${
    feedCategoryLabels[props.draft.category]
  } / ${buildVisibilityLabel(props.draft.visibility)}`;

  useEffect(() => {
    if (isDefaultComposerDraft(props.draft) && props.expanded && !props.isSubmitting) {
      props.onExpandedChange(false);
      setHasTriedSubmit(false);
    }
  }, [props.draft, props.expanded, props.isSubmitting, props.onExpandedChange]);

  const submit = (): void => {
    if (!props.expanded) {
      props.onExpandedChange(true);
      return;
    }

    setHasTriedSubmit(true);
    void props.onSubmit();
  };

  return (
    <QuickComposer
      authorInitials={createInitials(props.session.displayName)}
      authorName={props.session.displayName}
      captionLabel="Legenda"
      captionPlaceholder="Conte o que mudou na banca, no padrao visual ou na rotina."
      captionTone={hasTriedSubmit && missingCaption ? "danger" : "default"}
      captionValue={props.draft.caption}
      draftLabel={composerSummary}
      expanded={props.expanded}
      helperText={
        hasTriedSubmit && missingCaption
          ? "Escreva uma legenda curta antes de publicar."
          : "A legenda aparece no mural junto da foto."
      }
      onCameraPress={() =>
        props.onChange({
          ...props.draft,
          source: "camera",
        })
      }
      onCaptionChange={(caption: string) =>
        props.onChange({
          ...props.draft,
          caption,
        })
      }
      onGalleryPress={() =>
        props.onChange({
          ...props.draft,
          source: "gallery",
        })
      }
      onPrimaryPress={submit}
      onToggleExpanded={() => props.onExpandedChange(!props.expanded)}
      primaryDisabled={props.isSubmitting}
      primaryLabel={
        props.expanded
          ? props.isSubmitting
            ? "Enviando..."
            : "Enviar com foto"
          : "Adicionar detalhes"
      }
      primaryLoading={props.isSubmitting}
      prompt="Compartilhe uma foto do turno com contexto rapido."
    >
      <Input
        helperText={
          hasTriedSubmit && missingTitle
            ? "Dê um titulo simples para o registro."
            : "Curto, claro e ligado ao trabalho feito."
        }
        label="Titulo"
        onChangeText={(title) =>
          props.onChange({
            ...props.draft,
            title,
          })
        }
        placeholder="Ex.: Abertura validada"
        tone={hasTriedSubmit && missingTitle ? "danger" : "default"}
        value={props.draft.title}
      />

      <View style={styles.sectionStackCompact}>
        <FlvText variant="label">Categoria</FlvText>
        <View style={styles.inlineWrap}>
          {(["quality", "display", "routine", "mission"] as const).map((category) => (
            <Chip
              key={category}
              label={feedCategoryLabels[category]}
              onPress={() =>
                props.onChange({
                  ...props.draft,
                  category,
                })
              }
              selected={props.draft.category === category}
              tone={props.draft.category === category ? "fresh" : "neutral"}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionStackCompact}>
        <FlvText variant="label">Visibilidade</FlvText>
        <View style={styles.inlineWrap}>
          {(["department", "store", "organization"] as const).map((visibility) => (
            <Chip
              key={visibility}
              label={buildVisibilityLabel(visibility)}
              onPress={() =>
                props.onChange({
                  ...props.draft,
                  visibility,
                })
              }
              selected={props.draft.visibility === visibility}
              tone={props.draft.visibility === visibility ? "warning" : "neutral"}
            />
          ))}
        </View>
      </View>

      <Input
        label="Missao ou desafio"
        onChangeText={(missionTitle) =>
          props.onChange({
            ...props.draft,
            missionTitle,
          })
        }
        placeholder="Ex.: Abertura impecavel"
        value={props.draft.missionTitle}
      />
      <View style={styles.twoColumnRow}>
        <Input
          label="Rotina vinculada"
          onChangeText={(routineTitle) =>
            props.onChange({
              ...props.draft,
              routineTitle,
            })
          }
          placeholder="Frente de banca"
          value={props.draft.routineTitle}
        />
        <Input
          keyboardType="number-pad"
          label="Pontos"
          onChangeText={(rewardPoints) =>
            props.onChange({
              ...props.draft,
              rewardPoints,
            })
          }
          placeholder="120"
          value={props.draft.rewardPoints}
        />
      </View>

      <View style={styles.sectionStackCompact}>
        <FlvText variant="label">Reconhecimento</FlvText>
        <View style={styles.inlineWrap}>
          {(["none", "quality", "teamwork", "consistency", "learning", "improvement"] as const).map(
            (recognitionCategory) => (
              <Chip
                key={recognitionCategory}
                label={formatRecognitionCategory(recognitionCategory)}
                onPress={() =>
                  props.onChange({
                    ...props.draft,
                    recognitionCategory,
                  })
                }
                selected={props.draft.recognitionCategory === recognitionCategory}
                tone={props.draft.recognitionCategory === recognitionCategory ? "warm" : "neutral"}
              />
            ),
          )}
        </View>
      </View>

      {props.uploadProgress > 0 ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${props.uploadProgress}%` }]} />
          </View>
          <FlvText tone="muted" variant="caption">
            Preparando envio: {props.uploadProgress}%
          </FlvText>
        </View>
      ) : null}

      <Button
        fullWidth={false}
        label="Limpar"
        onPress={() => props.onChange(createDefaultFeedComposerDraft())}
        tone="secondary"
      />
    </QuickComposer>
  );
}

export function FeedSupportModules(props: {
  readonly achievementArchive: CollaboratorAchievementArchive | null;
  readonly announcements: readonly FeedAnnouncementPayload[];
  readonly engagementError: string | undefined;
  readonly feedbackDraft: FeedFeedbackDraft;
  readonly feedbackInboxCount: number;
  readonly isLoadingEngagement: boolean;
  readonly onAcknowledge: (announcementId: string) => Promise<void>;
  readonly onFeedbackChange: (draft: FeedFeedbackDraft) => void;
  readonly onFeedbackSubmit: () => Promise<void>;
  readonly onOpenAchievementArchive: () => void;
  readonly onVotePoll: (pollId: string, optionId: string) => Promise<void>;
  readonly polls: readonly FeedPollPayload[];
}): ReactNode {
  const activeCampaigns = props.achievementArchive?.activeCampaigns ?? [];
  const unreadAnnouncements = props.announcements.filter(
    (announcement) => !announcement.acknowledged,
  );
  const priorityItems: FeedPriorityItem[] = [];

  for (const announcement of unreadAnnouncements.slice(0, 1)) {
    priorityItems.push({
      actionLabel: "Marcar lido",
      description: announcement.title,
      id: `announcement-${announcement.id}`,
      onPress: () => {
        void props.onAcknowledge(announcement.id);
      },
      title: "Aviso",
      tone: announcement.requiredAcknowledgement ? "warning" : "info",
    });
  }

  if (props.polls.length > 0) {
    priorityItems.push({
      description: `${props.polls.length} votacao(oes) abertas no mural.`,
      id: "polls",
      title: "Votacao",
      tone: "info",
    });
  }

  if (activeCampaigns.length > 0) {
    priorityItems.push({
      actionLabel: "Ver",
      description: `${activeCampaigns.length} campanha(s) ativa(s) com progresso elegivel.`,
      id: "campaigns",
      onPress: props.onOpenAchievementArchive,
      title: "Campanha",
      tone: "success",
    });
  }

  if (props.feedbackInboxCount > 0) {
    priorityItems.push({
      description: `${props.feedbackInboxCount} retorno(s) privado(s) em acompanhamento.`,
      id: "feedback-count",
      title: "Feedback",
      tone: "warning",
    });
  }

  return (
    <View style={styles.sectionStack}>
      {priorityItems.length > 0 ? <FeedPriorityStrip items={priorityItems} /> : null}
      <AnnouncementsSection
        announcements={props.announcements}
        onAcknowledge={props.onAcknowledge}
      />
      <PollsSection polls={props.polls} onVote={props.onVotePoll} />
      <EngagementProgressCompactCard
        achievementArchive={props.achievementArchive}
        engagementError={props.engagementError}
        isLoadingEngagement={props.isLoadingEngagement}
        onOpenAchievementArchive={props.onOpenAchievementArchive}
      />
      <CampaignHighlightsSection
        campaigns={activeCampaigns}
        engagementError={props.engagementError}
        isLoadingEngagement={props.isLoadingEngagement}
        onOpenAchievementArchive={props.onOpenAchievementArchive}
      />
      <FeedbackPromptCard
        draft={props.feedbackDraft}
        onChange={props.onFeedbackChange}
        onSubmit={props.onFeedbackSubmit}
      />
    </View>
  );
}

export const FeedPostCard = memo(function FeedPostCard(props: {
  readonly commentDraft: string;
  readonly onCommentChange: (value: string) => void;
  readonly onCommentSubmit: () => Promise<void>;
  readonly onReactionPress: (reactionType: FeedReactionTypePayload) => Promise<void>;
  readonly post: FeedPostPayload;
  readonly session: MobileSession;
}): ReactNode {
  const commentsTotalLabel =
    props.post.comments.length > 2
      ? `Ultimos 2 de ${props.post.comments.length} comentarios`
      : undefined;

  return (
    <SocialPostCard
      actionSlot={
        <View style={styles.commentComposer}>
          <Input
            label="Comentario"
            onChangeText={props.onCommentChange}
            placeholder="Some com uma dica, duvida ou apoio para o time."
            value={props.commentDraft}
          />
          <Button
            fullWidth={false}
            label={props.session.role === "colaborador" ? "Comentar" : "Publicar comentario"}
            onPress={() => {
              void props.onCommentSubmit();
            }}
            tone="secondary"
          />
        </View>
      }
      authorInitials={createInitials(props.post.authorName)}
      authorName={props.post.authorName}
      caption={props.post.caption}
      comments={props.post.comments.slice(-2).map((comment) => ({
        author: comment.authorName,
        body: comment.body,
        id: comment.id,
        pending: comment.pendingSync || comment.status === "pending",
        timestamp: formatCommentTimestamp(comment),
      }))}
      {...(commentsTotalLabel === undefined ? {} : { commentsTotalLabel })}
      metadata={buildPostMetadata(props.post)}
      onReactionPress={(reactionId: string) => {
        if (isFeedReactionType(reactionId)) {
          void props.onReactionPress(reactionId);
        }
      }}
      reactions={props.post.reactions.map((reaction) => ({
        count: reaction.count,
        id: reaction.type,
        label: reactionLabels[reaction.type],
        selected: reaction.selected,
      }))}
      selectedReactionId={props.post.reactions.find((reaction) => reaction.selected)?.type ?? null}
      statusLabel={buildStatusLabel(props.post)}
      statusTone={buildStatusTone(props.post)}
      {...buildSocialPostImageProps(props.post.photoUrl)}
      timestamp={formatPostTimestamp(props.post)}
      title={props.post.title}
    />
  );
});

export function LeaderModerationPanel(props: {
  readonly feedError: string | undefined;
  readonly feedHome: FeedHomePayload | null;
  readonly isLoadingFeed: boolean;
  readonly onModerationAction: (
    postId: string,
    action: FeedModerationActionPayload,
  ) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  readonly submittingPostId?: string | undefined;
}): ReactNode {
  if (props.isLoadingFeed) {
    return (
      <View style={styles.sectionStack}>
        <PostSkeleton />
        <PostSkeleton />
      </View>
    );
  }

  if (props.feedError !== undefined) {
    return (
      <ErrorStateCard
        actionLabel="Atualizar fila"
        description="A fila nao carregou agora. As outras areas da lideranca continuam disponiveis."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title={props.feedError}
      />
    );
  }

  const pendingPosts =
    props.feedHome?.posts.filter((post) => post.status === "pending_moderation") ?? [];

  if (pendingPosts.length === 0) {
    return (
      <SuccessStateCard
        actionLabel="Atualizar fila"
        description="Nao ha fila pendente agora. O setor pode seguir com destaque e reconhecimento."
        onActionPress={() => {
          void props.onRefresh();
        }}
        title="Revisao em dia"
      />
    );
  }

  return (
    <View style={styles.sectionStack}>
      <Card tone="muted">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Revisao do mural
            </FlvText>
            <FlvText variant="headline">{pendingPosts.length} post(s) pedem decisao</FlvText>
          </View>
          <Badge label="Decisao contextual" tone="warning" />
        </View>
        <FlvText tone="muted">
          Aprove, destaque, oculte ou remova sem tirar o post do contexto social do mural.
        </FlvText>
      </Card>

      {pendingPosts.map((post) => {
        const isSubmittingThisPost = props.submittingPostId === post.id;

        return (
          <SocialPostCard
            authorInitials={createInitials(post.authorName)}
            authorName={post.authorName}
            caption={post.caption}
            key={post.id}
            metadata={buildPostMetadata(post)}
            moderationActions={[
              {
                disabled: props.submittingPostId !== undefined,
                id: "approve",
                label: isSubmittingThisPost ? "Aplicando..." : "Aprovar",
                onPress: () => {
                  void props.onModerationAction(post.id, "approve");
                },
                tone: "primary",
              },
              {
                disabled: props.submittingPostId !== undefined,
                id: "feature",
                label: "Destacar",
                onPress: () => {
                  void props.onModerationAction(post.id, "feature");
                },
              },
              {
                disabled: props.submittingPostId !== undefined,
                id: "pin",
                label: "Fixar",
                onPress: () => {
                  void props.onModerationAction(post.id, "pin");
                },
              },
              {
                disabled: props.submittingPostId !== undefined,
                id: "hide",
                label: "Ocultar",
                onPress: () => {
                  void props.onModerationAction(post.id, "hide");
                },
              },
              {
                disabled: props.submittingPostId !== undefined,
                id: "remove",
                label: "Remover",
                onPress: () => {
                  void props.onModerationAction(post.id, "remove");
                },
                tone: "danger",
              },
            ]}
            statusLabel={isSubmittingThisPost ? "Aplicando decisao" : "Aguardando revisao"}
            statusTone="warning"
            {...buildSocialPostImageProps(post.photoUrl)}
            timestamp={formatPostTimestamp(post)}
            title={post.title}
          />
        );
      })}
    </View>
  );
}

function AnnouncementsSection(props: {
  readonly announcements: readonly FeedAnnouncementPayload[];
  readonly onAcknowledge: (announcementId: string) => Promise<void>;
}): ReactNode {
  if (props.announcements.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionStackCompact}>
      <SectionLabel eyebrow="Avisos" title="Recados rapidos da lideranca" />
      {props.announcements.slice(0, 2).map((announcement) => (
        <Card key={announcement.id} tone="muted">
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderCopy}>
              <FlvText variant="headline">{announcement.title}</FlvText>
              <FlvText tone="muted" variant="caption">
                {announcement.requiredAcknowledgement ? "Leitura importante" : "Para acompanhar"}
              </FlvText>
            </View>
            <Badge
              label={announcement.acknowledged ? "Lido" : "Pendente"}
              tone={announcement.acknowledged ? "success" : "warning"}
            />
          </View>
          <FlvText tone="muted">{announcement.body}</FlvText>
          {!announcement.acknowledged ? (
            <Button
              fullWidth={false}
              label="Marcar como lido"
              onPress={() => {
                void props.onAcknowledge(announcement.id);
              }}
              tone="secondary"
            />
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function PollsSection(props: {
  readonly onVote: (pollId: string, optionId: string) => Promise<void>;
  readonly polls: readonly FeedPollPayload[];
}): ReactNode {
  if (props.polls.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionStackCompact}>
      <SectionLabel eyebrow="Votacoes" title="Decisoes leves do setor" />
      {props.polls.slice(0, 2).map((poll) => (
        <Card key={poll.id} tone="muted">
          <View style={styles.cardHeaderCopy}>
            <FlvText variant="headline">{poll.title}</FlvText>
            <FlvText tone="muted">{poll.prompt}</FlvText>
          </View>
          <View style={styles.inlineWrap}>
            {poll.options.map((option) => (
              <Chip
                key={option.id}
                label={`${option.label} ${option.voteCount}`}
                onPress={() => {
                  void props.onVote(poll.id, option.id);
                }}
                selected={poll.viewerVoteOptionId === option.id}
                tone={poll.viewerVoteOptionId === option.id ? "fresh" : "neutral"}
              />
            ))}
          </View>
          <FlvText tone="muted" variant="caption">
            {poll.totalVotes} voto(s) registrados.
          </FlvText>
        </Card>
      ))}
    </View>
  );
}

function EngagementProgressCompactCard(props: {
  readonly achievementArchive: CollaboratorAchievementArchive | null;
  readonly engagementError: string | undefined;
  readonly isLoadingEngagement: boolean;
  readonly onOpenAchievementArchive: () => void;
}): ReactNode {
  if (props.isLoadingEngagement && props.achievementArchive === null) {
    return (
      <Card tone="muted">
        <SectionLabel eyebrow="Conquistas" title="Atualizando progresso" />
        <FlvText tone="muted">
          Buscando streak, fotos aprovadas e premios pendentes do ciclo.
        </FlvText>
      </Card>
    );
  }

  if (props.engagementError !== undefined && props.achievementArchive === null) {
    return (
      <Card tone="muted">
        <SectionLabel eyebrow="Conquistas" title="Arquivo indisponivel agora" />
        <FlvText tone="muted">{props.engagementError}</FlvText>
      </Card>
    );
  }

  if (props.achievementArchive === null) {
    return null;
  }

  return (
    <Card tone="muted">
      <SectionLabel eyebrow="Conquistas" title="Seu progresso no ciclo" />
      <View style={styles.metricRow}>
        <MetricTile
          label="Streak"
          note="dias"
          tone="fresh"
          value={`${props.achievementArchive.summary.activeStreakDays}`}
        />
        <MetricTile
          label="Fotos"
          note="aprovadas"
          tone="accent"
          value={`${props.achievementArchive.summary.approvedPhotoParticipationCount}`}
        />
        <MetricTile
          label="Premios"
          note="pendentes"
          tone={props.achievementArchive.summary.pendingRewardCount === 0 ? "fresh" : "warm"}
          value={`${props.achievementArchive.summary.pendingRewardCount}`}
        />
      </View>
      <Button
        fullWidth={false}
        label="Abrir conquistas"
        onPress={props.onOpenAchievementArchive}
        tone="secondary"
      />
    </Card>
  );
}

export function CampaignHighlightsSection(props: {
  readonly campaigns: readonly CollaboratorAchievementArchive["activeCampaigns"][number][];
  readonly engagementError: string | undefined;
  readonly isLoadingEngagement: boolean;
  readonly onOpenAchievementArchive: () => void;
}): ReactNode {
  if (props.isLoadingEngagement && props.campaigns.length === 0) {
    return (
      <Card tone="muted">
        <SectionLabel eyebrow="Campanhas" title="Atualizando desafios" />
        <FlvText tone="muted">Buscando campanhas ativas e progresso pessoal.</FlvText>
      </Card>
    );
  }

  if (props.engagementError !== undefined && props.campaigns.length === 0) {
    return null;
  }

  if (props.campaigns.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionStackCompact}>
      <SectionLabel eyebrow="Campanhas" title="Desafios ativos" />
      {props.campaigns.slice(0, 2).map((campaignView) => (
        <CampaignCompactCard
          campaignView={campaignView}
          key={campaignView.campaign.id}
          onOpenAchievementArchive={props.onOpenAchievementArchive}
        />
      ))}
    </View>
  );
}

function CampaignCompactCard(props: {
  readonly campaignView: EngagementCampaignView;
  readonly onOpenAchievementArchive: () => void;
}): ReactNode {
  const leadingScore = props.campaignView.leaderboard[0]?.score ?? 0;
  const viewerScore = props.campaignView.viewerProgress?.score ?? 0;
  const progressPercent =
    leadingScore === 0 ? 0 : Math.min(100, Math.round((viewerScore / leadingScore) * 100));

  return (
    <Card tone="muted">
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderCopy}>
          <FlvText variant="headline">{props.campaignView.campaign.title}</FlvText>
          <FlvText tone="muted">{props.campaignView.campaign.objective}</FlvText>
        </View>
        <Badge
          label={formatCampaignStatus(props.campaignView.campaign.status)}
          tone={props.campaignView.campaign.status === "active" ? "success" : "info"}
        />
      </View>
      <View style={styles.inlineWrap}>
        <Chip label={formatCampaignReward(props.campaignView.campaign)} tone="warm" />
        <Chip label={`${props.campaignView.participantCount} pessoa(s)`} tone="neutral" />
      </View>
      {props.campaignView.viewerProgress === undefined ? null : (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <FlvText tone="muted" variant="caption">
            Seu progresso: {viewerScore} pts elegiveis.
          </FlvText>
        </View>
      )}
      <Button
        fullWidth={false}
        label="Ver no arquivo"
        onPress={props.onOpenAchievementArchive}
        tone="secondary"
      />
    </Card>
  );
}

function FeedbackPromptCard(props: {
  readonly draft: FeedFeedbackDraft;
  readonly onChange: (draft: FeedFeedbackDraft) => void;
  readonly onSubmit: () => Promise<void>;
}): ReactNode {
  return (
    <Card tone="muted">
      <SectionLabel eyebrow="Feedback privado" title="Bloqueios e ideias" />
      <View style={styles.inlineWrap}>
        {(["idea", "blocker", "routine", "improvement"] as const).map((category) => (
          <Chip
            key={category}
            label={formatFeedbackCategory(category)}
            onPress={() =>
              props.onChange({
                ...props.draft,
                category,
              })
            }
            selected={props.draft.category === category}
            tone={props.draft.category === category ? "warm" : "neutral"}
          />
        ))}
      </View>
      <Input
        label="Mensagem"
        multiline
        onChangeText={(message) =>
          props.onChange({
            ...props.draft,
            message,
          })
        }
        placeholder="Explique o bloqueio, a ideia ou o ajuste sem publicar no mural."
        value={props.draft.message}
      />
      <Button
        fullWidth={false}
        label="Enviar feedback"
        onPress={() => {
          void props.onSubmit();
        }}
        tone="accent"
      />
    </Card>
  );
}

function SectionLabel({
  eyebrow,
  title,
}: {
  readonly eyebrow: string;
  readonly title: string;
}): ReactNode {
  return (
    <View style={styles.sectionLabel}>
      <FlvText tone="accent" variant="eyebrow">
        {eyebrow}
      </FlvText>
      <FlvText variant="headline">{title}</FlvText>
    </View>
  );
}

function buildPostMetadata(post: FeedPostPayload): string[] {
  return [
    feedCategoryLabels[post.category],
    buildVisibilityLabel(post.visibility),
    ...(post.pendingSync ? ["Aguardando envio"] : []),
    ...(post.missionLink?.missionTitle === undefined ? [] : [post.missionLink.missionTitle]),
    ...(post.missionLink?.routineTitle === undefined ? [] : [post.missionLink.routineTitle]),
    ...(post.missionLink?.rewardPoints === undefined
      ? []
      : [`${post.missionLink.rewardPoints} pts`]),
    ...(post.missionLink?.rewardEligible ? ["Recompensa liberada"] : []),
    ...(post.missionLink?.recognitionEligible ? ["Reconhecimento elegivel"] : []),
  ];
}

function buildSocialPostImageProps(photoUrl: string | undefined): {
  readonly photoUrl?: string;
  readonly thumbnailUrl?: string;
} {
  const thumbnailUrl = buildSizedImageUrl(photoUrl);

  return {
    ...(photoUrl === undefined ? {} : { photoUrl }),
    ...(thumbnailUrl === undefined ? {} : { thumbnailUrl }),
  };
}

function buildStatusLabel(post: FeedPostPayload): string {
  if (post.pendingSync) {
    return "Aguardando envio";
  }

  return post.status === "featured"
    ? "Destaque"
    : post.status === "pending_moderation"
      ? "Em revisao"
      : post.status === "hidden"
        ? "Oculto"
        : post.status === "removed"
          ? "Removido"
          : post.status === "draft"
            ? "Rascunho"
            : "Publicado";
}

function buildStatusTone(post: FeedPostPayload): "danger" | "info" | "success" | "warning" {
  if (post.pendingSync || post.status === "pending_moderation" || post.status === "draft") {
    return "warning";
  }

  if (post.status === "hidden" || post.status === "removed") {
    return "danger";
  }

  return post.status === "featured" || post.status === "published" ? "success" : "info";
}

function buildVisibilityLabel(visibility: FeedPostPayload["visibility"]): string {
  return visibility === "department"
    ? "Setor"
    : visibility === "store"
      ? "Loja"
      : visibility === "organization"
        ? "Organizacao"
        : "Privado";
}

function createInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatPostTimestamp(post: FeedPostPayload): string {
  if (post.pendingSync) {
    return "Aguardando envio";
  }

  return formatIsoDateTimeLabel(post.publishedAt ?? post.createdAt);
}

function formatCommentTimestamp(comment: FeedPostPayload["comments"][number]): string {
  if (comment.pendingSync || comment.status === "pending") {
    return "Aguardando envio";
  }

  return formatIsoDateTimeLabel(comment.createdAt);
}

function formatIsoDateTimeLabel(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart?.split("-") ?? [];
  const timeLabel = timePart?.slice(0, 5);

  if (day === undefined || month === undefined || year === undefined || timeLabel === undefined) {
    return "Agora";
  }

  return `${day}/${month} ${timeLabel}`;
}

function formatRecognitionCategory(category: FeedComposerDraft["recognitionCategory"]): string {
  return category === "none"
    ? "Nenhum"
    : category === "quality"
      ? "Qualidade"
      : category === "teamwork"
        ? "Time"
        : category === "consistency"
          ? "Consistencia"
          : category === "learning"
            ? "Aprendizado"
            : "Melhoria";
}

function formatFeedbackCategory(category: FeedFeedbackDraft["category"]): string {
  return category === "idea"
    ? "Ideia"
    : category === "blocker"
      ? "Bloqueio"
      : category === "routine"
        ? "Rotina"
        : "Melhoria";
}

function formatCampaignStatus(status: EngagementCampaignView["campaign"]["status"]): string {
  return status === "active"
    ? "Ativa"
    : status === "scheduled"
      ? "Agendada"
      : status === "closed"
        ? "Encerrada"
        : status === "archived"
          ? "Arquivada"
          : "Rascunho";
}

function formatCampaignReward(campaign: EngagementCampaignView["campaign"]): string {
  if (campaign.reward.type === "digital") {
    return `${campaign.reward.title}${campaign.reward.points === undefined ? "" : ` / ${campaign.reward.points} pts`}`;
  }

  return `${campaign.reward.title} / aprovacao oficial`;
}

function isDefaultComposerDraft(draft: FeedComposerDraft): boolean {
  const defaultDraft = createDefaultFeedComposerDraft();

  return (
    draft.caption === defaultDraft.caption &&
    draft.category === defaultDraft.category &&
    draft.missionId === defaultDraft.missionId &&
    draft.missionTitle === defaultDraft.missionTitle &&
    draft.recognitionCategory === defaultDraft.recognitionCategory &&
    draft.rewardPoints === defaultDraft.rewardPoints &&
    draft.routineTitle === defaultDraft.routineTitle &&
    draft.source === defaultDraft.source &&
    draft.title === defaultDraft.title &&
    draft.visibility === defaultDraft.visibility
  );
}

function isFeedReactionType(value: string): value is FeedReactionTypePayload {
  return value === "aplauso" || value === "duvida" || value === "inspirador" || value === "like";
}

const styles = StyleSheet.create({
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
  commentComposer: {
    borderTopColor: flvSemanticColors.border,
    borderTopWidth: 1,
    gap: spacingScale.md,
    paddingHorizontal: spacingScale.md,
    paddingTop: spacingScale.md,
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
  sectionLabel: {
    gap: spacingScale.xxs,
  },
  sectionStack: {
    gap: spacingScale.lg,
  },
  sectionStackCompact: {
    gap: spacingScale.md,
  },
  twoColumnRow: {
    gap: spacingScale.md,
  },
});
