import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useV3Colors } from '@/theme';

type ChatShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickGallery: () => void;
};

export function ChatShareSheet({
  visible,
  onClose,
  onTakePhoto,
  onPickGallery,
}: ChatShareSheetProps) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.scrim, opacity: 0.6 }]}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 28,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.line }]} />
          </View>
          <Text
            style={{
              marginTop: 22,
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.4,
              color: colors.text,
            }}
          >
            Compartilhar com o{' '}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>Bud</Text>
          </Text>

          <TouchableOpacity
            onPress={onTakePhoto}
            accessibilityRole="button"
            accessibilityLabel="Tirar uma foto"
            style={styles.row}
          >
            <Camera color={colors.text} size={22} strokeWidth={2} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Tirar uma foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPickGallery}
            accessibilityRole="button"
            accessibilityLabel="Escolher da galeria"
            style={styles.row}
          >
            <ImageIcon color={colors.text} size={22} strokeWidth={2} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Escolher da galeria</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  handleWrap: {
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  row: {
    marginTop: 14,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 17,
  },
});
