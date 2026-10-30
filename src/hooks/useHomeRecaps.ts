import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  dateLabel: (dateSource: string) => string;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const today = getTodayInBrasilia();
  const yesterday = getYesterdayInBrasilia();
  const [pile, setPile] = useState<RecapPileItem[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    if (!userId) {
      setPile([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    void SecureStore.getItemAsync(pileStorageKey(userId))
      .then((raw) => {
        if (cancelled) return;
        setPile(parseRecapPile(raw));
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setPile([]);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!loaded || !userId) return;
    const next = nextRecapPile({ pile, candidateIds, today });
    if (pileEquals(pile, next)) return;
    setPile(next);
    void SecureStore.setItemAsync(pileStorageKey(userId), JSON.stringify(next));
  }, [candidateIds, loaded, pile, today, userId]);

  const snippetQuery = useQuery({
    queryKey: queryKeys.recapSnippets(userId ?? '', pile.map((item) => item.id)),
    queryFn: () => fetchFirstUserSnippets(pile.map((item) => item.id)),
    enabled: Boolean(userId) && loaded && pile.length > 0,
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
    for (const item of pile.slice(0, remaining)) {
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
  }, [params, pile, snippetQuery.data]);

  return {
    recaps,
    recapCountLabel: `${recaps.length} de ${RECAP_LIMIT}`,
  };
}
