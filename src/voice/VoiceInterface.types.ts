export interface VoiceInterfaceRef {
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
}
