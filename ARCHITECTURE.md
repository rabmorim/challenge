# ARCHITECTURE — KURIO

Decisões técnicas, contratos e limitações conhecidas. Documento vivo: cresce a
cada fase. O que está aqui hoje cobre a **Fase 0 (fundação)**, a **Fase 1
(camada de rede, mocks e tempo real)** e a **Fase 2 (autenticação, sessão e
proteção de rotas)**. As demais telas entram nas fases seguintes.

---

## 1. Organização

```
src/
  app/        bootstrap, providers, router, tema (globals.css)
  routes/     árvore de rotas do TanStack Router (file-based; _private = guard)
  features/   uma pasta por domínio: components/ hooks/ api/ lib/ types/ constants/
  components/ compartilhados entre features (ui/ = primitivos shadcn)
  hooks/      hooks compartilhados entre features (voltar pelo histórico, faixa de viewport)
  lib/        axios, queryClient, query keys, decimal (ETH), identidade da requisição
  types/      tipos globais
  constants/  constantes globais
  mocks/      servidor simulado (ver abaixo)
  test/       setup, utilitários e verificação da camada de rede (vitest)
e2e/          specs do Playwright (support/ = helpers; visual/ = regressão visual)
```

`src/components/` e `src/hooks/` existem pela mesma razão: o que **duas features
usam** não pertence a nenhuma delas. Um `import` de `features/cart` para dentro de
`features/nft-detail` amarraria as duas por um detalhe de implementação da
segunda. Foi o que motivou mover o card e as bolinhas dos carrosséis
(`NftPreviewCard`, `CarouselDots`), o retorno pelo histórico
(`useBackNavigation`) e a leitura da faixa de viewport (`useCompactLayout`) para
fora de `nft-detail` quando o carrinho passou a desenhar as mesmas peças.

`features/<x>/lib/` guarda **funções puras** da feature — validação de
formulário, guard de rota, ciclo de vida da sessão. Não é uma terceira gaveta
para sobras: é o lugar do que não é transporte (`api/`), não é React (`hooks/`) e
não é interface (`components/`), e que precisa ser testável isoladamente.

A camada de mocks tem estrutura própria, porque é um servidor simulado inteiro:

```
src/mocks/
  handlers/    endpoints REST por recurso + controle da simulação
  db/          store, sessão, catálogo, carrinho, cotação, pedidos, NFTs
  fixtures/    dados semeados (usuários, catálogo, cupons, pedido inicial)
  scenarios/   registro de cenários, cenário ativo, condições de rede, reset
  socket/      handler do transporte, emissor de eventos, agenda de pagamento
  lib/         hash estável, geradores de id, construtores de resposta de erro
  types/       tipos internos do servidor simulado
  browser.ts   worker (dev, demonstração, Playwright)
  node.ts      servidor (vitest)
```

Regras que valem em todo o código:

- nomes em inglês, comentários e JSDoc em português;
- `types`/`props` nunca inline no arquivo do componente — sempre na pasta `types`;
- constantes nunca soltas no meio do código — sempre na pasta `constants`;
- lógica em hooks, JSX só compõe.

---

## 2. Integração e estado

**Axios** (`src/lib/http.ts`) — instância única. O interceptor de **requisição**
anexa a identidade do chamador (`Authorization` e `x-guest-id`, ver seção 4); o de
**resposta** normaliza qualquer falha para `NormalizedHttpError` (`code`,
`message`, `status`, `reason`, `fieldErrors`, `conflicts`), incluindo os casos sem
resposta: `NETWORK_ERROR` e `TIMEOUT`. A interface nunca vê um `AxiosError` cru.

**Api client** — uma função por operação, em `features/<x>/api/`, tipada nos
contratos da seção 3. É a única porta de entrada da rede: os hooks do TanStack
Query (fases seguintes) consomem essas funções, e nenhuma delas contém dado
fictício ou caminho de negócio alternativo.

**TanStack Query** (`src/lib/query-client.ts`) — `createQueryClient()` é uma
fábrica, não um singleton, para que cada teste monte um cache isolado.

| Política | Valor | Motivo |
| --- | --- | --- |
| `staleTime` | 30 s | O catálogo recebe atualizações por Socket.IO; não faz sentido refetch agressivo. |
| `gcTime` | 5 min | Voltar pelo histórico não dispara refetch visível. |
| `retry` (queries) | até 2, só em `TRANSIENT_FAILURE`, `NETWORK_ERROR` e `TIMEOUT` | Erro de contrato (4xx) não melhora com repetição. |
| `retry` (mutations) | 0 | Repetição de mutation é decisão de negócio (idempotência), não do cache. |
| `refetchOnWindowFocus` | `false` | Evita ruído; a sincronização vem do socket. |
| `refetchOnReconnect` | `true` | Base da reconciliação REST após reconexão. |

**Query keys** (`src/lib/query-keys.ts`) — toda chave nasce em uma fábrica única,
com a raiz `kurio` seguida de um dos três escopos:

| Escopo | Forma | Quem vive aqui |
| --- | --- | --- |
| sessão | `['kurio','session']` | o estado de autenticação |
| público | `['kurio','public', …]` | catálogo, detalhe, sonda de saúde |
| privado | `['kurio','user', <userId>, …]` | favoritos, perfil, carteiras, pedidos |

A separação não é organizacional, é funcional. "Limpar dados privados" vira uma
operação exata (remover o ramo `user`) que **não** derruba o catálogo, que não
pertence a ninguém; e o `userId` dentro da chave garante que a query do usuário B
nunca case com o cache do usuário A, mesmo antes de qualquer limpeza. A sessão
fica fora dos outros dois escopos porque é ela quem os define — não pode viver
dentro do escopo que produz.

**Router** (`src/app/router.tsx`) — `createAppRouter(queryClient)` recebe o cache
por parâmetro; o mesmo `QueryClient` alimenta os providers e o contexto das
rotas, para que loaders e componentes compartilhem invalidação.

**Valores em ETH** (`src/lib/eth.ts`) — sempre string decimal, nunca `number`.
`decimal.js` com precisão de trabalho 30 e apresentação em 2 casas
(`ROUND_HALF_UP`). Quantidades são inteiras e `multiplyEth` rejeita qualquer
outra coisa.

---

## 3. Contratos REST

Caminhos em `src/constants/api.ts` (`API_PATHS` para o cliente, `API_PATTERNS`
para os handlers do MSW). Os tipos de cada recurso vivem na feature
correspondente (`src/features/<x>/types`); os envelopes compartilhados estão em
`src/types/api.ts`.

| Método | Caminho | Contrato | Sessão |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `SignUpRequest` → `SessionResponse` | — |
| POST | `/auth/login` | `LoginRequest` → `SessionResponse` | — |
| GET | `/auth/session` | → `SessionResponse` | obrigatória |
| POST | `/auth/logout` | → `LogoutResponse` | opcional (idempotente) |
| GET | `/nfts` | `NftListParams` → `NftListResponse` | — |
| GET | `/nfts/:nftId` | → `NftDetail` (aceita id **ou** slug) | — |
| GET | `/favorites` | → `FavoritesResponse` | obrigatória |
| POST | `/favorites` | `AddFavoriteRequest` → `FavoriteMutationResponse` | obrigatória |
| DELETE | `/favorites/:nftId` | → `FavoriteMutationResponse` | obrigatória |
| GET | `/cart` | → `Cart` | visitante ou usuário |
| POST | `/cart/items` | `AddCartItemRequest` → `Cart` | visitante ou usuário |
| PATCH | `/cart/items/:itemId` | `UpdateCartItemRequest` → `Cart` | visitante ou usuário |
| DELETE | `/cart/items/:itemId` | → `Cart` | visitante ou usuário |
| POST | `/quotes` | `QuoteRequest` → `Quote` | visitante ou usuário |
| POST | `/orders` | `CreateOrderRequest` → `Order` (+ `x-idempotency-key`) | obrigatória |
| GET | `/orders` | → `OrdersListResponse` | obrigatória |
| GET | `/orders/:orderId` | → `Order` | obrigatória |
| GET | `/orders/:orderId/receipt` | → `OrderReceipt` | obrigatória |
| GET | `/profile` | → `CollectorProfile` | obrigatória |
| PATCH | `/profile` | `UpdateProfileRequest` → `CollectorProfile` | obrigatória |
| PUT | `/profile/avatar` | `UpdateAvatarRequest` → `CollectorProfile` | obrigatória |
| DELETE | `/profile/avatar` | → `CollectorProfile` (remove o avatar) | obrigatória |
| PUT | `/profile/password` | `ChangePasswordRequest` → `ChangePasswordResponse` | obrigatória |
| GET | `/wallets` | → `WalletsResponse` | obrigatória |
| POST | `/wallets` | `CreateWalletRequest` → `Wallet` | obrigatória |
| PATCH | `/wallets/:walletId` | `UpdateWalletRequest` → `Wallet` | obrigatória |

**Envelope de erro.** Toda falha responde `ApiErrorPayload`:

```ts
{ code, message, reason?, fieldErrors?, conflicts? }
```

- `code` é a **classe** do erro e decide o tratamento: `VALIDATION_ERROR` (422),
  `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409),
  `RATE_LIMITED` (429) e `TRANSIENT_FAILURE` (503), mais `NETWORK_ERROR`,
  `TIMEOUT` e `UNKNOWN`, que nascem no cliente (não têm resposta HTTP).
- `reason` é o **subtipo** estável, porque `CONFLICT` sozinho não diz nada à
  interface: `EMAIL_ALREADY_REGISTERED`, `INVALID_CREDENTIALS`, `SESSION_EXPIRED`,
  `COUPON_NOT_FOUND` / `COUPON_EXPIRED` / `COUPON_NOT_APPLICABLE`,
  `PRICE_CHANGED`, `EDITION_SOLD_OUT`, `QUANTITY_ABOVE_LIMIT`,
  `QUOTE_STALE` / `QUOTE_EXPIRED`, `IDEMPOTENCY_KEY_REUSED`,
  `ORDER_ALREADY_FINALIZED`, `PAYMENT_DECLINED`, `WALLET_UNAVAILABLE`,
  `WALLET_ADDRESS_ALREADY_REGISTERED`.
- `conflicts` acompanha os conflitos de compra dizendo o que mudou por item
  (`quotedPrice`, `currentPrice`, `availableQuantity`, `version`) — é o que
  permite a tela mostrar exatamente a diferença e pedir nova confirmação.
- O interceptor do Axios repassa `reason` e `conflicts` intactos para
  `NormalizedHttpError`; a interface nunca vê um `AxiosError` cru.

**Valores em ETH.** Sempre string decimal. O servidor simulado calcula e
arredonda (`quantizeEth`: 6 casas, sem zeros à direita, para que a comparação
entre carrinho, cotação e pedido seja textual e exata) — o cliente só exibe.
Quantidades são inteiras e qualquer outra coisa é rejeitada.

---

## 4. Sessão e identidade do chamador

**Token no cabeçalho, não em cookie.** O login devolve `session.token` e o
interceptor de requisição do Axios o envia em `Authorization: Bearer <token>`.
A escolha é deliberada: o MSW também roda em Node (vitest), onde não existe jar
de cookies — com token no cabeçalho, navegador e testes se comportam igual.

`src/lib/request-identity.ts` guarda o token (e a identidade de visitante) no
`localStorage`, com espelho em memória para quando o storage não existe ou está
bloqueado. É o **único** dado de sessão no cliente: senha nunca sai do servidor
simulado, e o estado persistido guarda apenas um hash
(`src/mocks/db/password.ts` — não é criptografia, existe só para o estado salvo
no navegador não conter senha em claro).

**Visitante.** Sem sessão, o cliente envia `x-guest-id` (UUID persistido). O
servidor simulado usa esse valor como dono (`guest:<id>`) do carrinho e das
cotações, o que isola visitantes entre si e permite transferir o carrinho para a
conta no login/cadastro (`mergeCarts`, somando quantidades do mesmo NFT). Depois
da transferência o `x-guest-id` local é descartado.

**Ciclo de vida.** TTL de 30 min (`SESSION_TTL_MS`). O logout **revoga** a sessão
no servidor (não apenas apaga o token local) e o token sai do cliente mesmo se a
chamada falhar. A resposta distingue três situações, porque exigem tratamentos
diferentes na interface: sem sessão (`UNAUTHENTICATED` sem `reason`), token
inválido ou revogado (idem) e sessão vencida (`reason: SESSION_EXPIRED`).
Recursos privados (favoritos, perfil, carteiras, pedidos) exigem sessão;
carrinho e cotação aceitam visitante.

---

### Sessão no cliente (Fase 2)

**Não autenticado é estado, não erro.** `useSession` lê uma query única
(`src/features/auth/api/session-query.ts`) que devolve um dos três estados:

```ts
type SessionState =
  | { status: 'anonymous' }
  | { status: 'expired' }
  | { status: 'authenticated'; session; user }
```

O `UNAUTHENTICATED` da API vira estado dentro da `queryFn`; `isError` fica
reservado a falha real (rede, 5xx). Sem isso, todo visitante entraria em retry e
em error boundary por estar apenas... deslogado. Sem token local a query nem
chega a fazer requisição — seria um 401 garantido a cada carregamento anônimo.

**A sessão resolve antes de qualquer tela.** O `beforeLoad` da rota raiz chama
`ensureSession` e injeta o resultado no contexto das rotas filhas. É o que torna
a sessão recuperável após refresh e o que permite ao guard decidir sem hook,
inclusive no acesso direto a uma URL privada. `staleTime: 0` +
`revalidateIfStale` é deliberado e contraria o padrão do projeto: a navegação
responde na hora (cache) e revalida em segundo plano, porque uma sessão pode ser
revogada ou vencer no servidor sem o cliente saber.

**Painel de autenticação é estado de URL.** `?auth=entrar|criar-conta` abre o
painel sobre qualquer tela (como no Figma, em que o modal aparece sobre a
Início), sobrevive ao refresh e ao histórico, e serve de destino para o
redirecionamento do guard. O parâmetro é validado na rota raiz
(`validateAuthSearch`): valor desconhecido some em vez de quebrar a rota.

**Guard das rotas privadas.** `src/routes/_private.tsx` é uma rota sem caminho
próprio; as filhas mantêm a URL do design e herdam a verificação. Como ela roda
em `beforeLoad`, a tela protegida nunca chega a renderizar sem sessão:

```
/perfil sem sessão → redirect para /?auth=entrar&redirect=/perfil
                   → autenticação bem-sucedida → volta para /perfil
