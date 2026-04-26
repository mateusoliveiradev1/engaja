## Context

O repositorio ja tem um produto quase completo: Expo Router no mobile, API Hono, contratos tipados, dados persistidos, auth/convites, feed, escala, rotinas, reconhecimento, painel de lideranca, moderacao, time e um pacote `packages/ui`. O problema agora e outro: a entrega funcional ainda nao parece um app moderno e final em 100% das superficies. Algumas telas ainda soam como dashboard, formulario tecnico ou prototipo visual.

A mudanca deve refinar o produto inteiro sem trocar a arquitetura base. Expo Router, services atuais, contratos, API e banco continuam sendo a fundacao. O trabalho principal e de experiencia, composicao, componentes, copy, ergonomia, estados e QA visual, com ajustes de contrato/backend apenas quando um dado essencial nao existir.

Stakeholders:

- Colaborador de FLV: precisa abrir o app e sentir que tudo e rapido, claro, social, util e feito para a rotina real da loja.
- Lider de setor: precisa navegar por feed, moderacao, escala, rotinas, campanhas e equipe com clareza e confianca.
- Gerente/admin: precisa perceber acabamento profissional, consistencia, controle, seguranca e ausencia de "modo demo".

## Goals / Non-Goals

**Goals:**

- Fazer todas as telas principais parecerem produto final premium.
- Reduzir cara de dashboard generico, formulario pesado, prototipo ou template.
- Dar ao feed a fluidez de rede social operacional.
- Melhorar escala, rotinas, reconhecimento, lideranca, campanhas, time e convites como fluxos completos.
- Refinar componentes e tokens para suportar consistencia visual em todo o app.
- Revisar copy visivel em portugues brasileiro e estados de erro/offline/vazio/sucesso/permissao.
- Criar gates de qualidade que tornem "100% pronto" verificavel por screenshots, smoke flows e checklist.

**Non-Goals:**

- Nao reimplementar auth, banco, convites ou persistencia do zero.
- Nao criar features novas grandes fora da experiencia existente, como chat direto, push notifications ou analytics avancado.
- Nao transformar o app em landing page, painel web administrativo ou rede social publica.
- Nao adicionar dependencia paga obrigatoria para UI, imagens, email, storage ou analytics.
- Nao mudar regras de negocio quando o problema for apenas composicao/UX/copy.

## Decisions

### Tratar o refinamento como produto inteiro, nao como "ajuste de feed"

A implementacao SHALL revisar todas as superficies mobile primarias: auth, convite, shell, feed, escala, rotinas, reconhecimento, colaborador home, lider home, moderacao, campanhas, cobertura, time, convites e estados protegidos. O feed continua sendo um foco forte, mas nao sera o unico criterio de sucesso.

Rationale: a percepcao de produto moderno quebra se qualquer fluxo principal voltar a parecer demo ou painel antigo.

Alternativas consideradas:

- Refinar so o feed: resolveria o ponto mais visivel, mas deixaria o restante do produto inconsistente.
- Refazer o app inteiro do zero: alto risco e desnecessario porque as regras e dados ja existem.

### Remodelar por jornadas e primeira dobra

Cada area SHALL ter uma primeira dobra clara: contexto do usuario, acao primaria, sinal mais urgente e estado atual. Headers longos, cards explicativos e secoes secundarias devem perder prioridade quando competirem com a acao principal.

Rationale: app moderno nao exige que o usuario leia uma apresentacao antes de agir. Ele mostra o que importa agora.

Alternativas consideradas:

- Manter composicao por secoes completas: organizado para engenharia, mas pesado para uso diario.
- Criar hero visual em todas as telas: ficaria bonito pontualmente, mas pouco ergonomico para operacao de loja.

### Criar um sistema de componentes para social e operacao

`packages/ui/native` SHALL ganhar/refinar componentes reutilizaveis para:

