import { StyleSheet, Platform } from 'react-native';

import { fonts, type V3Colors } from '@/theme';

export function createAuthStyles(colors: V3Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
    },
    content: {
      width: '100%',
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    header: {
      width: '100%',
      paddingTop: 12,
    },
    welcomeArt: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: 220,
    },
    welcomeGiz: {
      width: 220,
      height: 280,
    },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.display,
      color: colors.text,
      letterSpacing: -0.4,
    },
    titleAccent: {
      fontFamily: fonts.displayItalic,
      fontStyle: 'italic',
      color: colors.accent,
    },
    subtitle: {
      fontSize: 17,
      lineHeight: 26,
      fontFamily: fonts.sans,
      color: colors.text2,
      marginTop: 16,
    },
    mainSection: {
      width: '100%',
      paddingTop: 8,
      paddingBottom: 12,
    },
    footerSection: {
      width: '100%',
      paddingBottom: 8,
    },
    socialSection: {
      gap: 12,
    },
    socialButton: {
      height: 58,
      borderRadius: 29,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.surface2,
    },
    socialButtonText: {
      fontSize: 17,
      fontFamily: fonts.sansSemi,
      color: colors.text,
    },
    socialIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emailSection: {
      width: '100%',
    },
    backRow: {
      marginBottom: 24,
    },
    emailAuthToggle: {
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },
    emailAuthToggleText: {
      fontSize: 16,
      fontFamily: fonts.sansSemi,
      color: colors.text2,
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface2,
      borderRadius: 16,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
    },
    tabActive: {
      backgroundColor: colors.btn,
    },
    tabText: {
      fontSize: 16,
      fontFamily: fonts.sans,
      color: colors.text2,
    },
    tabTextActive: {
      fontFamily: fonts.sansSemi,
      color: colors.onBtn,
    },
    form: {
      gap: 12,
      marginBottom: 16,
    },
    inputGroup: {
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.text2,
    },
    forgotPassword: {
      fontSize: 14,
      fontFamily: fonts.sansSemi,
      color: colors.text2,
      textAlign: 'right',
    },
    input: {
      height: 58,
      backgroundColor: colors.surface2,
      borderRadius: 18,
      paddingHorizontal: 22,
      fontSize: 16,
      fontFamily: fonts.sans,
      color: colors.text,
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 58,
      backgroundColor: colors.surface2,
      borderRadius: 18,
    },
    passwordInput: {
      flex: 1,
      height: 58,
      paddingHorizontal: 22,
      fontSize: 16,
      fontFamily: fonts.sans,
      color: colors.text,
    },
    eyeIcon: {
      paddingRight: 16,
      paddingLeft: 8,
    },
    button: {
      height: 58,
      backgroundColor: colors.btn,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonText: {
      fontSize: 17,
      fontFamily: fonts.sansSemi,
      color: colors.onBtn,
    },
    signupHint: {
      fontSize: 13,
      fontFamily: fonts.sans,
      color: colors.text3,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 8,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 8,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.line,
    },
    dividerText: {
      fontSize: 14,
      fontFamily: fonts.sans,
      color: colors.text3,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    termsText: {
      fontSize: 12,
      fontFamily: fonts.sans,
      color: colors.text3,
      textAlign: 'center',
      paddingHorizontal: 8,
      lineHeight: 17,
      marginTop: 12,
    },
    termsLink: {
      textDecorationLine: 'underline',
      color: colors.text3,
    },
    secondaryLink: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    secondaryLinkText: {
      fontSize: 16,
      fontFamily: fonts.sansSemi,
      color: colors.text2,
    },
    forgotPasswordTitle: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.display,
      color: colors.text,
      textAlign: 'left',
      marginBottom: 12,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    },
    forgotPasswordDescription: {
      fontSize: 16,
      fontFamily: fonts.sans,
      color: colors.text2,
      textAlign: 'left',
      lineHeight: 24,
      marginBottom: 24,
    },
    textLinkButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    textLinkButtonText: {
      fontSize: 16,
      fontFamily: fonts.sansSemi,
      color: colors.text2,
    },
    emailHighlight: {
      fontFamily: fonts.sansSemi,
      color: colors.text,
    },
    forgotPasswordContent: {
      width: '100%',
      justifyContent: 'flex-start',
    },
    forgotPasswordNavBar: {
      width: '100%',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    forgotPasswordBody: {
      width: '100%',
      paddingTop: 24,
    },
  });
}

/** @deprecated Use createAuthStyles(useV3Colors()) — kept for modules still importing the name. */
export const authStyles = createAuthStyles({
  bg: '#171310',
  surface: '#201B18',
  surface2: '#2A2522',
  line: '#3A332D',
  text: '#F1E6DB',
  text2: '#A39C93',
  text3: '#7A726A',
  accent: '#B0EDEE',
  btn: '#F1E6DA',
  onBtn: '#171312',
  onAccent: '#171311',
  scrim: '#0D0B09',
});
