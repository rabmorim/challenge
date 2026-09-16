# KURIO — Marketplace de NFTs

Marketplace de NFTs com fluxos de descoberta, compra e conta do colecionador, em
desktop e mobile. Todo o backend é **simulado** (MSW): não há blockchain, carteira
ou gateway de pagamento reais.

> **Status: Fase 6 — conta do colecionador.** Sobre a camada de rede da Fase 1,
> a sessão da Fase 2, o catálogo/detalhe/favoritos da Fase 3, o carrinho da
> Fase 4 e o pagamento/confirmação da Fase 5, esta fase entrega a **área da
> conta**: `/perfil` e `/carteiras` sob a barra lateral "Meu perfil", ambas
> privadas e com o mesmo guard.
>
> No perfil, os dados do frame, o avatar (troca simulada com prévia e remoção) e
> a **troca de senha**, com a senha atual incorreta voltando da API direto no
> campo. Nas carteiras, cadastro e edição da **principal e da secundária**, com o
> atalho "Igual à carteira principal" — que copia tudo menos o endereço, porque
> o servidor recusa endereço repetido. As carteiras salvas aqui são as **mesmas**
> que o pagamento lê: mesma query, mesma entrada de cache.
>
> As seções que o enunciado §3 exclui (Atividade, Lista de interesse, Ofertas,
> Arquivos baixados, Suporte) continuam desenhadas, mas marcadas como
> indisponíveis — nunca navegam nem aparentam sucesso.

---

## Requisitos

| Ferramenta | Versão usada |
| --- | --- |
| Node.js | 22.13.1 (mínimo suportado: 20.19) |
| pnpm | 12.3.4 |

O lockfile (`pnpm-lock.yaml`) é versionado — a instalação é reprodutível a partir
de um checkout limpo.

---

## Setup

```bash
pnpm install
pnpm exec playwright install chromium   # só para rodar os testes E2E
pnpm dev
```

A aplicação sobe em <http://localhost:5173> já com a camada de mocks ativa.

---

## Scripts

| Script | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento (Vite) com MSW ligado e HMR. |
| `pnpm build` | Checagem de tipos (`tsc -b`) seguida do build de produção. |
| `pnpm preview` | Serve o build em <http://localhost:4173>. |
| `pnpm typecheck` | Só a checagem de tipos, sem gerar bundle. |
| `pnpm lint` | Lint com oxlint (config em `.oxlintrc.json`). |
| `pnpm lint:fix` | Aplica as correções automáticas do lint. |
| `pnpm test` | Verificação da camada de rede: api client contra os handlers do MSW em Node (vitest). |
| `pnpm test:watch` | O mesmo, em modo observação. |
| `pnpm test:e2e` | Testes Playwright em Chromium, desktop (1440) e mobile (390). |
| `pnpm test:visual` | Só a suíte de regressão visual (`*.visual.spec.ts`). |
| `pnpm lighthouse` | Sobe o preview, roda 3 auditorias por página/perfil e publica a mediana. |
| `pnpm msw:init` | Regera `public/mockServiceWorker.js` (só após atualizar o MSW). |

Relatórios: `playwright-report/` (HTML + traces das falhas) e `lighthouse-report/`
(HTML e JSON de cada medição + `summary.json` com as medianas e LCP/CLS/TBT).

`pnpm lighthouse` termina com código 1 se alguma mediana ficar abaixo da meta
(Perf ≥ 90 · A11y ≥ 95 · BP ≥ 95 · SEO ≥ 90). A linha de base atual e a análise
do que ainda não bate a meta estão no `ARCHITECTURE.md`.

---

## Variáveis de ambiente

Todas têm prefixo `VITE_` e nenhuma carrega segredo — o backend inteiro é simulado.
Os valores padrão já estão versionados em `.env.development` e `.env.production`;
`.env.example` documenta o contrato.

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | URL base da instância única do Axios. |
| `VITE_SOCKET_URL` | `http://realtime.kurio.mock` | Origem do Socket.IO. Não existe servidor real nesse endereço: o MSW intercepta a conexão no construtor do `WebSocket`, antes de qualquer DNS. Usar uma origem própria evita colidir com o WebSocket de HMR do Vite. |
| `VITE_ENABLE_MOCKS` | `true` | Liga a camada de mocks. `true` ativa; qualquer outro valor desliga. |
| `VITE_MOCK_SCENARIO` | *(vazio)* | Cenário de mocks aplicado no boot. Vazio deixa a decisão para a URL (`?scenario=<id>`) ou para o cenário `default`. |
| `VITE_REQUEST_TIMEOUT_MS` | `15000` | Timeout das requisições REST. Reduzido nos testes (3000) para exercitar o cenário de timeout de pedido sem esperar 15 s. |