```

O `redirect` passa por `toSafeRedirect`: só caminho interno é aceito. Aceitar URL
absoluta transformaria o parâmetro em redirecionamento aberto — o painel levaria
o visitante para fora do app logo depois de ele digitar a senha.

**Expiração durante a navegação.** O interceptor de resposta do Axios apenas
*avisa* (`src/lib/session-expiry.ts`, um pub/sub sem React e sem router — a
camada de transporte não pode importar cache nem navegação sem inverter as
dependências). Quem reage é `useSessionExpiryWatcher`, montado uma vez na raiz:

```
401 (reason ≠ INVALID_CREDENTIALS, e havia token)
  → descarta o token local  → notifySessionExpired()
  → limpa cache privado + derruba o socket da sessão anterior
  → publica { status: 'expired' }  → toast + aviso dentro do painel
  → router.invalidate()  → o guard da rota atual dispara de novo e redireciona
                            guardando o destino
```

Reaproveitar o guard em vez de redirecionar na mão é o ponto: a retomada do
fluxo funciona igual para qualquer tela privada (checkout incluído, na fase
dele), sem caso especial. Credencial errada no login também responde 401 e **não**
entra nesse caminho — quem nunca teve sessão não tem sessão a perder.

**Troca de identidade (login, cadastro, logout).** Os três caminhos passam por
`switchSessionIdentity`, para que nenhum esqueça metade da limpeza:

1. cancela requisições de sessão em voo (resposta antiga não sobrescreve a nova);
2. `removeQueries` no ramo privado — `invalidate` manteria os dados do usuário
   anterior renderizáveis enquanto o refetch acontece;
3. `resetSocketSession(userId)` descarta a conexão de tempo real **com todos os
   seus listeners** e a próxima se anuncia (`session.identify`) como o novo dono.

A query de sessão é a exceção: ela **não** é removida. Tem observadores
permanentes (o header), e remover uma query com observador montado os deixa
presos a um objeto que saiu do cache — eles simplesmente param de receber
atualização. O estado novo é publicado com `setQueryData` e confirmado por um
refetch.

**Socket e troca de usuário.** Como a conexão inteira é descartada na troca, quem
registrou listeners precisa religá-los: `subscribeToSocketInstance` avisa a
substituição e o store de status reconecta seus handlers. Sem isso, um listener
da sessão anterior continuaria vivo em um socket morto — e o requisito é
justamente o contrário: nada da sessão anterior sobrevive à troca.

**Logout.** A limpeza fica em `onSettled`: token, cache privado e socket saem
mesmo se a chamada falhar. Sessão local não pode sobreviver a uma tentativa de
sair.

---

## 5. Carrinho, cotação e pedido

**O carrinho guarda apenas `nftId` e quantidade.** Preço, disponibilidade e
limite por pedido são lidos do catálogo em cada resposta. Consequência desejada:
mudança de preço aparece no carrinho sem nenhuma sincronização extra, e o
carrinho nunca "congela" um preço que a cotação vai desmentir. Cada linha carrega
`nftVersion`, e o carrinho tem `version` própria que sobe a cada alteração — é o
que permite descartar resposta fora de ordem.

**A cotação é a referência dos valores.** `POST /quotes` calcula subtotal,
desconto, taxa de rede e total. A taxa é parte fixa da rede mais parte por
unidade (`NETWORK_FEES`); o desconto vem do cupom e, em cupom restrito a
coleções, incide apenas sobre as linhas elegíveis. A resposta traz
`pricingSignature` — impressão digital de itens, versões, preços, cupom e rede —
e vale 10 min (`QUOTE_TTL_MS`).

**O pedido revalida antes de aceitar.** `POST /orders` recebe `quoteId` +
`pricingSignature` e compara com o catálogo atual: preço diferente →
`PRICE_CHANGED`; estoque insuficiente → `EDITION_SOLD_OUT`; assinatura, itens,
cupom ou rede divergentes → `QUOTE_STALE`; cotação vencida → `QUOTE_EXPIRED`.
Mudança só de disponibilidade (mesmo preço, estoque suficiente) **não** bloqueia:
a versão do recurso sobe em qualquer alteração, e recusar por isso seria falso
positivo.

**Idempotência.** A chave vai em `x-idempotency-key` e é guardada com a impressão
digital do corpo e o dono. Mesma chave + mesmo corpo devolve o mesmo pedido
(`200`, sem criar outro); mesma chave + corpo diferente responde `409`
`IDEMPOTENCY_KEY_REUSED`. É o que protege contra clique repetido e contra reenvio
depois de timeout.

**Ciclo do pedido.** Nasce `pending` e as unidades da edição são **reservadas na
criação** — assim duas compras do mesmo último item esgotam de verdade. A
resolução vem da simulação (temporizador + `order.updated`), nunca de otimismo do
cliente: `confirmed` gera hash e link simulados e remove do carrinho apenas os
itens e quantidades comprados; `declined` devolve as unidades à edição e preserva
o carrinho. Os dois são terminais — reaplicar a transição é no-op. O recibo é
criado no estado terminal como **snapshot imutável**: mudança posterior no
catálogo não altera nada nele, e pedido pendente não tem recibo (`404`).

---

## 5b. Catálogo e detalhe (Fase 3)

**O estado da consulta é a URL.** Busca, filtros, ordenação, aba e página vivem
em search params validados (`features/catalog/lib/catalog-search.ts`), e as
chaves são **as mesmas de `NftListParams`**. Isso não é estética: faz "a consulta
reflete os parâmetros enviados à API" deixar de ser convenção e virar
identidade — o objeto da URL é o corpo da requisição, sem tradução no meio.

```
/mercado?search=golden&networks=ethereum,polygon&rarities=rare&sort=price-asc&page=2
```

| Regra | Onde vive | Por quê |
| --- | --- | --- |
| Valor desconhecido some | `validateCatalogSearch` | URL colada errada não pode derrubar a rota (mesma política do `?auth=`). |
| Listas ordenadas e sem repetição | `readFilterList` | Duas URLs com os mesmos filtros em ordens diferentes precisam produzir **a mesma** query key, senão o cache se divide sem motivo. |
| Padrão não entra na URL | `normalizeCatalogSearch` | `/` e `/?tab=all&sort=recent&page=1` seriam dois estados com o mesmo resultado: duas entradas de cache e um histórico cheio de passos inúteis. |
| Faixa invertida é descartada | `normalizeCatalogSearch` | `priceMin > priceMax` não filtra nada e deixaria o slider incoerente. |
| **Mudança de filtro reinicia a página** | `applyCatalogPatch` | O item da página 3 de um filtro não existe no filtro seguinte. A regra é uma função pura por onde **todo** setter passa (`useCatalogSearch`), então nenhum controle consegue esquecê-la. |

`stringifySearch` próprio (`src/lib/search-serialization.ts`): o padrão do
TanStack Router serializa listas em JSON (`?networks=%5B%22ethereum%22%5D`).
Como a URL do catálogo é estado compartilhável e é o corpo da consulta, ela usa
texto puro com listas separadas por vírgula. A leitura não adivinha tipo — quem
converte é o validador de cada rota, que já precisa tratar entrada não confiável.

**Query keys e respostas obsoletas.** A chave da listagem carrega os parâmetros
inteiros:

```ts
queryKeys.public('nfts', 'list', toListParams(search))
queryKeys.public('nfts', 'detail', slugOuId)
queryKeys.private(userId, 'favorites')
queryKeys.private(userId ?? 'guest', 'cart')
```

Disso decorre o descarte de resposta obsoleta **por construção**: parâmetros
diferentes são entradas de cache diferentes, então uma resposta atrasada só tem
onde aterrissar na chave que a pediu — ela nunca sobrescreve o resultado do
filtro atual. Não há comparação de carimbo de tempo na interface. Além disso, o
`signal` do TanStack Query chega ao Axios (`listNfts(params, signal)`), então a
troca de filtro **aborta** a requisição anterior em vez de apenas ignorá-la. O
cenário `out-of-order` (latência sorteada com semente fixa) existe para
exercitar exatamente isso.

O carrinho é o único recurso que não é do usuário nem público: ele existe para
visitante e para conta. A chave fica no ramo privado com o dono (`guest` quando
não há sessão) porque a troca de identidade descarta esse ramo inteiro — sem
isso, o carrinho do usuário anterior sobreviveria ao logout.

**Os cinco estados, explícitos.** `useNftList` nomeia o que a tela precisa
tratar (`isPending`, `isEmpty`, `isError`, `isRefreshing`, `isStale`) em vez de
deixar cada componente combinar flags na mão:

| Estado | Interface |
| --- | --- |
| Primeiro carregamento | Esqueleto com shimmer nas dimensões finais do card (sem CLS). |
| Atualização em segundo plano | `keepPreviousData`: a grade anterior fica na tela, com `aria-busy` e contraste reduzido, e a região viva anuncia "Atualizando resultados...". |
| Vazio | Estado próprio, com saída (limpar filtros) — vazio não é erro. |
| Erro | Mensagem do erro normalizado + "Tentar novamente" (`refetch`). |
| Sucesso | Grade + paginação, com o resumo do resultado na região viva. |

O esqueleto é reservado ao primeiro carregamento de propósito: com dados já na
tela, trocá-los por blocos cinzas a cada filtro seria uma piscada, não um
progresso.

**Detalhe.** `useNftDetail` separa "não existe" de "falhou": `NOT_FOUND` é
resposta definitiva e leva à tela de recurso inexistente (sem botão de repetir,
que nunca daria certo); falha de rede ou 5xx leva ao erro recuperável. O
`loader` da rota apenas **aquece** o cache (`prefetchQuery`, que não lança e não
bloqueia): a navegação é imediata, o esqueleto aparece na hora e, quando a rota
é pré-carregada por intenção (foco/ponteiro), os dados já chegaram antes do
clique.

**Edição e quantidade.** Os chips `1/n` são as edições reais da coleção (uma por
tiragem, vindas da mesma consulta que alimenta "Mais desta coleção"); escolher
um navega para aquele item, e uma tiragem sem unidades aparece desabilitada e
marcada como esgotada. O teto do seletor de quantidade é
`min(maxPerOrder, available)` e é aplicado **durante a renderização**: quando um
`nft.updated` derruba a disponibilidade com a tela aberta, o valor já sai
corrigido no mesmo quadro.

**Favoritos — a interação otimista obrigatória.** `useFavorites` implementa o
ciclo completo:

```
onMutate  → cancela consultas em voo, guarda o instantâneo, aplica o novo estado
onError   → devolve o instantâneo inteiro + toast + região viva
onSettled → invalida a chave, para o servidor ter a última palavra
```

O rollback é do **cache**, não de um booleano local, porque o mesmo NFT aparece
em vários lugares (grade, destaque, detalhe, "mais desta coleção") e todos
precisam voltar juntos. Visitante não tem favorito para alternar: a tentativa
abre o painel de autenticação em vez de fingir sucesso. O cenário
`favorite-error` recusa só as mutations — a leitura continua de pé, que é o que
permite ver o otimismo ser aplicado e desfeito.

**Tempo real no catálogo.** `useNftRealtime` assina `nft.updated` pelo
`socket.io-client` e aplica a mudança a todas as páginas em cache e ao detalhe,
**somente** quando a `version` do evento é maior que a do recurso em cache —
duplicata e evento antigo caem fora sem reaplicar efeito. `useSocketEvent` cuida
das duas coisas que o `socket.on` cru não faz: remove o listener no desmonte e
o religa quando a troca de usuário descarta a conexão inteira.

---

## 5c. Carrinho (Fase 4)

**Um item é `{ nftId, edition, quantity }`.** O servidor **persiste** apenas
`nftId` + `quantity` (`CartItemRecord`); `edition` (tiragem, disponíveis, limite
por pedido), preço e dados de exibição são lidos do catálogo **a cada resposta**
(`serializeCart`). Consequência desejada: mudança de preço aparece no carrinho
sem sincronização extra, e a linha nunca "congela" um preço que a cotação vai
desmentir. Não existe um eixo de edição *dentro* de um NFT neste catálogo — cada
NFT **é** uma tiragem, e os chips `1/n` do detalhe navegam entre itens irmãos —,
então o que é persistido e o que é publicado dizem a mesma coisa sem redundância.

`edition` é um objeto, e não três campos soltos, porque os três têm um só dono e
duas leituras dependem disso: `edition.total` escreve "Edição: 1/50" no frame de
414, e `min(maxPerOrder, available)` é o teto da linha — que vive em um lugar só
(`lib/cart-quantity.ts`) e vale para o stepper, para a digitação no campo e para
a apara vinda do tempo real.

**O resumo é uma query, não uma mutation.** `POST /quotes` é o transporte, mas o
resumo é uma **leitura derivada** do carrinho, e modelá-lo como query entrega
três coisas por construção:

```ts
queryKeys.private(owner, 'cart', 'quote', {
  couponCode,
  items: [{ nftId, quantity, nftVersion }],   // assinatura, ordenada por nftId
})
```

| Ganho | Como |
| --- | --- |
| Descarte do obsoleto | Assinaturas diferentes são entradas de cache diferentes: uma cotação atrasada só tem onde aterrissar na chave que a pediu, nunca por cima do resumo atual. Latest-wins sem comparar carimbo de tempo. |
| Cancelamento real | O `signal` do TanStack Query chega ao Axios e **aborta** a cotação anterior, em vez de apenas ignorá-la. |
| Recotagem sem piscar | `keepPreviousData` mantém o resumo anterior na tela enquanto o novo chega, marcado com `aria-busy` e contraste reduzido. Esqueleto só no primeiro carregamento — trocar números por blocos cinzas a cada clique no "+" seria uma piscada, não um progresso, e deslocaria a coluna inteira. |

`staleTime: 0` contraria o padrão do projeto de propósito: uma cotação é um
instantâneo de preço **com validade**, então reaproveitá-la como "fresca" seria
exibir um total que o servidor talvez já não honre. A `network` fica fora do
corpo — quem a escolhe é o pagamento —, e é por isso que o frame escreve "Taxa
estimada" sob a taxa de rede.

**O cliente não soma nada.** Subtotal, desconto, taxa e total saem da cotação
como strings decimais e são exibidos por `formatEthPrecise`, que preserva a
precisão que a API enviou (`0.016 ETH`, `26.846 ETH`) — `formatEth`, de duas
casas, arredondaria a taxa para zero e mudaria o total. O que as funções puras de
`features/cart/lib/cart-cache.ts` recalculam é só o **espelho local** do recurso
`Cart` (`lineTotal`, `itemCount`, `subtotal`), com a mesma lib decimal e a mesma
fórmula do servidor, para a linha reagir no mesmo quadro; esse `subtotal` não é
renderizado em lugar nenhum, e a resposta REST seguinte o sobrescreve.

**Otimismo onde o resultado é previsível.** Quantidade e remoção aplicam o novo
estado antes da resposta e devolvem o **instantâneo inteiro** do carrinho no
`onError` — não um campo, porque a mesma linha alimenta a tabela, o resumo e o
selo do header, e os três precisam voltar juntos. Inclusão **não** é otimista por
outro motivo: o servidor é quem atribui o id da linha e o preço corrente, e
antecipar uma linha inventada seria fabricar dado que só a API tem.

**A quantidade é aparada antes de virar requisição.** Pedir mais do que a edição
comporta não vira erro do servidor: o valor é preso em
`min(maxPerOrder, available)` e a região viva diz o motivo. O servidor continua
sendo quem decide — a corrida ainda é possível, e aí o conflito vira rollback com
mensagem.

### Fusão do carrinho de visitante ao autenticar

Acontece no servidor (`mergeCarts`), em qualquer login ou cadastro que chegue com
`x-guest-id` — não só a partir do carrinho. Por linha:

1. **soma** a quantidade do visitante à que a conta já tinha do mesmo NFT;
2. **apara** o resultado no teto real da edição naquele momento
   (`min(maxPerOrder, available)`) — entrar na conta não pode criar uma linha que
   o próprio `PATCH /cart/items/:id` recusaria no clique seguinte;
3. **descarta** a linha cujo NFT saiu do catálogo ou cuja edição esgotou (teto
   abaixo de uma unidade), porque não há quantidade válida a transferir.

O carrinho de origem é descartado ao fim, o que torna a operação idempotente: um
segundo login não tem mais o que mesclar nem duplica linhas. No cliente nada
precisa ser feito — a troca de identidade descarta o ramo privado do cache e a
chave do carrinho passa de `guest` para o id do usuário, então a primeira leitura
já vem mesclada.

### `nft.updated` com o carrinho aberto

É o cenário do enunciado §7, passos 1 a 3. `useCartRealtime` guarda a **última
versão vista por NFT**, carimbada com o dono a quem ela pertence:

```
evento chega
 ├─ version <= última vista               → ignora   (duplicata / reentrega)
 ├─ NFT não está neste carrinho           → ignora   (é assunto do catálogo)
 ├─ version <= nftVersion da linha        → ignora   (evento antigo)
 └─ aplica: patch da linha + invalidate do REST + aviso na região viva
