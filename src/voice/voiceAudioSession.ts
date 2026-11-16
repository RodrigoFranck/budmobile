import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';
import {
  AudioSession,
  getDefaultAppleAudioConfigurationForMode,
} from '@livekit/react-native';

/**
 * Voice demos (pref_voz / onb_23_voz) use AVAudioSession .playback so samples
 * play through the main speaker at full volume, including while the phone is
 * on silent. Restore playAndRecord afterwards for LiveKit.
 */
export async function prepareVoiceDemoAudioMode() {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    });
  } catch {
    // ignore audio mode failures
  }
}

/** Restore playAndRecord for LiveKit/ElevenLabs after demos or session teardown. */
export async function restoreVoiceRecordingAudioMode() {
  if (Platform.OS === 'web') return;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });
  } catch {
    // ignore expo-av reset failures
  }

  if (Platform.OS !== 'ios') return;

  try {
    await AudioSession.setAppleAudioConfiguration(
      getDefaultAppleAudioConfigurationForMode('localAndRemote', true),
    );
  } catch {
    // ignore LiveKit audio reset failures
  }
}
