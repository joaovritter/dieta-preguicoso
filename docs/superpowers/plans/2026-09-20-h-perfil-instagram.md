# Plano H — Perfil estilo Instagram, foto de perfil, configurações e feed redesenhado

> **Modelo:** cada tarefa é implementada por subagente **Sonnet**; a sessão coordena e revisa.

**Goal:** O próprio perfil do usuário vira uma tela estilo Instagram (foto, nome, contadores de
seguidores/seguindo/posts, abas de publicações/grupos/comentários), com foto de perfil de verdade
(upload), um ícone de engrenagem que abre as configurações (conta/perfil/notificações/metas)
separadas do perfil em si, e o card de post no feed fica com separação visual mais clara,
inspirada em Instagram/X.

**Contexto levantado no código atual:**
- Não existe follow assimétrico — **decisão confirmada pelo usuário: continua sem existir.** O app
  só tem "amigos" (amizade mútua, aceite dos dois lados — `backend/src/repos/social.ts`). Os
  números de "seguidores" e "seguindo" do novo perfil **reaproveitam a contagem de amigos**: os
  dois mostram o mesmo valor. Nenhuma tabela nova de follow.
- Não existe foto de perfil hoje — `frontend/src/components/social/Avatar.tsx` só desenha iniciais
  a partir do nome (`corDoAvatar`/`inicial` de `frontend/src/lib/social.ts`). `Perfil.tsx` (o
  próprio perfil) nem usa esse componente, tem um círculo de iniciais inline próprio.
  `PerfilPublico.tsx` é o perfil de outra pessoa e já mostra calendário + feed de refeições — é a
  referência mais próxima de layout "estilo Instagram" que já existe no app.
- Upload de arquivo já tem um padrão pronto: `backend/src/lib/uploads.ts` (multer, `uploadImagem`,
  limite 10MB, salva com nome gerado por UUID, serve em `/uploads/:nome`), e
  `frontend/src/lib/api.ts` já tem um helper `arquivoForm`/`formData` usado em
  `registroFoto`/`registroAudio`. Reaproveitar os dois.
- `CardPost.tsx` já é MUI; hoje tem header (avatar+nome+refeição+tempo), imagem opcional, texto,
  rodapé (curtir/comentar). O pedido de "separação inspirada em Instagram/X" é sobre respiro
  visual entre posts consecutivos no feed (divisores, espaçamento, talvez borda/cartão mais
  definido), não uma reescrita de dados.
- Não existe hoje listagem de "meus comentários" (comentários que o usuário fez em posts de
  outros) nem contagem total de posts por pessoa — precisam de queries novas.
- `Perfil.tsx` hoje é uma lista de configurações (metas, modo preguiçoso, refeições, identidade,
  aparência, conta) — vai virar a tela de **configurações** (atrás da engrenagem), separada da
  nova tela de **perfil** (estilo Instagram).

## Global Constraints

- **Sem sistema de seguir novo.** "Seguidores" e "seguindo" no header do perfil = contagem de
  amigos, repetida nos dois números. Não crie migration nem endpoint de follow.
- Foto de perfil é opcional — sem foto, cai no avatar de iniciais que já existe
  (`Avatar.tsx`, ajustado para aceitar uma URL opcional).
- Reaproveite o padrão de upload existente (`uploadImagem` no backend, `arquivoForm`/`formData` no
  frontend) — não invente um novo mecanismo de upload.
- "Notificações" nas configurações é **placeholder** nesta primeira versão: uma tela/seção que
  existe na navegação mas sem preferências reais ainda (sem sistema de notificação por trás).
- Domínio em português, termos técnicos em inglês. SQL puro, sem ORM. Toda entrada de rota
  validada com Zod. Testes Vitest só de função pura, sem rede/DOM.
- Estilo só com MUI (`sx`/`styled`) e o tema de `frontend/src/theme/tema.ts`. Animação com Motion,
  respeitando `useReducedMotion`. Sem CSS puro novo.
- Commits em português, frase imperativa curta, terminando com as linhas de atribuição da sessão.
- Verificação de cada tarefa: `npm test && npm run typecheck` (e `npm run build` quando tocar
  frontend) nos lados que a tarefa tocar.

