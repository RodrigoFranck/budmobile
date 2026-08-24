export type StartVoiceConversationOptions = {
  firstMessage?: string;
};

export interface VoiceInterfaceRef {
  startConversation: (options?: StartVoiceConversationOptions) => Promise<void>;
  endConversation: (options?: { force?: boolean }) => Promise<void>;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setMicMuted: (muted: boolean) => void;
  toggleMicMuted: () => void;
}