```

A dupla guarda (mapa e cache) existe porque as duas podem divergir: o mapa cobre
reentregas entre renders, o cache cobre o estado que o REST já trouxe mais novo.
O dono viaja junto com o mapa, em vez de um efeito de limpeza, para que a troca
de conta o zere no mesmo instante em que o primeiro evento chega — versões do
usuário anterior não dizem nada sobre o carrinho do seguinte.

**A recotagem não tem chamada explícita.** `nftVersion` faz parte da assinatura
que identifica a cotação, então aplicar o evento à linha muda a query key do
resumo e o valor novo é buscado por construção. O REST confirma logo em seguida:
o socket notifica, a API tem a última palavra.

Disponibilidade abaixo da quantidade é **aparada por mutation**, e não por
escrita no cache — é a mesma ação que o "−" usa, para o servidor ter a palavra
final em qualquer caminho. Essa apara sai calada
(`setQuantity(..., { silent: true })`) e quem anuncia é o tempo real, porque só
ele sabe o **motivo**: o genérico "quantidade alterada para 1" apagaria "restam 1
unidade nesta edição". Edição esgotada não apara para zero — o item continua na
tela, avisado, e a saída fica com o usuário (o enunciado §3 exige preservar itens
em falhas).

Bloqueio do checkout com cotação vencida e reconciliação pós-reconexão ficam para
as fases do pagamento; aqui o requisito é refletir e informar com o carrinho
aberto.

### Cupom

**O cupom é uma mutation; o resumo continua sendo a query.** São papéis
diferentes: "tentar este código" é uma ação com sucesso ou recusa, e uma recusa
**não pode apagar um resumo que já estava correto**. Por isso o código só entra
na chave da query depois que o servidor o aceita — a resposta da mutation é
semeada na chave nova (`setQueryData`), o que troca o resumo sem uma segunda ida
à rede. A forma canônica vem do servidor (`quote.coupon.code`), para `kurio10` e
`KURIO10` não virarem duas entradas de cache.

Código recusado (`COUPON_NOT_FOUND`, `COUPON_EXPIRED`, `COUPON_NOT_APPLICABLE`)
vira mensagem **associada ao campo** (`aria-describedby` + `aria-invalid`), não um
toast solto: quem usa leitor de tela precisa encontrar o erro a partir do campo
que o causou. Um cupom aceito também pode deixar de valer quando o carrinho muda
(subtotal abaixo do mínimo, última linha da coleção removida) — aí a recusa chega
pela query, e não pela mutation, mas é exibida no mesmo lugar. O botão trava
enquanto o envio está em voo, o que resolve o duplo submit sem depender de o
usuário não clicar duas vezes.

### Gate de sessão do "Conectar e finalizar"

Não há `if (!isAuthenticated)` na tela do carrinho. `/pagamento` é **rota
privada**, então o CTA apenas navega e o guard da Fase 2 faz o resto:

```
visitante clica → /?auth=entrar&redirect=/pagamento → entra → volta a /pagamento
                                                    ↳ o servidor já mesclou o carrinho
```

Escrever o gate na tela seria uma segunda implementação da mesma regra, livre
para divergir da que protege a rota.

### Adicionar ao carrinho: dois botões, duas regras

| Onde | Exige sessão? | Por quê |
| --- | --- | --- |
| "COMPRAR NFT" (detalhe) | **sim** | É intenção de compra e leva ao pagamento, que exige sessão. Deslogado abre o painel de autenticação em vez de fingir (enunciado §3). |
| Ícone de carrinho (card do catálogo) | não | O carrinho aceita visitante **por contrato** — é para isso que existe o `x-guest-id`. Sem um caminho de inclusão anônimo, o carrinho de visitante nunca teria itens e "preservar os itens do visitante ao autenticar" (README §3) não existiria na prática. |

A regra é um parâmetro de `useAddToCart({ requireSession })`, não dois caminhos
copiados. Incluir no carrinho **não é** comprar: a compra só pode ser confirmada
pela resposta da simulação, na etapa do pagamento.

### Os estados da tela

| Estado | Interface |
| --- | --- |
| Primeiro carregamento | Cabeçalho da tabela já montado e esqueleto com shimmer **dentro do `tbody`** (cards no frame de 414), nas dimensões finais — as larguras de coluna existem desde o primeiro quadro, então nada desloca quando os dados chegam. O resumo tem esqueleto próprio, que é o componente citado no enunciado §8. |
| Recotando | Valores anteriores na tela, com `aria-busy` e contraste reduzido. Sem esqueleto, sem layout shift. |
| Vazio | Estado próprio com saída ("Continuar explorando"). Vazio não é erro: tabela de cabeçalhos sem linhas ou resumo zerado não corresponderiam a compra nenhuma. |
| Erro do carrinho | Mensagem do erro normalizado + nova tentativa. |
| Erro só da cotação | O resumo mostra o erro e "Recalcular"; as linhas continuam na tela. |
| Sucesso | Tabela (1440) ou cards (414) + resumo autoritativo do servidor. |

**Uma região viva só.** Mutations e eventos de tempo real mudam a mesma tela e
falam pelo mesmo `aria-live="polite"` — duas regiões concorrentes fariam o leitor
de tela cortar um anúncio no meio do outro. Quem anuncia por último ganha a vez,
que é o comportamento correto: o aviso mais novo descreve o estado mais novo.

Remover pede confirmação em um `alertdialog` do Radix (foco preso, devolvido à
própria lixeira, `Esc` para sair): remover é destrutivo e o frame não desenha
desfazer.

---

## 5d. Pagamento e confirmação (Fase 5)

A tela de pagamento é a composição de cinco responsabilidades separadas
(`useCheckout`), e a ordem em que elas se encadeiam **é** a regra de negócio:
carteiras → formulário (de onde sai a rede) → cotação → portão → pedido.

### A chave de idempotência nasce do corpo, não do clique

A unidade não é "o clique", é a **tentativa**: um corpo de pedido específico
(cotação, itens, cupom, rede, carteira e dados do colecionador). O cliente
calcula a impressão digital desse corpo (`lib/order-fingerprint.ts`, FNV-1a sobre
um JSON canônico) e a guarda junto com a chave em
`localStorage['kurio:checkout-attempt:<userId>']`, **antes de a requisição sair**.

| Momento | O que acontece com a chave |
| --- | --- |
| Entrar no checkout | nada — montar a tela não é tentativa |
| 1º envio de um corpo | **cria** (`crypto.randomUUID`) e grava o registro antes do POST |
| Clique repetido | **reusa** (e o envio nem sai: guarda de "um em voo") |
| Retry após `TIMEOUT` / `NETWORK_ERROR` / 5xx | **reusa** → o mock devolve `200` com o **mesmo** pedido |
| Refresh com pedido pendente | **reusa** (o registro sobrevive) |
| Reconexão do socket | **reusa** — reconciliação é `GET`, não cria nada |
| Campo, carteira, rede ou cupom alterado | **rotaciona** (impressão digital nova; reusar seria `409 IDEMPOTENCY_KEY_REUSED`) |
| Nova cotação aceita após bloqueio | **rotaciona** (`quoteId` e `pricingSignature` novos) |
| Estado terminal, logout, troca de usuário, reset | **descarta** |

Gravar antes do envio é o detalhe que faz o timeout funcionar: se a resposta se
perde, a chave já está no disco e o reenvio recupera o pedido que talvez exista
do outro lado. O registro é por usuário porque o servidor guarda a chave junto
com o dono — uma chave sobrevivente à troca de conta só produziria conflito, e
por isso `switchSessionIdentity` a apaga junto com o cache privado.

### Revalidação, bloqueio e nova confirmação

A cotação é revalidada em dois momentos: **ao entrar** (e a cada mudança, porque
a assinatura dos itens e a rede estão na query key — ver `quote-queries.ts`) e
**antes de aceitar o pedido**, no servidor, que compara `quoteId` +
`pricingSignature` com o catálogo atual.

O portão (`useCheckoutGate`) sobe por três origens, todas **fora do controle do
usuário**:

1. `nft.updated` chegando pelo `socket.io-client` para um item em compra, com
   preço diferente ou disponibilidade abaixo da quantidade pedida;
2. o `409` de `POST /orders` (`PRICE_CHANGED`, `EDITION_SOLD_OUT`,
   `QUOTE_STALE`, `QUOTE_EXPIRED`), cujos `conflicts` já dizem o que mudou;
3. a validade da própria cotação vencendo com a tela aberta.

Mudança que o **usuário** provoca — trocar cupom ou rede — recotiza em silêncio:
exigir nova confirmação de uma ação que ele acabou de tomar seria ruído, não
segurança. Disponibilidade que **sobe** com o mesmo preço também não bloqueia: a
versão do recurso sobe em qualquer alteração, e recusar por isso seria falso
positivo — a mesma regra que o servidor aplica ao revalidar.

Enquanto o portão está levantado o CTA fica desabilitado e o aviso lista o que
mudou (preço cotado para preço atual; quantidade pedida para disponível). O botão
de aceitar fica travado enquanto `isRefreshing`: aceitar valores que ainda estão
a caminho seria confirmar no escuro. Aceitar limpa o bloqueio — e, como a cotação
nova muda o corpo, a chave de idempotência rotaciona sozinha.

A deduplicação por versão é a mesma do carrinho: um mapa de `nftId` para versão,
carimbado com o dono e comparado também contra a versão da linha em cache. Evento
antigo ou reentregue cai fora sem reaplicar efeito e sem levantar o bloqueio de
novo.

### A máquina de estados do pedido

```
 idle --enviar--> submitting --2xx--> pending --order.updated--> confirmed
                       |                                     \-> declined
                       |-- 409 conflito -> portao bloqueia (nenhum pedido criado)
                       |-- 422 ----------> erros nos campos do formulario
                       \-- timeout ------> unknown --reenvio da MESMA chave--> pending