---

### Task 1: Contrato + migration (foto de perfil, esconder comentários, contagem de posts)

**Files:**
- Create: `backend/src/db/migrations/006_perfil_instagram.sql`
- Modify: `docs/api-contract.md`
- Modify: `backend/src/domain/tipos.ts`, `frontend/src/lib/types.ts`

**Steps:**
1. Migration: adiciona à tabela `users` duas colunas — `foto_url TEXT` (nullable) e
   `esconder_comentarios_perfil BOOLEAN NOT NULL DEFAULT false`. Numeração/imutabilidade igual às
   migrations anteriores (confira o número mais recente antes de nomear — deve ser 006, mas
   confirme).
2. Tipo `Perfil` (backend e frontend) ganha `foto_url: string | null` e
   `esconder_comentarios_perfil: boolean`.
3. Tipo `PerfilPublico` (usado em `PerfilPublico.tsx`/rotas sociais — confira o nome exato do tipo
   no contrato) ganha `foto_url: string | null`, `total_posts: number`, e o número de amigos (se
   ainda não existir um campo assim, adicione `total_amigos: number` — confira se já existe algo
   equivalente antes de duplicar).
4. `Post.autor` (tipo usado pelo feed/`CardPost`) ganha `foto_url: string | null`.
5. Documente no `api-contract.md`: os novos campos nos tipos, e que "seguidores"/"seguindo" no
   cliente são o mesmo valor de `total_amigos` (deixe explícito no contrato que não existe
   endpoint de seguir).
6. `npm run migrate` contra o Postgres local para confirmar que a migration aplica sem erro.
7. Commit.

---

### Task 2: Upload e remoção de foto de perfil (backend)

**Files:**
- Modify: `backend/src/routes/me.ts`
- Modify: `backend/src/repos/usuarios.ts`

**Interfaces:**
- `POST /api/me/foto` (multipart, campo `arquivo`, usa `uploadImagem` de `backend/src/lib/uploads.ts`)
  → `200 Perfil` com `foto_url` atualizado.
- `DELETE /api/me/foto` → `200 Perfil` com `foto_url: null` (volta pro avatar de iniciais). Se
  havia uma foto salva, apague o arquivo antigo do disco (`caminhoDaMidia`/`unlink`, seguindo o
  padrão que já deve existir em algum lugar do app para mídia de registros — confira antes de
  reinventar).

**Steps:**
1. Implemente as duas rotas, salvando `foto_url` via `urlDaMidia(nomeArquivo)` (já existe em
   `uploads.ts`).
2. Ao subir uma foto nova por cima de uma existente, apague o arquivo antigo do disco (evitar
   acumular lixo).
3. TDD onde fizer sentido (validação de campos, erro quando não há arquivo).
4. `npm test`, `npm run typecheck` em `backend/`.
5. Atualize `docs/api-contract.md` com as duas rotas novas.
6. Teste funcional real contra o Postgres/disco local se possível (upload de um arquivo pequeno de
   teste, confere `foto_url`, remove).
7. Commit.

---

### Task 3: Contagem de posts e propagação de `foto_url` nas consultas existentes

**Files:**
- Modify: `backend/src/repos/social.ts`, `backend/src/repos/registros.ts`, `backend/src/repos/interacoes.ts`
  (confira exatamente onde cada SELECT relevante está antes de editar)

**Steps:**
1. Toda consulta que hoje faz `JOIN users` para montar autor/perfil de post, membro de grupo, item
   de lista de amigos, etc. passa a trazer `u.foto_url` também (mesmo padrão usado no Plano D para
   propagar `curtidas`/`curti`/`comentarios` — segue o mesmo estilo de subquery/join já
   estabelecido).
2. Adicione a contagem de posts (`total_posts`) na consulta de perfil público (e no próprio
   `GET`/`PUT /api/me`, se fizer sentido reaproveitar o mesmo formato de resposta) — uma
   `COUNT(*)` em `registros` filtrado por usuário.
