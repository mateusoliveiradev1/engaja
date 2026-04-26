import type { ReactNode } from "react";

import { Image } from "expo-image";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  flvControlTokens,
  flvMediaTokens,
  flvPalette,
  flvProductCopy,
  flvSemanticColors,
  flvStatusColors,
  normalizeAccessibleLabel,
  radiusScale,
  spacingScale,
} from "../index.js";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  FlvText,
  IconButton,
  Input,
  ListRow,
  MetricTile,
} from "./primitives.js";
import { flvImagePerformanceDefaults } from "./image-performance.js";

export interface ReactionSummary {
  readonly count: number;
  readonly id: string;
  readonly label: string;
  readonly selected?: boolean;
}

export interface CommentPreviewDescriptor {
  readonly author: string;
  readonly body: string;
  readonly id: string;
  readonly pending?: boolean;
  readonly timestamp: string;
}

export interface ModerationActionDescriptor {
  readonly disabled?: boolean | undefined;
  readonly id: "approve" | "feature" | "hide" | "pin" | "remove";
  readonly label: string;
  readonly onPress?: () => void;
  readonly tone?: "danger" | "primary" | "secondary";
}

export interface FeedPriorityItem {
  readonly actionLabel?: string;
  readonly description: string;
  readonly id: string;
  readonly onPress?: () => void;
  readonly title: string;
  readonly tone?: "danger" | "info" | "success" | "warning";
}

export interface RankingItem {
  readonly helper?: string;
  readonly id: string;
  readonly label: string;
  readonly rank: number;
  readonly value: string;
}

export function PhotoCard({
  authorInitials,
  authorName,
  category,
  description,
  highlight,
  photoUrl,
  thumbnailUrl,
  title,
}: {
  readonly authorInitials: string;
  readonly authorName: string;
  readonly category: string;
  readonly description: string;
  readonly highlight: string;
  readonly photoUrl?: string;
  readonly thumbnailUrl?: string;
  readonly title: string;
}): ReactNode {
  const imageUrl = thumbnailUrl ?? photoUrl;

  return (
    <Card style={styles.photoCard}>
      <View style={styles.photoHero}>
        {imageUrl === undefined ? (
          <View style={styles.photoFallback} />
        ) : (
          <Image
            accessibilityLabel={`${title}. Foto do setor FLV.`}
            cachePolicy={flvImagePerformanceDefaults.cachePolicy}
            contentFit="cover"
            placeholder={flvImagePerformanceDefaults.placeholderBlurhash}
            placeholderContentFit="cover"
            recyclingKey={imageUrl}
            source={imageUrl}
            style={styles.photoImage}
            transition={flvImagePerformanceDefaults.progressiveTransitionMs}
          />
        )}
        <View style={styles.photoScrim} />
        <View style={styles.photoCaptionCard}>
          <Chip label={category} tone="fresh" />
          <FlvText style={styles.photoTitle} tone="inverse" variant="headline">
            {title}
          </FlvText>
          <FlvText style={styles.photoDescription} tone="inverse" variant="caption">
            {description}
          </FlvText>
        </View>
      </View>
      <View style={styles.photoFooter}>
        <View style={styles.photoAuthor}>
          <Avatar initials={authorInitials} label={authorName} />
          <View style={styles.photoAuthorCopy}>
            <FlvText variant="label">{authorName}</FlvText>
            <FlvText tone="muted" variant="caption">
              {highlight}
            </FlvText>
          </View>
        </View>
        <IconButton accessibilityLabel="Abrir detalhes do post" icon=">" />
      </View>
    </Card>
  );
}