```

- **A interface nunca marca `confirmed`.** O `2xx` da criação diz apenas "pedido
  existe"; quem resolve é a simulação, por `order.updated`, e a palavra final é
  sempre do REST — o evento invalida a query e o estado exibido é o que o
  servidor devolveu. Sem evento, o pedido fica pendente para sempre (é
  literalmente o cenário `payment-manual`).
- **Um envio em voo.** O botão trava durante a mutation, e uma guarda no início
  de `submit` cobre o que o botão não cobre (dois cliques no mesmo quadro). Se
  algo escapar, a chave transforma o segundo envio em recuperação do primeiro.
- **`unknown` é incerteza, não fracasso.** Depois de um timeout não dá para saber
  se o pedido existe. A tela diz isso, e a saída é reenviar a MESMA tentativa.
- **Terminalidade com guarda dupla no cliente**: versão menor ou igual é
  descartada, e estado já terminal em cache é descartado mesmo com versão maior.
  O servidor faz o mesmo no-op (`transitionOrder`), e o cliente não pode ser mais
  permissivo que ele.
- **Carrinho**: `confirmed` remove apenas os itens e quantidades comprados (quem
  remove é o servidor; o cliente invalida e relê); `declined` preserva tudo e
  devolve as unidades à edição.

### Recuperação após refresh e reconexão

Dois caminhos, nenhum deles cria compra:

1. **`GET /orders`** na montagem, habilitado só quando existe uma tentativa
   gravada **sem** pedido conhecido. Ele procura um pedido `pending` do usuário e
   o adota. Deliberadamente só `pending`: adotar "o mais recente" arriscaria
   assumir um pedido antigo quando a tentativa nunca chegou ao servidor.
2. **Reenvio da mesma chave**, que cobre o caso em que a simulação já resolveu o
   pedido enquanto o cliente esperava o timeout — aí não há pendente para
   encontrar, e o replay traz o pedido já resolvido (com o recibo).

Na volta da conexão, `useOrderTracking` relê o pedido pelo REST (além do
`refetchOnReconnect` global): uma queda durante o `pending` não pode deixar a
tela presa num estado que o servidor já mudou.

### O recibo é snapshot, não uma montagem

A confirmação lê `GET /orders/:id/receipt` — o instantâneo que o servidor
congelou quando o pedido virou terminal — e **não** o pedido em cache nem o
catálogo. Não há uma linha no `ReceiptDialog` que consulte preço atual, então
`nft.updated` posterior não muda um número ali. "Ver no Etherscan" é um no-op
coerente: a transação é simulada, e o botão explica isso no lugar de abrir um
link que mostraria "não encontrado".

O recibo é renderizado **fora** das duas composições da tela, e isso não é
organização: o pedido confirmado esvazia o carrinho, e se ele morasse dentro da
composição a confirmação o desmontaria no mesmo instante em que ele deveria
aparecer. Pela mesma razão, carrinho vazio só vira estado vazio quando não há
pedido em curso.

### Conexão de carteira simulada

A tela de pagamento **lê** as carteiras; cadastro e edição pertencem à tela de
carteiras. A única escrita é o `status` (`PATCH /wallets/:id`), que é como a
simulação representa conectar e desconectar. A **recusa é real**: no cenário
`wallet-refused` o servidor grava a carteira como `refused` e responde `409
WALLET_UNAVAILABLE` — a tela mostra o estado verdadeiro e o pedido com essa
carteira não passa (`createOrder` também recusa). Nada de sucesso falso.

O bloco "Carteira e rede" marca um **provedor**; quem paga é a carteira
cadastrada daquele provedor. Sem carteira correspondente, a seleção fica sem dona
de propósito, e a tela diz isso.

### Duas telas, uma cotação

O resumo do carrinho e o do pagamento são a **mesma leitura**: `useQuoteSummary`
serve os dois, com a rede como único parâmetro de diferença (`null` no carrinho —
daí a nota "Taxa estimada" do frame; a rede escolhida no pagamento, que muda a
taxa). A Fase 5 consolidou o que a Fase 4 tinha só no carrinho: `use-cart-quote`,
`cartQuoteQueryOptions` e `CartQuoteState` saíram, e `SummaryRow` e a região viva
(`useLiveAnnouncer` + `LiveRegion`) viraram compartilhados.

### O contrato do colecionador passou a ser o do frame

O `CollectorDetails` da Fase 1 (`fullName`, `email`, `phone`, `document`) não
correspondia a nenhum campo do `design/Pagamento.png`. Como os mocks são nossos e
o Figma manda na composição, o contrato foi reescrito com **exatamente** os campos
do frame: nome de exibição, nome de usuário, nome do perfil, e-mail, endereço da
carteira, ENS ou carteira secundária (opcional), código de indicação, domínio
ENS, "usar outra carteira?" e a observação. `network` e `walletId` **não** entram
aí: apesar de os seletores "Rede" e "Tipo de carteira" ficarem na mesma coluna do
layout, eles definem o pedido (taxa e carteira usada), e duplicá-los criaria duas
fontes de verdade para o mesmo dado.

---

## 5e. Conta: perfil e carteiras (Fase 6)

Duas telas, uma moldura. `/perfil` e `/carteiras` são filhas de um layout sem
caminho próprio (`routes/_private/_account.tsx`), que por sua vez é filho de
`_private`. As URLs continuam sendo as do design, e as duas herdam de uma vez o
guard de sessão e a barra lateral "Meu perfil" — herdar o guard por composição, e
não repeti-lo em cada tela, é o que garante que uma rota nova da conta **nasça**
protegida.

### O que a barra lateral faz com o que está fora do escopo

Cinco das oito seções do frame — Atividade, Lista de interesse, Ofertas, Arquivos
baixados e Suporte — estão explicitamente fora da entrega (enunciado §3). Elas
continuam desenhadas, porque a barra é a do Figma; o que muda é o comportamento:

- são `button` com **`aria-disabled="true"`**, e não `disabled`. Um controle
  desabilitado sai da ordem de foco e não pode explicar nada — quem navega por
  teclado encontraria um item mudo. Assim ele é alcançável, anuncia-se como
  indisponível e diz o que é quando acionado;
- trazem o selo visível **"em breve"**, para o estado não depender só de opacidade;
- ao serem acionadas abrem um aviso e **não navegam**. É o mesmo tratamento que a
  Fase 2 deu às ações sociais e o header aos itens editoriais.

"Sair" não é destino: é a mutation de logout da Fase 2, que limpa o ramo privado
do cache e derruba a conexão de tempo real. Tratá-lo como rota o faria parecer
uma tela.

### Desvio mobile (perfil e carteiras não têm frame de 414)

Abaixo de `md` a barra lateral vira um **`<details>` nativo**, recolhido, cujo
`summary` anuncia a seção aberta (`Meu perfil · Carteiras`). O elemento nativo já
entrega `aria-expanded`, operação por teclado e o comportamento de foco; um
drawer equivalente exigiria trap de foco, retorno de foco e uma camada de JS para
chegar ao mesmo lugar. As alternativas sem estado foram descartadas por motivos
concretos: empilhar as oito seções empurraria o formulário para baixo da dobra, e
uma faixa rolável na horizontal esconderia itens — o overflow lateral que o §8 do
enunciado proíbe.

A escolha entre as duas formas acontece **antes** de renderizar
(`useCompactLayout`), e não com `md:hidden`: montar as duas deixaria a árvore de
acessibilidade com dois `nav` de mesmo nome e dois "Sair", e quem usa leitor de
tela percorreria a navegação da conta duas vezes. É a mesma regra que o carrinho,
o detalhe e o pagamento já seguiam.

### Um "Salvar" para dados e senha

O frame do perfil tem **um** botão, abaixo dos três campos de senha — e é assim
que ele fica. `useProfileForm` despacha: os campos de dados que mudaram viram um
`PATCH /profile`; os três campos de senha, quando preenchidos, viram um
`PUT /profile/password`. Deixá-los em branco é como se diz "não quero trocar a
senha", então corrigir um nome nunca exige digitar a senha atual — por isso eles
não levam o asterisco de obrigatório.

A ordem é **sequencial**: dados primeiro, senha só se os dados passarem. Em
paralelo, uma troca de senha poderia ser aceita num formulário que o servidor
acabou de recusar por conflito de e-mail, e meio envio aceito é o estado mais
difícil de explicar a quem está na tela.

O corpo do `PATCH` é um **diff** contra o perfil carregado. Enviar o formulário
inteiro funcionaria, mas descreveria como alteração algo que ninguém tocou — e é
o diff que torna "salvei só a senha" um envio de senha, e nada mais.

**`changePassword`.** O cliente valida obrigatoriedade, tamanho mínimo (8, o mesmo
do servidor), nova diferente da atual e nova igual à confirmação. O servidor é a
palavra final: a senha atual incorreta volta como `422` com
`fieldErrors.currentPassword`, e a mensagem cai no campo pelo mesmo caminho de
sempre (`aria-describedby` via `FormField`). Nenhuma senha sai do estado local —
não entra em cache, URL, toast nem log — e os três campos são apagados no sucesso.

### Avatar

Troca simulada, como o enunciado pede: o arquivo é lido no navegador e vira uma
`data:` URL, que é o que o contrato transporta. A **prévia aparece antes da
resposta, mas nada é dado por salvo** — ela é só o que está em voo, e a falha da
mutation a descarta, devolvendo a imagem que o servidor ainda tem.

"Remover" é `DELETE /profile/avatar` e deixa a conta **sem** avatar (`avatarUrl`
vazio), não com o retrato genérico: depois dele a interface mostra a inicial do
usuário, e uma imagem inexistente não recebe texto alternativo. O input de
arquivo fica `sr-only` (e não `display: none`) para continuar na ordem de foco e
associado ao próprio rótulo.

### Modelo de carteira: principal e secundária

O frame prevê exatamente dois papéis, e o `WalletRole` da Fase 1 já os tinha. O
servidor garante que só exista uma principal — promover outra rebaixa a anterior
—, então a tela reduz a lista devolvida à primeira carteira de cada papel e não
tem estado a reconciliar. Um mesmo hook (`useWalletForm`) serve aos dois blocos:
a diferença é só o verbo, `POST` no bloco vazio e `PATCH` no que já tem carteira.

O frame pede dez campos e o contrato tinha seis; os que faltavam entraram no
recurso (`displayName`, `profileName`, `email`, `referralCode`,
`linkedReference`). "Nome ENS" é editado em **dois controles** — seletor de
domínio e rótulo — e gravado num campo só: a composição e a decomposição ficam em
`lib/ens-name.ts`, nas bordas do formulário, e não no transporte.

**"Igual à carteira principal" copia tudo menos o endereço.** O servidor recusa
endereço repetido do mesmo dono (`WALLET_ADDRESS_ALREADY_REGISTERED`), então
copiá-lo ofereceria um atalho que aparenta funcionar e falha no envio — o "fluxo
apenas visual" que o enunciado proíbe. A dica ao lado do controle diz isso em uma
linha. A cópia entra como **semente** por baixo do rascunho, não dentro dele:
campo digitado vence a semente, que vence a carteira salva.

O "Adicionar" da carteira principal leva o foco ao primeiro campo do formulário.
Abrir um segundo bloco prometeria duas principais, e só existe uma.

### As carteiras são as mesmas do pagamento

`walletsQueryOptions` vive na feature que as cadastra
(`features/wallets/api/wallets-queries.ts`) e a tela de pagamento a importa de
lá. É a **mesma entrada de cache**, não duas parecidas: uma carteira salva no
perfil já está disponível no checkout sem nenhuma sincronização entre as telas, e
a invalidação do cadastro alcança as duas. `CHECKOUT_QUERY_SEGMENTS` deixou de
declarar o segmento `wallets` justamente para que não houvesse duas strings
iguais por coincidência.

### Isolamento

Perfil e carteiras entram no ramo privado com o id do dono na chave
(`queryKeys.private(userId, …)`), que é o ramo que o logout e a troca de conta
removem por inteiro (`clearPrivateCache`). O isolamento é estrutural: a query do
usuário A não casa com a do usuário B nem enquanto os dois passam pelo mesmo
`QueryClient`. `e2e/profile.spec.ts` e `e2e/wallets.spec.ts` afirmam os **dois**
lados — o dado do segundo usuário está lá e o do primeiro não.

### Um achado de acessibilidade corrigido nesta fase

O primitivo `Input` trazia `outline-none`, uma utilidade, que vencia a regra
`:focus-visible` da camada base do tema: o campo focado ficava só com a troca de
cor da borda, indicador fraco demais para o requisito de foco visível por
teclado. O anel passou a ser declarado no próprio primitivo
(`focus-visible:outline-solid outline-2 outline-offset-2`). Muda apenas o estado
focado, então nenhuma baseline visual se moveu — mas todos os formulários do app
ganharam o anel junto.
---

## 6. Tempo real (Socket.IO)

**Ordem de inicialização — a decisão mais importante desta fase.** O engine.io do
`socket.io-client` guarda a referência global de `WebSocket` quando seu módulo é
avaliado. Como imports estáticos são avaliados antes de qualquer código rodar,
importar a árvore do app no topo de `main.tsx` fazia o socket capturar o
`WebSocket` nativo **antes** de o MSW instalar o dele — e nenhuma conexão era
interceptada. Por isso `main.tsx` faz:

```
await startMocks();                       // MSW instala o WebSocket dele
const { App } = await import('@/app/app'); // só então o socket.io-client é avaliado
```

**URL do link do MSW.** Antes de casar um handler de WebSocket, o MSW remove o
prefixo `/socket.io/` do caminho da conexão. O link em `src/mocks/socket/handlers.ts`
aponta portanto para a **origem**, sem o caminho do transporte — incluir
`/socket.io/` fazia o handler nunca casar.

**Origem dedicada.** `VITE_SOCKET_URL` aponta para `http://realtime.kurio.mock`,
uma origem que não existe. O MSW intercepta no construtor do `WebSocket`, então
nenhuma resolução de DNS acontece. Manter uma origem separada da página evita que
o link do MSW capture também o WebSocket de HMR do Vite, que roda na origem local
e ficaria sem funcionar em `pnpm dev`.

**Estado da conexão.** `src/features/realtime/api/socket-status-store.ts` é um
store externo lido por `useSyncExternalStore`. O socket é um sistema externo:
espelhá-lo em `useState` dentro de um efeito provocaria render em cascata e
estado duplicado.

**Limitações do binding (experimental).** `@mswjs/socket.io-binding` opera apenas
no **namespace raiz** e não implementa rooms nem broadcast seletivo. Duas medidas
complementares dão o escopo por usuário:

1. cada conexão anuncia sua sessão (`session.identify`, emitido pelo cliente) e o
   emissor entrega `order.updated` apenas às conexões daquele `userId` — conexões
   que ainda não se identificaram recebem, porque não têm sessão para agir;
2. o payload carrega `userId` de todo modo, e o cliente confere antes de aplicar
   qualquer efeito. Evento de sessão anterior nunca toca dado de outro usuário.

**Emissão amarrada ao store.** `src/mocks/socket/emitter.ts` é o único ponto de
emissão, e quem muda o recurso emite na mesma operação
(`src/mocks/db/nfts.ts`, `src/mocks/db/orders.ts`). Não existe caminho que altere
preço/disponibilidade sem avisar quem está ouvindo, nem evento sem mudança real
no estado — REST e tempo real não podem divergir por construção. Ao fechar a
conexão o registro é desfeito (sem listener órfão).

**Envelope dos eventos** (`src/features/realtime/types/events.ts`): todo evento é
um `RealtimeEvent` com `eventId` (identifica a *entrega*, permitindo ignorar
reentregas), `resource`, `id` estável do recurso, `version` e `occurredAt`.

| Evento | `payload` | Quem aplica |
| --- | --- | --- |
| `nft.updated` | `{ price, previousPrice, available }` | `useNftRealtime` (catálogo e detalhe) e `useCartRealtime` (linhas e resumo do carrinho — ver §5c) |
| `order.updated` | `{ status, userId, transactionHash, declineReason }` | fase do pagamento |

O endpoint de controle `/__mocks/events/nft` aceita `version` para emitir um
evento **deliberadamente fora de ordem**: nada muda no servidor e o envelope sai
com a versão informada. Existe só para os testes exigirem do cliente o descarte
de evento antigo sem regredir o estado mais novo — sem ele, o único caso
alcançável seria a reentrega do evento corrente.

**Reconciliação REST ↔ socket.** A regra é: o socket **notifica**, o REST
**confirma**. A `version` do recurso é monotônica no servidor simulado e vem nos
dois canais, então o cliente aplica um evento somente se `version` for maior que
a que tem em cache — duplicata e evento antigo são descartados sem reaplicar
efeito. Estados terminais de pedido (`confirmed`/`declined`) nunca regridem. Após
reconexão a fonte de verdade é o REST: `refetchOnReconnect` revalida os recursos
ativos (`QUERY_DEFAULTS`), e é assim que um pedido pendente durante uma queda é
recuperado sem criar outra compra — a chave de idempotência cobre o caso em que a
resposta da criação foi perdida.

**Disparo manual em teste.** Os endpoints de controle (`/__mocks/events/nft`,
`/__mocks/events/order`) provocam o evento **no servidor simulado**, que o entrega
pelo Socket.IO. Nenhum teste escreve no cache ou chama setter na interface: o
caminho exercitado é sempre `socket.io-client`.

