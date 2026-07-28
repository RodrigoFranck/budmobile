import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const MUTE_SOUND = require('../../assets/sounds/voice-mute.wav');
const UNMUTE_SOUND = require('../../assets/sounds/voice-unmute.wav');

type VoiceSoundKind = 'mute' | 'unmute';

const SOUND_BY_KIND: Record<VoiceSoundKind, number> = {
  mute: MUTE_SOUND,
  unmute: UNMUTE_SOUND,
};

const PLAYBACK_TIMEOUT_MS: Record<VoiceSoundKind, number> = {
  mute: 450,
  unmute: 450,
};

function playVoiceSound(kind: VoiceSoundKind): void {
  if (Platform.OS === 'web') return;

  void (async () => {
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync(SOUND_BY_KIND[kind], {
        shouldPlay: true,
        volume: 0.85,
      });
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, PLAYBACK_TIMEOUT_MS[kind]);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    } catch {
      // ignore playback failures — voice flow continues
    } finally {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore unload failures
      }
    }
  })();
}

/** Short call-style mute/unmute tone (iPhone-like) on iOS and Android. */
export function playVoiceMuteSound(muted: boolean): void {
  playVoiceSound(muted ? 'mute' : 'unmute');
}