export function SocialPostCard({
  actionSlot,
  authorInitials,
  authorName,
  caption,
  comments = [],
  commentsTotalLabel,
  metadata = [],
  moderationActions = [],
  onReactionPress,
  photoUrl,
  reactionDisabled = false,
  reactions = [],
  selectedReactionId,
  statusLabel,
  statusTone = "info",
  thumbnailUrl,
  timestamp,
  title,
}: {
  readonly actionSlot?: ReactNode;
  readonly authorInitials: string;
  readonly authorName: string;
  readonly caption: string;
  readonly comments?: readonly CommentPreviewDescriptor[];
  readonly commentsTotalLabel?: string;
  readonly metadata?: readonly string[];
  readonly moderationActions?: readonly ModerationActionDescriptor[];
  readonly onReactionPress?: (reactionId: string) => void;
  readonly photoUrl?: string;
  readonly reactionDisabled?: boolean;
  readonly reactions?: readonly ReactionSummary[];
  readonly selectedReactionId?: string | null;
  readonly statusLabel?: string;
  readonly statusTone?: "danger" | "info" | "success" | "warning";
  readonly thumbnailUrl?: string;
  readonly timestamp: string;
  readonly title?: string;
}): ReactNode {
  const imageUrl = thumbnailUrl ?? photoUrl;
  const currentSelectedReactionId =
    selectedReactionId ?? reactions.find((reaction) => reaction.selected === true)?.id ?? null;

  return (
    <Card style={styles.socialPostCard}>
      <View style={styles.postHeader}>
        <Avatar initials={authorInitials} label={authorName} />
        <View style={styles.postAuthorCopy}>
          <FlvText variant="label">{authorName}</FlvText>
          <FlvText tone="muted" variant="caption">
            {timestamp}
          </FlvText>
        </View>
        {statusLabel !== undefined ? <Badge label={statusLabel} tone={statusTone} /> : null}
      </View>
      {imageUrl !== undefined ? (
        <Image
          accessibilityLabel={normalizeAccessibleLabel([caption, "foto do registro"])}
          cachePolicy={flvImagePerformanceDefaults.cachePolicy}
          contentFit="cover"
          placeholder={flvImagePerformanceDefaults.placeholderBlurhash}
          placeholderContentFit="cover"
          recyclingKey={imageUrl}
          source={imageUrl}
          style={styles.postPhoto}
          transition={flvImagePerformanceDefaults.progressiveTransitionMs}
        />
      ) : (
        <View accessibilityLabel="Registro sem foto" accessible style={styles.postPhotoFallback}>
          <FlvText tone="muted" variant="caption">
            Sem imagem neste registro
          </FlvText>
        </View>
      )}
      <View style={styles.postBody}>
        {title === undefined ? null : <FlvText variant="headline">{title}</FlvText>}
        <FlvText>{caption}</FlvText>
        {metadata.length > 0 ? (
          <View style={styles.metadataRow}>
            {metadata.map((item) => (
              <Chip key={item} label={item} tone="neutral" />
            ))}
          </View>
        ) : null}
      </View>
      {reactions.length > 0 ? (
        <ReactionBar
          disabled={reactionDisabled}
          {...(onReactionPress === undefined ? {} : { onReactionPress })}
          reactions={reactions}
          selectedReactionId={currentSelectedReactionId}
        />
      ) : null}
      {comments.length > 0 ? (
        <CommentThreadPreview
          comments={comments}
          {...(commentsTotalLabel === undefined ? {} : { totalLabel: commentsTotalLabel })}
        />
      ) : null}
      {actionSlot}
      {moderationActions.length > 0 ? (
        <InlineModerationActions actions={moderationActions} />
      ) : null}
    </Card>
  );
}

export function QuickComposer({
  authorInitials,
  authorName,
  captionLabel = "Legenda",
  captionPlaceholder = flvProductCopy.feed.commentPlaceholder,
  captionTone = "default",
  captionValue,
  children,
  draftLabel,
  expanded = false,
  helperText,
  onCameraPress,
  onCaptionChange,
  onGalleryPress,
  onPrimaryPress,
  onToggleExpanded,
  primaryDisabled = false,
  primaryLabel,
  primaryLoading = false,
  prompt = flvProductCopy.feed.composerPrompt,
}: {
  readonly authorInitials: string;
  readonly authorName: string;
  readonly captionLabel?: string;
  readonly captionPlaceholder?: string;
  readonly captionTone?: "danger" | "default";
  readonly captionValue?: string;
  readonly children?: ReactNode;
  readonly draftLabel?: string;
  readonly expanded?: boolean;
  readonly helperText?: string;
  readonly onCameraPress?: () => void;
  readonly onCaptionChange?: (value: string) => void;
  readonly onGalleryPress?: () => void;
  readonly onPrimaryPress?: () => void;
  readonly onToggleExpanded?: () => void;
  readonly primaryDisabled?: boolean;
  readonly primaryLabel?: string;
  readonly primaryLoading?: boolean;
  readonly prompt?: string;
}): ReactNode {
  return (
    <Card>
      <View style={styles.quickComposerHeader}>
        <Avatar initials={authorInitials} label={authorName} />
        <View style={styles.quickComposerCopy}>
          <FlvText variant="label">{authorName}</FlvText>
          <FlvText tone="muted" variant="caption">
            {prompt}
          </FlvText>
        </View>
      </View>
      {draftLabel !== undefined ? (
        <View style={styles.quickComposerSummary}>
          <FlvText tone="accent" variant="caption">
            {draftLabel}
          </FlvText>
        </View>
      ) : null}
      {expanded ? (
        <View style={styles.quickComposerBody}>
          <Input
            helperText={helperText ?? flvProductCopy.feed.photoRequired}
            label={captionLabel}
            multiline
            onChangeText={onCaptionChange}
            placeholder={captionPlaceholder}
            tone={captionTone}
            value={captionValue}
          />
          {children}
        </View>
      ) : null}
      <View style={styles.composerActions}>
        <Chip label="Camera" onPress={onCameraPress} tone="fresh" />
        <Chip label="Galeria" onPress={onGalleryPress} tone="warm" />
        <Chip
          label={expanded ? "Menos detalhes" : "Mais detalhes"}
          onPress={onToggleExpanded}
          selected={expanded}
          tone="neutral"
        />
      </View>
      <Button
        disabled={primaryDisabled}
        icon="+"
        label={
          primaryLabel ??
          (expanded ? flvProductCopy.actions.publish : flvProductCopy.actions.continue)
        }
        loading={primaryLoading}
        onPress={onPrimaryPress}
        tone="primary"
      />
    </Card>
  );
}

