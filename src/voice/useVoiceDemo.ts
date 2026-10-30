import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { appAlert } from '@/contexts/AppAlertContext';
import type { VoiceId } from '@/theme';
import { fetchVoiceDemoBase64 } from '@/voice/fetchVoiceDemo';

export function useVoiceDemo() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const requestIdRef = useRef(0);
  const playingIdRef = useRef<VoiceId | null>(null);
  const loadingIdRef = useRef<VoiceId | null>(null);
  const [playingId, setPlayingId] = useState<VoiceId | null>(null);
  const [loadingId, setLoadingId] = useState<VoiceId | null>(null);

  const unload = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    playingIdRef.current = null;
    setPlayingId(null);
    if (!sound) return;
    try {
      await sound.stopAsync();
    } catch {
      // already stopped
    }
    try {
      await sound.unloadAsync();
    } catch {
      // ignore unload failures
    }
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      void unload();
    };
  }, [unload]);

  const play = useCallback(
    async (voice: VoiceId) => {
      if (playingIdRef.current === voice && !loadingIdRef.current) {
        await unload();
        return;
      }

      const requestId = ++requestIdRef.current;
      await unload();
      loadingIdRef.current = voice;
      setLoadingId(voice);

      try {
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
        }

        const audioBase64 = await fetchVoiceDemoBase64(voice);
        if (requestId !== requestIdRef.current) return;

        let uri = `data:audio/mpeg;base64,${audioBase64}`;
        if (Platform.OS !== 'web' && cacheDirectory) {
          uri = `${cacheDirectory}bud-voice-${voice}.mp3`;
          await writeAsStringAsync(uri, audioBase64, { encoding: EncodingType.Base64 });
        }
        if (requestId !== requestIdRef.current) return;

        const sound = new Audio.Sound();
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            playingIdRef.current = null;
            setPlayingId(null);
            void sound.unloadAsync().catch(() => {});
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
          }
        });

        await sound.loadAsync({ uri }, { shouldPlay: true, volume: 1 });
        if (requestId !== requestIdRef.current) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        playingIdRef.current = voice;
        setPlayingId(voice);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        appAlert({
          title: 'Não deu para ouvir',
          message: error instanceof Error ? error.message : 'Tente de novo em instantes.',
        });
      } finally {
        if (requestId === requestIdRef.current) {
          loadingIdRef.current = null;
          setLoadingId(null);
        }
      }
    },
    [unload],
  );

  return { playingId, loadingId, play, stop: unload };
}
