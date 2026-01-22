import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MessageWithDate {
  id: string;
  conversation_id: string;
  content: string;
  role: string;
  message_type: string;
  created_at: string;
  conversation_date: string | null;
}

export function useAllMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchAllMessages();

    // Subscribe to realtime updates for all user's conversations
    const channel = supabase
      .channel(`user-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Verify this message belongs to user's conversation
          const { data: conversation } = await supabase
            .from("conversations")
            .select("conversation_date, user_id")
            .eq("id", newMessage.conversation_id)
            .single();
          
          if (conversation && conversation.user_id === user.id) {
            const messageWithDate: MessageWithDate = {
              ...newMessage,
              conversation_date: conversation.conversation_date,
            };
            
            setMessages((current) => {
              // Prevent duplicates
              if (current.some(m => m.id === messageWithDate.id)) {
                return current;
              }
              return [...current, messageWithDate];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAllMessages = async () => {
    if (!user) return;

    try {
      // Fetch all messages from all user conversations
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          conversations!inner(conversation_date, user_id)
        `)
        .eq("conversations.user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Flatten the data structure
      const messagesWithDate: MessageWithDate[] = (data || []).map((item: any) => ({
        id: item.id,
        conversation_id: item.conversation_id,
        content: item.content,
        role: item.role,
        message_type: item.message_type,
        created_at: item.created_at,
        conversation_date: item.conversations?.conversation_date || null,
      }));
      
      setMessages(messagesWithDate);
    } catch (error) {
      console.error("Error fetching all messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async (
    conversationId: string, 
    content: string, 
    role: "user" | "assistant" | "context",
    messageType: string = "text"
  ) => {
    if (!conversationId) return null;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content,
          role,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  };

  return {
    messages,
    loading,
    addMessage,
    refetch: fetchAllMessages,
  };
}