3. Confirme que a contagem de amigos (`total_amigos`) já existe em algum lugar reaproveitável
   (função/query de `repos/social.ts`) — se não existir isolada, extraia.
4. `npm test`, `npm run typecheck` em `backend/`.
5. Commit.

---

### Task 4: "Meus comentários" — listagem para a aba Comentários do perfil

**Files:**
- Modify: `backend/src/repos/interacoes.ts`
- Modify: `backend/src/routes/social.ts` (ou `me.ts`, o que fizer mais sentido dado o padrão de
  rotas existente — confira antes)
- Modify: `docs/api-contract.md`

**Interfaces:**
- `GET /api/me/comentarios` (ou equivalente) → lista paginada dos comentários feitos pelo usuário
  logado, cada item com o texto do comentário, data, e referência mínima ao post comentado (id do
  registro, autor do post, trecho/descrição) para o cliente linkar de volta.

**Steps:**
1. Implemente a query e a rota, seguindo o padrão de paginação já usado no feed
   (`GET /api/social/feed`, `proximo_antes`).
2. TDD.
3. `npm test`, `npm run typecheck`.
4. Documente no contrato.
5. Commit.

---

### Task 5: Frontend — `Avatar` aceita foto real

**Files:**
- Modify: `frontend/src/components/social/Avatar.tsx`

**Steps:**
1. `Avatar` ganha uma prop opcional (ex: `fotoUrl?: string | null`). Quando presente, renderiza a
   imagem (`<Box component="img">`, `objectFit: cover`, mesmo tamanho/borderRadius circular);
   quando ausente/nula, mantém o comportamento atual (iniciais).
2. `npm run typecheck`, `npm test` em `frontend/`.
3. Commit.

---

### Task 6: Frontend — upload de foto de perfil (UI)

**Files:**
- Modify: `frontend/src/lib/api.ts` (novas funções `enviarFotoPerfil`/`removerFotoPerfil`, seguindo
  o padrão de `arquivoForm` já existente)
- Create: componente de upload (onde fizer mais sentido — provavelmente dentro do novo header do
  perfil da Task 8, ou um componente isolado reaproveitável)

**Steps:**
1. Input de arquivo (imagem) escondido atrás de um botão/toque no próprio avatar do header, ou um
   botão "editar foto" explícito — decida pelo padrão visual mais próximo do resto do app.
2. Preview otimista enquanto envia (ou um spinner simples) — sem exigir nada elaborado.
3. Chama `enviarFotoPerfil`, atualiza o `Perfil` em memória/contexto.
4. Opção de remover a foto (volta pro avatar de iniciais).
5. `npm test`, `npm run typecheck`, `npm run build`.
6. Checagem visual manual fora do escopo do subagente.
7. Commit.

---

### Task 7: Configurações — separa `Perfil.tsx` atual numa tela própria atrás da engrenagem

**Files:**
- Rename/Modify: o conteúdo atual de `frontend/src/pages/Perfil.tsx` migra para uma nova página de
  configurações (ex: `frontend/src/pages/Configuracoes.tsx`), organizada em sub-seções: **conta**
  (trocar senha, desativar conta — reaproveita `SecaoConta`), **perfil** (dados pessoais, nome,
  identidade — reaproveita o que hoje é `/perfil/dados`), **notificações** (placeholder — uma tela
  simples avisando "em breve" ou similar, sem lógica), **metas** (reaproveita `/perfil/metas` e a
  Task 4 do Plano G se ainda não tiver sido feita).
- Modify: `frontend/src/App.tsx` — rota da engrenagem (ex: `/configuracoes`), acessível a partir de
  um ícone de engrenagem no canto superior direito da nova tela de perfil (Task 8).

**Steps:**
1. Decida a estrutura mais simples: uma lista de entrada (conta/perfil/notificações/metas) igual
   ao padrão de `LinhaLista` que já existe, cada uma navegando pra sua subtela (as de
   perfil/metas/conta já existem como subtelas do Plano B/E — só mudam de onde são acessadas).
2. Garanta que nenhuma rota existente quebra (ex: `/perfil/dados`, `/perfil/metas`,
   `/perfil/senha`, `/perfil/refeicoes` continuam funcionando, só a entrada principal muda de
   lugar).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Commit.

