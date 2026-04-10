# Auditoria de performance (Linkora)

Data da revisão: branch `chore/performance-audit`, após merge do portfólio na `main`.

## O plano gratuito do Supabase atrapalha?

**Pode contribuir**, mas não explica sozinho a lentidão:

- Cold start do projeto serverless (Vercel/outro) + latência até o pool do Supabase.
- Muitas **round-trips** (várias queries ou várias URLs assinadas em sequência) multiplicam o tempo de ida e volta.
- **Storage**: cada `createSignedUrl` é trabalho extra; dezenas de prestadores × avatar + portfólio = muitas chamadas.

O gargalo mais grave encontrado estava **no código**, não só no plano (ver abaixo).

---

## Correções aplicadas nesta branch

### 1. Página pública do prestador (`/professionals/[slug]`)

**Problema:** `getPublicProfessionalBySlug` chamava `getPublicProfessionalsAndCategories()`, que carrega **todos** os prestadores ativos, todos os serviços, contatos WhatsApp em lote e **uma URL assinada de avatar por prestador**. Isso era usado em `generateMetadata` **e** a página já carregava o detalhe outra vez — na prática, metadata sozinho já podia ser muito pesado.

**Correção:**

- `getPublicProfessionalDetailBySlug` passou a usar `cache()` do React para **deduplicar** metadata + page na mesma requisição.
- `getPublicProfessionalBySlug` agora deriva de esse detalhe em memória (sem nova query), em vez de varrer a lista inteira.

### 2. `getPublicProfessionalById`

**Problema:** Três queries Supabase sequenciais (contatos, serviços, portfólio) + avatar assinado e depois N URLs do portfólio em paralelo só entre si.

**Correção:**

- Contatos, serviços e linhas do portfólio em **`Promise.all`**.
- Avatar + todas as URLs do portfólio em **um único `Promise.all`**.

---

## Gargalos ainda relevantes (próximas melhorias)

### Listagem `/professionals` e home (`getPublicProfessionalsAndCategories`)

- Para **cada** prestador há `getSignedUrlForPublicProviderAvatar` (N chamadas ao Storage/admin).
- **Ideias:** cache ISR (`revalidate` 60–300s), ou URLs públicas para avatares de perfil público, ou um endpoint que devolva batch de URLs com TTL.

### `getSignedUrlForPublicFile` (portfólio, artigos, etc.)

- Com service role, cada arquivo faz **várias** checagens em tabelas (`blog_posts`, `courses`, `materials`, depois portfólio) antes de assinar.
- **Ideia:** atalho quando já sabemos o contexto (ex.: só validar `provider_portfolio_posts` para fotos de portfólio).

### Páginas com `dynamic = "force-dynamic"` e `noStore()`

- Ex.: `page.tsx` (home), `professionals/page.tsx`, `ExploreCategories`, várias rotas de conteúdo.
- Tudo isso **desliga cache estático** e força trabalho no servidor a cada request.
- **Ideia:** usar `revalidate` onde os dados podem mudar pouco; manter dinâmico só onde há auth personalizada.

### Middleware

- `getSupabaseSessionUser` roda em quase todas as rotas (exceto assets) e chama `getUser()`.
- Custo moderado, mas soma com o resto.
- **Ideia:** estreitar `matcher` se possível (menos rotas passando pelo middleware).

### Cliente — polling

| Onde | Intervalo | Nota |
|------|-----------|------|
| `NotificationBell` | 45s + Realtime | Pode alongar intervalo se Realtime estiver estável. |
| `ChatInterface` | presença 30s; threads 60s | Razoável; revisar se usuário inativo. |
| `PublicProfessionalProfile` / `ProfessionalsExplorer` | presença 60s | OK para listas pequenas. |

### `HeaderContentNav`

- Três `fetch` paralelos (`articles`, `courses`, `materials`) em **todo** carregamento do header.
- **Ideia:** cache SWR/React Query com `staleTime`, ou dados embutidos no layout com revalidate.

### Bundle / código

- `ChatInterface` é grande; avaliar `dynamic(..., { loading })` para rota `/chat`.
- Revisar imports pesados em páginas públicas.

---

## Checklist rápido de diagnóstico

1. **Network** no DevTools: quantas requisições à API e ao Supabase por navegação?
2. **TTFB** da página: alto indica servidor/DB, não React.
3. **Supabase Dashboard**: uso de API, tempo de query, índices em `provider_id`, `user_id`, `image_file_id`.
4. Ambiente: **região** do projeto Supabase próxima ao deploy (ex. `sa-east-1`).

---

## Como mergear esta branch

```bash
git checkout main
git pull origin main
git merge chore/performance-audit
git push origin main
```

Ou abrir PR a partir de `chore/performance-audit` para revisar o diff em `public-professionals.ts` e este documento.