---

## 7. Mocks — store, fixtures e cenários

Toda resposta fictícia vive no MSW. Componentes, hooks e o cliente Axios não
contêm dado fake nem caminho de negócio alternativo.

A camada é ativada por `VITE_ENABLE_MOCKS` e vai no build de demonstração —
o import de `@/mocks/browser` em `src/mocks/start.ts` é dinâmico, então um build
com os mocks desligados não carrega o worker nem os fixtures.

**Store próprio, não `@mswjs/data`.** `src/mocks/db/store.ts` mantém um objeto
tipado (`MockDatabase`) semeado pelas fixtures. Escrevemos o store porque o
domínio pede três coisas que a lib não modela: `version` monotônica por recurso
(base do tempo real), valores em ETH como string decimal e registro de
idempotência de pedido. O store não filtra nada por usuário — o isolamento é
responsabilidade dos seletores e handlers, que sempre recebem o dono da
requisição (`userId` ou `guest:<id>`).

**Persistência e reset.** O estado é espelhado no `localStorage`
(`kurio:mock-state`) apenas para sobreviver ao refresh; em Node roda só em
memória. O envelope carrega dois invalidadores, e a distinção importa:
`schemaVersion` descarta estado cuja **forma** mudou, e `seedSignature` —
hash das especificações do acervo, incluindo o caminho resolvido de cada arte —
descarta estado cujo **conteúdo semeado** mudou. Sem o segundo, editar as
fixtures não teria efeito nenhum em quem já abriu a aplicação antes: o navegador
restauraria o catálogo anterior, com itens a menos e artes renomeadas que viram
404 no card. `e2e/foundation.spec.ts` cobre exatamente esse caso. `resetSimulation()` (`src/mocks/scenarios/runtime.ts`) restaura os três
estados juntos — dados semeados, contadores de rede e temporizadores agendados —
o que é o que faz "cada teste parte de estado isolado" valer de verdade.

**Fixtures** (`src/mocks/fixtures/`): 36 NFTs descritos por especificações
compactas (`NftSpec`), sendo os 9 do DESIGN_SPEC §6 com nome, preço e promoção
idênticos aos do Figma; as 9 coleções da sidebar do frame (quatro itens em
cada), 3 criadores, as 3 redes, as 3 raridades, preços de 0.02 a 12.30 ETH — a
mesma faixa que o frame mostra no slider, e o suficiente para as **4 páginas de
9** que ele mostra na paginação e para exercitar filtros combinados. Casos de borda propositais: `golden-signal-160` esgotado,
`ivory-baron-088` e `neon-vessel-118` com uma única unidade. Dois usuários com
dados privados distintos (favoritos, carteiras, pedido) tornam o isolamento
verificável. Quatro cupons cobrem válido, expirado, restrito a coleção e restrito
por subtotal; qualquer outro código cai em `COUPON_NOT_FOUND`.

**Contagem das facetas de coleção e rede.** As duas publicam o tamanho de
acervo declarado nas fixtures (`CollectionRecord.catalogSize` e
`NETWORK_CATALOG_SIZES`), que são os números entre parênteses do
`design/Início.png`. Não são contagens de linhas do store, e não poderiam ser:
o frame anuncia 239 itens somando as coleções, 283 somando as redes, e ainda
desenha uma paginação de 4 páginas de 9 — três totais que nenhum acervo único
satisfaz ao mesmo tempo. São números de vitrine, e por isso ficam **na camada de
mocks**, e não inventados no cliente. O que a contagem não muda é o
comportamento: marcar uma coleção ou uma rede filtra os itens de verdade, e a
faixa de preço e a faceta de raridade continuam calculadas a partir do acervo
(por isso `Preço: 0.02 - 12.30 ETH` é medido, não escrito).

As abas "Novos lançamentos" e "Em alta" usam **ranking** (mais recentes / maior
`trendingScore`) em vez de janela de tempo: assim o resultado não depende do
relógio da máquina e as fixtures continuam determinísticas.

Arte: as fixtures já apontam para os caminhos finais (`/nfts/<slug>.png`,
`/avatars/<...>.png`); os arquivos são exportados do Figma na fase das telas, que
é quando passam a ser renderizados. Itens extras da mesma família reusam a arte
da própria coleção — a galeria do detalhe é montada com as artes irmãs — para que
nenhuma fixture aponte para uma peça que não existe no Figma.

**Cenários** (`src/mocks/scenarios/registry.ts`). Um cenário é apenas
configuração — rede, catálogo, sessão, conta e checkout —, lida pelos handlers.
Isso evita caminho de negócio alternativo espalhado pelo código e mantém cada
situação do README §6 reproduzível por um único id:

| id | O que exercita |
| --- | --- |
| `default` | Sucesso: catálogo completo, latência curta, pagamento confirmado. |
| `empty` | Listagem sem resultados. |
| `slow` | Latência de 1200–2600 ms (skeletons com shimmer). |
| `out-of-order` | Latência sorteada por requisição, com semente fixa: respostas fora de ordem. |
| `flaky` | As duas primeiras requisições falham com 503; as seguintes passam. |
| `offline` | Falha antes do servidor, sem status (erro de rede). |
| `server-error` | 503 em tudo. |
| `session-expired` | Login devolve sessão já vencida. |
| `signup-conflict` | 409 em qualquer cadastro. |
| `price-changed` | Preço muda logo depois da cotação. |
| `sold-out` | Edição esgota logo depois da cotação. |
| `order-timeout` | Pedido criado, resposta fora do prazo do cliente. |
| `payment-declined` | Pendente → recusado por `order.updated`. |
| `payment-manual` | Fica pendente até um evento ser disparado pelo controle. |

Seleção, na ordem de precedência: cenário gravado junto com o estado (endpoint de
controle, sobrevive ao refresh) → `?scenario=<id>` na URL → `VITE_MOCK_SCENARIO`
→ `default`.

**Endpoints de controle** (`/api/__mocks/*`, fora do contrato do produto):
`GET|POST /scenario`, `POST /reset`, `POST /events/nft`, `POST /events/order`,
`POST /session/expire`. Não passam pelas condições de rede de propósito: um teste
precisa conseguir trocar de cenário e restaurar o estado mesmo no cenário
`offline`.

**Cenários de latência e o timeout do cliente.** `VITE_REQUEST_TIMEOUT_MS`
(padrão 15 s) existe para que o cenário `order-timeout` seja testável sem esperar
15 segundos — o vitest roda com 3 s. O handler de pedido espera esse valor mais
uma folga, então o cliente recebe `TIMEOUT` com o pedido **já criado**, e a
retentativa com a mesma chave recupera o mesmo recurso.

---

## 8. Verificação automatizada da camada de rede (vitest)

`pnpm test` roda os mesmos handlers do navegador em Node (`msw/node`) e exercita
o **api client tipado** de ponta a ponta — Axios → MSW → store → socket. Não há
segunda implementação de mock para teste. Os fluxos de interface continuam no
Playwright; aqui verificamos o contrato.

Sete arquivos, 61 casos: sessão (login, 401, expiração, logout, conflito de
cadastro, isolamento entre os dois usuários), catálogo (paginação, ordenação
decimal, filtros combinados, facetas, abas, detalhe e 404), carrinho (limites,
totais do servidor, reflexo de mudança de preço, transferência do visitante),
cotação e pedido (cupons, idempotência, preço alterado, edição esgotada, timeout
com recuperação, recusa, recibo), conta (perfil, senha, carteiras, isolamento),
cenários (offline, 503, `flaky`, fora de ordem, reset) e tempo real.

**Duas decisões de configuração merecem registro** (`vitest.config.ts`,
`src/test/setup.ts`):

1. **`server.listen()` roda no escopo do módulo do setup, não em `beforeAll`.** É
   a mesma lição do `main.tsx`: o engine.io resolve `globalThis.WebSocket` quando
   seu módulo é avaliado, e o vitest importa os arquivos de teste (com eles, o
   `socket.io-client`) **antes** de rodar qualquer hook. Em `beforeAll`, o MSW
   instalaria o `WebSocket` dele tarde demais e nenhuma conexão de tempo real
   seria interceptada.
2. **`./websocket.node.js` recebe alias para `./websocket.js`.** O engine.io
   sempre importa a variante `.node` e conta com o campo `browser` do
   `package.json` para trocá-la pela do navegador. Esse remapeamento não acontece
   na resolução do Node, e a variante `.node` abre a conexão pelo pacote `ws`,
   que o interceptor de WebSocket do MSW não substitui. Com o alias, o transporte
   usa o `WebSocket` global — exatamente o que o MSW intercepta. (Os dois pacotes
   também são processados pelo Vite via `server.deps.inline`.)

O `localStorage` não existe em Node, então store e identidade do chamador rodam
só em memória — `afterEach` restaura a simulação e limpa token e id de visitante,
para que nenhum teste herde estado do anterior. `fileParallelism: false` porque o
store simulado é global por processo.

---

## 9. Fidelidade visual

Tokens em `src/app/globals.css`, config CSS-first do Tailwind v4. As cores do
Figma foram convertidas de hexadecimal para OKLCH e o hex de origem está no
comentário ao lado de cada token.

| Papel | Hex | Token |
| --- | --- | --- |
| Fundo | `#140D0A` | `--kurio-bg` / `--background` |
| Superfície (card, sidebar) | `#241612` | `--kurio-surface` / `--card` |
| Texto primário | `#F5F1EB` | `--kurio-text` / `--foreground` |
| Texto tan / muted | `#CFB28C` | `--kurio-tan` / `--muted-foreground` |
| Accent (CTA, preço, foco) | `#D28A4C` | `--kurio-accent` / `--primary` / `--ring` |
| Link de texto | `#E89B55` | `--kurio-link` |
| Ícone muted | `#B39463` | `--kurio-icon-muted` |
| Borda de input | `#3F2319` | `--kurio-border` / `--input` |
| Ponta clara das superfícies mobile | `#2F1D15` | `--kurio-surface-lift` / `--color-surface-lift` |
| Filete das seções (tabela do carrinho, resumo) | `#432C1A` | `--kurio-divider` / `--color-divider` |
| Sombra da barra de atalhos | `#0A0604` | `--kurio-shade` |

Raios: 5px controles, 8px painéis, 15px card de NFT. A escala do shadcn foi
achatada em 5px para que `rounded-md`/`rounded-lg` dos primitivos caiam no valor
de controle do design. O frame de 414 usa outra escala e tem os próprios tokens:
`rounded-field` 10 (busca), `rounded-hero` 12, `rounded-filter` 14 (botão de
filtros), `rounded-media` 16 (arte) e `rounded-card-mobile` 20 (card e faixa
inferior).

### Medidas do Carrinho (Fase 4)

O frame de 1440 foi medido no PNG, pixel a pixel, e os valores entraram no
layout em vez de serem aproximados:

| Elemento | Valor |
| --- | --- |
| Tabela / resumo | 782px + goteira de 86px + 332px (= os 1200 do container) |
| Colunas | NFTs 312 · Preço 139 · Edições 135 · Total 152 · ações 44 |
| Linha | 70px de altura, 13px de respiro entre linhas |
| Miniatura | 70×70, raio 8, colada à borda esquerda da linha |
| Cápsulas do seletor | 17×26, raio total, accent `#D28A4C` |
| Preço da linha | `#CFB28C` (tan) — o **total** da linha é `#E89B55`, não o mesmo tom |
| Filete sob os cabeçalhos | `#432C1A`, e **para** na largura da tabela: no Figma ele não atravessa a goteira até a coluna do resumo |
| Campo de cupom | 230px + botão de 102px, borda accent (e não a borda padrão de input) |

Duas armadilhas de layout que o ajuste revelou, e que valem como documentação:

1. **`border-spacing-y` dobra na fronteira `thead`/`tbody`.** O respiro entre as
   linhas virava o dobro logo abaixo do filete. O espaçamento passou a vir de uma
   **borda superior transparente** nas células, com `bg-clip-padding` para o
   fundo da linha parar antes dela — assim os 13px do frame valem igual nos dois
   lugares.
2. **O grid esticava a tabela** até a altura da coluna do resumo (`align-items:
   stretch`), e as linhas absorviam a sobra, passando de 70px para 95px.
   `items-start` resolve.

No frame de 414 a composição é outra, e a escolha entre as duas acontece **antes
de renderizar** (`useCompactLayout`), para a árvore não ter dois seletores de
quantidade e duas lixeiras por item. Medidas tiradas do
`design/Carrinho de NFTsmobile.png`:

| Elemento | Valor |
| --- | --- |
| Goteira | 28px (16px abaixo de 414 — ver desvio adiante) |
| Card | 100px de altura, raio 16, 20px entre cards |
| Miniatura | 100×100, colada à borda esquerda do card |
| Seletor | círculos de 24px com borda accent, **em uma linha só**, centrado na altura do card |
| Painel do resumo | emendado no último card, cantos superiores de 40px, degrade da superfície |
| CTA | raio total, 56px de altura, degrade accent |
| Barra de atalhos | **não existe** nesta tela (ver desvios) |

### Frame de 414 (celular)

O frame mobile não é o de 1440 encolhido: tem outra escala tipográfica, outros
raios e superfícies em degrade. As medidas saíram do `design/InícioMobile.png`
(414×896, medido pixel a pixel) e viraram tokens, não valores soltos no JSX.

| Papel | Medida do frame | Token |
| --- | --- | --- |
| Linha de boas-vindas do herói | 12/16 medium | `text-eyebrow` |
| Título do herói | 18/29 bold | `text-hero-mobile` |
| Descrição do herói | 12/18 | `text-hero-body` |
| "EXPLORAR" | 12/14 bold | `text-cta` |
| Campo de busca | 14/16 bold | `text-field` |
| Nome e preço do card | 14/18 | `text-card-mobile` |

Os degrades não cabem em token de cor e viraram utilitários em `@layer
components`: `.surface-gradient` (card, `#241612 → #2F1D15` na diagonal),
`.surface-gradient-lifted` (herói, a mesma diagonal invertida), `.accent-gradient`
(botões de acento — `--accent-gradient-from` move o ponto de partida: 45% no
filtro, 40% no atalho central), `.hero-ellipse` (os dois círculos de 248px atrás
do texto do herói) e `.mobile-nav-surface`.

O recorte da barra inferior é uma **máscara** (`radial-gradient` de 55px centrado
15px acima do topo da faixa), e não um pseudo-elemento pintado por cima: assim o
conteúdo da página aparece através do vão, como no frame.