- social: quick composer, social post card, reaction bar, comment preview/thread, priority strip, moderation actions;
- operacao: shift summary, routine progress, checklist evidence, issue logging, recognition card, campaign progress, leaderboard, invite/user row;
- estados: loading, empty, error, offline, success, permission denied e pending sync.

Regras de negocio permanecem em services/use cases. Componentes resolvem visual, ergonomia e acessibilidade.

Rationale: polimento 100% nao escala se cada tela continuar montando UI final de forma ad hoc.

Alternativas consideradas:

- Ajustar JSX diretamente em `screens.tsx`: rapido no curto prazo, mas fragil e dificil de manter.
- Importar UI kit externo: poderia acelerar, mas traria visual generico e dependencia desnecessaria.

### Manter FLV real, mas com linguagem visual contemporanea

A direcao visual SHALL manter Engaja/FLV como identidade, usando midia, evidencias, contexto operacional e termos de loja, mas reduzir excesso de bege/verde, cards empilhados e visual de relatorio. A UI deve usar superficies limpas, contraste preciso, iconografia clara, bordas contidas, fotos bem enquadradas e motion leve.

Rationale: o app precisa ser especifico para FLV sem parecer antigo ou decorativo.

Alternativas consideradas:

- Trocar a marca inteira: escopo maior que o necessario.
- Apenas alterar cores: nao corrige hierarquia, fluxo e percepcao de qualidade.

### QA visual como gate, nao como opcional

A implementacao SHALL registrar screenshots e smoke flows para todas as jornadas principais antes de concluir tarefas. Qualquer texto cortado, sobreposicao, primeiro viewport fraco, nested cards sem funcao, copy interna ou estado incompleto bloqueia conclusao.

Rationale: "moderno" tem subjetividade, mas muitos sinais de produto inacabado sao objetivos.

Alternativas consideradas:

- Revisao manual livre: importante, mas facil de aceitar algo "quase bom".
- Snapshot pixel-perfect amplo: fragil demais nesta fase de evolucao visual.

## Risks / Trade-offs

- [Escopo amplo pode virar interminavel] -> Trabalhar por jornadas com criterios de aceite objetivos e tarefas pequenas.
- [Polimento pode quebrar comportamento existente] -> Preservar services/contratos, adicionar testes de fluxo e comparar smoke flows antes/depois.
- [Componentizar pode atrasar a primeira entrega] -> Extrair apenas componentes que removem duplicacao real ou sustentam varias telas.
- [Visual premium pode reduzir densidade operacional] -> Priorizar escaneabilidade e acao diaria, nao composicao decorativa.
- [QA visual pode exigir servidor/dev preview estavel] -> Registrar comandos, screenshots e falhas conhecidas sem depender de dados secretos.

## Migration Plan

1. Capturar baseline visual das jornadas principais em mobile estreito e web preview.
2. Mapear problemas por area: auth, shell, feed, escala, rotinas, reconhecimento, lideranca, time/convites e estados.
3. Refinar tokens e componentes compartilhados em `packages/ui`.
4. Remodelar feed social e composer como referencia de padrao visual.
5. Remodelar escala, rotinas, reconhecimento e lideranca por jornada.
6. Remodelar auth, convite, time/convites, permissao e estados transversais.
7. Revisar copy visivel e remover termos tecnicos/internos.
8. Rodar smoke flows, testes, typecheck, lint e QA visual.

Rollback:

- Cada jornada deve ser alterada em commits/tarefas pequenas.
- Services, contratos e repositorios devem permanecer compativeis; se uma tela falhar, a composicao anterior pode ser restaurada sem desfazer auth/banco.

## Open Questions

- O refinamento deve priorizar primeiro colaborador ou lideranca se houver conflito de agenda?
- O app deve usar botao flutuante global de camera/postagem ou manter entrada de postagem apenas no feed?
- A experiencia de reconhecimento deve ficar mais gamificada visualmente ou mais discreta e operacional?
