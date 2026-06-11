export interface VoiceInterfaceRef {
  startConversation: () => Promise<void>;
  endConversation: (options?: { force?: boolean }) => Promise<void>;
}
