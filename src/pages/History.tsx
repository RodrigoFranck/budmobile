import { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useConversations } from '@/hooks/useConversations';
import { useUserPlan } from '@/hooks/useUserPlan';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { groupConversationsByDate } from '@/utils/dateGrouping';
import ConversationDetail from '@/components/history/ConversationDetail';
import { cn } from '@/lib/utils';
import { LayoutSpacing } from '@/constants/layout';

interface ConversationToDelete {
  id: string;
  title: string;
}

export default function HistoryScreen() {
  const headerHeight = useHeaderHeight();
  const { effectivePlan, isLoading: planLoading } = useUserPlan();
  
  // Histórico sempre mostra todas as conversas desde a criação da conta
  // O limite de dias não se aplica ao histórico
  const daysLimit = undefined;
  
  const { conversations, loading: conversationsLoading, deleteConversation } = useConversations(daysLimit);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
    date: string;
  } | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationToDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = planLoading || conversationsLoading;

  const groupedConversations = useMemo(() => {
    if (isLoading || conversations.length === 0) {
      return [];
    }
    return groupConversationsByDate(conversations);
  }, [conversations, isLoading]);

  const handleLongPress = (conversation: { id: string; title: string }) => {
    setConversationToDelete(conversation);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteConversation(conversationToDelete.id);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConversationToDelete(null);
  };

  if (isLoading) {
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
            {groupedConversations.map((group, groupIndex) => (
              <View key={`group-${group.groupKey}-${groupIndex}`}>
                <View className={cn(
                  "flex-row items-center gap-4 mb-6",
                  groupIndex > 0 && "mt-6"
                )}>
                  <Text className="text-xs font-semibold text-muted-foreground tracking-wider">
                    {group.groupTitle}
                  </Text>
                  <View className="flex-1 h-px bg-border" />
                </View>
                
                <View className="space-y-4">
                  {group.conversations.map((conversation, index) => (
                    <TouchableOpacity
                      key={`conversation-${conversation.id}-${conversation.date.toISOString()}-${index}`}
                      onPress={() =>
                        setSelectedConversation({
                          id: conversation.id,
                          title: conversation.title,
                          date: conversation.date.toISOString(),
                        })
                      }
                      onLongPress={() => handleLongPress({
                        id: conversation.id,
                        title: conversation.title,
                      })}
                      delayLongPress={500}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={conversationToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <Pressable 
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onPress={handleCancelDelete}
        >
          <Pressable 
            className="bg-card mx-6 rounded-2xl overflow-hidden w-full max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="pt-6 pb-4 px-6 items-center">
              <View className="w-14 h-14 rounded-full bg-destructive/20 items-center justify-center mb-4">
                <Text className="text-3xl">🗑️</Text>
              </View>
              <Text className="text-xl font-semibold text-foreground text-center">
                Excluir conversa?
              </Text>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              <Text className="text-muted-foreground text-center text-base leading-relaxed">
                A conversa{' '}
                <Text className="text-foreground font-medium">
                  "{conversationToDelete?.title}"
                </Text>
                {' '}será excluída permanentemente. Esta ação não pode ser desfeita.
              </Text>
            </View>

            {/* Separator */}
            <View className="h-px bg-border" />

            {/* Actions */}
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 py-4 items-center justify-center"
                onPress={handleCancelDelete}
                disabled={isDeleting}
              >
                <Text className="text-base font-medium text-muted-foreground">
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <View className="w-px bg-border" />
              
              <TouchableOpacity
                className="flex-1 py-4 items-center justify-center"
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text className="text-base font-semibold text-destructive">
                    Excluir
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
