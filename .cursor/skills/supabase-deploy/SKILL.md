---
name: supabase-deploy
description: >-
  Publica alterações no Supabase do Bud (migrations SQL, Edge Functions, reload
  de schema, types). Use quando o usuário pedir deploy/publicar no Supabase,
  aplicar migration, subir function, sincronizar banco ou corrigir erro de
  schema cache (ex.: coluna não encontrada em profiles).
disable-model-invocation: true
---

# Supabase Deploy (Bud)

## Objetivo

Publicar mudanças de backend no projeto **Bud - MVP** (`cwruzarryygypeoncbre`) usando Supabase CLI, com verificação pós-deploy.

Escopo desta skill:

- SQL / schema (`supabase/migrations/`, `db query --linked`)
- Edge Functions em `supabase/functions/`
- Reload do schema cache do PostgREST
- Regeneração de types em `src/integrations/supabase/types.ts`

**Fora de escopo:** deploy do app mobile (Expo/iOS/Android), secrets com valores em texto no chat, `db reset` em produção.

## Projeto

| Item | Valor |
| ---- | ----- |
| Nome | Bud - MVP |
| Project ref | `cwruzarryygypeoncbre` |
| Config | `supabase/config.toml` |
| Types | `src/integrations/supabase/types.ts` |
| Functions locais | `chat-text`, `chat-voice`, `consolidate-daily-conversations`, `delete-account` |

JWT por function: respeitar `[functions.<nome>].verify_jwt` em `supabase/config.toml`. Não usar `--no-verify-jwt` salvo pedido explícito.

## Pré-voo (não pular)

```bash
cd /Users/locacao/projects/Bud/budmobile
npx supabase projects list
npx supabase migration list
npx supabase functions list
```

Se `projects list` falhar por auth: `npx supabase login` e repetir.

**Drift de migrations:** o histórico local e remoto costuma divergir. `db push` pode falhar com *"Remote migration versions not found in local migrations directory"*. Não forçar `db push` sem entender o drift — ver [reference.md](reference.md).

## Workflow

```
Task Progress:
- [ ] Identificar o que publicar (SQL / function / types / tudo)
- [ ] Pré-voo (login, migration list, functions list)
- [ ] Aplicar mudanças no remoto
- [ ] Reload schema cache (se alterou tabelas/colunas)
- [ ] Regenerar types (se alterou schema)
- [ ] Verificar deploy
- [ ] Resumir o que foi publicado e como validar no app
```

## 1. Publicar SQL (migrations)

### Criar migration

Arquivo em `supabase/migrations/` com timestamp UTC:

```
YYYYMMDDHHMMSS_descricao_curta.sql
```

Regras:

- SQL idempotente quando possível (`add column if not exists`, `create table if not exists`)
- Uma preocupação por arquivo (coluna, tabela, policy, trigger)
- Sem secrets nem dados sensíveis no SQL

### Aplicar no remoto

**Preferir** (drift conhecido no Bud):

```bash
npx supabase db query --linked -f supabase/migrations/<arquivo>.sql
```

**Alternativa** (só se `migration list` estiver alinhado):

```bash
npx supabase db push
```

### Após mudança de schema

```bash
npx supabase db query --linked "notify pgrst, 'reload schema';"
```

### Validar coluna/tabela

```bash
npx supabase db query --linked "select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = '<tabela>' order by ordinal_position;"
```

## 2. Publicar Edge Functions

Deploy de uma function:

```bash
npx supabase functions deploy chat-text
npx supabase functions deploy chat-voice
npx supabase functions deploy consolidate-daily-conversations
npx supabase functions deploy delete-account
```

Deploy de todas as functions locais:

```bash
npx supabase functions deploy
```

Shared code em `supabase/functions/_shared/` vai no bundle automaticamente.

Secrets usados pelas functions (nomes apenas — **nunca** colar valores no chat):

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Atualizar secret:

```bash
npx supabase secrets set OPENAI_API_KEY=<valor>
```

Listar secrets (só nomes/digests):

```bash
npx supabase secrets list
```

## 3. Regenerar types TypeScript

Depois de alterar schema:

```bash
npx supabase gen types --linked --lang=typescript > src/integrations/supabase/types.ts
```

Conferir diff: colunas novas/removidas batem com a migration aplicada.

## 4. Verificação pós-deploy

```bash
npx supabase functions list
npx supabase migration list
```

Para functions críticas, smoke test via `curl` ou log no dashboard:

- `chat-text` — streaming de texto com JWT
- `chat-voice` — token/signed URL de voz
- `delete-account` — só em ambiente de teste

## Decisão rápida

| Situação | Ação |
| -------- | ---- |
| Nova coluna/tabela/policy | Migration + `db query --linked` + reload schema |
| Erro "column not found in schema cache" | Aplicar SQL + `notify pgrst, 'reload schema'` |
| Mudança em `supabase/functions/` | `functions deploy <nome>` |
| Types desatualizados no app | `gen types --linked` |
| `db push` falha por drift | Ver [reference.md](reference.md); não improvisar `repair` em massa |

## Saída esperada para o usuário

Resumo curto em PT-BR:

1. O que foi publicado (SQL, functions, types)
2. Comandos executados
3. Como validar no app (ex.: refazer onboarding, testar chat)
4. Pendências (ex.: migration local não registrada no histórico remoto)

## Segurança

- Nunca commitar secrets (`.env`, API keys, service role)
- Nunca imprimir valores de `secrets list` — só nomes
- Não rodar `db reset --linked` nem SQL destrutivo em produção sem confirmação explícita
- Não expor `SUPABASE_SERVICE_ROLE_KEY` no app mobile

## Referência

- Drift de migrations, `db pull`, `migration repair`: [reference.md](reference.md)
