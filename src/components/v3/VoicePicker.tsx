import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Volume2, VolumeX } from 'lucide-react-native';

import { fonts, useV3Colors, v3LightColors, voiceOptions, type VoiceId } from '@/theme';
import { useVoiceDemo } from '@/voice/useVoiceDemo';

const PORTRAIT = 200;
const DOT_GAP = 7;

type VoiceOption = (typeof voiceOptions)[number];

export function VoicePicker({
  index,
  onIndexChange,
  showSilentHint = false,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  showSilentHint?: boolean;
}) {
  const colors = useV3Colors();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<VoiceOption>>(null);
  const fromScroll = useRef(false);
  const { playingId, loadingId, play, stop } = useVoiceDemo();

  useEffect(() => {
    if (fromScroll.current) {
      fromScroll.current = false;
      return;
    }
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
  }, [index, width]);

  useEffect(() => {
    void stop();
  }, [index, stop]);

  const snapTo = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next === index || next < 0 || next >= voiceOptions.length) return;
    fromScroll.current = true;
    void Haptics.selectionAsync();
    onIndexChange(next);
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={voiceOptions}
        extraData={`${playingId ?? ''}:${loadingId ?? ''}`}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        initialScrollIndex={index}
        onScrollToIndexFailed={() => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({ offset: index * width, animated: false });
          });
        }}
        onMomentumScrollEnd={snapTo}
        style={{ height: PORTRAIT }}
        renderItem={({ item }) => (
          <VoiceSlide
            voice={item}
            width={width}
            playing={playingId === item.id}
            loading={loadingId === item.id}
            onListen={() => {
              void play(item.id);
            }}
          />
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: DOT_GAP,
          marginTop: 80,
        }}
      >
        {voiceOptions.map((option, optionIndex) => {
          const active = optionIndex === index;
          return (
            <Pressable
              key={option.id}
              onPress={() => onIndexChange(optionIndex)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              hitSlop={10}
              style={{
                height: 9,
                width: active ? 28 : 9,
                borderRadius: 5,
                backgroundColor: active ? colors.text : colors.text3,
              }}
            />
          );
        })}
      </View>

      {showSilentHint ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
            marginTop: 32,
            paddingHorizontal: 40,
            color: colors.text2,
          }}
        >
          Se o celular estiver no silencioso, você não vai ouvir as vozes.
        </Text>
      ) : null}
    </View>
  );
}

function VoiceSlide({
  voice,
  width,
  playing,
  loading,
  onListen,
}: {
  voice: VoiceOption;
  width: number;
  playing: boolean;
  loading: boolean;
  onListen: () => void;
}) {
  const colors = useV3Colors();
  const label = playing ? 'Parar' : 'Ouvir';
  const Icon = playing ? VolumeX : Volume2;

  return (
    <View
      style={{
        width,
        paddingHorizontal: 28,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: PORTRAIT,
          height: PORTRAIT,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: v3LightColors.surface,
        }}
      >
        <Image source={voice.image} style={{ width: PORTRAIT, height: PORTRAIT }} />
      </View>
      <View style={{ flex: 1, marginLeft: 22, paddingTop: 8 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.4,
            color: colors.text,
          }}
        >
          {voice.label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 16,
            lineHeight: 25,
            color: colors.text2,
            marginTop: 8,
          }}
        >
          {voice.bio}
        </Text>
        <Pressable
          onPress={onListen}
          accessibilityRole="button"
          accessibilityLabel={playing ? `Parar ${voice.label}` : `Ouvir ${voice.label}`}
          hitSlop={8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            minHeight: 36,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Icon color={colors.accent} size={22} />
          )}
          <Text
            style={{
              fontFamily: fonts.sansSemi,
              fontSize: 14,
              lineHeight: 14,
              color: colors.accent,
            }}
          >
            {label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function voiceIdAt(index: number): VoiceId {
  return voiceOptions[index]?.id ?? voiceOptions[0].id;
}
