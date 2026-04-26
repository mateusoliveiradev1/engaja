// @ts-nocheck
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, create } from "react-test-renderer";

const { networkState } = vi.hoisted(() => ({
  networkState: {
    isConnected: true,
    isInternetReachable: true,
  },
}));

vi.mock("react-native", () => {
  const createHost = (name: string) => (props: Record<string, unknown>) =>
    React.createElement(name, props, props.children);

  const renderListSlot = (slot: unknown): React.ReactNode => {
    if (slot === null || slot === undefined) {
      return null;
    }

    if (React.isValidElement(slot)) {
      return slot;
    }

    if (typeof slot === "function") {
      return React.createElement(slot as React.ComponentType);
    }

    return slot as React.ReactNode;
  };

  return {
    Animated: {
      Value: class AnimatedValue {
        constructor(readonly value: number) {}
      },
      View: createHost("animated-view"),
      spring() {
        return {
          start() {
            return undefined;
          },
        };
      },
    },
    FlatList(props: {
      readonly ListEmptyComponent?: React.ReactNode;
      readonly ListFooterComponent?: React.ReactNode;
      readonly ListHeaderComponent?: React.ReactNode;
      readonly data?: readonly unknown[];
      readonly renderItem?: (input: { item: unknown; index: number }) => React.ReactNode;
    }) {
      const items = props.data ?? [];

      return React.createElement(
        "flat-list",
        props,
        renderListSlot(props.ListHeaderComponent),
        items.length === 0
          ? renderListSlot(props.ListEmptyComponent)
          : items.map((item, index) => props.renderItem?.({ index, item }) ?? null),
        renderListSlot(props.ListFooterComponent),
      );
    },
    Platform: {
      OS: "ios",
      select<T>(input: { android?: T; default?: T; ios?: T }) {
        return input.ios ?? input.default ?? input.android;
      },
    },
    Pressable: createHost("pressable"),
    RefreshControl: createHost("refresh-control"),
    ScrollView: createHost("scroll-view"),
    StyleSheet: {
      create<T>(styles: T): T {
        return styles;
      },
    },
    Text: createHost("text"),
    TextInput: createHost("text-input"),
    View: createHost("view"),
  };
});