Composição do frame, medida e reproduzida: recuo lateral de 24px; busca de
313×45 + botão de 45×45 com 8px entre eles; herói de 366×190 com arte de 138 no
canto superior direito; grade de dois cards de 175×200 (arte de 168, 12px acima
e 20px abaixo) com 16px de vão e a segunda coluna deslocada 32px; barra inferior
de 78px com o atalho central de 65px subindo 36px acima dela.

O detalhe tem composição própria no frame de 414 (`design/Detalhes do
NFTmobile.png`, medido pixel a pixel), e não a de 1440 encolhida — por isso a
escolha entre as duas acontece **antes** de renderizar, em `useCompactLayout`,
e não com `md:hidden`: montar as duas árvores deixaria dois `h1`, dois
seletores de quantidade e duas molduras pedindo imagem no mesmo documento.

- topo: recuo lateral de 28px, bolinhas de 35px (borda `--kurio-border` sobre
  `--kurio-surface-lift`) a 27px do alto, arte de 356px de altura e raio 24
  logo abaixo, tudo sobre `.surface-gradient`;
- folha de informações: sobe 30px por cima da borda de baixo da arte — é o que
  dá o recorte de 31px do frame —, com `32/24/24/24` de vão interno e 12px
  entre os blocos; selo de nota de 27px com borda `--kurio-accent`; metadados
  em 15px com 16px entre as linhas;
- barra de compra (`.buy-bar-surface`, raio 40 no topo, sombra de 20px):
  cápsulas de quantidade de 20×30, botão de 196×60 e botão de carrinho de
  60×60 com 12px entre eles, vão de `20/24/36/24` mais a área segura do
  aparelho.

Tipografia: uma única família, **Roboto Mono**, servida localmente
(`public/fonts/`, subsets latin e latin-ext, arquivo variável 100–700). O subset
latino é pré-carregado no `index.html`. A escala tem nomes próprios
(`text-hero` 43, `text-heading` 28, `text-title` 20, `text-body-lg` 16,
`text-body` 14, `text-label` 14 bold) — `text-title` entrou com as abas do painel
de autenticação.

`.skeleton` (em `globals.css`) é o shimmer padrão: ele ocupa a dimensão final do
conteúdo enquanto os dados não chegam, para que a chegada não desloque o layout.
A preferência por movimento reduzido já o congela, pela regra global.

**Valores medidos no `design/Login.png`** e aplicados ao painel: modal de 500px
com 80px de padding lateral, faixa accent de 4px na base, campos de 340px
(padding 12/16, raio 5, borda `#3F2319` → `#D28A4C` no foco), CTA de 44px com
texto escuro em 16 bold, abas de 20px (ativa no accent, inativa em tan) com
divisória vertical, e botões sociais de 36px com borda de 1px.

### Medidas do Pagamento e da Confirmação (Fase 5)

| Elemento | Valor |
| --- | --- |
| Colunas do frame de 1440 | formulário 763px + goteira de 32px + resumo 405px (= os 1200 do container) |
| Campos do formulário | dois por linha, 370px cada com 24px entre eles; rótulo, 8px e campo de 36px |
| Linha do resumo "Seus NFTs" | miniatura de 64px, raio de controle, superfície `#241612` com 6px de respiro |
| Faixa do recibo | quatro campos separados por filete vertical, rótulo de 12px e valor no tan |
| Modal da confirmação | 580px, raio 8, filete accent de 4px na base — o mesmo tratamento do painel de autenticação |
| Totais do recibo | recuados à direita (62% da largura), como no frame |
| Arte "THANK YOU" | PNG exportado do Figma (80×80, servido em 66px), como `img` decorativa — é ilustração colorida, não um glifo que herda `currentColor` |

No frame de 414 (`design/PagamentoMobile.png`) a tela é a da carteira, e cabe
inteira em uma dobra:

| Elemento | Valor |
| --- | --- |
| Goteira | 28px (16px abaixo de 414) |
| Cabeçalho | seta de 35px à esquerda, título centralizado |
| Cartão de carteira | raio 16, superfície `#241612`; o selecionado ganha borda accent |
| Lista de provedores | linhas de 56px, glifo em círculo à esquerda e radio à direita |
| Total | alinhado à direita, rótulo no texto primário e valor em accent |
| CTA | raio total, 56px, degrade accent, colado ao rodapé |
| Seções recolhidas | entre o total e o CTA — é o vão vazio do frame (ver desvios) |

### Assets (Fase 3)

O Figma entrega **quatro artes** e as reutiliza entre os nove NFTs desenhados —
não existem nove arquivos. Cada arquivo foi renomeado para o slug do primeiro
NFT que o exibe em `design/Início.png`, e `ArtworkKey` passou a descrever a
**arte** (não o item), com `ARTWORK_FILES` fazendo a ponte:

| Arquivo exportado | Arquivo final | Arte | Usada por (frame) |
| --- | --- | --- | --- |
| `Frame 136.png` (450×450) | `/nfts/emerald-ape-042.png` | jaqueta varsity verde, óculos, pingente | Emerald Ape #042 + herói |
| `NFT Artwork 04.png` (250×250) | `/nfts/sage-nomad-009.png` | bucket hat e moletom violeta | Sage Nomad #009, Cosmic Bloom #118, Violet Nomad #314 |
| `NFT Artwork 05.png` (250×250) | `/nfts/neon-vessel-552.png` | blazer marfim e gola esmeralda | Neon Vessel #552, Ivory Baron #088 |
| `NFT Artwork 10.png` (250×250) | `/nfts/golden-beat-207.png` | headphones verdes e jaqueta creme | Golden Beat #207, Golden Frequency #071, Golden Signal #160 |

Os 15 NFTs que não estão no Figma receberam as quatro artes distribuídas de modo
que **toda coleção tenha pelo menos três artes distintas** — é o que faz a
galeria do detalhe (montada com as artes irmãs da coleção) ter mais de uma
miniatura em qualquer item.

**Limitações e substituições registradas:**

- **As artes vieram a 1x.** Três delas têm 250×250, exatamente o tamanho do card.
  A imagem principal do detalhe é renderizada em até ~400px, então nesses três
  casos ela é ampliada e perde nitidez. Reexportar @2x do Figma resolve sem tocar
  no código: os nomes dos arquivos já são os finais.
- **Avatares não existem no Figma.** Os cinco (`/avatars/creator-*.png`,
  `/avatars/collector-*.png`, 128×128) são recortes do rosto das próprias artes.
  Dois deles saem da mesma arte, em enquadramentos diferentes.
- **`Início.png` e `Marketplace Page.png` discordam** sobre qual arte pertence a
  qual NFT (o segundo desloca a atribuição em um item). A implementação segue
  `Início.png`, que é a referência da tela de início neste projeto e a que concorda com
  o frame de detalhe (`Emerald Ape #042` de jaqueta varsity nos dois).
