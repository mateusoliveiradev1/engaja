## Why

O app ja cobre muitas areas do produto, mas a experiencia ainda parece demonstracao tecnica em vez de aplicativo final, confiavel e pronto para uso por lideres e colaboradores. Esta mudanca transforma o Engaja em um produto completo: identidade visual propria, telas finalizadas, copy profissional, autenticacao real, convites controlados e banco real migrado para rodar de ponta a ponta.

## What Changes

- Remodelar toda a UI/UX mobile, incluindo login, cadastro, feed, escala, rotinas, reconhecimento, painel de lideranca, estados vazios, carregamento, erro, offline, sucesso e permissoes.
- Criar uma identidade visual final para o Engaja, incluindo logo, marca aplicada no app, linguagem visual consistente e componentes menos genericos.
- Substituir textos internos, provisiorios ou tecnicos por copy final em portugues brasileiro, orientada a usuarios reais de loja, lideranca e colaboradores.
- Implementar autenticacao real com login, cadastro por convite, aceite de convite, controle de sessao, logout e recuperacao/renovacao de acesso.
- Permitir que usuarios autorizados enviem acessos para colaboradores, definindo papel, loja, setor, validade do convite e reenvio/revogacao.
- Criar `.env` local a partir dos valores reais atualmente informados, mantendo segredos fora do Git e saneando exemplos para nao versionar credenciais reais.
- Rodar migrations no banco real, validar conectividade, aplicar seed minimo operacional e garantir que o app abra usando dados persistidos.
- Adicionar verificacoes visuais, fluxos de smoke test e criterios de aceite para impedir layout quebrado, texto cortado, UI generica ou telas incompletas.

## Capabilities

### New Capabilities

- `final-product-ui-ux`: Remodelacao completa da experiencia mobile para parecer um app final, profissional, especifico para FLV e pronto para uso diario.
- `brand-and-copy-system`: Logo, identidade visual aplicada e copy final em portugues brasileiro para todos os fluxos, sem termos internos ou placeholders.
- `auth-invitation-access`: Login, cadastro por convite, sessao, logout, recuperacao de acesso e envio/revogacao de convites para colaboradores.
- `real-database-bootstrap`: Configuracao segura de ambiente real, migrations no banco real, seed operacional minimo e validacao de persistencia.
- `release-readiness-quality-gates`: Gates de qualidade visual, acessibilidade, responsividade, testes de fluxo e criterios objetivos de app pronto.

### Modified Capabilities

- None.

## Impact

- `apps/mobile`: navegacao, telas de auth, rotas protegidas, tela inicial, telas de colaborador, telas de lideranca, componentes de fluxo, estados e copy.
- `packages/ui`: tokens, logo/marca, primitivos, componentes, densidade visual, tipografia, estados, acessibilidade e QA visual.
- `apps/api`: rotas de auth, convite, sessao, usuario atual, bootstrap/health e endpoints necessarios para app real.
- `packages/security`: adaptador de autenticacao, hashing/tokens, politicas de permissao, sessoes, convite, auditoria e redacao de erros.
- `packages/data`: schema Drizzle, migrations, repositories de usuarios/convites/sessoes, seed inicial e scripts de banco real.
- `packages/contracts`: contratos tipados para auth, convite, usuario atual, bootstrap, erros e validacao de formularios.
- Arquivos de ambiente: criacao local de `.env`, alinhamento de `.env.example`, `apps/api/.env.example` e `apps/mobile/.env.example` sem expor segredos reais.
- Testes e verificacoes: unitarios, integracao, smoke/e2e, acessibilidade, captura visual e gates `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:migrate` e `pnpm visual:qa`.
