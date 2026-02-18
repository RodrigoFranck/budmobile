import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayInBrasilia, getNowInBrasilia, parseDateString } from "@/utils/dateUtils";
import type { Tables } from "@/integrations/supabase/types";

type Conversation = Tables<"conversations">;

export function useConversations(daysLimit?: number) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const previousDaysLimitRef = useRef<number | undefined>(undefined);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      isInitialLoadRef.current = true;
      previousDaysLimitRef.current = undefined;
      hasLoadedOnceRef.current = false;
      return;
    }

    let isMounted = true;
    const isDaysLimitChanged = previousDaysLimitRef.current !== daysLimit;
    const isFirstLoad = !hasLoadedOnceRef.current || isInitialLoadRef.current;

    // CRÍTICO: Limpar conversas ANTES de começar a carregar para evitar mostrar dados antigos
    if (isFirstLoad || isDaysLimitChanged) {
      setConversations([]);
      setLoading(true);
    }

    const fetchConversations = async () => {
      if (!user || !isMounted) return;

      try {
        // Primeiro, buscar todas as conversas do usuário (sem filtro de dias ainda)
        let query = supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("updated_at", { ascending: false });

        const { data: allConversations, error: convError } = await query;
        if (convError) throw convError;

        if (!isMounted) return;

        if (!allConversations || allConversations.length === 0) {
          setConversations([]);
          setLoading(false);
          isInitialLoadRef.current = false;
          hasLoadedOnceRef.current = true;
          return;
        }

        // Buscar IDs de conversas que têm mensagens
        const conversationIds = allConversations.map(c => c.id);
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds);

        if (messagesError) {
          console.error("Error fetching messages for conversations:", messagesError);
          // Se der erro, retornar todas as conversas mesmo sem verificar mensagens
          const uniqueConversations = Array.from(
            new Map(allConversations.map((c: Conversation) => [c.id, c])).values()
          );
          setConversations(uniqueConversations);
          setLoading(false);
          isInitialLoadRef.current = false;
          hasLoadedOnceRef.current = true;
          return;
        }

        // Filtrar apenas conversas que têm mensagens
        const conversationIdsWithMessages = Array.from(
          new Set(messagesData?.map((m: any) => m.conversation_id) || [])
        );

        let conversationsWithMessages = allConversations.filter((c: Conversation) => 
          conversationIdsWithMessages.includes(c.id)
        );

        // Aplicar limite de dias baseado no plano APÓS filtrar por mensagens
        if (daysLimit) {
          // Usar horário de Brasília para calcular o limite
          const nowBrasilia = getNowInBrasilia();
          const limitDate = new Date(nowBrasilia);
          limitDate.setDate(limitDate.getDate() - daysLimit);
          limitDate.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
          
          // Converter para string YYYY-MM-DD para comparação
          const limitDateStr = limitDate.toISOString().split('T')[0];
          
          conversationsWithMessages = conversationsWithMessages.filter((c: Conversation) => {
            // Usar conversation_date se disponível, senão created_at
            const dateSource = c.conversation_date || c.created_at;
            
            // Extrair apenas a data (YYYY-MM-DD) para comparação
            let convDateStr: string;
            if (dateSource.includes('T')) {
              // Timestamp completo - extrair apenas a data
              convDateStr = dateSource.split('T')[0];
            } else {
              // Já está no formato YYYY-MM-DD
              convDateStr = dateSource;
            }
            
            // Comparar strings de data diretamente (YYYY-MM-DD)
            return convDateStr >= limitDateStr;
          });
        }

        // Remover duplicatas baseadas no ID antes de definir o estado
        const uniqueConversations = Array.from(
          new Map(conversationsWithMessages.map((c: Conversation) => [c.id, c])).values()
        );
        
        // Atualizar estado de uma vez só, quando tudo estiver pronto
        setConversations(uniqueConversations);
        setLoading(false);
        isInitialLoadRef.current = false;
        hasLoadedOnceRef.current = true;
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (isMounted) {
          setConversations([]);
          setLoading(false);
        }
      }
    };

    // Sempre buscar quando user ou daysLimit mudarem
    if (isFirstLoad || isDaysLimitChanged) {
      fetchConversations();
    }

    previousDaysLimitRef.current = daysLimit;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`conversations-changes-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Atualizar em background quando há mudanças em tempo real
          if (isMounted) {
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, daysLimit]);

  const getOrCreateTodayConversation = async () => {
    if (!user) return null;

    try {
      const today = getTodayInBrasilia(); // YYYY-MM-DD format (horário de Brasília)

      // Buscar conversa do dia atual
      const { data: existingConversation, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("conversation_date", today)
        .eq("is_archived", false)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Se já existe, retorna ela
      if (existingConversation) {
        return existingConversation;
      }

      // Se não existe, cria uma nova para hoje
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          conversation_date: today,
        })
        .select()
        .single();

      if (createError) {
        // Se for erro de chave duplicada (race condition), buscar novamente
        if (createError.code === '23505') {
          console.log("Duplicate key detected, retrying fetch...");
          const { data: retryData } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user.id)
            .eq("conversation_date", today)
            .eq("is_archived", false)
            .maybeSingle();
          
          return retryData;
        }
        throw createError;
      }
      
      return newConversation;
    } catch (error) {
      console.error("Error getting or creating today's conversation:", error);
      return null;
    }
  };

  const createConversation = async () => {
    // Manter para compatibilidade, mas agora usa a lógica de conversa diária
    return getOrCreateTodayConversation();
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      
      // Atualizar estado local imediatamente após exclusão bem-sucedida
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error; // Re-throw para que o chamador saiba que falhou
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_archived: true })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error archiving conversation:", error);
    }
  };

  const refetch = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Primeiro, buscar todas as conversas do usuário
      let query = supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (daysLimit) {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - daysLimit);
        query = query.gte("created_at", limitDate.toISOString());
      }

      const { data: allConversations, error: convError } = await query;
      if (convError) throw convError;

      if (!allConversations || allConversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Buscar IDs de conversas que têm mensagens
      const conversationIds = allConversations.map(c => c.id);
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds);

      if (messagesError) {
        console.error("Error fetching messages for conversations:", messagesError);
        // Se der erro, retornar todas as conversas mesmo sem verificar mensagens
        const uniqueConversations = Array.from(
          new Map(allConversations.map((c: Conversation) => [c.id, c])).values()
        );
        setConversations(uniqueConversations);
        setLoading(false);
        return;
      }

      // Filtrar apenas conversas que têm mensagens
      const conversationIdsWithMessages = Array.from(
        new Set(messagesData?.map((m: any) => m.conversation_id) || [])
      );

      const conversationsWithMessages = allConversations.filter((c: Conversation) => 
        conversationIdsWithMessages.includes(c.id)
      );

      const uniqueConversations = Array.from(
        new Map(conversationsWithMessages.map((c: Conversation) => [c.id, c])).values()
      );
      
      setConversations(uniqueConversations);
    } catch (error) {
      console.error("Error refetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    getOrCreateTodayConversation,
    deleteConversation,
    archiveConversation,
    refetch,
  };
}

