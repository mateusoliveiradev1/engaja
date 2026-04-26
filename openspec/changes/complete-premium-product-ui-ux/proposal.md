## Why

O app ja funciona e tem varios fluxos implementados, mas a experiencia ainda nao passa a sensacao de produto 100% pronto, moderno e desejavel. Esta mudanca existe para elevar o Engaja inteiro: nao apenas o feed, mas cada tela, fluxo, estado, componente, copy e interacao que um colaborador ou lider toca no dia a dia.

## What Changes

- Refinar 100% da experiencia mobile do Engaja, incluindo auth, cadastro por convite, shell, navegacao, feed, escala, rotinas, reconhecimento, lideranca, moderacao, campanhas, time, convites, estados vazios, erro, offline, carregamento e sucesso.
- Transformar o feed em uma experiencia social moderna, com timeline viva, composer rapido, posts foto-first, comentarios, reacoes, moderacao contextual e organizacao visual parecida com app social contemporaneo.
- Remodelar fluxos operacionais para parecerem produto final, nao dashboard/prototipo: escala mais escaneavel, rotinas mais ergonomicas, reconhecimento mais motivador, painel de lideranca mais claro e time/convites mais profissional.
- Evoluir o sistema visual com componentes, tokens, iconografia, densidade, layout, motion, midia, contrastes e estados que parecam app nativo premium.
- Revisar toda copy visivel em portugues brasileiro para remover linguagem tecnica, interna, demonstrativa ou pouco humana.
- Criar gates de QA visual/UX que bloqueiem qualquer superficie com cara de demo, layout datado, excesso de cards, texto cortado, hierarquia fraca ou fluxo incompleto.

## Capabilities

### New Capabilities

- `complete-premium-product-experience`: refinamento completo das superficies mobile, navegacao, auth, estados e composicao geral do produto.
- `modern-social-feed-experience`: timeline, composer, posts, comentarios, reacoes, moderacao e organizacao social do feed mobile.
- `polished-operational-workflows`: escala, rotinas, reconhecimento, campanhas, lideranca, time e convites com UX final e ergonomia diaria.
- `premium-mobile-visual-system`: direcao visual, componentes, tokens, iconografia, midia, motion, densidade, copy e acessibilidade do app.
- `visual-ux-quality-gates`: validacoes visuais, responsivas, interativas e de copy que bloqueiam entrega com cara de prototipo.

### Modified Capabilities

- None.

## Impact

- `apps/mobile`: todas as telas e composicoes principais, incluindo `screens.tsx`, auth screens, product shell, route guards, team access, services de feed/engagement/schedule/operations/recognition e estados offline.
- `packages/ui`: tokens, primitivos, componentes nativos, estados, brand/copy, visual QA e componentes sociais/operacionais reutilizaveis.
- `packages/contracts`: somente ajustes de payload/copy/tipos se algum fluxo visual exigir dado ja existente de forma mais explicita.
- `apps/api`, `packages/application`, `packages/data`: apenas se algum endpoint atual nao entregar dados necessarios para a experiencia final; a prioridade e reaproveitar os contratos existentes.
- Testes e QA: screenshots mobile/web, smoke flows de todos os caminhos primarios, auditoria de copy, acessibilidade, responsividade, performance de lista/midia, `pnpm lint`, `pnpm typecheck` e testes relevantes.
