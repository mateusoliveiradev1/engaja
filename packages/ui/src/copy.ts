export const flvStateCopy = {
  empty: {
    actionLabel: "Criar acao",
    description: "Ainda nao ha conteudo nesta tela, mas o proximo passo ja fica claro.",
    eyebrow: "Estado vazio",
    title: "Sem novidade por enquanto",
  },
  error: {
    actionLabel: "Tentar novamente",
    description:
      "Nao foi possivel atualizar agora. Confira a conexao ou tente de novo em instantes.",
    eyebrow: "Erro",
    title: "Algo travou neste fluxo",
  },
  loading: {
    eyebrow: "Carregando",
  },
  offline: {
    actionLabel: "Ver itens salvos",
    description:
      "O app continua util com dados recentes, itens salvos no aparelho e destaque para o que precisa ser enviado depois.",
    eyebrow: "Sem conexao",
    title: "Tudo importante segue visivel",
  },
  pending: {
    actionLabel: "Acompanhar envio",
    description: "A acao ficou registrada e sera concluida assim que o app puder atualizar.",
    eyebrow: "Em andamento",
    title: "Registro guardado com seguranca",
  },
  permissionDenied: {
    actionLabel: "Solicitar acesso",
    description: "Este conteudo exige outra area de loja ou uma permissao de lideranca.",
    eyebrow: "Permissao",
    title: "Acesso bloqueado",
  },
  success: {
    actionLabel: "Compartilhar resultado",
    description: "A confirmacao aparece sem ruido e deixa o proximo passo evidente para a equipe.",
    eyebrow: "Sucesso",
    title: "Tudo certo por aqui",
  },
} as const;

export const flvProductCopy = {
  actions: {
    addEvidence: "Adicionar evidencia",
    approve: "Aprovar",
    camera: "Abrir camera",
    comment: "Comentar",
    continue: "Continuar",
    createInvite: "Convidar pessoa",
    feature: "Destacar",
    gallery: "Abrir galeria",
    hide: "Ocultar",
    publish: "Publicar",
    remove: "Remover",
    retry: flvStateCopy.error.actionLabel,
    save: "Salvar",
    sendRecognition: "Enviar reconhecimento",
    viewDetails: "Ver detalhes",
  },
  auth: {
    inviteExpired: "O convite perdeu validade. Peça um novo link para a lideranca.",
    inviteReady: "Confirme seus dados para entrar no Engaja FLV.",
    loginSubtitle: "Entre para acompanhar turno, rotinas e comunicados do setor.",
    recovery: "Informe seu e-mail para receber o proximo passo com seguranca.",
  },
  feed: {
    commentPlaceholder: "Escreva um comentario util para o time",
    composerPrompt: "Compartilhe uma foto, conquista ou alerta rapido do FLV.",
    emptyTitle: "A linha do tempo esta pronta para o primeiro registro do turno",
    pendingSync: "Sera enviado quando a conexao voltar.",
    photoRequired: "Adicione uma foto ou legenda antes de publicar.",
  },
  leadership: {
    attention: "Pontos que pedem decisao",
    campaignClose: "Encerrar campanha",
    coverageGap: "Cobertura com risco",
    moderationQueue: "Itens aguardando revisao",
    teamAction: "Organizar equipe",
  },
  recognition: {
    archive: "Historico de conquistas",
    campaignProgress: "Progresso da campanha",
    ranking: "Ranking do periodo",
    rewardStatus: "Status da recompensa",
  },
  routines: {
    checklistNext: "Proxima acao da rotina",
    evidenceReady: "Evidencia anexada",
    issueLogged: "Ocorrencia registrada para acompanhamento",
    priority: "Rotinas prioritarias",
  },
  schedule: {
    availability: "Informar disponibilidade",
    coverageDecision: "Decisao de cobertura",
    nextShift: "Proximo turno",
    requestStatus: "Status da solicitacao",
    todayShift: "Turno de hoje",
  },
  team: {
    activeMembers: "Pessoas ativas",
    pendingInvites: "Convites pendentes",
    permissionDenied: "A lideranca pode liberar essa acao para o seu perfil.",
    roleContext: "Funcao e area de atuacao",
  },
} as const;