export function UploadComposer(): ReactNode {
  return (
    <Card>
      <FlvText tone="accent" variant="eyebrow">
        Publicar agora
      </FlvText>
      <Input
        helperText="Legenda enxuta, util e conectada com a rotina do setor."
        label="Legenda"
        placeholder="Ex.: Abastecimento finalizado com frente organizada e padrao de maturacao conferido."
      />
      <View style={styles.composerActions}>
        <Chip label="Camera" onPress={() => undefined} tone="fresh" />
        <Chip label="Galeria" onPress={() => undefined} tone="warm" />
        <Chip label="Missao" onPress={() => undefined} tone="neutral" />
      </View>
      <Button icon="+" label="Enviar com foto" tone="primary" />
    </Card>
  );
}

export function ReactionBar({
  disabled = false,
  onReactionPress,
  reactions,
  selectedReactionId,
}: {
  readonly disabled?: boolean;
  readonly onReactionPress?: (reactionId: string) => void;
  readonly reactions: readonly ReactionSummary[];
  readonly selectedReactionId?: string | null;
}): ReactNode {
  const [localSelectedReactionId, setLocalSelectedReactionId] = useState<string | null>(null);
  const currentSelectedReactionId = selectedReactionId ?? localSelectedReactionId;

  return (
    <View style={styles.reactionRow}>
      {reactions.map((reaction) => {
        const selected = reaction.id === currentSelectedReactionId;

        return (
          <Chip
            accessibilityLabel={normalizeAccessibleLabel([
              reaction.label,
              `${reaction.count} reacoes`,
              selected ? "selecionada" : undefined,
            ])}
            key={reaction.id}
            label={`${reaction.label} ${reaction.count}`}
            onPress={
              disabled
                ? undefined
                : () => {
                    setLocalSelectedReactionId(reaction.id);
                    onReactionPress?.(reaction.id);
                  }
            }
            selected={selected}
            tone={selected ? "bold" : "neutral"}
          />
        );
      })}
    </View>
  );
}

export function CommentThreadPreview({
  comments,
  totalLabel,
}: {
  readonly comments: readonly CommentPreviewDescriptor[];
  readonly totalLabel?: string;
}): ReactNode {
  return (
    <View style={styles.threadPreview}>
      {totalLabel !== undefined ? (
        <FlvText tone="muted" variant="caption">
          {totalLabel}
        </FlvText>
      ) : null}
      {comments.slice(0, 2).map((comment) => (
        <View key={comment.id} style={styles.threadComment}>
          <View style={styles.commentHeader}>
            <FlvText variant="label">{comment.author}</FlvText>
            <FlvText tone="muted" variant="caption">
              {comment.pending === true ? "Aguardando envio" : comment.timestamp}
            </FlvText>
          </View>
          <FlvText>{comment.body}</FlvText>
        </View>
      ))}
    </View>
  );
}

export function CommentPreview({
  author,
  body,
  timestamp,
}: {
  readonly author: string;
  readonly body: string;
  readonly timestamp: string;
}): ReactNode {
  return (
    <Card style={styles.commentCard} tone="muted">
      <View style={styles.commentHeader}>
        <FlvText variant="label">{author}</FlvText>
        <FlvText tone="muted" variant="caption">
          {timestamp}
        </FlvText>
      </View>
      <FlvText>{body}</FlvText>
    </Card>
  );
}

