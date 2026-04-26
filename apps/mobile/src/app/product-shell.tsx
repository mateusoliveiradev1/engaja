import type { ReactNode } from "react";

import React from "react";
import { StyleSheet, View } from "react-native";

import { flvSemanticColors, radiusScale, spacingScale } from "@engaja/ui";
import {
  Avatar,
  Badge,
  FlvText,
  LoadingStateCard,
  MetricTile,
  OfflineStateCard,
  PermissionDeniedStateCard,
  ScreenScaffold,
  Tabs,
} from "@engaja/ui/native";

export const collaboratorTabOptions = [
  { id: "feed", label: "Engajar" },
  { id: "schedule", label: "Escala" },
  { id: "operations", label: "Rotinas" },
  { id: "recognition", label: "Conquistas" },
] as const;

export type CollaboratorTabId = (typeof collaboratorTabOptions)[number]["id"];

export const leaderTabOptions = [
  { id: "overview", label: "Painel" },
  { id: "campaigns", label: "Campanhas" },
  { id: "moderation", label: "Moderacao" },
  { id: "coverage", label: "Escala" },
  { id: "team", label: "Time" },
] as const;

export type LeaderTabId = (typeof leaderTabOptions)[number]["id"];

export interface ProductTabDescriptor {
  readonly badge?: string;
  readonly id: string;
  readonly label: string;
}

export interface ProductMetricDescriptor {
  readonly key: string;
  readonly label: string;
  readonly note?: string;
  readonly tone: "accent" | "fresh" | "warm";
  readonly value: string;
}

export interface ProductUserContextDescriptor {
  readonly areaLabel: string;
  readonly displayName: string;
  readonly roleLabel: string;
}

export interface ProductAccessStateScreenProps {
  readonly actionLabel?: string;
  readonly description: string;
  readonly isLoading?: boolean;
  readonly onActionPress?: () => void;
  readonly title: string;
}

export function ProductAccessStateScreen({
  actionLabel,
  description,
  isLoading = false,
  onActionPress,
  title,
}: ProductAccessStateScreenProps): ReactNode {
  return (
    <ScreenScaffold eyebrow="Acesso Engaja" subtitle={description} title={title}>
      {isLoading ? (
        <LoadingStateCard description={description} title={title} />
      ) : (
        <PermissionDeniedStateCard
          actionLabel={actionLabel}
          description={description}
          onActionPress={onActionPress}
          title={title}
        />
      )}
    </ScreenScaffold>
  );
}

export interface CollaboratorHomeChromeProps {
  readonly activeTab: CollaboratorTabId;
  readonly isOffline: boolean;
  readonly onTabChange: (nextTabId: string) => void;
  readonly operationsMetricValue: string;
  readonly pendingCount: number;
  readonly postCount: number;
  readonly scheduleMetricValue: string;
  readonly tabs: readonly ProductTabDescriptor[];
  readonly userContext: ProductUserContextDescriptor;
}

export function CollaboratorHomeChrome({
  activeTab,
  isOffline,
  onTabChange,
  operationsMetricValue,
  pendingCount,
  postCount,
  scheduleMetricValue,
  tabs,
  userContext,
}: CollaboratorHomeChromeProps): ReactNode {
  return (
    <View style={styles.stack}>
      <ProductContextBar
        statusLabel={isOffline ? "Sem conexao" : "Online"}
        statusTone={isOffline ? "warning" : "success"}
        userContext={userContext}
      />

      <View style={styles.metricRow}>
        <MetricTile
          label="Feed"
          note={pendingCount > 0 ? "pendente" : "fotos do turno"}
          tone="fresh"
          value={`${postCount}`}
        />
        <MetricTile label="Escala" note="entrada" tone="accent" value={scheduleMetricValue} />
        <MetricTile label="Rotinas" note="concluidas" tone="warm" value={operationsMetricValue} />
      </View>

      <Tabs activeTabId={activeTab} onTabChange={onTabChange} tabs={tabs} />

      {isOffline ? <OfflineStateCard /> : null}
    </View>
  );
}

export interface LeaderHomeChromeProps {
  readonly activeTab: LeaderTabId;
  readonly isOffline: boolean;
  readonly metrics: readonly ProductMetricDescriptor[];
  readonly onTabChange: (nextTabId: string) => void;
  readonly tabs: readonly ProductTabDescriptor[];
  readonly userContext: ProductUserContextDescriptor;
}

export function LeaderHomeChrome({
  activeTab,
  isOffline,
  metrics,
  onTabChange,
  tabs,
  userContext,
}: LeaderHomeChromeProps): ReactNode {
  return (
    <View style={styles.stack}>
      <ProductContextBar
        statusLabel={isOffline ? "Sem conexao" : "Online"}
        statusTone={isOffline ? "warning" : "success"}
        userContext={userContext}
      />

      <View style={styles.metricRow}>
        {metrics.map((metric) => (
          <MetricTile
            key={metric.key}
            label={metric.label}
            {...(metric.note === undefined ? {} : { note: metric.note })}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </View>

      <Tabs activeTabId={activeTab} onTabChange={onTabChange} tabs={tabs} />

      {isOffline ? <OfflineStateCard /> : null}
    </View>
  );
}

function ProductContextBar({
  statusLabel,
  statusTone,
  userContext,
}: {
  readonly statusLabel: string;
  readonly statusTone: "danger" | "info" | "success" | "warning";
  readonly userContext: ProductUserContextDescriptor;
}): ReactNode {
  return (
    <View style={styles.contextBar}>
      <Avatar initials={buildInitials(userContext.displayName)} label={userContext.displayName} />
      <View style={styles.contextCopy}>
        <FlvText variant="label">{userContext.displayName}</FlvText>
        <FlvText tone="muted" variant="caption">
          {userContext.roleLabel} / {userContext.areaLabel}
        </FlvText>
      </View>
      <View style={styles.contextBadge}>
        <Badge label={statusLabel} tone={statusTone} />
      </View>
    </View>
  );
}

function buildInitials(displayName: string): string {
  const pieces = displayName
    .trim()
    .split(/\s+/)
    .filter((piece) => piece.length > 0);

  if (pieces.length === 0) {
    return "EN";
  }

  return pieces
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase() ?? "")
    .join("");
}

const styles = StyleSheet.create({
  contextBadge: {
    alignItems: "flex-end",
  },
  contextBar: {
    alignItems: "center",
    backgroundColor: flvSemanticColors.panel,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.md,
    padding: spacingScale.md,
  },
  contextCopy: {
    flex: 1,
    gap: spacingScale.xxs,
    minWidth: 180,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  stack: {
    gap: spacingScale.lg,
  },
});
