import type { Href } from "expo-router";
import type { ReactNode } from "react";

import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  Chip,
  EmptyStateCard,
  EngajaWordmark,
  ErrorStateCard,
  FlvText,
  Input,
  LoadingStateCard,
  ScreenScaffold,
  SuccessStateCard,
} from "@engaja/ui/native";
import { flvSemanticColors, flvStatusColors, radiusScale, spacingScale } from "@engaja/ui";

import { getHomeHrefForSession } from "../navigation/routes.js";
import { toSafeAuthMessage } from "./auth-service.js";
import { authCopy } from "./copy.js";
import { useSession } from "./providers.js";

interface InviteSignupScreenProps {
  readonly initialInviteToken?: string | undefined;
}

interface LoginDraft {
  readonly email: string;
  readonly password: string;
}

interface InviteSignupDraft {
  readonly confirmPassword: string;
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
  readonly preferredName: string;
  readonly token: string;
}

const initialLoginDraft: LoginDraft = {
  email: "",
  password: "",
};

export function SignInScreen(): ReactNode {
  const router = useRouter();
  const { session, sessionError, sessionStatus, signIn } = useSession();
  const [draft, setDraft] = useState<LoginDraft>(initialLoginDraft);
  const [formError, setFormError] = useState<string>();
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const validationError = useMemo(() => validateLoginDraft(draft), [draft]);
  const emailError =
    hasAttemptedSubmit && !isValidEmail(draft.email)
      ? "Informe um email valido para continuar."
      : undefined;
  const passwordError =
    hasAttemptedSubmit && draft.password.length < 8
      ? "A senha precisa ter pelo menos 8 caracteres."
      : undefined;

  if (session !== null) {
    return <Redirect href={getHomeHrefForSession(session) as Href} />;
  }

  const handleSubmit = async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    const nextValidationError = validateLoginDraft(draft);

    if (nextValidationError !== undefined) {
      setFormError(nextValidationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(undefined);
      await signIn({
        deviceLabel: "Engaja mobile",
        email: normalizeEmail(draft.email),
        password: draft.password,
      });
    } catch (error) {
      setFormError(
        toSafeAuthMessage(
          error,
          "Nao foi possivel entrar agora. Confira sua conexao e tente novamente.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Engaja FLV"
      subtitle={authCopy.login.subtitle}
      title={authCopy.login.title}
    >
      {sessionStatus === "restoring" ? (
        <LoadingStateCard
          description={authCopy.login.restoringDescription}
          title={authCopy.login.restoringTitle}
        />
      ) : (
        <>
          <AuthContextCard
            chips={[
              { label: "Acesso protegido", tone: "fresh" },
              { label: "Convite fechado", tone: "warm" },
              { label: "Equipe FLV", tone: "neutral" },
            ]}
            description={authCopy.login.brandDescription}
            eyebrow="Rotina conectada"
            title={authCopy.login.brandTitle}
          />

          <Card>
            <View style={styles.formHeader}>
              <FlvText tone="accent" variant="eyebrow">
                {authCopy.login.formTitle}
              </FlvText>
              <FlvText tone="muted">{authCopy.login.formDescription}</FlvText>
            </View>

            <Input
              autoCapitalize="none"
              autoComplete="email"
              helperText={emailError ?? authCopy.login.helperEmail}
              keyboardType="email-address"
              label="Email"
              onChangeText={(email) => {
                setDraft((current) => ({ ...current, email }));
                setFormError(undefined);
              }}
              placeholder="nome@empresa.com.br"
              returnKeyType="next"
              textContentType="emailAddress"
              tone={emailError === undefined ? "default" : "danger"}
              value={draft.email}
            />
            <Input
              autoCapitalize="none"
              helperText={passwordError ?? authCopy.login.helperPassword}
              label="Senha"
              onChangeText={(password) => {
                setDraft((current) => ({ ...current, password }));
                setFormError(undefined);
              }}
              placeholder="Digite sua senha"
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              tone={passwordError === undefined ? "default" : "danger"}
              value={draft.password}
            />

            {formError === undefined && sessionError === undefined ? null : (
              <InlineMessage
                description={formError ?? sessionError ?? ""}
                title="Nao foi possivel entrar"
                tone="danger"
              />
            )}

            <Button
              disabled={isSubmitting}
              label="Entrar com seguranca"
              loading={isSubmitting}
              loadingLabel="Entrando com seguranca"
              onPress={() => {
                void handleSubmit();
              }}
              tone="primary"
            />

            <Button
              label="Tenho convite"
              onPress={() => router.push("/(auth)/invite" as Href)}
              tone="secondary"
            />

            {hasAttemptedSubmit && validationError !== undefined ? (
              <FlvText tone="muted" variant="caption">
                {validationError}
              </FlvText>
            ) : (
              <View style={styles.inlineWrap}>
                <Chip label="Sessao protegida" tone="fresh" />
                <Chip label="Senha segura" tone="neutral" />
              </View>
            )}
          </Card>
        </>
      )}

      <Card tone="muted">
        <FlvText tone="accent" variant="eyebrow">
          Recuperar acesso
        </FlvText>
        <FlvText tone="muted">{authCopy.login.recoveryDescription}</FlvText>
      </Card>
    </ScreenScaffold>
  );
}

export function InviteSignupScreen({ initialInviteToken }: InviteSignupScreenProps): ReactNode {
  const router = useRouter();
  const { acceptInvite, session } = useSession();
  const [draft, setDraft] = useState<InviteSignupDraft>({
    confirmPassword: "",
    displayName: "",
    email: "",
    password: "",
    phoneNumber: "",
    preferredName: "",
    token: initialInviteToken ?? "",
  });
  const [formError, setFormError] = useState<string>();
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isSuccessRouting, setSuccessRouting] = useState(false);
  const validationError = useMemo(() => validateInviteDraft(draft), [draft]);
  const inviteIssues = getInviteFieldIssues(draft, hasAttemptedSubmit);

  if (session !== null) {
    return <Redirect href={getHomeHrefForSession(session) as Href} />;
  }

  if (isSuccessRouting) {
    return (
      <ScreenScaffold
        eyebrow="Convite Engaja"
        subtitle={authCopy.invite.successDescription}
        title={authCopy.invite.successTitle}
      >
        <SuccessStateCard
          actionLabel="Abrir minha area"
          description={authCopy.invite.successDescription}
          title={authCopy.invite.successTitle}
        />
      </ScreenScaffold>
    );
  }

  const handleSubmit = async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    const nextValidationError = validateInviteDraft(draft);

    if (nextValidationError !== undefined) {
      setFormError(nextValidationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(undefined);
      await acceptInvite({
        displayName: draft.displayName.trim(),
        email: normalizeEmail(draft.email),
        password: draft.password,
        ...(draft.phoneNumber.trim().length === 0 ? {} : { phoneNumber: draft.phoneNumber.trim() }),
        ...(draft.preferredName.trim().length === 0
          ? {}
          : { preferredName: draft.preferredName.trim() }),
        token: draft.token.trim(),
      });
      setSuccessRouting(true);
    } catch (error) {
      setSuccessRouting(false);
      setFormError(
        toSafeAuthMessage(
          error,
          "Nao foi possivel confirmar este convite. Revise os dados ou peca um novo acesso.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Convite Engaja"
      subtitle={authCopy.invite.subtitle}
      title={authCopy.invite.title}
    >
      <AuthContextCard
        chips={[
          {
            label: draft.token.trim().length === 0 ? "Codigo pendente" : "Convite recebido",
            tone: draft.token.trim().length === 0 ? "warning" : "fresh",
          },
          { label: "Senha segura", tone: "neutral" },
          { label: "Rota protegida", tone: "warm" },
        ]}
        description={authCopy.invite.contextDescription}
        eyebrow="Entrada por convite"
        title={authCopy.invite.contextTitle}
      />

      {draft.token.trim().length === 0 ? (
        <EmptyStateCard
          actionLabel="Preencher convite"
          description={authCopy.invite.emptyDescription}
          title={authCopy.invite.emptyTitle}
        />
      ) : null}

      {formError === undefined ? null : (
        <ErrorStateCard
          actionLabel="Conferir convite"
          description={formError}
          title={authCopy.invite.invalidTitle}
        />
      )}

      <Card>
        <View style={styles.formHeader}>
          <FlvText tone="accent" variant="eyebrow">
            {authCopy.invite.formTitle}
          </FlvText>
          <FlvText tone="muted">{authCopy.invite.formDescription}</FlvText>
        </View>

        <Input
          autoCapitalize="none"
          helperText={inviteIssues.token ?? authCopy.invite.receivedDescription}
          label="Codigo do convite"
          onChangeText={(token) => {
            setDraft((current) => ({ ...current, token }));
            setFormError(undefined);
          }}
          placeholder="Cole o codigo recebido"
          tone={inviteIssues.token === undefined ? "default" : "danger"}
          value={draft.token}
        />
        <Input
          label="Nome completo"
          onChangeText={(displayName) => {
            setDraft((current) => ({ ...current, displayName }));
            setFormError(undefined);
          }}
          placeholder="Nome usado pela equipe"
          textContentType="name"
          tone={inviteIssues.displayName === undefined ? "default" : "danger"}
          value={draft.displayName}
          {...(inviteIssues.displayName === undefined
            ? {}
            : { helperText: inviteIssues.displayName })}
        />
        <Input
          label="Como prefere ser chamado"
          onChangeText={(preferredName) => setDraft((current) => ({ ...current, preferredName }))}
          placeholder="Opcional"
          value={draft.preferredName}
        />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={(email) => {
            setDraft((current) => ({ ...current, email }));
            setFormError(undefined);
          }}
          placeholder="nome@empresa.com.br"
          textContentType="emailAddress"
          tone={inviteIssues.email === undefined ? "default" : "danger"}
          value={draft.email}
          {...(inviteIssues.email === undefined ? {} : { helperText: inviteIssues.email })}
        />
        <Input
          keyboardType="phone-pad"
          label="Telefone"
          onChangeText={(phoneNumber) => setDraft((current) => ({ ...current, phoneNumber }))}
          placeholder="Opcional"
          textContentType="telephoneNumber"
          value={draft.phoneNumber}
        />
        <Input
          autoCapitalize="none"
          helperText={inviteIssues.password ?? "Use pelo menos 8 caracteres."}
          label="Senha"
          onChangeText={(password) => {
            setDraft((current) => ({ ...current, password }));
            setFormError(undefined);
          }}
          placeholder="Minimo de 8 caracteres"
          secureTextEntry
          textContentType="newPassword"
          tone={inviteIssues.password === undefined ? "default" : "danger"}
          value={draft.password}
        />
        <Input
          autoCapitalize="none"
          label="Confirmar senha"
          onChangeText={(confirmPassword) => {
            setDraft((current) => ({ ...current, confirmPassword }));
            setFormError(undefined);
          }}
          placeholder="Repita a senha"
          secureTextEntry
          textContentType="newPassword"
          tone={inviteIssues.confirmPassword === undefined ? "default" : "danger"}
          value={draft.confirmPassword}
          {...(inviteIssues.confirmPassword === undefined
            ? {}
            : { helperText: inviteIssues.confirmPassword })}
        />

        <PasswordSetupChecklist
          confirmPassword={draft.confirmPassword}
          password={draft.password}
        />

        <Button
          disabled={isSubmitting}
          label="Criar acesso pelo convite"
          loading={isSubmitting}
          loadingLabel="Criando acesso"
          onPress={() => {
            void handleSubmit();
          }}
          tone="primary"
        />

        <Button
          label="Ja tenho acesso"
          onPress={() => router.push("/(auth)/sign-in" as Href)}
          tone="secondary"
        />

        {hasAttemptedSubmit && validationError !== undefined ? (
          <FlvText tone="muted" variant="caption">
            {validationError}
          </FlvText>
        ) : null}
      </Card>

      <Card tone="muted">
        <FlvText tone="accent" variant="eyebrow">
          Convite invalido ou expirado
        </FlvText>
        <FlvText tone="muted">{authCopy.invite.invalidDescription}</FlvText>
      </Card>
    </ScreenScaffold>
  );
}

type AuthChipTone = "bold" | "fresh" | "neutral" | "success" | "warning" | "warm";

interface AuthContextCardProps {
  readonly chips: readonly {
    readonly label: string;
    readonly tone: AuthChipTone;
  }[];
  readonly description: string;
  readonly eyebrow: string;
  readonly title: string;
}

function AuthContextCard({
  chips,
  description,
  eyebrow,
  title,
}: AuthContextCardProps): ReactNode {
  return (
    <Card style={styles.authContextCard}>
      <EngajaWordmark />
      <View style={styles.formHeader}>
        <FlvText tone="accent" variant="eyebrow">
          {eyebrow}
        </FlvText>
        <FlvText variant="headline">{title}</FlvText>
        <FlvText tone="muted">{description}</FlvText>
      </View>
      <View style={styles.inlineWrap}>
        {chips.map((chip) => (
          <Chip key={chip.label} label={chip.label} tone={chip.tone} />
        ))}
      </View>
    </Card>
  );
}

interface InlineMessageProps {
  readonly description: string;
  readonly title: string;
  readonly tone: "danger" | "success" | "warning";
}

function InlineMessage({ description, title, tone }: InlineMessageProps): ReactNode {
  const palette = flvStatusColors[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      style={[
        styles.inlineMessage,
        {
          backgroundColor: palette.background,
          borderColor: palette.outline,
        },
      ]}
    >
      <View style={[styles.inlineMessageRail, { backgroundColor: palette.foreground }]} />
      <View style={styles.inlineMessageCopy}>
        <FlvText style={{ color: palette.foreground }} variant="label">
          {title}
        </FlvText>
        <FlvText style={{ color: palette.foreground }} variant="caption">
          {description}
        </FlvText>
      </View>
    </View>
  );
}

function PasswordSetupChecklist({
  confirmPassword,
  password,
}: {
  readonly confirmPassword: string;
  readonly password: string;
}): ReactNode {
  const hasEnoughCharacters = password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <View style={styles.passwordChecklist}>
      <FlvText tone="muted" variant="caption">
        A senha protege seu acesso pessoal ao Engaja.
      </FlvText>
      <View style={styles.inlineWrap}>
        <Chip
          label={hasEnoughCharacters ? "8 caracteres ok" : "Minimo 8 caracteres"}
          tone={hasEnoughCharacters ? "fresh" : "neutral"}
        />
        <Chip
          label={passwordsMatch ? "Confirmacao ok" : "Confirmar senha"}
          tone={passwordsMatch ? "fresh" : "neutral"}
        />
      </View>
    </View>
  );
}

interface InviteFieldIssues {
  readonly confirmPassword?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly password?: string;
  readonly token?: string;
}

function getInviteFieldIssues(
  draft: InviteSignupDraft,
  shouldValidate: boolean,
): InviteFieldIssues {
  if (!shouldValidate) {
    return {};
  }

  return {
    ...(draft.token.trim().length < 32
      ? { token: "Use o codigo completo do convite." }
      : {}),
    ...(draft.displayName.trim().length < 2
      ? { displayName: "Informe seu nome completo." }
      : {}),
    ...(!isValidEmail(draft.email)
      ? { email: "Informe o email que recebeu o convite." }
      : {}),
    ...(draft.password.length < 8
      ? { password: "Crie uma senha com pelo menos 8 caracteres." }
      : {}),
    ...(draft.password !== draft.confirmPassword
      ? { confirmPassword: "As senhas precisam ser iguais." }
      : {}),
  };
}

function validateLoginDraft(draft: LoginDraft): string | undefined {
  if (!isValidEmail(draft.email)) {
    return "Informe um email valido para continuar.";
  }

  if (draft.password.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  return undefined;
}

function validateInviteDraft(draft: InviteSignupDraft): string | undefined {
  if (draft.token.trim().length < 32) {
    return "Use o codigo completo do convite.";
  }

  if (draft.displayName.trim().length < 2) {
    return "Informe seu nome completo.";
  }

  if (!isValidEmail(draft.email)) {
    return "Informe o email que recebeu o convite.";
  }

  if (draft.password.length < 8) {
    return "Crie uma senha com pelo menos 8 caracteres.";
  }

  if (draft.password !== draft.confirmPassword) {
    return "As senhas precisam ser iguais.";
  }

  return undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const styles = StyleSheet.create({
  authContextCard: {
    backgroundColor: flvSemanticColors.panel,
  },
  formHeader: {
    gap: spacingScale.xs,
  },
  inlineWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingScale.sm,
  },
  inlineMessage: {
    alignItems: "flex-start",
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacingScale.md,
    padding: spacingScale.md,
  },
  inlineMessageCopy: {
    flex: 1,
    gap: spacingScale.xxs,
  },
  inlineMessageRail: {
    borderRadius: radiusScale.pill,
    minHeight: 28,
    width: 6,
  },
  passwordChecklist: {
    borderColor: flvSemanticColors.border,
    borderRadius: radiusScale.lg,
    borderWidth: 1,
    gap: spacingScale.sm,
    padding: spacingScale.md,
  },
});
