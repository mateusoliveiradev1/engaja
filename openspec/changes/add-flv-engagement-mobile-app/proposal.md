## Why

O setor de FLV precisa de um app mobile que seja produto de verdade: bonito, rapido, seguro, modular e util na rotina, nao apenas uma tela de comunicados. Como voce assumiu a lideranca, a oportunidade e criar uma plataforma moderna para engajamento visual com fotos, gestao de escala, rotinas, reconhecimento e acompanhamento operacional com padrao enterprise.

## What Changes

- Reposicionar o projeto como uma plataforma mobile-first para FLV, com app, API, banco Neon Postgres, midia segura, analytics, testes e arquitetura modular desde o primeiro commit.
- Adicionar feed de engajamento com fotos, legendas, categorias, vinculo com missoes/rotinas, reacoes, comentarios controlados, moderacao e destaques da lideranca.
- Adicionar gestao de escala com turnos, folgas, disponibilidade, trocas, cobertura por setor, aprovacoes e visualizacao clara para colaboradores e lideres.
- Tornar o visual do app uma experiencia propria de FLV, com UI/UX premium, foto-first, microinteracoes, estados vazios ricos, acessibilidade e verificacao visual obrigatoria.
- Definir stack 2026 com pnpm workspaces, Turborepo, Expo SDK 55, React Native, TypeScript, API modular, Neon serverless Postgres e Drizzle ORM.
- Exigir clean code, SOLID, arquitetura hexagonal, boundaries estritos, contratos tipados, testes automatizados, performance extrema e seguranca nivel enterprise.
- Adicionar controles de seguranca para autenticacao, RBAC/ABAC, RLS no banco, uploads assinados, validacao de arquivos, auditoria, rate limit, secrets, logs e testes de autorizacao.
- Definir RBAC nominal para `colaborador`, `lider-setor`, `gerente-loja`, `admin-organizacao` e `auditor`, com permissoes especificas por loja, setor e acao.
- Garantir desenvolvimento com custo zero usando ferramentas open source, execucao local e free tiers com limites monitorados.
- Preparar o produto para evoluir para multiplas lojas/setores sem reescrever dominio, dados, UI ou permissoes.

## Capabilities

### New Capabilities

- `mobile-app-shell`: Estrutura base do app mobile, navegacao, autenticacao, sessoes, perfis, offline-ready, observabilidade e boundaries modulares.
- `backend-data-platform`: API modular, Neon Postgres, Drizzle ORM, migrations, storage de midia, contratos tipados e sincronizacao segura.
- `premium-ui-ux`: Design system exclusivo do produto FLV, identidade visual nao generica, motion, acessibilidade, performance visual e verificacao de telas.
- `flv-engagement`: Feed de engajamento com fotos, missoes, posts, comentarios, reacoes, enquetes, comunicados, feedback e moderacao.
- `shift-scheduling`: Gestao de escala, turnos, disponibilidade, folgas, trocas, aprovacoes, cobertura e notificacoes de escala.
- `flv-operations`: Checklists, rotinas, padroes de qualidade, evidencias, perdas, abastecimento, aprendizagem rapida e resumo de turno.
- `recognition-gamification`: Pontos, badges, conquistas, ranking saudavel, reconhecimento, regras anti-abuso e transparencia.
- `leader-dashboard`: Painel de lideranca para indicadores, feed, escala, rotinas, conteudos, reconhecimentos, moderacao e decisoes.
- `enterprise-security-performance`: Requisitos transversais de seguranca, performance, clean code, SOLID, observabilidade, testes e qualidade.
- `zero-cost-development`: Modo de desenvolvimento sem custo com provedores free, alternativas locais, limites de uso, guardrails contra cobranca e documentacao operacional.

### Modified Capabilities

- None.

## Impact

- Novo monorepo pnpm/Turborepo com `apps/mobile`, `apps/api`, possivel `apps/admin` futuro e pacotes internos independentes.
- Banco principal Neon Postgres com migrations versionadas, schema multi-tenant, RLS, auditoria e conexoes server-side apenas.
- Midias do feed e evidencias operacionais armazenadas em object storage privado, com metadados e permissoes no Neon.
- API modular com validacao de entrada/saida, contratos compartilhados, rate limiting, autenticao/autorizacao e logs estruturados.
- Dependencias esperadas: Expo SDK 55, React Native 0.83, React 19.2, Expo Router, pnpm 10, Turborepo, TypeScript, Drizzle ORM, Neon serverless driver, TanStack Query, Better Auth ou Neon Auth free, storage local/MinIO para dev, R2 free opcional para teste remoto, analytics local, testes e tooling de seguranca open source.