vi.mock("@engaja/ui/native", () => {
  const renderButton = (label: string, props: Record<string, unknown>) =>
    React.createElement(
      "pressable",
      {
        ...props,
        accessibilityLabel: props.accessibilityLabel ?? label,
        accessibilityRole: props.accessibilityRole ?? "button",
      },
      React.createElement("text", null, label),
    );

  const renderStateCard = (
    eyebrow: string,
    title: string,
    description: string,
    actionLabel?: string,
    onActionPress?: () => void,
  ) =>
    React.createElement(
      "view",
      null,
      React.createElement("text", null, eyebrow),
      React.createElement("text", null, title),
      React.createElement("text", null, description),
      actionLabel === undefined ? null : renderButton(actionLabel, { onPress: onActionPress }),
    );

  return {
    Avatar({ initials, label }: { initials: string; label: string }) {
      return React.createElement("text", null, `${label} ${initials}`);
    },
    Badge({ label }: { label: string }) {
      return React.createElement("text", null, label);
    },
    Button({
      accessibilityLabel,
      label,
      onPress,
    }: {
      accessibilityLabel?: string;
      label: string;
      onPress?: () => void;
    }) {
      return renderButton(label, {
        accessibilityLabel,
        onPress,
      });
    },
    Card(props: Record<string, unknown>) {
      return React.createElement("view", props, props.children);
    },
    ChecklistCard({
      items,
      title,
    }: {
      items: readonly { id: string; label: string }[];
      title: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, title),
        items.map((item) => React.createElement("text", { key: item.id }, item.label)),
      );
    },
    Chip({
      accessibilityLabel,
      label,
      onPress,
    }: {
      accessibilityLabel?: string;
      label: string;
      onPress?: () => void;
    }) {
      return onPress === undefined
        ? React.createElement("text", null, label)
        : renderButton(label, { accessibilityLabel, onPress });
    },
    CommentPreview({
      author,
      body,
      timestamp,
    }: {
      author: string;
      body: string;
      timestamp: string;
    }) {
      return React.createElement("text", null, `${author} ${timestamp} ${body}`);
    },
    CoverageIndicator({
      label,
      note,
      progress,
    }: {
      label: string;
      note: string;
      progress: number;
    }) {
      return React.createElement("text", null, `${label} ${note} ${progress}%`);
    },
    CoverageDecisionCard({
      gapLabel,
      note,
      onPrimaryPress,
      onSecondaryPress,
      primaryLabel,
      riskLabel,
      secondaryLabel,
      title,
    }: {
      gapLabel: string;
      note: string;
      onPrimaryPress?: () => void;
      onSecondaryPress?: () => void;
      primaryLabel: string;
      riskLabel: string;
      secondaryLabel: string;
      title: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, title),
        React.createElement("text", null, riskLabel),
        React.createElement("text", null, gapLabel),
        React.createElement("text", null, note),
        renderButton(primaryLabel, { onPress: onPrimaryPress }),
        renderButton(secondaryLabel, { onPress: onSecondaryPress }),
      );
    },
    EmptyStateCard({
      actionLabel = "Criar acao",
      description = "Ainda nao ha conteudo nesta tela, mas o proximo passo ja fica claro.",
      onActionPress,
      title = "Sem novidade por enquanto",
    }: {
      actionLabel?: string;
      description?: string;
      onActionPress?: () => void;
      title?: string;
    }) {
      return renderStateCard("Estado vazio", title, description, actionLabel, onActionPress);
    },
    EngajaWordmark() {
      return React.createElement("text", null, "Engaja");
    },
    ErrorStateCard({
      actionLabel = "Tentar novamente",
      description = "Nao foi possivel sincronizar a ultima atualizacao. Revise a conexao ou tente mais tarde.",
      onActionPress,
      title = "Algo travou neste fluxo",
    }: {
      actionLabel?: string;
      description?: string;
      onActionPress?: () => void;
      title?: string;
    }) {
      return renderStateCard("Erro", title, description, actionLabel, onActionPress);
    },
    EvidenceThumbnail({ label, status }: { label: string; status: string }) {
      return React.createElement("text", null, `${label} ${status}`);
    },
    EvidenceBlock({
      description,
      label,
      status,
    }: {
      description?: string;
      label: string;
      status: string;
    }) {
      return React.createElement(
        "text",
        null,
        `${label} ${status}${description === undefined ? "" : ` ${description}`}`,
      );
    },
    FeedPriorityStrip({
      items,
    }: {
      items: readonly {
        actionLabel?: string;
        description: string;
        id: string;
        onPress?: () => void;
        title: string;
      }[];
    }) {
      return React.createElement(
        "view",
        null,
        items.map((item) =>
          React.createElement(
            "view",
            { key: item.id },
            React.createElement("text", null, item.title),
            React.createElement("text", null, item.description),
            item.actionLabel === undefined
              ? null
              : renderButton(item.actionLabel, { onPress: item.onPress }),
          ),
        ),
      );
    },
    FlvText(props: Record<string, unknown>) {
      return React.createElement("text", props, props.children);
    },
    IconButton({
      accessibilityLabel,
      icon,
      onPress,
    }: {
      accessibilityLabel: string;
      icon: string;
      onPress?: () => void;
    }) {
      return renderButton(icon, {
        accessibilityLabel,
        onPress,
      });
    },
    Input({
      label,
      onChangeText,
      placeholder,
      value,
    }: {
      label?: string;
      onChangeText?: (value: string) => void;
      placeholder?: string;
      value?: string;
    }) {
      return React.createElement(
        "view",
        null,
        label === undefined ? null : React.createElement("text", null, label),
        placeholder === undefined ? null : React.createElement("text", null, placeholder),
        React.createElement("text-input", {
          onChangeText,
          placeholder,
          value,
        }),
      );
    },
    InviteMemberRow({
      actionLabel,
      description,
      name,
      onActionPress,
      statusLabel,
    }: {
      actionLabel?: string;
      description: string;
      name: string;
      onActionPress?: () => void;
      statusLabel: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, name),
        React.createElement("text", null, description),
        React.createElement("text", null, statusLabel),
        actionLabel === undefined ? null : renderButton(actionLabel, { onPress: onActionPress }),
      );
    },
    LoadingStateCard() {
      return React.createElement("text", null, "Carregando");
    },
    MetricTile({ label, note, value }: { label: string; note?: string; value: string }) {
      return React.createElement(
        "text",
        null,
        `${label} ${value}${note === undefined ? "" : ` ${note}`}`,
      );
    },
    CampaignProgressCard({
      actionLabel = "Ver detalhes",
      note,
      onActionPress,
      progress,
      title,
    }: {
      actionLabel?: string;
      note: string;
      onActionPress?: () => void;
      progress: number;
      title: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, `${title} ${progress}% ${note}`),
        renderButton(actionLabel, { onPress: onActionPress }),
      );
    },
    OfflineStateCard({
      actionLabel = "Ver itens salvos",
      description = "O app continua util com dados recentes, itens salvos no aparelho e destaque para o que precisa ser enviado depois.",
      onActionPress,
      title = "Modo offline ativo",
    }: {
      actionLabel?: string;
      description?: string;
      onActionPress?: () => void;
      title?: string;
    }) {
      return renderStateCard("Offline", title, description, actionLabel, onActionPress);
    },
    PermissionDeniedStateCard({
      actionLabel = "Solicitar acesso",
      description = "Este conteudo exige outra area de loja ou uma permissao de lideranca.",
      onActionPress,
      title = "Acesso bloqueado",
    }: {
      actionLabel?: string;
      description?: string;
      onActionPress?: () => void;
      title?: string;
    }) {
      return renderStateCard("Permissao", title, description, actionLabel, onActionPress);
    },
    PhotoCard({
      authorName,
      description,
      highlight,
      title,
    }: {
      authorName: string;
      description: string;
      highlight: string;
      title: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, title),
        React.createElement("text", null, description),
        React.createElement("text", null, authorName),
        React.createElement("text", null, highlight),
      );
    },
    PostSkeleton() {
      return React.createElement("text", null, "Post skeleton");
    },
    QuickComposer({
      authorName,
      captionLabel = "Legenda",
      captionValue,
      children,
      draftLabel,
      expanded,
      helperText,
      onCameraPress,
      onCaptionChange,
      onGalleryPress,
      onPrimaryPress,
      onToggleExpanded,
      primaryLabel = "Continuar",
      prompt,
    }: {
      authorName: string;
      captionLabel?: string;
      captionValue?: string;
      children?: React.ReactNode;
      draftLabel?: string;
      expanded?: boolean;
      helperText?: string;
      onCameraPress?: () => void;
      onCaptionChange?: (value: string) => void;
      onGalleryPress?: () => void;
      onPrimaryPress?: () => void;
      onToggleExpanded?: () => void;
      primaryLabel?: string;
      prompt?: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, authorName),
        prompt === undefined ? null : React.createElement("text", null, prompt),
        draftLabel === undefined ? null : React.createElement("text", null, draftLabel),
        expanded === true
          ? React.createElement(
              "view",
              null,
              React.createElement("text", null, captionLabel),
              React.createElement("text-input", {
                onChangeText: onCaptionChange,
                value: captionValue,
              }),
              helperText === undefined ? null : React.createElement("text", null, helperText),
              children,
            )
          : null,
        renderButton("Camera", { onPress: onCameraPress }),
        renderButton("Galeria", { onPress: onGalleryPress }),
        renderButton(expanded === true ? "Menos detalhes" : "Mais detalhes", {
          onPress: onToggleExpanded,
        }),
        renderButton(primaryLabel, { onPress: onPrimaryPress }),
      );
    },
    RequestStatusChip({ label }: { label: string }) {
      return React.createElement("text", null, label);
    },
    RankingList({
      items,
      title = "Ranking do periodo",
    }: {
      items: readonly {
        helper?: string;
        id: string;
        label: string;
        rank: number;
        value: string;
      }[];
      title?: string;
    }) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, title),
        items.map((item) =>
          React.createElement(
            "text",
            { key: item.id },
            `#${item.rank} ${item.label} ${item.value}${item.helper === undefined ? "" : ` ${item.helper}`}`,
          ),
        ),
      );
    },
    RecognitionCard({
      campaignLabel,
      fromName,
      message,
      pointsLabel,
      toName,
    }: {
      campaignLabel?: string;
      fromName: string;
      message: string;
      pointsLabel: string;
      toName: string;
    }) {
      return React.createElement(
        "text",
        null,
        `${fromName} reconheceu ${toName} ${pointsLabel} ${message}${
          campaignLabel === undefined ? "" : ` ${campaignLabel}`
        }`,
      );
    },
    ScreenScaffold(props: Record<string, unknown>) {
      return React.createElement(
        "view",
        null,
        React.createElement("text", null, props.eyebrow),
        React.createElement("text", null, props.title),
        props.subtitle === undefined ? null : React.createElement("text", null, props.subtitle),
        props.topAction,
        props.children,
      );
    },
    SectionHeader({
      action,
      eyebrow,
      title,
    }: {
      action?: React.ReactNode;
      eyebrow?: string;
      title: string;
    }) {
      return React.createElement(
        "view",
        null,
        eyebrow === undefined ? null : React.createElement("text", null, eyebrow),
        React.createElement("text", null, title),
        action,
      );
    },
    ShiftCard({
      dayLabel,
      roleLabel,
      statusLabel,
      timeRange,
    }: {
      dayLabel: string;
      roleLabel: string;
      statusLabel: string;
      timeRange: string;
    }) {
      return React.createElement(
        "text",
        null,
        `${dayLabel} ${timeRange} ${roleLabel} ${statusLabel}`,
      );
    },
    ShiftSummaryCard({
      completed,
      overdue,
      wins,
    }: {
      completed: string;
      overdue: string;
      wins: string;
    }) {
      return React.createElement(
        "text",
        null,
        `Resumo do turno FLV ${completed} ${overdue} ${wins}`,
      );
    },
    SocialPostCard({
      actionSlot,
      authorName,
      caption,
      comments = [],
      commentsTotalLabel,
      metadata = [],
      moderationActions = [],
      onReactionPress,
      photoUrl,
      reactions = [],
      selectedReactionId,
      statusLabel,
      thumbnailUrl,
      timestamp,
      title,
    }: {
      actionSlot?: React.ReactNode;
      authorName: string;
      caption: string;
      comments?: readonly { author: string; body: string; id: string; timestamp: string }[];
      commentsTotalLabel?: string;
      metadata?: readonly string[];
      moderationActions?: readonly { id: string; label: string; onPress?: () => void }[];
      onReactionPress?: (reactionId: string) => void;
      photoUrl?: string;
      reactions?: readonly { count: number; id: string; label: string }[];
      selectedReactionId?: string | null;
      statusLabel?: string;
      thumbnailUrl?: string;
      timestamp: string;
      title?: string;
    }) {
      const imageUrl = thumbnailUrl ?? photoUrl;

      return React.createElement(
        "view",
        null,
        React.createElement("text", null, authorName),
        React.createElement("text", null, timestamp),
        statusLabel === undefined ? null : React.createElement("text", null, statusLabel),
        title === undefined ? null : React.createElement("text", null, title),
        React.createElement("text", null, caption),
        imageUrl === undefined
          ? React.createElement("text", null, "Sem imagem neste registro")
          : React.createElement("expo-image", {
              accessibilityLabel: `${caption}, foto do registro`,
              source: imageUrl,
            }),
        metadata.map((item) => React.createElement("text", { key: item }, item)),
        reactions.map((reaction) =>
          renderButton(`${reaction.label} ${reaction.count}`, {
            accessibilityState: { selected: reaction.id === selectedReactionId },
            key: reaction.id,
            onPress: () => onReactionPress?.(reaction.id),
          }),
        ),
        commentsTotalLabel === undefined
          ? null
          : React.createElement("text", null, commentsTotalLabel),
        comments.map((comment) =>
          React.createElement(
            "text",
            { key: comment.id },
            `${comment.author} ${comment.timestamp} ${comment.body}`,
          ),
        ),
        actionSlot,
        moderationActions.map((action) =>
          renderButton(action.label, { key: action.id, onPress: action.onPress }),
        ),
      );
    },
    SuccessStateCard({
      actionLabel = "Compartilhar resultado",
      description = "A confirmacao aparece sem ruido e deixa o proximo passo bem evidente para a equipe.",
      onActionPress,
      title = "Tudo certo por aqui",
    }: {
      actionLabel?: string;
      description?: string;
      onActionPress?: () => void;
      title?: string;
    }) {
      return renderStateCard("Sucesso", title, description, actionLabel, onActionPress);
    },
    Tabs({
      activeTabId,
      onTabChange,
      tabs,
    }: {
      activeTabId: string;
      onTabChange: (tabId: string) => void;
      tabs: readonly { badge?: string; id: string; label: string }[];
    }) {
      return React.createElement(
        "view",
        { accessibilityRole: "tablist" },
        tabs.map((tab) =>
          React.createElement(
            "pressable",
            {
              accessibilityLabel: tab.label,
              accessibilityRole: "tab",
              accessibilityState: { selected: tab.id === activeTabId },
              key: tab.id,
              onPress: () => onTabChange(tab.id),
            },
            React.createElement(
              "text",
              null,
              `${tab.label}${tab.badge === undefined ? "" : ` ${tab.badge}`}`,
            ),
          ),
        ),
      );
    },
    Toast({ message, title }: { message: string; title: string }) {
      return React.createElement("text", null, `${title} ${message}`);
    },
    WeeklyTimeline({ days }: { days: readonly { id: string; label: string; shift: string }[] }) {
      return React.createElement(
        "view",
        null,
        days.map((day) =>
          React.createElement("text", { key: day.id }, `${day.label} ${day.shift}`),
        ),
      );
    },
  };
});

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener(listener: (state: typeof networkState) => void) {
      listener(networkState);
      return () => undefined;
    },
  },
}));

