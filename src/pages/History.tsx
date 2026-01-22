import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useConversations } from '@/hooks/useConversations';
import { useUserPlan } from '@/hooks/useUserPlan';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { groupConversationsByDate } from '@/utils/dateGrouping';
import ConversationDetail from '@/components/history/ConversationDetail';
import { cn } from '@/lib/utils';
import { LayoutSpacing } from '@/constants/layout';

export default function HistoryScreen() {
  const headerHeight = useHeaderHeight();
  const { effectivePlan, isLoading: planLoading } = useUserPlan();
  
  // Só definir daysLimit quando o plano estiver carregado
  // Enquanto carrega, usar undefined para buscar tudo
  const daysLimit = planLoading 
    ? undefined
    : effectivePlan === 'profundo' 
      ? undefined  // ilimitado
      : effectivePlan === 'reflexivo' 
        ? 30 
        : 7; // free
  
  const { conversations, loading: conversationsLoading } = useConversations(daysLimit);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
    date: string;
  } | null>(null);

  if (planLoading || conversationsLoading) {
    return (
      <View className="flex-1 bg-background">
        <Header />
        <Sidebar />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const groupedConversations = groupConversationsByDate(conversations);

  // Se uma conversa está selecionada, mostrar a view de detalhe
  if (selectedConversation) {
    return (
      <ConversationDetail
        conversationId={selectedConversation.id}
        conversationTitle={selectedConversation.title}
        conversationDate={selectedConversation.date}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: headerHeight + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
      >
        <Text className="text-2xl font-medium text-foreground mb-6">
          Histórico
        </Text>
        
        {conversations.length === 0 ? (
          <View className="bg-card rounded-lg p-6">
            <View className="items-center py-12">
              <Text className="text-5xl mb-4">💬</Text>
              <Text className="text-muted-foreground mt-4 text-center">
                Você ainda não tem conversas salvas.
              </Text>
            </View>
          </View>
        ) : (
          <View className="space-y-8">
            {groupedConversations.map((group) => (
              <View key={group.groupKey}>
                <View className="flex-row items-center gap-4 mb-4">
                  <Text className="text-xs font-semibold text-muted-foreground tracking-wider">
                    {group.groupTitle}
                  </Text>
                  <View className="flex-1 h-px bg-border" />
                </View>
                
                <View className="space-y-2">
                  {group.conversations.map((conversation, index) => (
                    <TouchableOpacity
                      key={conversation.id}
                      onPress={() =>
                        setSelectedConversation({
                          id: conversation.id,
                          title: conversation.title,
                          date: conversation.date.toISOString(),
                        })
                      }
                      className={cn(
                        'flex-row items-center justify-between rounded-lg p-4 bg-card',
                        'active:bg-accent/50'
                      )}
                    >
                      <View className="flex-1 min-w-0">
                        <Text className="text-base font-medium text-foreground">
                          {conversation.title}
                        </Text>
                      </View>
                      <Text className="text-muted-foreground">›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
