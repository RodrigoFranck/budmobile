import { supabase } from "@/integrations/supabase/client";
import type { ChatMemoryContext } from "@/utils/formatInternalProfile";

type Message = { role: "user" | "assistant"; content: string };

export type { ChatMemoryContext };

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

export interface ApproachContext {
  strategy: string;
  guidanceText: string;
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

/**
 * Stream chat using XMLHttpRequest for React Native compatibility.
 * React Native's fetch doesn't support ReadableStream, so we use XHR with onprogress.
 */
export async function streamChat({
  messages,
  userContext,
  insightContext,
  memoryContext,
  approachContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  userContext?: UserContext;
  insightContext?: InsightContext;
  memoryContext?: ChatMemoryContext;
  approachContext?: ApproachContext;
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

    // Use XMLHttpRequest for React Native streaming support
    const xhr = new XMLHttpRequest();
    let lastProcessedIndex = 0;

    xhr.open("POST", CHAT_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);

    // Process streaming data incrementally
    xhr.onprogress = () => {
      const responseText = xhr.responseText;
      const newData = responseText.substring(lastProcessedIndex);
      lastProcessedIndex = responseText.length;

      // Process each line of SSE data
      const lines = newData.split("\n");
      for (const line of lines) {
        if (!line || line.trim() === "") continue;
        if (line.startsWith(":")) continue; // SSE comment
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, will be processed in next chunk
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // Process any remaining data
        const responseText = xhr.responseText;
        const remainingData = responseText.substring(lastProcessedIndex);
        
        if (remainingData) {
          const lines = remainingData.split("\n");
          for (const line of lines) {
            if (!line || line.trim() === "") continue;
            if (line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                onDelta(content);
              }
            } catch {
              // Ignore incomplete JSON at the end
            }
          }
        }
        onDone();
      } else if (xhr.status === 429) {
        onError("Limite de requisições atingido. Tente novamente mais tarde.");
      } else if (xhr.status === 401) {
        onError("Sessão expirada. Por favor, faça login novamente.");
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          onError(errorData.error || "Erro ao conectar com o assistente");
        } catch {
          onError("Erro ao conectar com o assistente");
        }
      }
    };

    xhr.onerror = () => {
      onError("Erro de conexão. Verifique sua internet.");
    };

    xhr.ontimeout = () => {
      onError("Tempo de conexão esgotado. Tente novamente.");
    };

    // Set a reasonable timeout (2 minutes for long responses)
    xhr.timeout = 120000;

    // Send the request
    xhr.send(
      JSON.stringify({
        messages,
        userContext,
        insightContext,
        memoryContext,
        approachContext,
        internalProfile: memoryContext?.internalProfileText ?? null,
      }),
    );

  } catch (error) {
    console.error("Stream error:", error);
    onError(error instanceof Error ? error.message : "Erro desconhecido");
  }
}
