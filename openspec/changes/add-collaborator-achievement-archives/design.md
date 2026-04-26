## Context

O produto ja tem uma direcao macro para feed de fotos, reconhecimento e gamificacao, mas ainda nao existe uma definicao dedicada para transformar essas ideias em um ciclo de engajamento que seja visivel no perfil e repetivel na rotina da loja. O pedido atual puxa duas necessidades praticas: um "archives" no perfil de cada colaborador, tratado aqui como um arquivo de conquistas e evidencias, e campanhas que premiem comportamentos desejados como postar boas fotos, montar bancas com capricho e manter consistencia operacional.

Stakeholders principais:

- Colaboradores de FLV: querem enxergar progresso real, vitrine pessoal e motivos claros para cada conquista.
- Lideres de setor: querem criar desafios simples, justos e faceis de acompanhar sem virar bagunca ou concurso de spam.
- Gerencia de loja: quer usar campanhas para reforcar padrao operacional e engajamento sem expor desempenho negativo.

Restricoes assumidas:

- O sistema precisa aproveitar feed, moderacao e reconhecimento ja planejados, em vez de criar uma experiencia paralela.
- Pontuacao e ranking so podem contar evidencias aprovadas ou validadas.
- O produto deve reforcar competicao saudavel, nunca ranking de vergonha ou incentivo a volume sem qualidade.
- Recompensas fisicas ou externas podem existir, mas sua entrega precisa ficar rastreavel e sob controle da lideranca.
- Folga, dinheiro e outros premios sensiveis dependem de politica interna da empresa e nao devem ser prometidos automaticamente pelo produto.

## Goals / Non-Goals

**Goals:**

- Criar um arquivo de conquistas no perfil com historico, rastreabilidade e resumos positivos de progresso.
- Permitir campanhas recorrentes e configuraveis ligadas ao feed e a evidencias operacionais.
- Garantir que fotos, bancas e outras provas elegiveis so contem quando passarem pelas regras de moderacao e validacao.
- Integrar recompensas digitais e premios manuais sem perder transparencia do motivo e do responsavel.
- Diferenciar recompensas oficiais aprovadas pela empresa de gestos pessoais informais feitos fora da politica oficial.
- Exibir progresso no feed, no perfil e nas superficies de lideranca como partes do mesmo sistema.

**Non-Goals:**

- Nao criar folha de pagamento variavel, bonus financeiro automatico ou integracao com RH no MVP.
- Nao transformar curtidas brutas ou volume de postagem em criterio unico de vencedor.
- Nao permitir que colaboradores editem manualmente o proprio arquivo de conquistas.
- Nao expor rankings com ultimos colocados, metricas negativas ou comparacoes humilhantes.
- Nao abrir upload ou validacao fora do fluxo de seguranca e moderacao definido para o feed.
- Nao automatizar transferencia de dinheiro, `Pix` pessoal do lider ou concessao de folga sem fluxo de aprovacao configurado.

## Decisions

### Use a dedicated engagement event ledger plus archive read model

O sistema SHALL registrar eventos elegiveis de engajamento em um ledger imutavel e derivar a visao de "arquivo de conquistas" a partir desse historico, em vez de salvar cards manuais soltos no perfil.

Rationale:

- Um ledger unifica origem de pontos, reconhecimentos, campanhas e evidencias validadas.
- O arquivo de perfil passa a ser explicavel: cada item aponta para a origem que o gerou.
- Correcao de regras fica mais segura porque a projecao pode ser recalculada sem perder auditoria.

Implementation direction:

- Registrar eventos com `source_type`, `source_id`, `actor_id`, `campaign_id`, `awarded_at`, `status` e metadados de regra.
- Projetar itens de arquivo com tipos como `badge-awarded`, `challenge-won`, `featured-post`, `validated-banca`, `manual-prize`.
- Marcar itens corrigidos ou revogados quando a evidencia de origem perder validade.

Alternatives considered:

