import type { ReactNode } from "react";

import React from "react";
import { StyleSheet, View } from "react-native";

import {
  flvPalette,
  flvSemanticColors,
  flvStateCopy,
  radiusScale,
  spacingScale,
} from "../index.js";
import { EngajaLogoMark } from "./brand.js";
import { Button, Card, FlvText } from "./primitives.js";

type FlowStateTone = "danger" | "info" | "success" | "warning";

export interface FlowStateCardProps {
  readonly actionLabel?: string | undefined;
  readonly description: string;
  readonly eyebrow: string;
  readonly onActionPress?: (() => void) | undefined;
  readonly title: string;
  readonly tone?: FlowStateTone | undefined;
}

export function FlowStateCard({
  actionLabel,
  description,
  eyebrow,
  onActionPress,
  title,
  tone = "info",
}: FlowStateCardProps): ReactNode {
  const accentColor =
    tone === "danger"
      ? flvPalette.tomato
      : tone === "success"
        ? flvPalette.leaf
        : tone === "warning"
          ? flvPalette.citrus
          : flvPalette.grape;

  return (
    <Card style={styles.card} tone="muted">
      <View style={styles.stateHeader}>
        <EngajaLogoMark size="sm" />
        <View style={[styles.accentRail, { backgroundColor: accentColor }]} />
      </View>
      <View style={styles.copy}>
        <FlvText tone="accent" variant="eyebrow">
          {eyebrow}
        </FlvText>
        <FlvText variant="headline">{title}</FlvText>
        <FlvText tone="muted">{description}</FlvText>
      </View>
      {actionLabel !== undefined ? (
        <Button label={actionLabel} onPress={onActionPress} tone={toneToButtonTone[tone]} />
      ) : null}
    </Card>
  );
}

export interface LoadingStateCardProps {
  readonly description?: string | undefined;
  readonly title?: string | undefined;
}

export function LoadingStateCard({
  description,
  title,
}: LoadingStateCardProps = {}): ReactNode {
  return (
    <Card style={styles.placeholderCard} tone="muted">
      <View style={styles.stateHeader}>
        <EngajaLogoMark size="sm" />
        <FlvText tone="accent" variant="eyebrow">
          {flvStateCopy.loading.eyebrow}
        </FlvText>
      </View>
      {title === undefined ? null : (
        <View style={styles.copy}>
          <FlvText variant="headline">{title}</FlvText>
          {description === undefined ? null : <FlvText tone="muted">{description}</FlvText>}
        </View>
      )}
      <View style={styles.skeletonBlockLarge} />
      <View style={styles.skeletonBlockMedium} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChipShort} />
      </View>
    </Card>
  );
}

export function EmptyStateCard({
  actionLabel = flvStateCopy.empty.actionLabel,
  description = flvStateCopy.empty.description,
  onActionPress,
  title = flvStateCopy.empty.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.empty.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="info"
    />
  );
}

export function ErrorStateCard({
  actionLabel = flvStateCopy.error.actionLabel,
  description = flvStateCopy.error.description,
  onActionPress,
  title = flvStateCopy.error.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.error.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="danger"
    />
  );
}

export function OfflineStateCard({
  actionLabel = flvStateCopy.offline.actionLabel,
  description = flvStateCopy.offline.description,
  onActionPress,
  title = flvStateCopy.offline.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.offline.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="warning"
    />
  );
}

export function PendingStateCard({
  actionLabel = flvStateCopy.pending.actionLabel,
  description = flvStateCopy.pending.description,
  onActionPress,
  title = flvStateCopy.pending.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.pending.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="warning"
    />
  );
}

export function PermissionDeniedStateCard({
  actionLabel = flvStateCopy.permissionDenied.actionLabel,
  description = flvStateCopy.permissionDenied.description,
  onActionPress,
  title = flvStateCopy.permissionDenied.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.permissionDenied.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="danger"
    />
  );
}

export function SuccessStateCard({
  actionLabel = flvStateCopy.success.actionLabel,
  description = flvStateCopy.success.description,
  onActionPress,
  title = flvStateCopy.success.title,
}: Partial<FlowStateCardProps>): ReactNode {
  return (
    <FlowStateCard
      actionLabel={actionLabel}
      description={description}
      eyebrow={flvStateCopy.success.eyebrow}
      onActionPress={onActionPress}
      title={title}
      tone="success"
    />
  );
}

const toneToButtonTone = {
  danger: "danger",
  info: "secondary",
  success: "primary",
  warning: "accent",
} as const;

const styles = StyleSheet.create({
  accentRail: {
    borderRadius: radiusScale.pill,
    height: 10,
    width: 64,
  },
  card: {
    gap: spacingScale.md,
  },
  copy: {
    gap: spacingScale.sm,
  },
  placeholderCard: {
    gap: spacingScale.md,
  },
  skeletonBlockLarge: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.sm,
    height: 20,
    opacity: 0.75,
    width: "78%",
  },
  skeletonBlockMedium: {
    backgroundColor: flvSemanticColors.border,
    borderRadius: radiusScale.sm,
    height: 16,
    opacity: 0.55,
    width: "92%",
  },
  skeletonChip: {
    backgroundColor: flvPalette.mist,
    borderRadius: radiusScale.pill,
    height: 32,
    width: 104,
  },
  skeletonChipShort: {
    backgroundColor: flvPalette.mist,
    borderRadius: radiusScale.pill,
    height: 32,
    width: 72,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacingScale.sm,
  },
  stateHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacingScale.sm,
    justifyContent: "space-between",
  },
});
