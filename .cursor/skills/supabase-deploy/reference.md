# Supabase Deploy — Referência

## Drift de migrations (Bud)

O repositório local tem poucas migrations em `supabase/migrations/`, mas o remoto tem dezenas aplicadas direto no dashboard ou em outro fluxo. Por isso `db push` costuma falhar.

### Sintoma

```
Remote migration versions not found in local migrations directory.
```

### Estratégias

| Cenário | Estratégia | Comando |
| ------- | ---------- | ------- |
| Hotfix pontual (coluna, policy, índice) | Aplicar SQL direto + manter arquivo local | `db query --linked -f <migration.sql>` |
| Sincronizar histórico para uso futuro de `db push` | Puxar schema remoto | `npx supabase db pull` |
| Registrar migration já aplicada manualmente | Repair (cuidado) | `npx supabase migration repair --status applied <version>` |

**Regra:** para o Bud no dia a dia, preferir `db query --linked` para mudanças novas. Usar `db pull` quando for alinhar o repo com o remoto de propósito (gera migration grande).

### Reload schema cache

Sempre após DDL (create/alter/drop):

```sql
notify pgrst, 'reload schema';
```

Via CLI:

```bash
npx supabase db query --linked "notify pgrst, 'reload schema';"
```

Sem reload, o app pode continuar com erro *"Could not find the 'X' column ... in the schema cache"* mesmo com a coluna criada.

## Edge Functions

### Estrutura local

```
supabase/functions/
├── _shared/          # imports compartilhados
├── chat-text/
├── chat-voice/
├── consolidate-daily-conversations/
└── delete-account/
```

### Deploy

```bash
# Uma function
npx supabase functions deploy chat-text

# Todas
npx supabase functions deploy

# Sem Docker (CI / máquinas sem Docker)
npx supabase functions deploy --use-api
```

### JWT (`config.toml`)

| Function | verify_jwt |
| -------- | ---------- |
| chat-text | true |
| chat-voice | true |
| delete-account | true |
| consolidate-daily-conversations | false |

Functions antigas no remoto (ex.: `chat-with-ai`, `elevenlabs-tts`) **não** estão no repo local — não usar `--prune` sem confirmação.

## Types

```bash
npx supabase gen types --linked --lang=typescript > src/integrations/supabase/types.ts
```

Commitar o arquivo gerado junto com a migration quando o schema mudar.

## Troubleshooting

### "column not found in schema cache"

1. Confirmar coluna: query em `information_schema.columns`
2. Se não existir: aplicar migration
3. `notify pgrst, 'reload schema'`
4. Regenerar types se o app usa a coluna

### Function deploy falha

- Verificar login: `npx supabase projects list`
- Tentar `--use-api`
- Conferir imports em `_shared/`

### App ainda falha após deploy

- Fechar/reabrir app ou logout/login (cache de sessão)
- Conferir se `src/integrations/supabase/types.ts` foi atualizado
- Ver logs da function no dashboard Supabase

## Comandos úteis

```bash
# Status migrations
npx supabase migration list

# SQL ad hoc
npx supabase db query --linked "select 1;"

# Functions remotas
npx supabase functions list

# Secrets (só nomes)
npx supabase secrets list

# Link manual (se necessário)
npx supabase link --project-ref cwruzarryygypeoncbre
```
