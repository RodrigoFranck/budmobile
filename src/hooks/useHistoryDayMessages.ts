import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { Tables } from '@/integrations/supabase/types';
import { isDisplayableHistoryMessage } from '@/utils/historyMessages';

export type HistoryDayMessage = Pick<
  Tables<'messages'>,
  'id' | 'role' | 'content' | 'created_at' | 'conversation_id'
>;

const PAGE_SIZE = 80;

async function fetchHistoryDayMessagesPage(
  conversationId: string,
  pageIndex: number,
): Promise<HistoryDayMessage[]> {
  const from = pageIndex * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at, conversation_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function useHistoryDayMessages(conversationId: string | null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.historyDayMessages(conversationId ?? ''),
    queryFn: ({ pageParam }) => fetchHistoryDayMessagesPage(conversationId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPageParam + 1,
    enabled: Boolean(conversationId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const messages = useMemo(() => {
    const flat = query.data?.pages.flat() ?? [];
    return flat.filter(isDisplayableHistoryMessage);
  }, [query.data]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    messages,
    /** True only on the first load with no cached pages. */
    loading: query.isPending && !query.data,
    /** Soft refresh while showing cached messages. */
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    loadMore,
    error: query.error,
  };
}