- Salvar apenas totais agregados no perfil: simples, mas pouco transparente e ruim para auditoria.
- Salvar cards livres editaveis pela lideranca: flexivel, mas fraco para consistencia e rastreabilidade.

### Model campaigns as configurable, time-bound challenge programs

As campanhas SHALL ser entidades configuraveis com janela de tempo, escopo, criterio de elegibilidade, metrica principal, recompensa e modo de apuracao.

Rationale:

- Lideres precisam criar desafios repetiveis sem depender de mudanca de codigo a cada nova ideia.
- O mesmo motor pode cobrir desafios de foto, banca montada, evidencia antes/depois e consistencia semanal.
- Parametrizacao reduz ambiguidade na apuracao e torna o resultado defendivel.

Implementation direction:

- Suportar metricas como `approved-photo-post`, `validated-banca-setup`, `approved-before-after`, `checklist-linked-evidence`, `consistency-streak`.
- Permitir escopo por organizacao, loja, setor e publico elegivel.
- Permitir campanhas individuais e, futuramente, de equipe, mas priorizar individual no primeiro corte.
- Limitar a primeira versao a periodos semanais, mensais ou customizados simples.

Alternatives considered:

- Hardcode de desafios fixos: rapido no inicio, mas limita experimentacao da lideranca.
- Campanhas livres demais com formulas arbitrarias: flexivel, porem dificil de validar e explicar.

### Count only verified evidence and moderated content

Pontuacao de campanha SHALL depender apenas de fotos aprovadas e evidencias operacionais validadas, nunca de uploads pendentes, rejeitados ou removidos.

Rationale:

- O comportamento desejado e qualidade com consistencia, nao spam.
- Fotos e evidencias sao superficie sensivel e precisam do mesmo nivel de confianca do restante do produto.
- Regras claras reduzem contestacao e favoritismo percebido.

Implementation direction:

- Integrar a campanha com estados de moderacao do feed e validacao operacional.
- Recontar scores quando uma evidencia for aprovada, revogada ou escondida.
- Exigir chave de unicidade por post ou evidencia para evitar dupla contagem.

Alternatives considered:

- Contar tudo no envio e corrigir depois: cria rankings instaveis e incentiva comportamento errado.
- Contar curtidas ou reacoes como peso principal: facil de manipular e menos aderente a execucao real.

### Separate digital reward granting from manual prize fulfillment

O sistema SHALL conceder recompensas digitais automaticamente e registrar premios manuais como itens pendentes de fulfillment pela lideranca.

Rationale:

- Pontos, badges e destaque podem ser automatizados com seguranca.
- Premios fisicos, brindes ou beneficios locais exigem confirmacao humana.
- Separar concessao de fulfillment evita sumico de premios prometidos e mantem historico confiavel.

Implementation direction:

- Encerrar campanha com apuracao formal dos vencedores e criar `reward_grants`.
- Conceder pontos e badges no fechamento da campanha.
- Criar status para premio manual: `pending-fulfillment`, `fulfilled`, `canceled`.
- Exibir no perfil quem ganhou, por qual campanha e em que estado esta o premio.

Alternatives considered:

- Fazer tudo manualmente: sobrecarrega a lideranca e enfraquece o loop de engajamento.
- Automatizar qualquer premio sem confirmacao: arriscado para operacao real de loja.

### Require approval governance for company-backed real-world rewards

Premios de mundo real que envolvam folga, dinheiro, voucher, brinde corporativo ou outro beneficio oficial SHALL exigir aprovacao interna configurada antes de serem publicados como recompensa oficial da campanha ou marcados como entregues.

Rationale:

- Folga depende explicitamente de RH ou gestao.
- Premio em dinheiro pode envolver regras internas, equidade e compliance, mesmo quando a ideia parte da lideranca local.
- O app precisa deixar claro o que e conquista digital imediata e o que depende de validacao humana.

Implementation direction:

