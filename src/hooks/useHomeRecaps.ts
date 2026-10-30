import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/contexts/AuthContext';
import type { Insight } from '@/hooks/useExploreInsights';
import { queryKeys } from '@/lib/queryKeys';
import type { Conversation } from '@/services/conversationsQuery';
import { fetchFirstUserSnippets } from '@/services/dailyLetterQuery';
import { isUsableLetterInsight, YESTERDAY_CARD_QUOTE } from '@/utils/dailyLetter';
import {
  clipCardText,
  conversationDayKey,
  nextRecapPile,
  parseRecapPile,
  recapCandidateIds,
  recapInvite,
  recapQuote,
  RECAP_LIMIT,
  type RecapPileItem,
} from '@/utils/homeRecaps';
import { getTodayInBrasilia, getYesterdayInBrasilia } from '@/utils/dateUtils';

export type HomeRecapItem =
  | { kind: 'yesterday'; id: 'yesterday'; label: string; quote: string; body: string }
  | { kind: 'conversation'; id: string; label: string; quote: string; body: string };

function pileStorageKey(userId: string) {
  return `home_recap_pile_${userId}`;
}

function pileEquals(left: RecapPileItem[], right: RecapPileItem[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.id === right[index]?.id && item.addedOn === right[index]?.addedOn);
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
      const quote = recapQuote(
        isUsableLetterInsight(insight) ? insight?.title : null,
        YESTERDAY_CARD_QUOTE,
      );
      const body = clipCardText(
        (isUsableLetterInsight(insight) ? insight?.contextSummary || insight?.description : '') ||
          recapInvite('Ontem'),
      );
      items.push({
        kind: 'yesterday',
        id: 'yesterday',
        label: 'Ontem',
        quote: quote || YESTERDAY_CARD_QUOTE,
        body,
      });
    }

    const remaining = RECAP_LIMIT - items.length;
    for (const item of nextPile.slice(0, remaining)) {
      const conversation = byId.get(item.id);
      if (!conversation?.title) continue;
      const dateSource = conversation.conversation_date || conversation.created_at;
      const label = params.dateLabel(dateSource);
      items.push({
        kind: 'conversation',
        id: conversation.id,
        label,
        quote: recapQuote(snippets[conversation.id], conversation.title),
        body: recapInvite(label),
      });
    }

    return items;
  }, [nextPile, params, snippetQuery.data]);

  const snippetsReady = nextPile.length === 0 || snippetQuery.isFetched;

  return {
    recaps,
    recapCountLabel: `${recaps.length} de ${RECAP_LIMIT}`,
    loading: Boolean(userId) && (!pileReady || !params.conversationsReady || !snippetsReady),
  };
}