vi.mock("expo-image", () => ({
  Image(props: Record<string, unknown>) {
    return React.createElement("expo-image", props);
  },
}));

vi.mock("expo-router", () => ({
  Redirect(props: { href: string }) {
    return React.createElement("redirect", props);
  },
  useLocalSearchParams() {
    return {};
  },
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
    };
  },
}));

const collaboratorSession = {
  displayName: "Julia Lima",
  role: "colaborador",
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_colaborador",
};

const leaderSession = {
  displayName: "Renata Prado",
  role: "lider-setor",
  scope: {
    departmentId: "dept_flv",
    organizationId: "org_demo",
    storeId: "store_001",
  },
  userId: "user_demo_lider",
};

describe("mobile component flows", () => {
  beforeEach(() => {
    networkState.isConnected = true;
    networkState.isInternetReachable = true;

    vi.stubGlobal("__DEV__", false);
    vi.stubGlobal("__ENGAJA_ENABLE_MOBILE_DEMO_FALLBACK__", true);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the collaborator journey across feed, schedule, checklist and recognition tabs", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { CollaboratorHomeScreen } = await import("../src/app/screens.js");

    const renderer = await renderWithProviders(
      AppProviders,
      React.createElement(CollaboratorHomeScreen),
      collaboratorSession,
    );

    expectRenderedText(renderer, "Feed do FLV");
    expectRenderedText(renderer, "Compartilhe uma foto do turno");
    expectRenderedText(renderer, "Reposicao pronta com banca viva");

    await pressTab(renderer, "Escala");
    expectRenderedText(renderer, "Hoje, proximo turno e pedidos");
    expectRenderedText(renderer, "Pedido guiado");

    await pressTab(renderer, "Rotinas");
    expectRenderedText(renderer, "Prioridade, evidencia e desvio");
    expectRenderedText(renderer, "Resumo do turno FLV");

    await pressTab(renderer, "Reconhecer");
    expectRenderedText(renderer, "Reconhecimento do ciclo");
    expectRenderedText(renderer, "Consistencia FLV");
  });

  it("surfaces offline chrome and state messaging when connectivity is weak", async () => {
    networkState.isConnected = false;
    networkState.isInternetReachable = false;

    const { AppProviders } = await import("../src/app/providers.js");
    const { CollaboratorHomeScreen } = await import("../src/app/screens.js");

    const renderer = await renderWithProviders(
      AppProviders,
      React.createElement(CollaboratorHomeScreen),
      collaboratorSession,
    );

    expectRenderedText(renderer, "Modo offline");
    expectRenderedText(renderer, "Modo offline ativo");
  });

  it("renders the leader dashboard overview and moderation queue", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { LeaderHomeScreen } = await import("../src/app/screens.js");

    const renderer = await renderWithProviders(
      AppProviders,
      React.createElement(LeaderHomeScreen),
      leaderSession,
    );

    expectRenderedText(renderer, "Comando do setor");
    expectRenderedText(renderer, "Rotinas monitoradas");
    expectRenderedText(renderer, "Decisoes sugeridas");

    await pressTab(renderer, "Moderacao");
    expectRenderedText(renderer, "Moderacao");
    expectRenderedText(renderer, "Revisao em dia");
  });

  it("renders shared auth and state surfaces with clear action labels", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { SignInScreen } = await import("../src/app/screens.js");
    const {
      EmptyStateCard,
      ErrorStateCard,
      LoadingStateCard,
      OfflineStateCard,
      PermissionDeniedStateCard,
      SuccessStateCard,
    } = await import("@engaja/ui/native");

    const renderer = await renderElement(
      React.createElement(
        AppProviders,
        { initialSession: null },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(SignInScreen),
          React.createElement(LoadingStateCard),
          React.createElement(EmptyStateCard),
          React.createElement(ErrorStateCard),
          React.createElement(OfflineStateCard),
          React.createElement(PermissionDeniedStateCard),
          React.createElement(SuccessStateCard),
        ),
      ),
    );

    expectRenderedText(renderer, "Entrar no Engaja");
    expectRenderedText(renderer, "Carregando");
    expectRenderedText(renderer, "Sem novidade por enquanto");
    expectRenderedText(renderer, "Algo travou neste fluxo");
    expectRenderedText(renderer, "Modo offline ativo");
    expectRenderedText(renderer, "Acesso bloqueado");
    expectRenderedText(renderer, "Tudo certo por aqui");
  });

  it("covers quick composer, post comments, reactions and contextual moderation actions", async () => {
    const { createDefaultFeedComposerDraft } = await import("../src/app/feed-state.js");
    const { FeedComposerCard, FeedPostCard, LeaderModerationPanel } = await import(
      "../src/app/feed-ui.js"
    );
    const submitPost = vi.fn();

    function ComposerHarness() {
      const [draft, setDraft] = React.useState(createDefaultFeedComposerDraft());
      const [expanded, setExpanded] = React.useState(false);

      return React.createElement(FeedComposerCard, {
        draft,
        expanded,
        isSubmitting: false,
        onChange: setDraft,
        onExpandedChange: setExpanded,
        onSubmit: submitPost,
        session: collaboratorSession,
        uploadProgress: 0,
      });
    }

    const composerRenderer = await renderElement(React.createElement(ComposerHarness));

    expectRenderedText(composerRenderer, "Compartilhe uma foto do turno com contexto rapido.");
    await pressButton(composerRenderer, "Galeria");
    await pressButton(composerRenderer, "Adicionar detalhes");
    expectRenderedText(composerRenderer, "Titulo");

    await changeTextInput(composerRenderer, 0, "Legenda com leitura do turno e contexto visual.");
    await pressButton(composerRenderer, "Enviar com foto");
    expect(submitPost).toHaveBeenCalledTimes(1);

    const reactionPress = vi.fn(async () => undefined);
    const commentChange = vi.fn();
    const commentSubmit = vi.fn(async () => undefined);
    const postRenderer = await renderElement(
      React.createElement(FeedPostCard, {
        commentDraft: "",
        onCommentChange: commentChange,
        onCommentSubmit: commentSubmit,
        onReactionPress: reactionPress,
        post: createFeedPost({
          comments: [
            createFeedComment({ body: "Primeiro comentario longo de contexto.", id: "comment-1" }),
            createFeedComment({ body: "Segunda dica para o time.", id: "comment-2" }),
            createFeedComment({
              body: "Comentario final com bastante texto para validar quebra e preview.",
              id: "comment-3",
            }),
          ],
        }),
        session: collaboratorSession,
      }),
    );

    expectRenderedText(postRenderer, "Ultimos 2 de 3 comentarios");
    expectRenderedText(postRenderer, "Segunda dica para o time.");
    expectRenderedText(postRenderer, "Comentario final com bastante texto");

    await pressButton(postRenderer, "Aplauso 0");
    await changeTextInput(postRenderer, 0, "Comentario rapido no post social.");
    await pressButton(postRenderer, "Comentar");
    expect(reactionPress).toHaveBeenCalledWith("aplauso");
    expect(commentChange).toHaveBeenCalledWith("Comentario rapido no post social.");
    expect(commentSubmit).toHaveBeenCalledTimes(1);

    const moderationAction = vi.fn(async () => undefined);
    const moderationRenderer = await renderElement(
      React.createElement(LeaderModerationPanel, {
        feedError: undefined,
        feedHome: createFeedHome([createFeedPost({ id: "post-pending", status: "pending_moderation" })]),
        isLoadingFeed: false,
        onModerationAction: moderationAction,
        onRefresh: vi.fn(async () => undefined),
      }),
    );

    expectRenderedText(moderationRenderer, "Revisao do mural");
    await pressButton(moderationRenderer, "Aprovar");
    expect(moderationAction).toHaveBeenCalledWith("post-pending", "approve");
  });

  it("smokes auth restore, invite validation, logout and forbidden route states", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { ProtectedRoute } = await import("../src/app/route-guards.js");
    const { CollaboratorHomeScreen, InviteSignupScreen, RootRedirect } = await import(
      "../src/app/screens.js"
    );
    const restoringStorage = {
      clearSessionToken: vi.fn(async () => undefined),
      getSessionToken: vi.fn(() => new Promise<string | undefined>(() => undefined)),
      setSessionToken: vi.fn(async () => undefined),
    };

    const restoringRenderer = await renderElement(
      React.createElement(
        AppProviders,
        { authStorage: restoringStorage },
        React.createElement(RootRedirect),
      ),
    );

    expectRenderedText(restoringRenderer, "Abrindo o Engaja");

    const inviteRenderer = await renderElement(
      React.createElement(
        AppProviders,
        { initialSession: null },
        React.createElement(InviteSignupScreen),
      ),
    );

    expectRenderedText(inviteRenderer, "Convite invalido ou expirado");
    await pressButton(inviteRenderer, "Criar acesso pelo convite");
    expectRenderedText(inviteRenderer, "Use o codigo completo do convite");

    const forbiddenRenderer = await renderElement(
      React.createElement(
        AppProviders,
        { initialSession: collaboratorSession },
        React.createElement(
          ProtectedRoute,
          { group: "leader" },
          React.createElement("text", null, "Area de lideranca"),
        ),
      ),
    );

    expectRenderedText(forbiddenRenderer, "Area nao liberada");
    expectRenderedText(forbiddenRenderer, "Voltar para minha area");

    const logoutService = {
      acceptInvite: vi.fn(async () => collaboratorSession),
      login: vi.fn(async () => collaboratorSession),
      logout: vi.fn(() => new Promise<void>(() => undefined)),
      refreshSession: vi.fn(async () => collaboratorSession),
    };
    const logoutRenderer = await renderElement(
      React.createElement(
        AppProviders,
        {
          authService: logoutService,
          initialSession: { ...collaboratorSession, accessToken: "sess_mobile_logout" },
        },
        React.createElement(CollaboratorHomeScreen),
      ),
    );

    await pressButton(logoutRenderer, "Sair do Engaja");
    expectRenderedText(logoutRenderer, "Saindo do Engaja");
    expect(logoutService.logout).toHaveBeenCalledWith("sess_mobile_logout");
  });

  it("smokes collaborator feed, schedule, routine, issue and recognition actions", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { CollaboratorHomeScreen } = await import("../src/app/screens.js");

    const renderer = await renderWithProviders(
      AppProviders,
      React.createElement(CollaboratorHomeScreen),
      collaboratorSession,
    );

    await pressButton(renderer, "Galeria");
    await pressButton(renderer, "Adicionar detalhes");
    await pressButton(renderer, "Enviar com foto");
    expectRenderedText(renderer, "Complete o post");

    await pressTab(renderer, "Escala");
    await pressButton(renderer, "Disponibilidade");
    expectRenderedText(renderer, "Disponibilidade registrada");

    await pressTab(renderer, "Rotinas");
    await pressButton(renderer, "Concluir item", { fromEnd: true });
    expectRenderedText(renderer, "Checklist atualizado");
    await pressButton(renderer, "Registrar desvio");
    expectRenderedText(renderer, "Desvio registrado");

    await pressTab(renderer, "Reconhecer");
    await pressButton(renderer, "Reconhecer apoio");
    expectRenderedText(renderer, "Reconhecimento enviado");
  });

  it("smokes leader overview, campaign, moderation, coverage and invite management flows", async () => {
    const { AppProviders } = await import("../src/app/providers.js");
    const { LeaderHomeScreen } = await import("../src/app/screens.js");

    const renderer = await renderWithProviders(
      AppProviders,
      React.createElement(LeaderHomeScreen),
      leaderSession,
    );

    expectRenderedText(renderer, "Decisoes sugeridas");

    await pressTab(renderer, "Moderacao");
    expectRenderedText(renderer, "Moderacao");

    await pressTab(renderer, "Escala");
    expectRenderedText(renderer, "Trocas, lacunas e aprovacoes");
    await pressButton(renderer, "Criar reforco");
    expectRenderedText(renderer, "Rascunho criado");

    await pressTab(renderer, "Campanhas");
    expectRenderedText(renderer, "Ativas, rascunhos e encerradas");
    await pressButton(renderer, "Criar campanha");
    expectRenderedText(renderer, "Campanha criada");

    await pressTab(renderer, "Time");
    expectRenderedText(renderer, "Convites da equipe");
    await pressButton(renderer, "Enviar acesso");
    expectRenderedText(renderer, "Informe um email valido para enviar o acesso.");
  });
});

