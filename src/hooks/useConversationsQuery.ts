import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchConversationsWithMessages,
  filterConversationsByDaysLimit,
} from '@/services/conversationsQuery';
import type { Conversation } from '@/services/conversationsQuery';

export function useConversationsQuery(daysLimit?: number) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: queryKeys.conversations(userId ?? ''),
    queryFn: () => fetchConversationsWithMessages(userId!),
    enabled: !!userId,
  });

  const conversations = filterConversationsByDaysLimit(query.data ?? [], daysLimit);

  return {
    ...query,
    conversations,
  };
}

export type { Conversation };
