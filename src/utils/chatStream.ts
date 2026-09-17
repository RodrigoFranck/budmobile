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
  cardDescription?: string;
  backgroundType?: "yesterday" | "inspired" | "frequency" | "habit";
}

/**
 * Parse one SSE line. Returns delta content when present.
 */
export function parseSseDataLine(line: string): string | null {
  const trimmed = line.replace(/\r$/, "").trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  if (!trimmed.startsWith("data:")) return null;

  const jsonStr = trimmed.startsWith("data: ")
    ? trimmed.slice(6).trim()
    : trimmed.slice(5).trim();

  if (!jsonStr || jsonStr === "[DONE]") return null;

  try {
    const parsed = JSON.parse(jsonStr) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}

/**
 * Feed incremental SSE text into a line buffer.
 * Keeps the trailing partial line until a newline arrives — avoids dropping mid-token JSON.
 */
export function consumeSseBuffer(
  buffer: string,
  chunk: string,
  onDelta: (deltaText: string) => void,
  options?: { flush?: boolean },
): string {
  const combined = buffer + chunk;
  const parts = combined.split("\n");
  const incomplete = options?.flush ? "" : (parts.pop() ?? "");

  for (const part of parts) {
    const content = parseSseDataLine(part);
    if (content) onDelta(content);
  }

  return incomplete;
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      onError("Você precisa estar logado para usar o chat.");
      return;
    }

    const xhr = new XMLHttpRequest();
    let lastProcessedIndex = 0;
    let sseBuffer = "";

    xhr.open("POST", CHAT_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);

    xhr.onprogress = () => {
      const responseText = xhr.responseText;
      const newData = responseText.substring(lastProcessedIndex);
      lastProcessedIndex = responseText.length;
      sseBuffer = consumeSseBuffer(sseBuffer, newData, onDelta);
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const responseText = xhr.responseText;
        const remainingData = responseText.substring(lastProcessedIndex);
        sseBuffer = consumeSseBuffer(sseBuffer, remainingData, onDelta, { flush: true });
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

    xhr.timeout = 120000;

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
