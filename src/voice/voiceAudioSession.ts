import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import {
  AudioSession,
  getDefaultAppleAudioConfigurationForMode,
} from '@livekit/react-native';

/**
 * Demos must not switch iOS to playback-only — LiveKit publishes the mic during
 * the WebSocket handshake, and a playback category closes the room mid-connect.
 */
export async function prepareVoiceDemoAudioMode() {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
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
