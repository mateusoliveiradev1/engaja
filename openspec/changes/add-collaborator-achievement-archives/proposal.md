## Why

O app ja tem uma direcao de feed com fotos e reconhecimento, mas ainda falta um loop de engajamento que fique claro para o colaborador no dia a dia: entrar no perfil e enxergar um arquivo vivo do que conquistou, e participar de campanhas que transformem rotina real de FLV em meta, disputa saudavel e recompensa. Fazer isso agora ajuda a aumentar recorrencia, senso de progresso e valor pratico do feed, ligando fotos e evidencias operacionais a reconhecimento concreto.

## What Changes

- Adicionar um arquivo de conquistas no perfil de cada colaborador com linha do tempo de badges, reconhecimentos, posts destacados, desafios concluidos, vitorias de campanha e recompensas recebidas ou pendentes.
- Adicionar campanhas de engajamento configuraveis ligadas ao feed e a evidencias operacionais, permitindo desafios como "quem enviou mais fotos aprovadas", "quem montou mais bancas validadas" e "quem manteve mais consistencia na semana".
- Adicionar regras explicitas para que apenas evidencias aprovadas e elegiveis contem para pontuacao, ranking e recompensa, reduzindo spam, injustica e competicao toxica.
- Adicionar mecanicas de recompensa com transparencia do motivo do ganho, incluindo pontos, badges, destaque no app e premio manual controlado pela lideranca.
- Definir que recompensas oficiais de mundo real, como folga ou premio em dinheiro, nao sao liberadas automaticamente pelo app e dependem de aprovacao interna configurada pela empresa.
- Definir que recompensas pessoais ou informais oferecidas pelo lider fora da politica oficial nao constituem promessa automatica do sistema nem direito adquirido do colaborador.
- Expor progresso pessoal e ranking saudavel dentro do feed e do perfil, com foco em motivacao positiva e sem listar piores desempenhos.

## Capabilities

### New Capabilities

- `collaborator-achievement-archives`: arquivo pessoal no perfil com historico rastreavel de conquistas, campanhas, reconhecimentos, destaques e recompensas.
- `engagement-challenge-campaigns`: campanhas periodicas de engajamento baseadas em fotos e evidencias operacionais, com criterios, ranking saudavel, apuracao e distribuicao de recompensas.

### Modified Capabilities

- None.

## Impact

- Novas entidades e projecoes de leitura para arquivo de perfil, campanhas, entradas elegiveis, placares e concessao de recompensa.
- Novas rotas e casos de uso para consultar arquivo do colaborador, criar campanhas, acompanhar progresso, fechar apuracoes e registrar fulfillment manual de premios com governanca de aprovacao.
- Mudancas no feed e no perfil mobile para exibir cards de desafio, progresso individual, historico de vitorias e detalhes de cada conquista.
- Integracao com moderacao, pontos, reconhecimento, auditoria e analytics de engajamento.
