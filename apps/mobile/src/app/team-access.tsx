import type { AccessInvitePayload, FlvRole, TenantScopePayload } from "@engaja/contracts";
import type { ReactNode } from "react";

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { flvSemanticColors, radiusScale, spacingScale } from "@engaja/ui";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyStateCard,
  ErrorStateCard,
  FlvText,
  Input,
  InviteMemberRow,
  PermissionDeniedStateCard,
  SectionHeader,
} from "@engaja/ui/native";

import {
  createMobileAuthService,
  toSafeAuthMessage,
  type MobileAuthService,
} from "./auth-service.js";
import { teamAccessCopy } from "./copy.js";
import type { MobileSession } from "./providers.js";

interface TeamAccessPanelProps {
  readonly authService?: MobileAuthService;
  readonly onInviteCountChange?: (inviteCount: number) => void;
  readonly session: MobileSession;
}

interface InviteDraft {
  readonly email: string;
  readonly expiresInDays: string;
  readonly role: FlvRole;
}

const initialInviteDraft: InviteDraft = {
  email: "",
  expiresInDays: "14",
  role: "colaborador",
};

export function TeamAccessPanel({
  authService,
  onInviteCountChange,
  session,
}: TeamAccessPanelProps): ReactNode {
  const resolvedAuthService = useMemo(
    () => authService ?? createMobileAuthService(),
    [authService],
  );
  const canManageInvites = useMemo(() => canManageInviteSurface(session), [session]);
  const roleOptions = useMemo(() => getInviteRoleOptions(session.role), [session.role]);
  const [draft, setDraft] = useState<InviteDraft>(initialInviteDraft);
  const [invites, setInvites] = useState<readonly AccessInvitePayload[]>([]);
  const [isLoading, setLoading] = useState(canManageInvites);
  const [isSubmitting, setSubmitting] = useState(false);
  const [panelError, setPanelError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    if (!canManageInvites) {
      onInviteCountChange?.(0);
      return;
    }

    let cancelled = false;

    async function loadInvites(): Promise<void> {
      try {
        setLoading(true);
        setPanelError(undefined);
        const nextInvites = await resolvedAuthService.listInvites(session.accessToken);

        if (!cancelled) {
          setInvites(nextInvites);
          onInviteCountChange?.(nextInvites.length);
        }
      } catch (error) {
        if (!cancelled) {
          setPanelError(
            toSafeAuthMessage(error, "Nao foi possivel carregar os convites do time agora."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInvites();

    return () => {
      cancelled = true;
    };
  }, [
    canManageInvites,
    onInviteCountChange,
    resolvedAuthService,
    session.accessToken,
    session.scope.departmentId,
    session.scope.organizationId,
    session.scope.storeId,
  ]);

  if (!canManageInvites) {
    return (
      <PermissionDeniedStateCard
        actionLabel="Voltar ao trabalho do dia"
        description={teamAccessCopy.permissionDescription}
        title="Convites protegidos"
      />
    );
  }

  const refreshInvites = async (): Promise<void> => {
    try {
      setLoading(true);
      setPanelError(undefined);
      const nextInvites = await resolvedAuthService.listInvites(session.accessToken);

      setInvites(nextInvites);
      onInviteCountChange?.(nextInvites.length);
    } catch (error) {
      setPanelError(toSafeAuthMessage(error, "Nao foi possivel atualizar os convites."));
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async (): Promise<void> => {
    const validationError = validateInviteDraft(draft);

    if (validationError !== undefined) {
      setPanelError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setPanelError(undefined);
      setSuccessMessage(undefined);

      const createdInvite = await resolvedAuthService.createInvite(session.accessToken, {
        email: normalizeEmail(draft.email),
        expiresInDays: Number.parseInt(draft.expiresInDays, 10),
        role: draft.role,
        scope: createInviteScope(session),
      });

      setInvites((currentInvites) => [createdInvite, ...currentInvites]);
      onInviteCountChange?.(invites.length + 1);
      setDraft(initialInviteDraft);
      setSuccessMessage(teamAccessCopy.successCreated);
    } catch (error) {
      setPanelError(toSafeAuthMessage(error, "Nao foi possivel criar este convite."));
    } finally {
      setSubmitting(false);
    }
  };

  const resendInvite = async (inviteId: string): Promise<void> => {
    await updateInvite(inviteId, async () =>
      resolvedAuthService.resendInvite(session.accessToken, inviteId),
    );
    setSuccessMessage(teamAccessCopy.successResent);
  };

  const revokeInvite = async (inviteId: string): Promise<void> => {
    await updateInvite(inviteId, async () =>
      resolvedAuthService.revokeInvite(session.accessToken, inviteId),
    );
    setSuccessMessage(teamAccessCopy.successRevoked);
  };

  const pendingInviteCount = invites.filter((invite) => invite.status === "pending").length;

  return (
    <View style={styles.stack}>
      <SectionHeader
        action={
          <Button
            disabled={isLoading}
            fullWidth={false}
            label="Atualizar"
            onPress={() => {
              void refreshInvites();
            }}
            tone="secondary"
          />
        }
        eyebrow="Acessos"
        title="Convites da equipe"
      />

      <Card tone="muted">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardCopy}>
            <FlvText tone="accent" variant="eyebrow">
              Perfil de acesso
            </FlvText>
            <FlvText variant="headline">{formatRoleLabel(session.role)}</FlvText>
            <FlvText tone="muted">Area de atuacao: {formatWorkArea(session.scope)}.</FlvText>
          </View>
          <Badge label={`${roleOptions.length} papeis`} tone="info" />
        </View>
        <View style={styles.inlineWrap}>
          {roleOptions.map((role) => (
            <Chip key={role} label={formatRoleLabel(role)} tone="neutral" />
          ))}
        </View>
      </Card>

      <Card>
        <FlvText tone="accent" variant="eyebrow">
          Novo acesso
        </FlvText>
        <FlvText tone="muted">
          {teamAccessCopy.scopeDescription} {formatWorkArea(session.scope)}.
        </FlvText>
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email da pessoa"
          onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
          placeholder="nome@empresa.com.br"
          value={draft.email}
        />
        <View style={styles.inlineWrap}>
          {roleOptions.map((role) => (
            <Chip
              key={role}
              label={formatRoleLabel(role)}
              onPress={() => setDraft((current) => ({ ...current, role }))}
              selected={draft.role === role}
              tone={draft.role === role ? "bold" : "neutral"}
            />
          ))}
        </View>
        <Input
          keyboardType="number-pad"
          label="Validade em dias"
          onChangeText={(expiresInDays) => setDraft((current) => ({ ...current, expiresInDays }))}
          placeholder="14"
          value={draft.expiresInDays}
        />
        <Button
          disabled={isSubmitting}
          icon="+"
          label={isSubmitting ? "Criando convite..." : "Enviar acesso"}
          onPress={() => {
            void createInvite();
          }}
          tone="primary"
        />
      </Card>

      <View style={styles.inlineWrap}>
        <Chip label={`${pendingInviteCount} pendente(s)`} tone="warm" />
        <Chip label={`${invites.length} convite(s)`} tone="fresh" />
      </View>

      {panelError === undefined ? null : (
        <ErrorStateCard
          actionLabel="Tentar de novo"
          description={panelError}
          onActionPress={() => {
            void refreshInvites();
          }}
          title="Convites indisponiveis"
        />
      )}

      {successMessage === undefined ? null : (
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Tudo certo
          </FlvText>
          <FlvText tone="muted">{successMessage}</FlvText>
        </Card>
      )}

      {isLoading && invites.length === 0 ? (
        <Card tone="muted">
          <FlvText tone="accent" variant="eyebrow">
            Carregando convites
          </FlvText>
          <FlvText tone="muted">{teamAccessCopy.loadingDescription}</FlvText>
        </Card>
      ) : null}

      {!isLoading && invites.length === 0 ? (
        <EmptyStateCard
          actionLabel={undefined}
          description={teamAccessCopy.emptyDescription}
          title="Ainda sem convites"
        />
      ) : (
        invites.map((invite) => (
          <InviteCard
            invite={invite}
            key={invite.id}
            onResend={() => {
              void resendInvite(invite.id);
            }}
            onRevoke={() => {
              void revokeInvite(invite.id);
            }}
          />
        ))
      )}
    </View>
  );

  async function updateInvite(
    inviteId: string,
    action: () => Promise<AccessInvitePayload>,
  ): Promise<void> {
    try {
      setSubmitting(true);
      setPanelError(undefined);
      const updatedInvite = await action();

      setInvites((currentInvites) =>
        currentInvites.map((invite) => (invite.id === inviteId ? updatedInvite : invite)),
      );
    } catch (error) {
      setPanelError(toSafeAuthMessage(error, "Nao foi possivel atualizar este convite."));
    } finally {
      setSubmitting(false);
    }
  }
}

function InviteCard({
  invite,
  onResend,
  onRevoke,
}: {
  readonly invite: AccessInvitePayload;
  readonly onResend: () => void;
  readonly onRevoke: () => void;
}): ReactNode {
  const canChange = invite.status === "pending";

  return (
    <View style={styles.inviteStack}>
      <InviteMemberRow
        description={`${formatRoleLabel(invite.role)} / ${formatWorkArea(invite.scope)} / expira em ${formatShortDate(invite.expiresAt)}`}
        initials={createInviteInitials(invite.email)}
        name={invite.email}
        statusLabel={formatInviteStatus(invite.status)}
        statusTone={
          invite.status === "pending"
            ? "warning"
            : invite.status === "accepted"
              ? "success"
              : "danger"
        }
      />
      {invite.delivery?.inviteUrl === undefined ? null : (
        <View style={styles.deliveryBox}>
          <FlvText tone="accent" variant="eyebrow">
            Link de entrega
          </FlvText>
          <FlvText tone="muted" variant="caption">
            {invite.delivery.inviteUrl}
          </FlvText>
        </View>
      )}
      <View style={styles.inlineActions}>
        <Button
          disabled={!canChange}
          fullWidth={false}
          label="Reenviar"
          onPress={onResend}
          tone="secondary"
        />
        <Button
          disabled={!canChange}
          fullWidth={false}
          label="Revogar"
          onPress={onRevoke}
          tone="danger"
        />
      </View>
    </View>
  );
}

function canManageInviteSurface(session: MobileSession): boolean {
  return (
    session.role === "lider-setor" ||
    session.role === "gerente-loja" ||
    session.role === "admin-organizacao"
  );
}

function createInviteScope(session: MobileSession): TenantScopePayload {
  return {
    organizationId: session.scope.organizationId,
    ...(session.scope.departmentId === undefined
      ? {}
      : { departmentId: session.scope.departmentId }),
    ...(session.scope.storeId === undefined ? {} : { storeId: session.scope.storeId }),
  };
}

function getInviteRoleOptions(role: FlvRole): readonly FlvRole[] {
  if (role === "admin-organizacao") {
    return ["colaborador", "lider-setor", "gerente-loja", "admin-organizacao"];
  }

  if (role === "gerente-loja") {
    return ["colaborador", "lider-setor"];
  }

  return ["colaborador"];
}

function validateInviteDraft(draft: InviteDraft): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(draft.email))) {
    return "Informe um email valido para enviar o acesso.";
  }

  const expiresInDays = Number.parseInt(draft.expiresInDays, 10);

  if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
    return "A validade precisa ficar entre 1 e 30 dias.";
  }

  return undefined;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createInviteInitials(email: string): string {
  const [name = "acesso"] = email.split("@");
  return name
    .split(/[._-]+/)
    .map((piece) => piece[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatWorkArea(scope: TenantScopePayload): string {
  const pieces = [
    "organizacao",
    scope.storeId === undefined ? undefined : "loja vinculada",
    scope.departmentId === undefined ? undefined : "setor vinculado",
  ].filter((piece): piece is string => piece !== undefined);

  return pieces.join(" / ");
}

function formatRoleLabel(role: FlvRole): string {
  return role === "colaborador"
    ? "Colaborador"
    : role === "lider-setor"
      ? "Lider de setor"
      : role === "gerente-loja"
        ? "Gerente de loja"
        : role === "admin-organizacao"
          ? "Admin da organizacao"
          : "Auditor";
}

function formatInviteStatus(status: AccessInvitePayload["status"]): string {
  return status === "pending"
    ? "Pendente"
    : status === "accepted"
      ? "Aceito"
      : status === "revoked"
        ? "Revogado"
        : "Expirado";
}

function formatShortDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  cardCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  cardHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacingScale.md,
    justifyContent: "space-between",
  },
  deliveryBox: {
    backgroundColor: flvSemanticColors.cardMuted,
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.md,
    borderWidth: 1,
    gap: spacingScale.xs,
    padding: spacingScale.md,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  inlineWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  inviteStack: {
    gap: spacingScale.sm,
  },
  stack: {
    gap: spacingScale.lg,
  },
});
