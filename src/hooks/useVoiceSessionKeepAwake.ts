import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';

const VOICE_SESSION_KEEP_AWAKE_TAG = 'bud-voice-session';

export function useVoiceSessionKeepAwake(active: boolean) {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (active) {
      void activateKeepAwakeAsync(VOICE_SESSION_KEEP_AWAKE_TAG);
    } else {
      void deactivateKeepAwake(VOICE_SESSION_KEEP_AWAKE_TAG);
    }

    return () => {
      void deactivateKeepAwake(VOICE_SESSION_KEEP_AWAKE_TAG);
    };
  }, [active]);
}