async function renderWithProviders(
  AppProviders: React.ComponentType<{
    readonly children?: React.ReactNode;
    readonly initialSession?: unknown;
  }>,
  element: React.ReactElement,
  session: typeof collaboratorSession,
) {
  return renderElement(React.createElement(AppProviders, { initialSession: session }, element));
}

async function renderElement(element: React.ReactElement) {
  let renderer: any;

  await act(async () => {
    renderer = create(element);
    await flushAsyncWork();
  });

  return renderer;
}

async function pressTab(renderer: any, accessibilityLabel: string): Promise<void> {
  const tab = renderer.root.find(
    (node: any) =>
      node.props.accessibilityRole === "tab" &&
      node.props.accessibilityLabel === accessibilityLabel,
  );

  await act(async () => {
    tab.props.onPress();
    await flushAsyncWork();
  });
}

async function pressButton(
  renderer: any,
  accessibilityLabel: string,
  options: { readonly fromEnd?: boolean; readonly occurrence?: number } = {},
): Promise<void> {
  const buttons = renderer.root.findAll(
    (node: any) =>
      node.props.accessibilityRole === "button" &&
      node.props.accessibilityLabel === accessibilityLabel &&
      typeof node.props.onPress === "function",
  );
  const button =
    options.fromEnd === true
      ? buttons.at(-1)
      : buttons[options.occurrence === undefined ? 0 : options.occurrence];

  if (button === undefined) {
    throw new Error(`Unable to find pressable button: ${accessibilityLabel}`);
  }

  await act(async () => {
    button.props.onPress();
    await flushAsyncWork(10);
  });
}

