export interface VoiceInterfaceRef {
  startConversation: () => Promise<void>;
  endConversation: (options?: { force?: boolean }) => Promise<void>;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setMicMuted: (muted: boolean) => void;
  toggleMicMuted: () => void;
}