Para sobrescrever localmente sem sujar o repositório, use `.env.local` (ignorado
pelo git).

---

## Camada de mocks

- Ativada por configuração (`VITE_ENABLE_MOCKS`) e **incluída no build de
  demonstração** — o deploy da Vercel roda com os mocks ligados.
- O worker é iniciado em `src/mocks/start.ts` **antes** do primeiro render — e,
  por isso, antes de qualquer socket ser aberto.
- Estrutura: `handlers/` (REST + controle), `db/` (store e regras do servidor
  simulado), `fixtures/` (dados semeados), `scenarios/` (cenários e condições de
  rede), `socket/` (transporte e emissão de eventos).

### Credenciais fictícias

| Usuário | E-mail | Senha | Dados privados |
| --- | --- | --- | --- |
| Ana Ribeiro | `ana@kurio.dev` | `kurio1234` | 2 favoritos, 2 carteiras, 1 pedido confirmado |
| Bruno Salles | `bruno@kurio.dev` | `kurio4321` | 1 favorito, 1 carteira |

Os dois existem para tornar o isolamento verificável: nada de um aparece na
sessão do outro. Cadastro pela interface também funciona.

### Sessão e rotas privadas

O painel de autenticação é **estado de URL**, então dá para abrir direto:

| URL | O que abre |
| --- | --- |
| `/?auth=entrar` | Painel na aba "Entrar". |
| `/?auth=criar-conta` | Painel na aba "Criar conta". |
| `/perfil` | Rota privada: sem sessão, redireciona para `/?auth=entrar&redirect=%2Fperfil` e volta para `/perfil` depois de autenticar. |
| `/favoritos` | Rota privada com os favoritos do colecionador (mesmo comportamento de guard). |
| `/carteiras` | Rota privada com as carteiras principal e secundária — as mesmas que o pagamento usa. |

### Estado do catálogo na URL

Busca, filtros, ordenação, aba e página são search params validados — as mesmas
chaves que a API recebe. Colar qualquer uma destas URLs reproduz o estado:

| URL | Estado |
| --- | --- |
| `/mercado?search=golden` | Busca por "golden". |
| `/mercado?networks=ethereum,polygon` | Duas redes combinadas (listas por vírgula). |
| `/mercado?collections=digital-art&rarities=legendary` | Coleção + raridade. |
| `/mercado?priceMin=0.5&priceMax=2` | Faixa de preço em ETH. |
| `/mercado?tab=trending&sort=price-asc&page=2` | Aba, ordenação e página. |
| `/nft/emerald-ape-042` | Detalhe por slug (o id também funciona). |
| `/nft/golden-signal-160` | Edição esgotada: compra bloqueada com o motivo. |
| `/nft/nao-existe` | Recurso inexistente, tratado (404 da aplicação). |

Mudar qualquer filtro reinicia a paginação; voltar e avançar no histórico
restaura exatamente o estado anterior.

Para reproduzir a expiração durante a navegação: entre com uma conta, chame
`fetch('/api/__mocks/session/expire', { method: 'POST' })` no console e navegue
para o perfil pelo menu da conta — a sessão cai, o painel abre avisando e o
destino é retomado depois do novo login.

### Cupons

| Código | Resultado |
| --- | --- |
| `KURIO10` | 10% de desconto (válido) |
| `GENESIS20` | expirado |
| `ARTE15` | válido só para a coleção Arte digital |
| `WHALE25` | exige subtotal mínimo de 5 ETH |
| qualquer outro | cupom não encontrado |

### Cenários

Selecione pela URL (`http://localhost:5173/?scenario=slow`), por
`VITE_MOCK_SCENARIO` no `.env.local`, ou pelos endpoints de controle.

Os endpoints de controle vivem **dentro do service worker do MSW**, então são
chamados a partir da própria página (console do navegador), não por `curl`:

```js
// cenário ativo e lista de cenários
await (await fetch('/api/__mocks/scenario')).json();

// trocar de cenário (ressemeia o estado)
await fetch('/api/__mocks/scenario', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ id: 'slow' }),
});

// trocar sem ressemear: mantém sessão e dados, muda só a condição de rede.
// É como reproduzir "falhou e depois se recuperou" sem recarregar a tela.
await fetch('/api/__mocks/scenario', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ id: 'default', reseed: false }),
});

// restaurar integralmente o cenário conhecido
await fetch('/api/__mocks/reset', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
```

