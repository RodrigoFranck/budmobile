import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { updateConversationTitleIfNeeded } from "@/utils/generateConversationTitle";

type Message = Tables<"messages">;

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const previousConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      previousConversationIdRef.current = null;
      return;
    }

    // Se mudou a conversa, resetar e carregar
    const conversationChanged = previousConversationIdRef.current !== conversationId;
    if (conversationChanged) {
      setMessages([]);
      setLoading(true);
      previousConversationIdRef.current = conversationId;
    }

    // Função para buscar mensagens
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          throw error;
        }
        
        setMessages(data || []);

        // Se há mensagens e a conversa pode não ter título, verificar e gerar se necessário
        if (data && data.length > 0) {
          // Verificar se precisa gerar título (em background, não bloquear)
          updateConversationTitleIfNeeded(conversationId).catch(err => {
            console.error("Error updating conversation title on fetch:", err);
          });
        }
      } catch (error) {
        console.error("useMessages: Error fetching messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    // Buscar mensagens
    fetchMessages();

    // Subscribe to realtime updates
    const channelName = `messages-${conversationId}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            // Prevent duplicates if message already exists
            if (current.some(m => m.id === newMessage.id)) {
              return current;
            }
            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const addMessage = async (content: string, role: "user" | "assistant") => {
    if (!conversationId) return null;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content,
          role,
        })
        .select()
        .single();

      if (error) throw error;

      // Se é a primeira mensagem do usuário, gerar título da conversa
      if (role === "user" && data) {
        // Atualizar título em background (não bloquear)
        updateConversationTitleIfNeeded(conversationId).catch(err => {
          console.error("Error updating conversation title:", err);
        });
      }

      return data;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  };

  const refetch = useCallback(async () => {
    if (!conversationId || !user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error refetching messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  return {
    messages,
    loading,
    addMessage,
    refetch,
  };
}

