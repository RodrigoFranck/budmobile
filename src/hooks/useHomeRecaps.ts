import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/contexts/AuthContext';
import type { Insight } from '@/hooks/useExploreInsights';
import { queryKeys } from '@/lib/queryKeys';
import type { Conversation } from '@/services/conversationsQuery';
import { fetchFirstUserSnippets } from '@/services/dailyLetterQuery';
import {
  requestParaComecarCards,
  type ParaComecarCard,
} from '@/services/paraComecarQuery';
import { isUsableLetterInsight, YESTERDAY_CARD_QUOTE } from '@/utils/dailyLetter';
import { looksLikeCrisisSpeech } from '@/utils/approachMatcher';
import {
  clipCardText,
  conversationDayKey,
  isUsableRecapBody,
  isUsableRecapFragment,
  nextRecapPile,
  parseRecapPile,
  recapCandidateIds,
  recapQuote,
  RECAP_LIMIT,
  type RecapPileItem,
} from '@/utils/homeRecaps';
import { cleanupTriggerUserMessages } from '@/utils/cleanupTriggerUserMessages';
import { getTodayInBrasilia, getYesterdayInBrasilia } from '@/utils/dateUtils';

export type HomeRecapItem =
  | { kind: 'yesterday'; id: 'yesterday'; label: string; quote: string; body: string }
  | { kind: 'conversation'; id: string; label: string; quote: string; body: string };

type CachedParaComecar = Record<
  string,
  { fragmento: string; paragrafo: string; mensagem_id: string }
>;

function pileStorageKey(userId: string) {
  return `home_recap_pile_${userId}`;
}

function paraComecarStorageKey(userId: string) {
  return `home_para_comecar_${userId}`;
}

function pileEquals(left: RecapPileItem[], right: RecapPileItem[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.id === right[index]?.id && item.addedOn === right[index]?.addedOn);
}