| id | Como reproduzir a falha |
| --- | --- |
| `default` | Caminho sem falhas: catálogo cheio, latência curta, pagamento confirmado. |
| `empty` | Catálogo sem resultados. |
| `slow` | Latência 1200–2600 ms: skeletons e feedback de carregamento. |
| `out-of-order` | Latência sorteada (semente fixa): respostas fora de ordem. |
| `flaky` | As duas primeiras requisições falham com 503; a terceira passa. |
| `offline` | Falha de conexão, sem status. |
| `server-error` | 503 em toda requisição. |
| `session-expired` | O login já devolve sessão vencida (401 nos protegidos). |
| `signup-conflict` | Todo cadastro responde 409. |
| `favorite-error` | Ler favoritos funciona; incluir/remover responde 503 — mostra o update otimista e o rollback. |
| `price-changed` | O preço do primeiro item muda **uma vez**, logo depois da cotação: o pagamento bloqueia a confirmação e exige revisão dos novos valores. |
| `sold-out` | A edição do primeiro item esgota depois da cotação. |
| `order-timeout` | Pedido criado, resposta fora do prazo; reenviar recupera o **mesmo** pedido pela chave de idempotência. |
| `payment-declined` | Pedido pendente → recusado por `order.updated`: itens preservados, sem recibo. |
| `payment-manual` | Pedido fica pendente até o evento ser disparado pelo controle — usado para desconexão e retomada. |
| `wallet-refused` | Conectar a carteira é negado (como o usuário recusando na extensão): ela fica `refused` e o pedido com ela não passa. |

Estes disparam eventos de tempo real **no servidor simulado**, que os entrega
pelo `socket.io-client` (nenhum setter direto na interface):

```js
await fetch('/api/__mocks/events/nft', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ nftId: 'emerald-ape-042', price: '1.49', available: 9 }),
});

await fetch('/api/__mocks/events/order', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ orderId: 'order-1', status: 'confirmed' }),
});

// expira as sessões ativas sem esperar o TTL
await fetch('/api/__mocks/session/expire', { method: 'POST' });
```

O estado simulado é persistido no `localStorage` (`kurio:mock-state`) só para
sobreviver ao refresh; o reset restaura integralmente o cenário semeado.

### Reproduzindo os fluxos do pagamento

Todos partem de um carrinho com itens e da conta da Ana (ver credenciais acima).

| O que ver | Como chegar lá |
| --- | --- |
| Compra completa | Cenário `default`. Preencha o formulário e confirme: o pedido nasce **pendente** e o recibo só aparece quando `order.updated` chega da simulação (~1s). |
| Pagamento recusado | Cenário `payment-declined`. O pedido é recusado, os itens continuam no carrinho e nenhum recibo é emitido. |
| Clique repetido | Qualquer cenário. O botão trava no envio; mesmo forçando dois cliques, a chave de idempotência garante um pedido só (confira em `GET /api/orders`). |
| Timeout com recuperação | Cenário `order-timeout`. A tela admite a incerteza ("não sabemos se o pedido foi criado"); "Tentar novamente" reenvia a **mesma** chave e recupera o mesmo pedido. |
| Preço mudando no checkout | Cenário `payment-manual` + dispare `/__mocks/events/nft` com outro `price` (veja o trecho acima). A confirmação bloqueia, a tela mostra o que mudou e exige "Revisar e confirmar novos valores". |
| Pedido pendente retomado | Cenário `payment-manual`. Confirme, recarregue a página: o **mesmo** pedido continua sendo acompanhado, sem criar uma segunda compra. |
| Carteira recusada | Cenário `wallet-refused`. Escolha WalletConnect (a carteira "Reserva" nasce desconectada) e conecte: a recusa é mostrada e a compra continua travada. |

A etapa do pagamento em celulares vive na URL (`/pagamento?etapa=carteira` abre
direto a tela "Pagamento com carteira" do Figma).

### Reproduzindo os fluxos da conta

Todos exigem sessão — o guard leva ao painel e devolve ao destino depois de
entrar.

| O que ver | Como chegar lá |
| --- | --- |
| Edição do perfil | `/perfil`, cenário `default`. Altere os dados e salve; recarregue para ver que persistiu. |
| Conflito de e-mail | `/perfil` como Ana. Troque o e-mail para `bruno@kurio.dev`: a API responde `409` e a mensagem aparece **no campo**, sem gravar nada. |
| Avatar | "Alterar" abre o seletor de arquivo (PNG/JPEG/WebP até 2 MB); a prévia mostra o que está em voo. "Remover" deixa a conta sem avatar, e a inicial ocupa o lugar. |
| Senha atual incorreta | `/perfil`. Preencha as três senhas com uma senha atual errada: o `422` da API cai no campo "Senha atual". |
| Salvar só os dados | Deixe os três campos de senha em branco. O "Salvar" do frame é um só, mas a senha não é exigida para corrigir um nome. |
| Carteira secundária | `/carteiras` como **Bruno** (ele só tem a principal). "Adicionar" abre o formulário; "Igual à carteira principal" copia os dados e deixa o endereço em branco de propósito. |
| Endereço repetido | Em `/carteiras`, informe na secundária o mesmo endereço da principal: o `409` do servidor cai no campo "Endereço da carteira". |
| Consistência com o pagamento | Cadastre uma carteira MetaMask em `/carteiras` e abra `/pagamento`: ela já está lá, sem nenhuma sincronização entre as telas. |
| Isolamento entre contas | Edite o perfil como Ana, saia e entre como Bruno: nenhum dado da Ana aparece (cache privado e subscriptions são descartados no logout). |

