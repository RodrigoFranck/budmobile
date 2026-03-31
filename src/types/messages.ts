/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'context';

/**
 * Streaming message interface
 * Used for messages that are being streamed in real-time
 */
export interface StreamingMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}

/**
 * Base message interface
 */
export interface Message {
  id: string | number;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  /** ISO date for dividers (from DB or client) */
  createdAt?: string;
}