---

### Task 8: Nova tela de perfil (própria) estilo Instagram

**Files:**
- Rewrite: conteúdo de `frontend/src/pages/Perfil.tsx` (ou crie um arquivo novo e aponte a rota
  `/perfil` pra ele — decida pelo que for mais simples dado o resultado da Task 7)
- Create: componentes de apoio se fizer sentido dividir (ex: header do perfil, abas)

**Steps:**
1. Header: foto (via `Avatar` da Task 5, com upload da Task 6), nome, `nome#tag`, e uma linha com
   três números — **seguidores** / **seguindo** / **posts** — onde seguidores e seguindo mostram o
   mesmo valor de `total_amigos` (Task 3) e posts mostra `total_posts` (Task 3). Ícone de
   engrenagem no canto superior direito, navegando para `/configuracoes` (Task 7).
2. Abas: **Publicações** (feed de registros do próprio usuário — reaproveite o que
   `PerfilPublico.tsx` já faz com `api.refeicoesDe`/`useFeed`, adaptado para o próprio usuário),
   **Grupos** (lista dos grupos que o usuário participa — reaproveite dados/rotas já existentes de
   grupos), **Comentários** (lista de `GET /api/me/comentarios` da Task 4) — a aba Comentários só
   aparece se `esconder_comentarios_perfil` for `false`.
3. Toggle "esconder comentários no meu perfil" vai na subtela de configurações > perfil (Task 7),
   chamando `PUT /api/me` com o novo campo.
4. `npm test`, `npm run typecheck`, `npm run build`.
5. Checagem visual manual fora do escopo do subagente.
6. Commit.

---

### Task 9: `PerfilPublico.tsx` usa foto real e contadores reais

**Files:**
- Modify: `frontend/src/pages/PerfilPublico.tsx`

**Steps:**
1. Passa `fotoUrl` pro `Avatar` a partir do novo campo do perfil público.
2. Mostra os mesmos três contadores do header (seguidores/seguindo = amigos, posts = total_posts),
   consistente com a Task 8, mas sem os controles de edição (é o perfil de outra pessoa).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Commit.

---

### Task 10: `CardPost` — separação visual inspirada em Instagram/X

**Files:**
- Modify: `frontend/src/components/CardPost.tsx`
- Modify: qualquer componente de lista que renderize vários `CardPost` em sequência (feed geral,
  perfil, grupo) para garantir espaçamento/divisores consistentes entre posts

**Steps:**
1. `Avatar` do card passa a usar `foto_url` do autor (Task 3/5), com fallback pra iniciais.
2. Melhore a separação visual entre posts consecutivos: espaçamento vertical mais generoso e/ou
   divisor sutil entre cards, cabeçalho do autor mais destacado (nome com peso maior, avatar um
   pouco maior), rodapé de ações (curtir/comentar) com mais respiro — sem inventar nada fora dos
   tokens do tema já definidos (`neutro.linha`/`neutro.borda` pra divisores, por exemplo).
3. Sem mudar a estrutura de dados nem o comportamento de curtir/comentar — é só ajuste visual.
4. `npm test`, `npm run typecheck`, `npm run build`.
5. Checagem visual manual fora do escopo do subagente.
6. Commit.

---

### Task 11: Revisão final

**Steps:**
1. Rode a suíte completa (`npm test`, `npm run typecheck`, `npm run build`) em `backend/` e
   `frontend/`.
2. Confirme que nenhuma rota antiga do perfil (`/perfil/dados`, `/perfil/metas`, `/perfil/senha`,
   `/perfil/refeicoes`) ficou inacessível depois da Task 7.
3. Confirme que "seguidores" e "seguindo" mostram o mesmo número em todo lugar que aparecem, e que
   não existe nenhum endpoint/tabela de follow criado por engano.
4. Teste funcional real se possível: upload de foto de perfil, ver ela aparecer no feed e no
   perfil público de outra conta amiga, comentar em um post e ver aparecer na própria aba
   Comentários, esconder a aba Comentários pela configuração.
5. Reporte qualquer pendência.