async function changeTextInput(renderer: any, occurrence: number, value: string): Promise<void> {
  const inputs = renderer.root.findAll((node: any) => typeof node.props.onChangeText === "function");
  const input = inputs[occurrence];

  if (input === undefined) {
    throw new Error(`Unable to find text input at occurrence ${occurrence}`);
  }

  await act(async () => {
    input.props.onChangeText(value);
    await flushAsyncWork();
  });
}

function expectRenderedText(renderer: any, expectedText: string): void {
  expect(collectText(renderer.toJSON()).join(" ")).toContain(expectedText);
}

function collectText(node: unknown): string[] {
  if (node === null || node === undefined) {
    return [];
  }

  if (typeof node === "string") {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => collectText(child));
  }

  if (typeof node === "object" && "children" in node) {
    const children = (node as { children?: unknown[] }).children ?? [];

    return children.flatMap((child) => collectText(child));
  }

  return [];
}

async function flushAsyncWork(iterations: number = 6): Promise<void> {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

function createFeedHome(posts = [createFeedPost()]) {
  return {
    announcements: [],
    feedbackInboxCount: 0,
    polls: [],
    posts,
  };
}

function createFeedPost(input?: {
  readonly comments?: Array<ReturnType<typeof createFeedComment>>;
  readonly id?: string;
  readonly photoUrl?: string;
  readonly status?: string;
}) {
  return {
    authorName: "Julia Lima",
    caption:
      "Banca reorganizada com frente viva, leitura de maturacao clara e contexto suficiente para o time.",
    category: "quality",
    comments: input?.comments ?? [],
    createdAt: "2026-04-23T12:00:00.000Z",
    id: input?.id ?? "post-social",
    pendingSync: false,
    photoUrl: input?.photoUrl ?? "https://images.engaja.local/feed/social-post.jpg",
    publishedAt: "2026-04-23T12:05:00.000Z",
    reactions: [
      { count: 1, label: "Curtir", selected: true, type: "like" },
      { count: 0, label: "Aplauso", selected: false, type: "aplauso" },
      { count: 0, label: "Inspirador", selected: false, type: "inspirador" },
      { count: 0, label: "Duvida", selected: false, type: "duvida" },
    ],
    status: input?.status ?? "published",
    title: "Reposicao pronta com banca viva",
    visibility: "department",
  };
}

function createFeedComment(input?: { readonly body?: string; readonly id?: string }) {
  return {
    authorName: "Mateus Rocha",
    body: input?.body ?? "Boa leitura para o proximo turno.",
    createdAt: "2026-04-23T12:04:00.000Z",
    id: input?.id ?? "comment-social",
    pendingSync: false,
    status: "visible",
  };
}
