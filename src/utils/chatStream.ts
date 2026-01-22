import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export interface UserContext {
  name?: string | null;
  initialThoughts?: string | null;
  conversationGoal?: string | null;
  occupation?: string | null;
  age?: string | null;
  gender?: string | null;
  relationship?: string | null;
  hobbies?: string[] | null;
  isFirstInteractionOfDay: boolean;
}

export interface InsightContext {
  insightType?: string;
  contextSummary?: string;
  internalContext?: string;
  conversationId?: string;
  habitTitle?: string;
  badge?: string;
  title?: string;
  backgroundType?: "yesterday" | "inspired" | "frequency" | "habit";
}

export async function streamChat({
  messages,
  userContext,
  insightContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  userContext?: UserContext;
  insightContext?: InsightContext;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const CHAT_URL = `${SUPABASE_URL}/functions/v1/chat-text`;

  try {
    // Get the current user's session for JWT authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      onError("Você precisa estar logado para usar o chat.");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, userContext, insightContext }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        onError("Limite de requisições atingido. Tente novamente mais tarde.");
        return;
      }
      if (resp.status === 401) {
        onError("Sessão expirada. Por favor, faça login novamente.");
        return;
      }
      const errorData = await resp.json().catch(() => ({}));
      onError(errorData.error || "Erro ao conectar com o assistente");
      return;
    }

    if (!resp.body) {
      onError("Resposta inválida do servidor");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream error:", error);
    onError(error instanceof Error ? error.message : "Erro desconhecido");
  }
}