function parseParaComecarCache(raw: string | null): CachedParaComecar {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: CachedParaComecar = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const row = value as Partial<CachedParaComecar[string]>;
      if (
        typeof row.fragmento === 'string' &&
        typeof row.paragrafo === 'string' &&
        typeof row.mensagem_id === 'string' &&
        isUsableRecapFragment(row.fragmento) &&
        isUsableRecapBody(row.paragrafo)
      ) {
        out[id] = {
          fragmento: row.fragmento.trim(),
          paragrafo: row.paragrafo.trim(),
          mensagem_id: row.mensagem_id,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function mergeParaComecarCache(
  current: CachedParaComecar,
  cards: ParaComecarCard[],
): CachedParaComecar {
  const next = { ...current };
  for (const card of cards) {
    if (!isUsableRecapFragment(card.fragmento)) continue;
    if (!isUsableRecapBody(card.paragrafo)) continue;
    next[card.conversation_id] = {
      fragmento: card.fragmento,
      paragrafo: card.paragrafo,
      mensagem_id: card.mensagem_id,
    };
  }
  return next;
}

export function useHomeRecaps(params: {
  conversations: Conversation[];
  yesterdayInsight: Insight | undefined;
  hasLetter: boolean;
  conversationsReady: boolean;
  dateLabel: (dateSource: string) => string;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const today = getTodayInBrasilia();
  const yesterday = getYesterdayInBrasilia();

  useEffect(() => {
    if (!userId) return;
    void cleanupTriggerUserMessages(userId).then(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
      void queryClient.invalidateQueries({ queryKey: ['recapSnippets', userId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.recapBodies(userId) });
    });
  }, [queryClient, userId]);

  const yesterdayIds = useMemo(
    () =>
      params.conversations
        .filter((conversation) => {
          return conversationDayKey(conversation.conversation_date || conversation.created_at) === yesterday;
        })
        .map((conversation) => conversation.id),
    [params.conversations, yesterday],
  );

  const candidateIds = useMemo(
    () =>
      recapCandidateIds({
        conversations: params.conversations,
        today,
        excludeIds: params.hasLetter ? yesterdayIds : [],
      }),
    [params.conversations, params.hasLetter, today, yesterdayIds],
  );

  const pileQuery = useQuery({
    queryKey: queryKeys.recapPile(userId ?? ''),
    queryFn: async () => parseRecapPile(await SecureStore.getItemAsync(pileStorageKey(userId!))),
    enabled: Boolean(userId),
    staleTime: Infinity,
  });

  const pile = pileQuery.data ?? [];
  const pileReady = !userId || pileQuery.isFetched;

  const nextPile = useMemo(() => {
    if (!pileReady || !params.conversationsReady) return pile;
    return nextRecapPile({ pile, candidateIds, today });
  }, [candidateIds, params.conversationsReady, pile, pileReady, today]);

  useEffect(() => {
    if (!userId || !pileReady || !params.conversationsReady) return;
    if (pileEquals(pile, nextPile)) return;
    queryClient.setQueryData(queryKeys.recapPile(userId), nextPile);
    void SecureStore.setItemAsync(pileStorageKey(userId), JSON.stringify(nextPile));
  }, [nextPile, params.conversationsReady, pile, pileReady, queryClient, userId]);

  const cacheQuery = useQuery({
    queryKey: queryKeys.recapBodies(userId ?? ''),
    queryFn: async () => parseParaComecarCache(await SecureStore.getItemAsync(paraComecarStorageKey(userId!))),
    enabled: Boolean(userId),
    staleTime: Infinity,
  });

  const cachedBodies = cacheQuery.data ?? {};
  const cacheReady = !userId || cacheQuery.isFetched;

  const missingBodyIds = useMemo(() => {
    if (!cacheReady) return [] as string[];
    return nextPile.map((item) => item.id).filter((id) => !cachedBodies[id]);
  }, [cacheReady, cachedBodies, nextPile]);

  const generatedQuery = useQuery({
    queryKey: queryKeys.recapBodiesGenerate(userId ?? '', missingBodyIds),
    queryFn: async () => {
      const knownBodies = Object.values(cachedBodies).map((item) => item.paragrafo);
      const cards = await requestParaComecarCards({
        conversationIds: missingBodyIds,
        knownBodies,
      });
      return mergeParaComecarCache(cachedBodies, cards);
    },
    enabled:
      Boolean(userId) &&
      pileReady &&
      cacheReady &&
      params.conversationsReady &&
      missingBodyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!userId || !generatedQuery.data) return;
    const merged = generatedQuery.data;
    queryClient.setQueryData(queryKeys.recapBodies(userId), merged);
    void SecureStore.setItemAsync(paraComecarStorageKey(userId), JSON.stringify(merged));
  }, [generatedQuery.data, queryClient, userId]);

  const bodiesById = generatedQuery.data ?? cachedBodies;

  const snippetQuery = useQuery({
    queryKey: queryKeys.recapSnippets(userId ?? '', nextPile.map((item) => item.id)),
    queryFn: () => fetchFirstUserSnippets(nextPile.map((item) => item.id)),
    enabled: Boolean(userId) && pileReady && params.conversationsReady && nextPile.length > 0,
  });

  const recaps = useMemo(() => {
    const items: HomeRecapItem[] = [];
    const byId = new Map(params.conversations.map((conversation) => [conversation.id, conversation]));
    const snippets = snippetQuery.data ?? {};

    if (params.hasLetter) {
      const insight = params.yesterdayInsight;
      const rawQuote = isUsableLetterInsight(insight) ? insight?.title : null;
      const rawBody = isUsableLetterInsight(insight)
        ? insight?.contextSummary || insight?.description
        : '';
      if (!looksLikeCrisisSpeech(rawQuote ?? '') && !looksLikeCrisisSpeech(rawBody ?? '')) {
        const quote = recapQuote(rawQuote, YESTERDAY_CARD_QUOTE);
        const body = isUsableRecapBody(rawBody) ? clipCardText(rawBody!) : '';
        if (quote && body) {
          items.push({
            kind: 'yesterday',
            id: 'yesterday',
            label: 'Ontem',
            quote,
            body,
          });
        }
      }
    }

    for (const item of nextPile) {
      if (items.length >= RECAP_LIMIT) break;
      const conversation = byId.get(item.id);
      if (!conversation?.title) continue;
      if (looksLikeCrisisSpeech(conversation.title)) continue;

      const generated = bodiesById[conversation.id];
      const snippet = snippets[conversation.id];
      if (snippet && looksLikeCrisisSpeech(snippet)) continue;

      const quote = recapQuote(generated?.fragmento ?? snippet, conversation.title);
      if (!quote || !isUsableRecapFragment(quote)) continue;

      const body = generated?.paragrafo?.trim() ?? '';
      if (!isUsableRecapBody(body)) continue;

      const dateSource = conversation.conversation_date || conversation.created_at;
      const label = params.dateLabel(dateSource);
      items.push({
        kind: 'conversation',
        id: conversation.id,
        label,
        quote,
        body: clipCardText(body),
      });
    }

    return items;
  }, [bodiesById, nextPile, params, snippetQuery.data]);

  const snippetsReady = nextPile.length === 0 || snippetQuery.isFetched;
  const bodiesReady =
    missingBodyIds.length === 0 || generatedQuery.isFetched || generatedQuery.isError;

  return {
    recaps,
    recapCountLabel: `${recaps.length} de ${RECAP_LIMIT}`,
    loading:
      Boolean(userId) &&
      (!pileReady || !cacheReady || !params.conversationsReady || !snippetsReady || !bodiesReady),
  };
}