export function ModerationBanner({
  message,
  tone = "warning",
}: {
  readonly message: string;
  readonly tone?: "danger" | "success" | "warning";
}): ReactNode {
  return (
    <Card tone="muted">
      <View style={styles.bannerHeader}>
        <Badge
          label={tone === "danger" ? "Removido" : tone === "success" ? "Aprovado" : "Em revisao"}
          tone={tone === "warning" ? "warning" : tone === "success" ? "success" : "danger"}
        />
        <FlvText tone="muted" variant="caption">
          Lideranca FLV
        </FlvText>
      </View>
      <FlvText>{message}</FlvText>
    </Card>
  );
}

export function FeedPriorityStrip({
  items,
}: {
  readonly items: readonly FeedPriorityItem[];
}): ReactNode {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.priorityStripScroller}
    >
      <View style={styles.priorityStrip}>
        {items.map((item) => (
          <View key={item.id} style={styles.priorityItem}>
            <Badge label={item.title} tone={item.tone ?? "info"} />
            <FlvText tone="muted" variant="caption">
              {item.description}
            </FlvText>
            {item.actionLabel !== undefined ? (
              <Button
                fullWidth={false}
                label={item.actionLabel}
                onPress={item.onPress}
                tone="secondary"
              />
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function InlineModerationActions({
  actions,
}: {
  readonly actions: readonly ModerationActionDescriptor[];
}): ReactNode {
  return (
    <View style={styles.moderationActions}>
      {actions.map((action) => {
        const disabledProps = action.disabled === undefined ? {} : { disabled: action.disabled };

        return (
          <Button
            {...disabledProps}
            fullWidth={false}
            key={action.id}
            label={action.label}
            onPress={action.onPress}
            tone={action.tone ?? (action.id === "remove" ? "danger" : "secondary")}
          />
        );
      })}
    </View>
  );
}

export function PostSkeleton(): ReactNode {
  return (
    <Card style={styles.skeletonCard}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonLineLong} />
      <View style={styles.skeletonLineShort} />
    </Card>
  );
}

export function ShiftCard({
  dayLabel,
  roleLabel,
  statusLabel,
  timeRange,
}: {
  readonly dayLabel: string;
  readonly roleLabel: string;
  readonly statusLabel: string;
  readonly timeRange: string;
}): ReactNode {
  return (
    <Card>
      <View style={styles.shiftHeader}>
        <View>
          <FlvText tone="accent" variant="eyebrow">
            {dayLabel}
          </FlvText>
          <FlvText variant="headline">{timeRange}</FlvText>
        </View>
        <Badge label={statusLabel} tone="info" />
      </View>
      <ListRow
        description="Loja centro / setor FLV"
        title={roleLabel}
        trailing={<IconButton accessibilityLabel="Ver detalhes do turno" icon=">" />}
      />
    </Card>
  );
}

export interface WeeklyTimelineDay {
  readonly emphasis?: "high" | "medium";
  readonly id: string;
  readonly label: string;
  readonly shift: string;
}

export function WeeklyTimeline({
  days,
}: {
  readonly days: readonly WeeklyTimelineDay[];
}): ReactNode {
  return (
    <Card tone="muted">
      <FlvText variant="label">Semana operacional</FlvText>
      <View style={styles.timelineRow}>
        {days.map((day) => {
          const activeColor =
            day.emphasis === "high"
              ? flvPalette.leaf
              : day.emphasis === "medium"
                ? flvPalette.citrus
                : flvSemanticColors.border;

          return (
            <View key={day.id} style={styles.timelineDay}>
              <FlvText tone="muted" variant="caption">
                {day.label}
              </FlvText>
              <View style={[styles.timelinePill, { backgroundColor: activeColor }]} />
              <FlvText variant="caption">{day.shift}</FlvText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function CoverageIndicator({
  label,
  note,
  progress,
}: {
  readonly label: string;
  readonly note: string;
  readonly progress: number;
}): ReactNode {
  const progressWidth = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;

  return (
    <Card tone="muted">
      <FlvText variant="label">{label}</FlvText>
      <View style={styles.coverageTrack}>
        <View style={[styles.coverageFill, { width: progressWidth }]} />
      </View>
      <FlvText tone="muted" variant="caption">
        {note}
      </FlvText>
    </Card>
  );
}

export function RequestStatusChip({
  label,
  tone = "warning",
}: {
  readonly label: string;
  readonly tone?: "danger" | "success" | "warning";
}): ReactNode {
  return (
    <Badge
      label={label}
      tone={tone === "warning" ? "warning" : tone === "success" ? "success" : "danger"}
    />
  );
}

export function ApprovalActions({
  note,
  primaryLabel,
  secondaryLabel,
}: {
  readonly note: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
}): ReactNode {
  return (
    <Card tone="muted">
      <FlvText variant="label">Aprovacao rapida</FlvText>
      <View style={styles.approvalButtons}>
        <Button fullWidth={false} label={primaryLabel} tone="primary" />
        <Button fullWidth={false} label={secondaryLabel} tone="secondary" />
      </View>
      <FlvText tone="muted" variant="caption">
        {note}
      </FlvText>
    </Card>
  );
}

export function CoverageDecisionCard({
  gapLabel,
  note,
  onPrimaryPress,
  onSecondaryPress,
  primaryLabel = "Publicar ajuste",
  riskLabel,
  secondaryLabel = "Rever escala",
  title,
}: {
  readonly gapLabel: string;
  readonly note: string;
  readonly onPrimaryPress?: () => void;
  readonly onSecondaryPress?: () => void;
  readonly primaryLabel?: string;
  readonly riskLabel: string;
  readonly secondaryLabel?: string;
  readonly title: string;
}): ReactNode {
  return (
    <Card>
      <View style={styles.decisionHeader}>
        <View style={styles.decisionCopy}>
          <FlvText tone="accent" variant="eyebrow">
            {flvProductCopy.schedule.coverageDecision}
          </FlvText>
          <FlvText variant="headline">{title}</FlvText>
        </View>
        <Badge label={riskLabel} tone="warning" />
      </View>
      <ListRow description={note} title={gapLabel} />
      <View style={styles.approvalButtons}>
        <Button fullWidth={false} label={primaryLabel} onPress={onPrimaryPress} tone="primary" />
        <Button
          fullWidth={false}
          label={secondaryLabel}
          onPress={onSecondaryPress}
          tone="secondary"
        />
      </View>
    </Card>
  );
}

export interface ChecklistItemDescriptor {
  readonly helper?: string;
  readonly id: string;
  readonly label: string;
  readonly selected?: boolean;
}

export function ChecklistCard({
  items,
  title,
}: {
  readonly items: readonly ChecklistItemDescriptor[];
  readonly title: string;
}): ReactNode {
  const [localItems, setLocalItems] = useState(items);

  return (
    <Card>
      <FlvText variant="headline">{title}</FlvText>
      <View style={styles.checklistItems}>
        {localItems.map((item) => {
          const selected = item.selected === true;

          return (
            <View
              key={item.id}
              style={[
                styles.checklistRow,
                selected ? styles.checklistRowSelected : styles.checklistRowIdle,
              ]}
            >
              <Button
                accessibilityLabel={`${selected ? "Desmarcar" : "Concluir"} ${item.label}`}
                fullWidth={false}
                icon={selected ? "OK" : "+"}
                label={selected ? "Feito" : "Marcar"}
                onPress={() =>
                  setLocalItems((currentItems) =>
                    currentItems.map((currentItem) =>
                      currentItem.id === item.id
                        ? {
                            ...currentItem,
                            selected: currentItem.selected !== true,
                          }
                        : currentItem,
                    ),
                  )
                }
                tone={selected ? "primary" : "secondary"}
              />
              <View style={styles.checklistCopy}>
                <FlvText variant="label">{item.label}</FlvText>
                {item.helper !== undefined ? (
                  <FlvText tone="muted" variant="caption">
                    {item.helper}
                  </FlvText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function RoutineChecklist({
  items,
  onToggleItem,
  progressLabel,
  title,
}: {
  readonly items: readonly ChecklistItemDescriptor[];
  readonly onToggleItem?: (itemId: string) => void;
  readonly progressLabel: string;
  readonly title: string;
}): ReactNode {
  const completedCount = items.filter((item) => item.selected === true).length;

  return (
    <Card>
      <View style={styles.routineHeader}>
        <View style={styles.decisionCopy}>
          <FlvText tone="accent" variant="eyebrow">
            {flvProductCopy.routines.priority}
          </FlvText>
          <FlvText variant="headline">{title}</FlvText>
        </View>
        <Badge label={progressLabel} tone={completedCount === items.length ? "success" : "info"} />
      </View>
      <View style={styles.checklistItems}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.checklistRow,
              item.selected === true ? styles.checklistRowSelected : styles.checklistRowIdle,
            ]}
          >
            <IconButton
              accessibilityLabel={`${item.selected === true ? "Concluido" : "Concluir"} ${
                item.label
              }`}
              icon={item.selected === true ? "OK" : "+"}
              onPress={onToggleItem === undefined ? undefined : () => onToggleItem(item.id)}
              tone={item.selected === true ? "primary" : "secondary"}
            />
            <View style={styles.checklistCopy}>
              <FlvText variant="label">{item.label}</FlvText>
              <FlvText tone="muted" variant="caption">
                {item.helper ?? flvProductCopy.routines.checklistNext}
              </FlvText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function EvidenceThumbnail({
  label,
  status,
}: {
  readonly label: string;
  readonly status: string;
}): ReactNode {
  return (
    <Card style={styles.evidenceCard} tone="muted">
      <View style={styles.evidencePhoto} />
      <View style={styles.evidenceCopy}>
        <FlvText variant="label">{label}</FlvText>
        <Badge label={status} tone="info" />
      </View>
    </Card>
  );
}

export function EvidenceBlock({
  description,
  imageUrl,
  label,
  status,
}: {
  readonly description?: string;
  readonly imageUrl?: string;
  readonly label: string;
  readonly status: string;
}): ReactNode {
  return (
    <Card tone="muted">
      {imageUrl !== undefined ? (
        <Image
          accessibilityLabel={`${label}. Evidencia registrada.`}
          cachePolicy={flvImagePerformanceDefaults.cachePolicy}
          contentFit="cover"
          placeholder={flvImagePerformanceDefaults.placeholderBlurhash}
          placeholderContentFit="cover"
          recyclingKey={imageUrl}
          source={imageUrl}
          style={styles.evidenceImage}
          transition={flvImagePerformanceDefaults.progressiveTransitionMs}
        />
      ) : (
        <View accessibilityLabel="Evidencia sem foto" accessible style={styles.evidencePhoto} />
      )}
      <View style={styles.evidenceCopy}>
        <View style={styles.decisionCopy}>
          <FlvText variant="label">{label}</FlvText>
          {description !== undefined ? (
            <FlvText tone="muted" variant="caption">
              {description}
            </FlvText>
          ) : null}
        </View>
        <Badge label={status} tone="info" />
      </View>
    </Card>
  );
}

export function QualityStandardCard({
  title,
  checkpoints,
}: {
  readonly checkpoints: readonly string[];
  readonly title: string;
}): ReactNode {
  return (
    <Card tone="muted">
      <FlvText tone="accent" variant="eyebrow">
        Padrao visual
      </FlvText>
      <FlvText variant="headline">{title}</FlvText>
      <View style={styles.checkpointList}>
        {checkpoints.map((checkpoint) => (
          <Chip key={checkpoint} label={checkpoint} tone="fresh" />
        ))}
      </View>
    </Card>
  );
}

export function IssueFormCard(): ReactNode {
  return (
    <Card>
      <FlvText variant="headline">Registrar desvio</FlvText>
      <Input
        helperText="Inclua produto, perda, gravidade e o que ja foi feito no turno."
        label="Descricao"
        multiline
        placeholder="Ex.: Quebra de tomate grape na frente, lote separado e lider avisado."
      />
      <View style={styles.issueFooter}>
        <Chip label="Baixa" onPress={() => undefined} tone="neutral" />
        <Chip label="Media" onPress={() => undefined} tone="warning" />
        <Chip label="Alta" onPress={() => undefined} tone="bold" />
      </View>
      <Button label="Salvar ocorrencia" tone="accent" />
    </Card>
  );
}

export function ShiftSummaryCard({
  completed,
  overdue,
  wins,
}: {
  readonly completed: string;
  readonly overdue: string;
  readonly wins: string;
}): ReactNode {
  return (
    <Card>
      <FlvText tone="accent" variant="eyebrow">
        Fechamento do turno
      </FlvText>
      <View style={styles.summaryMetrics}>
        <MetricTile label="Rotinas" tone="fresh" value={completed} />
        <MetricTile label="Pendencias" tone="warm" value={overdue} />
        <MetricTile label="Destaque" tone="accent" value={wins} />
      </View>
      <FlvText tone="muted">
        Resumo com foco em entregas, desvios e reconhecimento antes da troca de equipe.
      </FlvText>
    </Card>
  );
}

export function RecognitionCard({
  campaignLabel,
  fromInitials,
  fromName,
  message,
  pointsLabel,
  toName,
}: {
  readonly campaignLabel?: string;
  readonly fromInitials: string;
  readonly fromName: string;
  readonly message: string;
  readonly pointsLabel: string;
  readonly toName: string;
}): ReactNode {
  return (
    <Card>
      <View style={styles.postHeader}>
        <Avatar initials={fromInitials} label={fromName} tone="warm" />
        <View style={styles.postAuthorCopy}>
          <FlvText variant="label">{fromName}</FlvText>
          <FlvText tone="muted" variant="caption">
            reconheceu {toName}
          </FlvText>
        </View>
        <Badge label={pointsLabel} tone="success" />
      </View>
      <FlvText>{message}</FlvText>
      {campaignLabel !== undefined ? <Chip label={campaignLabel} tone="warm" /> : null}
    </Card>
  );
}

export function CampaignProgressCard({
  actionLabel = flvProductCopy.actions.viewDetails,
  note,
  onActionPress,
  progress,
  title,
}: {
  readonly actionLabel?: string;
  readonly note: string;
  readonly onActionPress?: () => void;
  readonly progress: number;
  readonly title: string;
}): ReactNode {
  const progressWidth = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;

  return (
    <Card>
      <View style={styles.decisionHeader}>
        <View style={styles.decisionCopy}>
          <FlvText tone="accent" variant="eyebrow">
            {flvProductCopy.recognition.campaignProgress}
          </FlvText>
          <FlvText variant="headline">{title}</FlvText>
        </View>
        <Badge label={`${Math.round(progress)}%`} tone={progress >= 100 ? "success" : "info"} />
      </View>
      <View style={styles.coverageTrack}>
        <View style={[styles.coverageFill, { width: progressWidth }]} />
      </View>
      <FlvText tone="muted" variant="caption">
        {note}
      </FlvText>
      <Button fullWidth={false} label={actionLabel} onPress={onActionPress} tone="secondary" />
    </Card>
  );
}

export function RankingList({
  items,
  title = flvProductCopy.recognition.ranking,
}: {
  readonly items: readonly RankingItem[];
  readonly title?: string;
}): ReactNode {
  return (
    <Card>
      <FlvText variant="headline">{title}</FlvText>
      <View style={styles.rankingList}>
        {items.map((item) => (
          <ListRow
            key={item.id}
            leading={<Badge label={`#${item.rank}`} tone={item.rank === 1 ? "success" : "info"} />}
            title={item.label}
            trailing={
              <FlvText tone="accent" variant="label">
                {item.value}
              </FlvText>
            }
            {...(item.helper === undefined ? {} : { description: item.helper })}
          />
        ))}
      </View>
    </Card>
  );
}

export function InviteMemberRow({
  actionLabel,
  description,
  initials,
  name,
  onActionPress,
  statusLabel,
  statusTone = "info",
}: {
  readonly actionLabel?: string;
  readonly description: string;
  readonly initials: string;
  readonly name: string;
  readonly onActionPress?: () => void;
  readonly statusLabel: string;
  readonly statusTone?: "danger" | "info" | "success" | "warning";
}): ReactNode {
  return (
    <View style={styles.memberRow}>
      <ListRow
        description={description}
        leading={<Avatar initials={initials} label={name} />}
        title={name}
        trailing={<Badge label={statusLabel} tone={statusTone} />}
      />
      {actionLabel !== undefined ? (
        <Button fullWidth={false} label={actionLabel} onPress={onActionPress} tone="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  approvalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  bannerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
    justifyContent: "space-between",
  },
  checklistCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  checklistItems: {
    gap: spacingScale.sm,
  },
  checklistRow: {
    alignItems: "center",
    borderRadius: radiusScale.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacingScale.md,
    padding: spacingScale.md,
  },
  checklistRowIdle: {
    backgroundColor: flvSemanticColors.panel,
    borderColor: flvSemanticColors.border,
  },
  checklistRowSelected: {
    backgroundColor: flvStatusColors.success.background,
    borderColor: flvStatusColors.success.outline,
  },
  checkpointList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  commentCard: {
    gap: spacingScale.sm,
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  composerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  coverageFill: {
    backgroundColor: flvPalette.leaf,
    borderRadius: radiusScale.pill,
    height: "100%",
  },
  coverageTrack: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.pill,
    height: 12,
    overflow: "hidden",
  },
  evidenceCard: {
    gap: spacingScale.md,
  },
  evidenceCopy: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  evidenceImage: {
    aspectRatio: flvMediaTokens.evidenceAspectRatio,
    backgroundColor: flvMediaTokens.fallbackBackground,
    borderRadius: radiusScale.md,
    minHeight: flvMediaTokens.minEvidenceHeight,
    overflow: "hidden",
  },
  evidencePhoto: {
    backgroundColor: flvSemanticColors.photoShade,
    borderRadius: radiusScale.md,
    height: 120,
  },
  issueFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  decisionCopy: {
    flex: 1,
    gap: spacingScale.xs,
  },
  decisionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  memberRow: {
    backgroundColor: flvSemanticColors.card,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    gap: spacingScale.md,
    minHeight: flvControlTokens.standardHeight,
    padding: spacingScale.md,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  moderationActions: {
    borderTopColor: flvSemanticColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
    paddingTop: spacingScale.md,
  },
  photoAuthor: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacingScale.sm,
  },
  photoAuthorCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  photoCard: {
    padding: 0,
  },
  photoCaptionCard: {
    backgroundColor: "rgba(20, 33, 23, 0.72)",
    borderRadius: radiusScale.lg,
    gap: spacingScale.sm,
    padding: spacingScale.lg,
  },
  photoDescription: {
    maxWidth: 280,
  },
  photoFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.md,
    padding: spacingScale.lg,
  },
  photoFallback: {
    backgroundColor: flvPalette.graphite,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  photoImage: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  photoHero: {
    backgroundColor: flvPalette.graphite,
    aspectRatio: 4 / 3,
    minHeight: 256,
    overflow: "hidden",
    padding: spacingScale.lg,
    justifyContent: "flex-end",
  },
  photoScrim: {
    backgroundColor: "rgba(20, 33, 23, 0.38)",
    bottom: 0,
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: 0,
  },
  photoTitle: {
    maxWidth: 280,
  },
  postAuthorCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  postBody: {
    gap: spacingScale.md,
    paddingHorizontal: spacingScale.md,
  },
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
    paddingHorizontal: spacingScale.md,
    paddingTop: spacingScale.md,
  },
  postPhoto: {
    aspectRatio: flvMediaTokens.feedPhotoAspectRatio,
    backgroundColor: flvMediaTokens.fallbackBackground,
    maxHeight: flvMediaTokens.maxPreviewHeight,
    minHeight: flvMediaTokens.minFeedPhotoHeight,
    width: "100%",
  },
  postPhotoFallback: {
    alignItems: "center",
    aspectRatio: flvMediaTokens.feedPhotoAspectRatio,
    backgroundColor: flvMediaTokens.fallbackBackground,
    justifyContent: "center",
    minHeight: flvMediaTokens.minFeedPhotoHeight,
    padding: spacingScale.lg,
  },
  priorityItem: {
    backgroundColor: flvSemanticColors.card,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    gap: spacingScale.sm,
    maxWidth: 220,
    minHeight: 96,
    padding: spacingScale.md,
    width: 208,
  },
  priorityStrip: {
    flexDirection: "row",
    gap: spacingScale.sm,
    paddingRight: spacingScale.md,
  },
  priorityStripScroller: {
    marginRight: -spacingScale.md,
  },
  quickComposerCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  quickComposerBody: {
    gap: spacingScale.md,
  },
  quickComposerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
  },
  quickComposerSummary: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    padding: spacingScale.sm,
  },
  rankingList: {
    gap: spacingScale.md,
  },
  reactionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  routineHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  shiftHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skeletonCard: {
    gap: spacingScale.md,
  },
  skeletonHero: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    height: 180,
    opacity: 0.75,
  },
  skeletonLineLong: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.sm,
    height: 18,
    opacity: 0.65,
    width: "82%",
  },
  skeletonLineShort: {
    backgroundColor: flvPalette.mist,
    borderRadius: radiusScale.sm,
    height: 14,
    opacity: 0.9,
    width: "48%",
  },
  summaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  socialPostCard: {
    gap: spacingScale.md,
    padding: 0,
    paddingBottom: spacingScale.md,
  },
  threadComment: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    gap: spacingScale.sm,
    padding: spacingScale.md,
  },
  threadPreview: {
    gap: spacingScale.sm,
    paddingHorizontal: spacingScale.md,
  },
  timelineDay: {
    alignItems: "center",
    flex: 1,
    gap: spacingScale.sm,
  },
  timelinePill: {
    borderRadius: radiusScale.pill,
    height: 10,
    width: "100%",
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacingScale.sm,
  },
});
