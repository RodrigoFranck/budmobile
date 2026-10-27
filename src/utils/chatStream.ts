import { Platform } from "react-native";

import { supabase } from "@/integrations/supabase/client";
import { resolveChatTextRequestUrls } from "@/utils/chatFunctionsUrl";
import {
  consumeSseBuffer,
  extractAssistantContent,
  parseChatErrorPayload,
} from "@/utils/chatStreamParse";
import type { ChatMemoryContext } from "@/utils/formatInternalProfile";

type Message = { role: "user" | "assistant"; content: string };

export type { ChatMemoryContext };
export {
  consumeSseBuffer,
  extractAssistantContent,
  parseSseDataLine,
} from "@/utils/chatStreamParse";

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

const CHAT_REQUEST_TIMEOUT_MS = 180000;

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isNetworkRequestError(error: unknown): boolean {
  if (!(error instanceof Error) || isAbortError(error)) return false;
  return /network request failed|failed to fetch|load failed|networkerror/i.test(
    error.message,
  );
}

function toUserFacingChatError(error: unknown): string {
  if (isAbortError(error)) {
    return "Tempo de conexão esgotado. Tente novamente.";
  }
  if (isNetworkRequestError(error)) {
    return "Não foi possível conectar ao chat. Verifique sua internet e tente novamente.";
  }
  return error instanceof Error ? error.message : "Erro desconhecido";
}

function postChatXhr({
  url,
  accessToken,
  supabaseAnonKey,
  body,
  timeoutMs,
  onDelta,
}: {
  url: string;
  accessToken: string;
  supabaseAnonKey: string;
  body: string;
  timeoutMs: number;
  onDelta: (deltaText: string) => void;
}): Promise<{ status: number; responseText: string; streamedLength: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastProcessedIndex = 0;
    let sseBuffer = "";
    let streamedLength = 0;

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    if (supabaseAnonKey) {
      xhr.setRequestHeader("apikey", supabaseAnonKey);
    }

    xhr.onprogress = () => {
      const newData = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;
      sseBuffer = consumeSseBuffer(sseBuffer, newData, (delta) => {
        streamedLength += delta.length;
        onDelta(delta);
      });
    };

    xhr.onload = () => {
      const remainingData = xhr.responseText.substring(lastProcessedIndex);
      sseBuffer = consumeSseBuffer(
        sseBuffer,
        remainingData,
        (delta) => {
          streamedLength += delta.length;
          onDelta(delta);
        },
        { flush: true },
      );
      resolve({
        status: xhr.status,
        responseText: xhr.responseText,
        streamedLength,
      });
    };

    xhr.onerror = () => {
      reject(new TypeError("Network request failed"));
    };

    xhr.ontimeout = () => {
      const error = new Error("Tempo de conexão esgotado. Tente novamente.");
      error.name = "AbortError";
      reject(error);
    };

    xhr.timeout = timeoutMs;
    xhr.send(body);
  });
}

/**
 * Stream chat using XMLHttpRequest for React Native compatibility.
 * Accepts the deployed SSE function and the local JSON `{ content }` function.
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
  const { primary, fallback } = resolveChatTextRequestUrls({ os: Platform.OS });
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      onError("Você precisa estar logado para usar o chat.");
      return;
    }

    const requestBody = JSON.stringify({
      messages,
      userContext,
      insightContext,
      memoryContext,
      approachContext,
      internalProfile: memoryContext?.internalProfileText ?? null,
    });
    const urls = fallback ? [primary, fallback] : [primary];

    let result: {
      status: number;
      responseText: string;
      streamedLength: number;
    } | null = null;

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      if (__DEV__) {
        console.log("[chat] function url", url);
      }

      try {
        result = await postChatXhr({
          url,
          accessToken: session.access_token,
          supabaseAnonKey,
          body: requestBody,
          timeoutMs: CHAT_REQUEST_TIMEOUT_MS,
          onDelta,
        });
        break;
      } catch (error) {
        const canFallback =
          index < urls.length - 1 &&
          (isNetworkRequestError(error) || isAbortError(error));

        if (canFallback) {
          if (__DEV__) {
            console.warn(
              "[chat] local function unreachable, falling back to remote",
              error,
            );
          }
          continue;
        }

        console.warn("Stream error:", error);
        onError(toUserFacingChatError(error));
        return;
      }
    }

    if (!result) {
      onError("Não foi possível conectar ao chat. Verifique sua internet e tente novamente.");
      return;
    }

    if (result.status === 429) {
      onError("Limite de requisições atingido. Tente novamente mais tarde.");
      return;
    }

    if (result.status === 401) {
      onError("Sessão expirada. Por favor, faça login novamente.");
      return;
    }

    if (result.status !== 200) {
      onError(
        parseChatErrorPayload(result.responseText, "Erro ao conectar com o assistente"),
      );
      return;
    }

    if (result.streamedLength > 0) {
      await onDone();
      return;
    }

    const content = extractAssistantContent(result.responseText);
    if (!content) {
      onError("Não foi possível gerar uma resposta completa.");
      return;
    }

    onDelta(content);
    await onDone();
  } catch (error) {
    console.warn("Stream error:", error);
    onError(toUserFacingChatError(error));
  }
}
