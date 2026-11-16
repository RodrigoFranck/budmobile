import { StyleSheet } from 'react-native';

import { fonts, type V3Colors } from '@/theme';

export function createChatMessageStyles(params: { colors: V3Colors }) {
  const { colors } = params;

  return StyleSheet.create({
    contextText: {
      fontFamily: fonts.sansItalic,
      fontSize: 15,
      lineHeight: 21,
      color: colors.text2,
    },
    messageContent: {
      alignSelf: 'stretch',
      width: '100%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: 300,
      backgroundColor: colors.surface2,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 6,
      paddingHorizontal: 18,
      paddingVertical: 13,
    },
    assistantBody: {
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      flexShrink: 1,
    },
    userPhotoBubble: {
      alignSelf: 'flex-end',
      width: 264,
      backgroundColor: colors.surface2,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 6,
      overflow: 'hidden',
    },
    userPhoto: {
      width: 264,
      height: 176,
    },
    userBody: {
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 23,
      color: colors.text,
      flexShrink: 1,
    },
    stanzaSpacing: {
      marginTop: 16,
    },
    assistantWrap: {
      marginBottom: 16,
      width: '100%',
      alignItems: 'flex-start',
      maxWidth: 350,
    },
    userWrap: {
      marginBottom: 16,
      width: '100%',
      alignItems: 'flex-end',
    },
  });
}