- Permitir tipos de recompensa `digital`, `manual-company-approved` e `manual-external-informal`.
- Exigir aprovador responsavel e trilha de auditoria para `manual-company-approved`.
- Tratar `manual-external-informal` apenas como nota opcional interna ou nao suportar sua publicacao como premio oficial no MVP.
- Nunca exibir dinheiro ou folga como premio garantido sem estado de aprovacao valido.

Alternatives considered:

- Deixar qualquer lider publicar qualquer premio: rapido, mas perigoso para operacao real.
- Bloquear qualquer premio real no produto: seguro, mas limita um caso de uso importante se a empresa quiser formalizar incentivos.

### Show progress as positive motivation, not public shaming

As superficies de ranking e progresso SHALL destacar top contribuidores, metas pessoais e historico de evolucao sem expor ultimos colocados ou indicadores negativos publicos.

Rationale:

- O pedido e engajar mais, nao criar ambiente punitivo.
- Competicao saudavel funciona melhor com reconhecimento, transparencias de regra e foco em quem avancou.
- Isso tambem reduz risco cultural e resistencia da operacao.

Implementation direction:

- Mostrar top posicoes elegiveis, progresso do proprio usuario e destaques de campanha.
- Usar desempate por qualidade aprovada, consistencia e tempo de conclusao quando necessario.
- Aplicar limites por periodo para evitar que quantidade pura derrote qualidade.

Alternatives considered:

- Ranking completo do primeiro ao ultimo: simples, mas gera vergonha e distorce comportamento.
- Esconder qualquer comparacao: mais seguro, mas enfraquece o aspecto motivacional do desafio.

## Risks / Trade-offs

- [Campanhas viram corrida por volume] -> Exigir evidencias aprovadas, caps por periodo e criterios de qualidade.
- [Lideranca cria regras confusas] -> Restringir templates e campos de campanha na primeira versao.
- [Mudancas de moderacao alteram placar depois da publicacao] -> Usar status claros, recalculo auditavel e historico de correcao.
- [Premios prometidos nao sao entregues] -> Separar grant de fulfillment e mostrar status no perfil e na lideranca.
- [Lider oferece recompensa sem autorizacao e gera expectativa] -> Exigir aprovacao para premios oficiais e impedir promessas automaticas de `Pix` ou folga.
- [Escopo cruza lojas ou setores sem permissao] -> Aplicar autorizacao por organizacao, loja e setor em leitura e escrita.
- [Arquivo do perfil fica poluido] -> Projetar filtros por tipo, periodo e status, alem de destaque para itens mais relevantes.

## Migration Plan

Como o produto ainda esta em fase de definicao, a implantacao pode ser feita por migracoes aditivas:

1. Criar entidades de campanhas, eventos elegiveis, itens de arquivo e grants de recompensa.
2. Integrar o motor de apuracao aos fluxos de feed aprovado e validacao operacional.
3. Publicar leitura de arquivo do colaborador e cards de campanha ativa.
4. Habilitar fechamento de campanha e fulfillment manual por feature flag operacional.
5. Popular seeds com campanhas exemplo de foto aprovada e banca validada para demonstracao.
6. Configurar aprovacao obrigatoria para recompensas oficiais antes de expor campanhas com premio real.

Rollback:

- Desabilitar leitura das campanhas e do arquivo por feature flag sem remover dados.
- Preservar ledger e grants para auditoria mesmo que a experiencia fique escondida.
- Reverter apuracoes por status, sem apagar historico original.

## Open Questions

- Quais tipos de premio manual a operacao realmente quer usar no MVP: brinde, folga simbolica, destaque interno ou outro incentivo?
- A vitoria deve ser sempre individual ou algumas campanhas precisam nascer em modo equipe desde o inicio?
- "Banca montada" sera validada por lideranca manual, checklist com foto ou regra combinada?
- O arquivo de conquistas de um colaborador pode ser visto por outros colaboradores ou apenas pelo proprio usuario e lideranca?
- A empresa quer suportar algum premio oficial em dinheiro ou prefere limitar o MVP a folga aprovada, brindes e destaque no app?