- **As datas de listagem das fixtures** foram ordenadas conforme os nove itens
  aparecem no frame, para que a primeira página da ordenação padrão ("Listados
  recentemente") seja exatamente a do design — o que também dá uma baseline
  estável à regressão visual.

Toda imagem tem `width`/`height` declarados e moldura de proporção fixa, para
que a chegada da arte não desloque o conteúdo (CLS). A arte do herói é a única
com `fetchPriority="high"`: é o elemento LCP da Início.

### Desvios em relação ao Figma

| Desvio | Motivo |
| --- | --- |
| Estados `:focus-visible` em todos os elementos interativos | O Figma não desenha foco, mas navegação por teclado com foco visível é requisito de acessibilidade. |
| Estados `disabled` | Não desenhados; seguem o mesmo padrão visual com contraste reduzido. |
| Link "Pular para o conteúdo" | Não existe no Figma; requisito de acessibilidade. |
| Tema fixo em dark | Não há frame claro no Figma. O `Toaster` do shadcn foi adaptado para dispensar o `next-themes`. |
| Perfil, Carteiras e Confirmação em mobile | Sem frame no Figma — versão responsiva derivada dos tokens e componentes base. |
| Ícones do carrinho e de saída como PNG do Figma | Os dois glifos foram exportados do frame (`public/icons/`). Entram como **máscara CSS** (`AppIcon`), não como `img`, para herdarem `currentColor` — o mesmo arquivo serve ao carrinho claro do header, ao botão "Entrar" (escuro sobre accent) e ao "Sair" do menu da conta. |
| Caixa "Carteiras compatíveis" presa à coluna | No frame ela sangra alguns pixels para fora da coluna de 230; em telas menores isso a jogava para fora do rodapé. A caixa ficou com `max-w-full` e o texto em 10px, o que a mantém em uma linha dentro da coluna. |
| Header autenticado (avatar + menu com "Meu perfil" e "Sair") | Todos os frames do Figma mostram o header deslogado. Refletir a sessão e permitir sair é requisito do enunciado, então a composição é nossa, com os mesmos tokens. |
| Header sem navegação, busca e carrinho | (Resolvido na Fase 3.) Entraram junto com o catálogo e as rotas que apontam: link para tela inexistente seria "fluxo apenas visual". |
| Contagem das facetas de coleção e rede | Os números do frame (239 em coleções, 283 em redes) não fecham entre si nem com a paginação de 36 itens que ele desenha. São exibidos como o design pede, mas declarados nas fixtures do MSW como tamanho de acervo, não contados no store — ver §7. O filtro em si opera sobre os itens reais. |
| Filtro de raridade na sidebar | Não está no frame. A raridade já existe no contrato e no detalhe; filtrar por ela é comportamento real, e o enunciado pede filtros combináveis. |
| Card do catálogo sem selo de raridade | Nenhuma das quatro páginas do frame desenha selo em card algum. A raridade continua sendo filtro combinável e atributo do detalhe. |
| Cartão "Oferta limitada" sem nome e preço | O frame mostra apenas os dois títulos e a arte. Nome e preço seguem no rótulo acessível do link, para quem não vê a imagem. |
| Filtros em gaveta no celular | O frame mobile os esconde atrás de um botão de 45px ao lado da busca. A gaveta é um diálogo do Radix, para herdar foco preso, `Esc` e devolução de foco. |
| Ordenação dentro da gaveta de filtros no celular | O frame de 414 não desenha ordenação ao lado das abas. Escondê-la sem destino a tornaria inalcançável no toque, então ela entra na gaveta, junto do resto da consulta (`CatalogSortMenu` é o mesmo componente nos dois tamanhos). |
| Header ausente em celulares | **Nenhum** frame mobile do Figma desenha o header — a Início abre pela busca, o detalhe e o carrinho por uma linha própria. O header passou a ser `md:` para cima e a barra inferior virou a navegação da tela. |
| Atalho de conta na barra inferior | Consequência do item acima: sem header, "Entrar", "Meu perfil" e "Sair" ficariam inalcançáveis no celular. O quarto glifo do frame (a pessoa) virou o controle de conta (`AccountShortcut`) — painel de autenticação para visitante, menu da conta com sessão. |
| Atalho central da barra leva ao Mercado | O frame desenha um botão de 65px com glifo de leitura de código, sem destino. Ler QR está fora do escopo; o botão virou o atalho de explorar o catálogo, com rótulo acessível — botão desenhado e inerte seria "fluxo apenas visual". |
| Coração sempre visível no card em celulares | O frame de 414 o mostra sobre a arte. No toque não existe ponteiro, e a faixa de ações que o desktop revela no `hover` deixaria favoritar inalcançável — é o mesmo botão, só a posição da faixa muda. |
| Casa da barra inferior sem o vão da porta | O glifo do frame é uma casa preenchida com um recorte de porta. Os ícones do `lucide` desenham a porta **antes** da casa, então preenchê-los fecha o recorte. A diferença é de 4px em um glifo de 18px; trocar o pacote de ícones por causa dela não se justifica. |
| Pontos do herói mobile com o inativo esmaecido | O frame de 414 pinta os três com o mesmo `#D28A4C`, o que deixaria o controle sem indicação do destaque corrente. Segue a mesma marcação do frame de 1440 (`bg-primary` / `bg-primary/40`), além do `aria-current`. |
| Herói mobile com altura mínima, não fixa | O frame fixa 190px em 414. Abaixo de 360px o texto não cabe nessa caixa; a altura vira mínima e a arte encolhe para 96px, para não haver conteúdo cortado nem rolagem horizontal. |
| "Criadores" e "Aprenda" sem destino | Páginas editoriais, que o enunciado §3 exclui da entrega. Continuam visíveis (o header é o do Figma) e dizem o que são ao serem acionadas. |
| Pontos do herói trocam o destaque | O frame desenha três pontos sem comportamento. Eles percorrem os NFTs em alta que a API devolve — controle desenhado e inerte seria "fluxo apenas visual". Não há rotação automática: movimento contínuo exigiria exceção para `prefers-reduced-motion` e instabilizaria a regressão visual. |
| "Compartilhar este NFT" com ações do navegador | O frame mostra marcas de terceiros (LinkedIn, e-mail, X). Publicar em rede social está fora do escopo, então as três ações viraram copiar o link, abrir o e-mail e a folha de compartilhamento do sistema — reais, nenhuma fingindo sucesso. |
| Avaliações de colecionadores | A aba existe no frame e precisava de dado. `NftDetail` ganhou `rating` e `reviews`, semeados de forma determinística a partir do slug. |
| Barra de compra do detalhe presa por `sticky`, não `fixed` | O frame a desenha colada à base. Com `sticky` ela flutua sobre o conteúdo enquanto há o que rolar e estaciona antes do rodapé, sem precisar de um vão fantasma reservado embaixo da página. |
| Barra de atalhos ausente no detalhe em celulares | O frame de 414 do detalhe não a desenha: ali a base pertence à barra de compra, e as duas empilhadas cobririam metade da tela. A rota entra em `ROUTES_WITHOUT_MOBILE_NAV`, e sai junto a folga que o layout raiz reserva para a barra. A saída da tela continua desenhada — a seta de voltar do topo. |
| Detalhe em celulares sem miniaturas da galeria | O frame de 414 mostra uma peça só. A arte continua abrindo em tamanho cheio, mas o gatilho passa a ser a própria imagem (o toque que o celular sugere), em vez da lupa do frame de 1440. |
| Abas e "Mais desta coleção" abaixo da folha no celular | O frame de 414 desenha só a primeira dobra. Cortá-las tiraria do celular a ficha técnica, as avaliações e o resto da coleção; elas seguem dentro da mesma superfície, para o fundo não se partir no meio da rolagem. |
| `/favoritos` | Não há frame. A rota existe porque a barra inferior do frame mobile traz o atalho de favoritos e porque "favoritos persistem para o usuário autenticado" precisa de um lugar onde isso seja verificável. Composição derivada dos tokens e da grade do catálogo. |
| Lixeira no canto do card de 414 | O frame desenha a lixeira **por cima** do "+" de um dos cards — as duas não cabem no mesmo lugar, e sem ela o celular ficaria sem remover. O seletor fica onde o frame o põe (uma linha só, centrado na altura do card) e a lixeira sobe para o canto superior direito, fora do fluxo: é o espaço vazio do card, e enfileirar quatro controles espremeria o nome do NFT abaixo de 414px. |
| Vão lateral de 16px no carrinho abaixo de 414 | O frame é desenhado em 414 com 28px de cada lado. Em 390 isso deixaria o nome do NFT sem largura para uma linha só; abaixo de 414 o vão cai para 16px, o que devolve ao texto exatamente a largura que ele tem no frame. |
| "Colecionadores também viram" sem os itens do carrinho | O frame repete na seção dois NFTs que estão na tabela logo acima. Sugerir o que a pessoa acabou de escolher não ajuda — os itens do carrinho saem da lista antes de ela ser paginada. |
| "Colecionadores também viram" ausente no frame de 414 | O frame mobile termina no painel do resumo, que é um bloco de fechamento de página (cantos superiores arredondados, colado à base). Emendar um carrossel depois dele contradiria o desenho. |
| "Continuar explorando" só no frame de 1440 | O frame de 414 não desenha o link; no celular a navegação é a barra de atalhos, que continua na tela. O estado vazio mantém o link nos dois tamanhos, porque ali ele é a única saída. |
| Confirmação ao remover item | Não existe no Figma. Remover é destrutivo e o frame não desenha desfazer, então a ação passa por um `alertdialog` do Radix (foco preso e devolvido à lixeira). |
| Botão de retirar o cupom aplicado | O frame só desenha "Aplicar". O enunciado §3 exige **aplicar e remover** cupom; o controle aparece apenas quando há cupom em vigor. |
| Seta de voltar no carrinho de 414 | O frame a desenha; ela usa o histórico do router e, sem histórico, leva ao Mercado — seta que não volta para lugar nenhum seria controle inerte. |
| `/pagamento` sem `h1` visível | O frame de 1440 abre direto na trilha e nos títulos das duas colunas. O nome da tela vive na trilha e no rótulo acessível de cada seção; o frame de 414 tem o título, e é ele que carrega o `h1`. |
| Formulário do colecionador ausente no frame mobile de pagamento | O Figma traz um frame mobile só ("Pagamento com carteira"), sem os campos do colecionador — que são obrigatórios e validados pelo servidor. Empilhá-los acima da lista de carteiras desfiguraria o frame, que ocupa a tela inteira com o CTA no rodapé. A tela continua sendo **uma só**, igual ao frame na primeira dobra: o formulário e o resumo do pedido descem para duas seções recolhidas (`details` nativo), no vão que o frame deixa entre o total e o CTA. "Confirmar compra" valida antes de enviar e, quando encontra campo inválido, **abre a seção e leva o foco ao primeiro erro** (`useCollectorDisclosure`) — parar o envio com os erros dentro de uma seção fechada não mudaria nada na tela. |
| Resumo do pedido recolhido no frame de 414 | O frame mostra só "Total: X ETH", e é ele que fica visível. Os itens, o cupom e as linhas de valor entram na segunda seção recolhida: sumir com eles deixaria o celular sem saber o que está comprando, e abri-los por padrão empurraria o "Confirmar compra" para fora da tela. A tela anterior (carrinho) mostra a mesma quebra por extenso. |
| Barra de atalhos ausente no pagamento em celulares | Mesma razão do detalhe: o frame termina no "Confirmar compra", e a barra passaria por cima do CTA além de oferecer saídas laterais no meio de um checkout. A rota entra em `ROUTES_WITHOUT_MOBILE_NAV`; a seta de voltar do topo continua sendo a saída desenhada. |
| Barra de atalhos ausente no carrinho em celulares | O frame de 414 não a desenha: a tela fecha no painel de resumo, colado à base, e a barra cobria justamente o total e o "Conectar e finalizar". A rota entra em `ROUTES_WITHOUT_MOBILE_NAV`, e com ela sai o vão que o layout raiz reservava. A saída desenhada é a seta de voltar do topo; entrar na conta a partir do carrinho continua acontecendo pelo "Conectar e finalizar", que cai no guard do pagamento. |
| Estado de conexão da carteira no frame de 1440 | O frame desenha o mundo em que a carteira já está conectada. Conexão, recusa e desconexão são simulações exigidas pelo enunciado, e precisam de um lugar onde o estado seja visível e reversível — sem isso, escolher a carteira desconectada travaria o CTA sem explicação. O bloco aparece **só** quando há algo a resolver, então o caminho feliz continua idêntico ao frame; desconectar segue disponível no menu dos cartões de 414. |
| "Trocar carteira" do frame de 414 | O frame mostra o rótulo ao lado de "Carteira conectada", com os dois cartões já selecionáveis logo abaixo. O controle virou o atalho correspondente: avança para a próxima carteira cadastrada, e fica desabilitado quando só existe uma — rótulo sem comportamento seria controle inerte. |
| Avisos de pedido pendente, incerto e recusado | O Figma desenha só o caminho feliz. Os três estados são exigidos pelo enunciado ("representar pedido pendente, confirmado e recusado") e seguem o padrão visual da coluna. |
| Bloco "o que mudou" no bloqueio da compra | Não existe no frame. O enunciado exige que mudanças de preço/disponibilidade **exijam nova confirmação**, e confirmar sem ver o que mudou não é confirmação. |
| Confirmação em mobile | Sem frame no Figma. O modal vira tela cheia abaixo de `sm`, na mesma ordem do frame de 1440 (arte, título, faixa de metadados, itens, totais, nota, CTA). |
| "Ver no Etherscan" sem navegação | A transação é simulada. Abrir um explorador real mostraria "não encontrado" e um link falso aparentaria sucesso funcional, que o enunciado proíbe; o botão explica isso no lugar. |
| Seletor "Nome ENS" com mais de um domínio | O frame mostra só `.eth`. Um seletor de uma opção é um controle inerte; as opções (`.eth`, `.kurio.eth`, `.xyz`) fazem dele uma escolha real. |
| Taxa de rede diferente da escrita no frame | O frame escreve `0.016 ETH` para 17 unidades. A taxa da simulação é parte fixa da rede mais parte por unidade (`NETWORK_FEES`) e dá outro valor — os números do frame são de vitrine, e a cotação da API é a referência do enunciado. |
| Rótulos e endereço das carteiras semeadas | As fixtures passaram a usar os nomes do frame de 414 ("Principal" e "Reserva"), o nome ENS `nova.kurio.eth` e um endereço cujo final mascarado reproduz o `0xA91F…E82C` do frame — é o mesmo texto que aparece no recibo. |
| Abas "Entrar \| Criar conta" apenas em 1440 | O frame de 414 não as desenha: anuncia a tela por um título ("Entrar" / "Criar perfil de colecionador") e joga a troca para o convite do rodapé. As abas do Radix continuam montadas nos dois tamanhos — são o dono do estado de aba —, mas abaixo de `sm` saem da tela com `hidden`, e não `sr-only`: uma aba invisível que ainda recebe o foco do teclado seria uma parada sem indicação. Quem opera por teclado no celular usa o rodapé, que é um botão de verdade. |
| X de fechar no painel de 414 | O frame mobile não o desenha. Sem ele, no toque não existe `Esc` e a única saída seria o "voltar" do navegador — um painel de tela cheia sem saída visível é uma armadilha. O X segue no mesmo lugar e com o mesmo tom do frame de 1440. |
| Rótulo do envio do cadastro ("Criar perfil" em 414, "Criar conta" em 1440) | Os dois frames escrevem rótulos diferentes. A troca é por `hidden`, e não por opacidade, para o nome acessível do botão continuar igual ao rótulo visível em cada tamanho. |
| Olho de mostrar/ocultar na confirmação de senha | O frame de 414 o desenha nos dois campos de senha; o de 1440, só em "Senha" (§5 do DESIGN_SPEC). Vale o de 1440 nos dois tamanhos: revelar a confirmação anula o que ela verifica, e um campo que se comporta de um jeito em cada largura é pior que a divergência de um ícone. |
| "Nome de usuário" com texto à esquerda no frame de 414 | O frame centraliza o `placeholder` do primeiro campo e alinha à esquerda os outros três. Quatro campos idênticos com um deles alinhado diferente lê-se como falha, não como intenção — todos seguem o alinhamento dos demais. |
| Rótulos dos campos apenas para leitor de tela | O design usa placeholder no lugar do rótulo. O `label` existe, associado ao campo (`sr-only`), porque placeholder não é rótulo acessível. |
| Barra lateral da conta em celulares | Perfil e Carteiras não têm frame de 414. A barra vira um `<details>` nativo recolhido, cujo `summary` nomeia a seção aberta — o elemento já entrega `aria-expanded`, teclado e foco, que um drawer exigiria reimplementar. Ver §5e. |
| Seções da conta fora do escopo ("em breve") | Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte estão fora da entrega (enunciado §3). Continuam desenhadas, mas com `aria-disabled`, selo visível e um aviso ao serem acionadas — nunca navegam nem aparentam sucesso. |
| "Adicionar" da carteira principal leva o foco ao formulário | Abrir um segundo bloco prometeria duas principais, e o servidor só mantém uma (promover outra rebaixa a anterior). Como atalho de foco o controle é honesto nos dois estados. |
| "Igual à carteira principal" não copia o endereço | O servidor recusa endereço repetido do mesmo dono; copiá-lo ofereceria um atalho que falharia no envio. A dica ao lado do controle diz isso. |
| Seletor de domínio ENS com 152px (frame: ~76px) | A lista tem domínios mais longos que o `.eth` desenhado. Na medida do frame, `.kurio.eth` apareceria cortado, e um controle que não deixa ler a própria escolha é pior que a diferença de largura. |
| Anel de foco declarado no primitivo `Input` | O `outline-none` do campo é uma utilidade e vencia a regra `:focus-visible` da camada base: o campo focado ficava só com a troca de cor da borda. Ver §5e. |

---

## 10. Testes

Playwright em Chromium, viewports 1440 (desktop) e 390 (mobile, perfil Pixel 5).
A regressão visual fica isolada no projeto `visual` (`*.visual.spec.ts`) para que
baselines desatualizadas não derrubem a suíte funcional. `trace`, `screenshot` e
`video` são retidos apenas em falha.

A divisão é: **vitest** verifica o contrato da camada de rede (seção 8) e
**Playwright** verifica os fluxos na interface. Os 12 cenários do enunciado entram
com as telas.

`e2e/foundation.spec.ts` cobre o que sustenta todo o resto: a Início montada com
o catálogo servido pelo MSW, um evento do servidor chegando pelo
`socket.io-client` e mudando a tela sem refetch, rota inexistente caindo no 404
da aplicação e o link de pular navegação aparecendo ao receber foco.

A Fase 2 acrescenta 17 casos, que rodam nos dois viewports:

| Arquivo | Cobre |
| --- | --- |
| `e2e/auth.spec.ts` | Cenário 3 do enunciado: cadastro (sucesso e conflito 409 no campo), login (sucesso e credencial inválida), sessão após refresh, submit pendente sem duplo-envio, logout e troca de usuário sem vazamento. |
| `e2e/private-routes.spec.ts` | Acesso direto e refresh de rota protegida, retomada do destino após autenticar e expiração — descoberta na navegação e no refresh. |
| `e2e/auth-a11y.spec.ts` | Cenário 11: abertura por teclado, foco preso, `Esc` fechando com retorno de foco, setas nas abas, erro associado ao campo, alternância de senha e ações fora do escopo que não simulam sucesso. |

A Fase 3 acrescenta 24 casos por viewport mais a regressão visual de duas telas:

| Arquivo | Cobre |
| --- | --- |
| `e2e/catalog.spec.ts` | Cenário 1: busca (com refresh), filtros combináveis reiniciando a paginação, ordenação, abas, paginação com ida e volta pelo histórico, resultado vazio e respostas fora de ordem. |
| `e2e/nft-detail.spec.ts` | Cenário 2: acesso direto por URL, refresh, recurso inexistente com saída, galeria, limite de quantidade, edição esgotada, compra sem sessão levando ao painel (o que ela faz **com** sessão está em `cart.spec.ts`) e `nft.updated` (inclusive reentrega, que não regride o estado). |
| `e2e/favorites.spec.ts` | Cenário 4: visitante levado ao painel, favoritar/desfavoritar com persistência, **falha da mutation com rollback e recuperação**, isolamento entre usuários e a rota privada de favoritos. |
| `e2e/loading-states.spec.ts` | Cenário 12 (parte desta fase): esqueletos em rede lenta no catálogo e no detalhe, erro com nova tentativa nos dois, catálogo vazio e atualização em segundo plano marcada com `aria-busy`. |
| `e2e/catalog-a11y.spec.ts` | Cenário 11 nas telas desta fase: filtros e paginação acionados por teclado com estado anunciado, setas nas abas, região viva do resultado, alternativa textual das artes e o diálogo da arte com foco preso e devolvido. |
| `e2e/visual/catalog.visual.spec.ts` | Regressão visual de Início e Detalhe em 1440 e 390, com cenário fixo, reset e animações desligadas na captura. |

A Fase 4 acrescenta 13 casos por viewport mais duas baselines:

| Arquivo | Cobre |
| --- | --- |
| `e2e/cart.spec.ts` | Cenário 5: inclusão pelo catálogo e pelo detalhe (com e sem sessão), alteração de quantidade **incluindo a tentativa de exceder a disponibilidade**, remoção com confirmação, cupom válido e recusado (inexistente e expirado) sem derrubar o resumo, conferência do resumo **contra o corpo da cotação**, persistência após refresh, **carrinho de visitante preservado no login** (com as quantidades), `nft.updated` mudando linha e resumo com aviso, evento reentregue e evento antigo que não regridem nada, apara por queda de disponibilidade, carrinho vazio e o gate de sessão do "Conectar e finalizar". |
| `e2e/visual/cart.visual.spec.ts` | Regressão visual do Carrinho em 1440 e 390, com carrinho semeado de itens e quantidades fixos — sem isso, subtotal, taxa e total mudariam a cada execução. |

Dois cuidados que esta fase impôs aos testes, e que descrevem o comportamento:

1. **Mais de uma cotação pode estar em voo** (a do carregamento e a que a
   interação provocou). O helper `waitForQuote` recebe um reconhecedor (`coupon`
   aplicado, preço novo na linha) em vez de prender a primeira resposta que
   passar — comparar a tela com uma cotação que ela já substituiu seria um
   falso negativo intermitente.
2. **O ícone de carrinho do card só existe a partir de `lg`.** O caso de inclusão
   pelo catálogo é pulado no viewport de 390, onde o caminho desenhado é o
   detalhe — que tem caso próprio.

O helper `seedCart` prepara o cenário falando com a **mesma API** que a interface
usa (`POST /cart/items`, com o `x-guest-id` que o app já criou). Não escreve em
storage nem no cache: é preparação, e incluir pela interface tem teste próprio.

**Como os testes controlam o tempo e a falha.** Nenhum usa `waitForTimeout` nem
intercepta rota: a latência vem do cenário `slow`, a falha do `server-error` ou
do `favorite-error`, e os eventos de tempo real são disparados pelo endpoint de
controle — ou seja, saem do servidor simulado e chegam pelo `socket.io-client`.
`switchScenario` troca a condição **sem ressemear**, que é o que permite
verificar a recuperação depois de uma falha sem derrubar a sessão junto.

Duas armadilhas que os testes precisaram respeitar, e que valem como
documentação do comportamento:

1. **A grade anterior continua na tela durante a nova consulta**
   (`keepPreviousData`). Ler os nomes antes de `aria-busy="false"` devolveria o
   resultado do filtro anterior — por isso o helper espera o atributo.
2. **O update de favorito é otimista.** Recarregar logo após o clique cancelaria
   a requisição em voo; o teste espera a resposta da mutation antes de verificar
   a persistência.

A Fase 5 acrescenta 13 casos por viewport mais três baselines:

| Arquivo | Cobre |
| --- | --- |
| `e2e/checkout.spec.ts` | Cenários 6 e 7: compra completa do catálogo ao recibo confirmado **pela simulação**, remoção do carrinho **apenas** dos itens comprados (um item entra no carrinho entre a criação e a confirmação, e sobrevive), pagamento recusado preservando os itens e sem recibo, clique repetido no mesmo quadro criando um único pedido, timeout com recuperação do **mesmo** pedido pela chave de idempotência, validação dos campos obrigatórios sem enviar nada, foco preso e devolvido no recibo, e a conexão de carteira recusada que não deixa confirmar. |
| `e2e/checkout-realtime.spec.ts` | Cenários 9 e 10: `nft.updated` durante o checkout bloqueando a confirmação e exigindo nova confirmação explícita (com o que mudou na tela), o cenário `price-changed` bloqueando antes do envio, evento antigo que não regride nem reaplica o bloqueio, `order.updated` duplicado e recusa posterior recusados pela terminalidade, refresh com pedido pendente retomando o **mesmo** pedido e a reconexão reconciliando pelo REST. |
| `e2e/visual/checkout.visual.spec.ts` | Regressão visual do Pagamento em 1440 e 390 e da Confirmação, com carrinho semeado fixo. O hash da transação e a data são **mascarados** na captura: mudam a cada compra e derrubariam a baseline sem nenhuma mudança de código. |

Três coisas que esta fase impôs aos testes, e que descrevem o comportamento:

1. **Os testes descrevem o fluxo, não a composição.** `fillCollectorForm` e
   `waitForSummary` revelam a seção recolhida quando ela existe (414) e não
   fazem nada quando não (1440); `connectWallet` usa a ação em linha no desktop
   e o menu do cartão no celular; `addFirstNftToCart` decide pela **largura** da
   janela, e não por `isVisible()` — a faixa de ações do card nasce com
   opacidade zero, e "visível" para o Playwright inclui elementos
   transparentes.
2. **Duplicidade é um fato do servidor.** As afirmações de "criou um pedido" leem
   `GET /orders`, não a tela. O helper desconta o pedido já semeado na conta da
   Ana, que não pertence a nenhum teste.
3. **O desvio pós-cotação acontece uma vez por cenário.** Os cenários
   `price-changed` e `sold-out` mudavam o mercado a **cada** cotação; como a tela
   recotiza sozinha quando o preço muda (a versão do NFT está na assinatura da
   cotação), isso produzia uma escalada sem fim e o resumo nunca assentava. Uma
   vez basta para o pedido seguinte cair em conflito, que é o que o cenário existe
   para provar — e `resetQuoteDrift` devolve o estado no reset e na troca de
   cenário.

A Fase 6 acrescenta 22 casos por viewport mais quatro baselines:

| Arquivo | Cobre |
| --- | --- |
| `e2e/profile.spec.ts` | Cenário 8 (perfil): edição dos dados com persistência após refresh, conflito de e-mail da API caindo **no campo** sem gravar nada, validação do cliente antes de ir à rede, avatar alterado e removido (com a remoção sobrevivendo ao refresh), arquivo de formato recusado **sem** chamar a API, troca de senha com a nova credencial passando a valer, confirmação divergente recusada no cliente, senha atual incorreta vinda da API no campo certo, e salvar só os dados sem exigir senha. |
| `e2e/wallets.spec.ts` | Cenário 8 (carteiras): cadastro da secundária com persistência, atualização da principal (a mesma carteira, não uma segunda), "Igual à carteira principal" copiando tudo menos o endereço, o `409` de endereço repetido caindo no campo, validação do cliente sem requisição, e a carteira cadastrada aqui passando a existir no pagamento. |
| `e2e/account-a11y.spec.ts` | Cenário 11 nestas telas: campos com nome acessível (inclusive o input de arquivo), anel de foco, o olho de senha com `aria-pressed`, selects e radio por teclado, as seções fora do escopo alcançáveis por Tab que anunciam indisponibilidade e **não navegam**, "Sair" pela barra lateral, e os esqueletos das duas telas em rede lenta (cenário 12). |
| `e2e/visual/account.visual.spec.ts` | Regressão visual de Perfil e Carteiras em 1440 e 390, com a conta da Ana — que tem as duas carteiras semeadas, então os dois blocos do frame aparecem preenchidos. A baseline de 390 registra o desvio mobile documentado em §5e. |

Dois cuidados que esta fase impôs aos testes, e que descrevem o comportamento:

1. **Sair de uma rota privada já abre o painel de autenticação**, porque o guard
   assume assim que a sessão cai. Entrar com outra conta em seguida não pode
   passar por "clicar em Entrar" — o painel está cobrindo esse botão. O helper
   `switchAccount` sai da rota protegida antes de entrar de novo, que é o que o
   usuário faria; o caso da senha trocada usa o painel aberto pelo guard de
   propósito, porque ele também exercita a retomada do destino.
2. **A navegação da conta está recolhida no celular.** `openAccountNav` abre o
   `<details>` quando ele existe e não faz nada no desktop — os itens não
   existem para o teste enquanto não existem para o usuário.

As afirmações de isolamento leem os **dois** lados: o dado do segundo usuário
está na tela e o do primeiro não, e `readWallets` confirma pelo servidor o que
ficou gravado, sem depender do que a tela mostra.

As baselines visuais são versionadas com sufixo de plataforma
(`-visual-win32.png`), porque a renderização de fonte difere entre sistemas.
Em outro sistema operacional elas precisam ser regeradas uma vez
(`pnpm test:visual --update-snapshots`) e versionadas ao lado das atuais.

**Isolamento de estado.** Cada teste roda em um contexto de navegador novo
(storage vazio) e o helper `startApp` (`e2e/support/mocks.ts`) seleciona o
cenário por `?scenario=` e chama o reset **de dentro da página**
(`page.evaluate`): os endpoints de controle vivem no service worker do MSW, e
uma requisição feita pelo `request` do Playwright não passaria por ele. Onde o
teste depende de tempo (estado pendente do submit), o cenário `slow` é quem
fornece a latência — nada de `waitForTimeout`.

---

## 11. Performance

Configuração versionada em `lighthouse.config.mjs`; o runner
(`scripts/lighthouse.mjs`) sobe o `preview`, roda 3 medições por página e perfil,
publica a **mediana** por categoria e registra LCP, CLS e TBT em
`lighthouse-report/summary.json`. O processo termina com código 1 se alguma
mediana ficar abaixo da meta (Perf ≥ 90 · A11y ≥ 95 · BP ≥ 95 · SEO ≥ 90).

### Medição da Fase 3 (telas reais)

Mediana de 3 execuções por página e perfil, build de produção com os mocks
ligados (o cenário `default`), em `vite preview`:

| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | desktop | **99** | **100** | 100 | 92 | 969 ms | 0.008 | 0 ms |
| Início | mobile | **87** | **96** | 100 | 92 | 3523 ms | 0.011 | 132 ms |
| Detalhe | desktop | **99** | **100** | 100 | 92 | 921 ms | 0.004 | 0 ms |
| Detalhe | mobile | **82** | **100** | 100 | 92 | 3960 ms | 0 | 194 ms |

**O que a auditoria encontrou e o que foi corrigido.** A primeira medição das
telas reais reprovou em três pontos, todos consertados:

| Problema | Medida | Correção |
| --- | --- | --- |
| CLS 0.237 no detalhe | O esqueleto cobria só a primeira dobra; ao chegar o recurso, abas e "mais desta coleção" empurravam o rodapé. | O esqueleto passou a reservar a **página inteira** (CLS 0.004). |
| `aria-valid-attr-value` na Início | O recorte do catálogo usava `tablist` do Radix sem painéis: cada gatilho apontava `aria-controls` para um id inexistente. | Viraram botões de alternância (`aria-pressed`) — o que eles mudam é a consulta, não um painel. |
| `heading-order` na Início | A sidebar abria em `h3` sem um `h2` antes. | Títulos só para leitor de tela nas seções de catálogo e promoções. |
| `target-size` na Início | Os pontos do herói tinham 10px de área de toque. | O ponto continua com 10px; o botão passou a 24px. |

Com isso a Início saiu de A11y 91 para 96 e o detalhe para 100, e o detalhe no
desktop foi de 87 para 99.

**Por que mobile ainda fica em 87 / 82.** A causa é a mesma das fases
anteriores, agora medida com conteúdo real: o worker do MSW (~177 kB do bundle
`browser`, 101 kB deles sem uso na primeira tela) é carregado e **aguardado
antes do primeiro render**, porque é o que garante que o `socket.io-client`
encontre o `WebSocket` já interceptado (seção 6). Sob o throttling móvel do
Lighthouse isso adia o primeiro paint, e a arte do herói — o elemento LCP — só
começa a baixar depois disso. No desktop, sem throttling, o mesmo caminho dá 99.

Uma tentativa de atalho foi medida e **descartada**: pré-carregar a arte do
herói (`<link rel="preload" as="image">`) piorou o LCP móvel de 3,5 s para
5,1 s, porque a imagem de 350 kB passou a disputar banda com o JavaScript
crítico no perfil móvel. Fica registrado para não ser tentado de novo.

O caminho que sobra é o já previsto: separar o shell da página do carregamento
do worker (pintar cabeçalho e esqueletos antes de `startMocks()`, adiando a
espera para o primeiro uso de rede) e servir as artes em formato moderno com
tamanhos por viewport — hoje a arte do herói é um PNG de 450×450 exibido a
120px no celular, porque é o único arquivo que o Figma entregou (ver §9). Os
dois são trabalho da fase de performance; CLS e TBT já estão folgados, e
Best Practices está em 100 nos quatro cenários.

**SEO 92 nos quatro** é estrutural desta entrega: a aplicação é renderizada no
cliente e a auditoria aponta a ausência de conteúdo no HTML inicial. Renderizar
no servidor está fora do escopo de um desafio de front-end com backend simulado.


### Linha de base anterior (página placeholder)

| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT | Fase |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Início | desktop | 100 | 100 | 100 | 91 | 795 ms | 0.001 | 0 ms | 1 |
| Início | mobile | **89** | 100 | 100 | 91 | 3490 ms | 0.016 | 38 ms | 1 |
| Início | desktop | 100 | 100 | 100 | 91 | 770 ms | 0.001 | 0 ms | 2 |
| Início | mobile | **87** | 100 | 100 | 91 | 3563 ms | 0.016 | 127 ms | 2 |

As duas primeiras fases mediram uma página placeholder; a Fase 3 mede as telas
de verdade (acima). A performance móvel já era limitada pelo mesmo ponto — o
worker do MSW aguardado antes do primeiro render.

---

## 12. Ferramentas — decisões

**oxlint no lugar do ESLint.** O `typescript-eslint` recusa explicitamente o
TypeScript 7 (`typescript-eslint does not support TS 7.0`) e a alternativa
sugerida — rodar lado a lado com a API do TypeScript 6 — não é viável porque não
existe TS 6 estável publicado (apenas `6.0.0-beta`). Entre baixar o compilador
para uma linha antiga e trocar o linter, trocamos o linter: o `oxlint` analisa
TS/JSX sem depender da API do compilador, cobre `react/rules-of-hooks`,
`react/exhaustive-deps` e as regras de acessibilidade `jsx-a11y`. A checagem de
tipos de verdade continua sendo o `tsc -b`, na última versão estável.

**`jsx-a11y/control-has-associated-label` não vale para células de tabela.** A
regra do oxlint trata `td`/`th` como controles e exige texto até dois níveis de
profundidade. Uma célula de dados com miniatura e nome em duas linhas passa disso
por construção, e o aviso era falso — a célula não é um controle. `td` e `th`
entraram em `ignoreElements` (`.oxlintrc.json`), preservando o resto da regra.

**`src/routeTree.gen.ts` é versionado.** É gerado pelo plugin do TanStack Router
durante `dev`/`build`, mas `pnpm build` roda `tsc -b` primeiro; versionar o
arquivo faz o build funcionar a partir de um checkout limpo. Ele está fora do
lint.

**`cn` configurado com a escala tipográfica do projeto** (`src/lib/utils.ts`).
O merge de classes do Tailwind resolve conflitos por grupo, e ele não conhece
`text-body`/`text-title`: por serem `text-*` desconhecidos, eram tratados como
**cor**. O efeito era silencioso e errado — `text-body text-tan` no mesmo
elemento descartava o tamanho (campos renderizavam em 16px, não 14), e
`text-primary-foreground text-body-lg` descartava a cor (o texto do CTA saía
claro, não escuro). Declarar a escala como `font-size` devolve a regra correta:
tamanho conflita com tamanho, cor com cor. Por isso os primitivos importam `cn`
de `@/lib/utils`, e não direto do pacote.

**Retorno de foco do painel é explícito** (`useReturnFocus`). O Radix devolve o
foco sozinho quando o diálogo é aberto pelo `DialogTrigger` dele; aqui a abertura
é uma **navegação** (o painel é estado de URL), então não há gatilho que ele
conheça, e fechar com `Esc` deixava o foco no `body` — medido, em dev e no build
de produção. O hook guarda quem estava focado na abertura e refoca no
fechamento, se o elemento ainda estiver no documento.

**`.env.development` e `.env.production` são versionados.** Não contêm segredo
algum (o backend é simulado) e precisam existir no checkout limpo e no build da
Vercel. `.env` e `.env.local` continuam ignorados.
