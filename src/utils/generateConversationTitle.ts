import { supabase } from "@/integrations/supabase/client";

/**
 * Gera um título para a conversa baseado nas primeiras mensagens
 * Tenta usar a Edge Function primeiro, se falhar usa lógica local
 */
export async function generateConversationTitle(conversationId: string): Promise<string | null> {
  try {
    // Tentar usar a Edge Function primeiro (se disponível)
    try {
      const { data, error } = await supabase.functions.invoke('generate-conversation-title', {
        body: { conversationId }
      });

      if (!error && data?.title) {
        return data.title;
      }
    } catch (edgeFunctionError) {
      // Se a Edge Function não estiver disponível, continuar com lógica local
      console.log("Edge Function not available, using local title generation");
    }

    // Buscar as primeiras 5 mensagens da conversa
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(5);

    if (messagesError || !messages || messages.length === 0) {
      console.error("Error fetching messages for title generation:", messagesError);
      return null;
    }

    // Filtrar apenas mensagens do usuário para gerar título
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    if (!userMessages || userMessages.trim().length === 0) {
      return null;
    }

    // Extrair palavras-chave da primeira mensagem do usuário
    // Remover pontuação e palavras comuns
    const stopWords = new Set([
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
      'para', 'com', 'por', 'sem', 'sob', 'sobre', 'entre',
      'que', 'qual', 'quais', 'quando', 'onde', 'como', 'porque',
      'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas',
      'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
      'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas',
      'é', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'estar',
      'tenho', 'tem', 'temos', 'têm', 'tinha', 'tinham',
      'fazer', 'fez', 'fizeram', 'feito',
      'dizer', 'disse', 'disseram', 'dito',
      'saber', 'soube', 'souberam', 'sabido',
      'querer', 'quis', 'quiseram', 'querido',
      'poder', 'pôde', 'puderam', 'podido',
      'ver', 'viu', 'viram', 'visto',
      'dar', 'deu', 'deram', 'dado',
      'ir', 'foi', 'foram', 'ido',
      'vir', 'veio', 'vieram', 'vindo',
      'ter', 'teve', 'tiveram', 'tido',
      'estar', 'esteve', 'estiveram', 'estado',
      'ser', 'foi', 'foram', 'sido',
      'a', 'e', 'i', 'o', 'u',
      'mas', 'porém', 'contudo', 'todavia',
      'então', 'assim', 'logo', 'portanto',
      'também', 'ainda', 'já', 'ainda',
      'não', 'nem', 'nunca', 'jamais',
      'sim', 'claro', 'certo', 'ok',
      'bom', 'boa', 'bons', 'boas',
      'muito', 'muita', 'muitos', 'muitas',
      'pouco', 'pouca', 'poucos', 'poucas',
      'mais', 'menos', 'melhor', 'pior',
      'hoje', 'ontem', 'amanhã', 'agora',
      'aqui', 'ali', 'lá', 'onde',
      'isso', 'isto', 'aquilo', 'esse', 'essa', 'esses', 'essas',
      'este', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas',
    ]);

    // Extrair palavras significativas (mais de 3 caracteres, não são stop words)
    const words = userMessages
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5); // Pegar até 5 palavras

    if (words.length === 0) {
      // Se não encontrou palavras significativas, usar primeiras palavras da primeira mensagem
      const firstMessage = userMessages.trim();
      const firstWords = firstMessage
        .split(/\s+/)
        .slice(0, 5)
        .join(' ');
      
      // Limitar a 50 caracteres
      return firstWords.length > 50 
        ? firstWords.substring(0, 47) + '...' 
        : firstWords;
    }

    // Criar título com as palavras-chave
    const title = words.join(' ');
    
    // Limitar a 50 caracteres
    return title.length > 50 
      ? title.substring(0, 47) + '...' 
      : title;

  } catch (error) {
    console.error("Error generating conversation title:", error);
    return null;
  }
}

/**
 * Atualiza o título da conversa se ainda não tiver um
 */
export async function updateConversationTitleIfNeeded(conversationId: string): Promise<void> {
  try {
    // Verificar se a conversa já tem título
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", conversationId)
      .single();

    if (convError) {
      console.error("Error checking conversation title:", convError);
      return;
    }

    // Se já tem título, não fazer nada
    if (conversation?.title && conversation.title.trim().length > 0) {
      return;
    }

    // Gerar título baseado nas mensagens
    const title = await generateConversationTitle(conversationId);

    if (!title) {
      return;
    }

    // Atualizar título da conversa
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Error updating conversation title:", updateError);
    } else {
      console.log(`Updated conversation ${conversationId} title to: ${title}`);
    }
  } catch (error) {
    console.error("Error in updateConversationTitleIfNeeded:", error);
  }
}