Em celulares a barra lateral "Meu perfil" fica recolhida num `<details>` no topo
da tela — não há frame de 414 para estas telas, e o desvio está documentado no
`ARCHITECTURE.md` §5e.

### Auditoria de performance

`pnpm lighthouse` sobe o `preview`, roda 3 medições por página e perfil e
publica a mediana em `lighthouse-report/summary.json` (HTML e JSON por
execução ao lado). Medição desta fase:

| Página | Perfil | Perf | A11y | BP | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| Início | desktop | 99 | 100 | 100 | 92 |
| Início | mobile | 87 | 96 | 100 | 92 |
| Detalhe | desktop | 99 | 100 | 100 | 92 |
| Detalhe | mobile | 82 | 100 | 100 | 92 |

A performance móvel abaixo da meta e as correções aplicadas depois da primeira
medição estão analisadas no `ARCHITECTURE.md` §11.

### Contratos

Os contratos REST, os eventos, a política de sessão, o estado do carrinho e a
reconciliação REST ↔ Socket.IO estão documentados no `ARCHITECTURE.md`
(seções 3 a 8).

---

## Stack e versões instaladas

| Responsabilidade | Pacote | Versão |
| --- | --- | ---: |
| Build / bundler | `vite` | 8.2.2 |
| Plugin React | `@vitejs/plugin-react` | 6.1.1 |
| UI | `react` / `react-dom` | 19.3.0 |
| Linguagem | `typescript` | 7.0.2 |
| Roteamento | `@tanstack/react-router` | 1.170.33 |
| Geração de rotas | `@tanstack/router-plugin` | 1.168.36 |
| Estado remoto | `@tanstack/react-query` | 5.102.8 |
| HTTP | `axios` | 1.20.0 |
| Tempo real | `socket.io-client` | 4.8.3 |
| Estilo | `tailwindcss` / `@tailwindcss/vite` | 4.3.3 |
| Componentes | `shadcn` (CLI/registry) | 4.21.0 |
| Primitivos | `radix-ui` | 1.6.7 |
| Toasts | `sonner` | 2.0.8 |
| Ícones | `lucide-react` | 1.43.0 |
| Variantes de classe | `class-variance-authority` | 0.7.1 |
| Composição de classes | `cn` | 0.2.6 |
| Animações utilitárias | `tw-animate-css` | 1.4.0 |
| Decimal (ETH) | `decimal.js` | 10.6.0 |
| Mocks | `msw` | 2.15.0 |
| Testes de rede | `vitest` | 5.0.0 |
| Socket.IO nos mocks | `@mswjs/socket.io-binding` | 0.2.0 |
| Testes E2E e visual | `@playwright/test` | 1.63.0 |
| Auditoria | `lighthouse` | 13.4.1 |
| Launcher do Chrome | `chrome-launcher` | 1.2.1 |
| Lint | `oxlint` | 1.82.0 |

**Sobre o lint:** o `typescript-eslint` ainda não suporta o TypeScript 7 (a
release atual e o `tsc` usado no projeto), e não existe TypeScript 6 estável para
usar lado a lado. Para manter o compilador na última versão estável **e** ter um
`pnpm lint` funcional, o linter é o `oxlint`, que analisa TS/JSX sem depender da
API do compilador. A justificativa completa está no `ARCHITECTURE.md`.

---

## Deploy (Vercel)

`vercel.json` configura o projeto como SPA:

- `rewrites` manda qualquer rota para `/index.html` — acesso direto e refresh
  funcionam em qualquer URL (a Vercel serve arquivos estáticos antes de aplicar
  o rewrite, então os assets não são afetados);
- `installCommand` usa `--frozen-lockfile`;
- fontes com `Cache-Control: immutable` e `mockServiceWorker.js` sem cache.

---

## Documentação complementar

`ARCHITECTURE.md` registra as decisões técnicas, os contratos REST e de eventos,
a política de cache e sessão, e as limitações conhecidas do ambiente de mocks.
