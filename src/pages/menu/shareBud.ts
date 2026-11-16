import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { BUD_SHARE_DISPLAY, BUD_SHARE_URL } from '@/constants/preferences';

export async function shareBud() {
  await Share.share(
    Platform.OS === 'ios'
      ? { url: BUD_SHARE_URL }
      : { message: BUD_SHARE_URL },
  );
}

export async function copyBudLink() {
  await Clipboard.setStringAsync(BUD_SHARE_URL);
  return true;
}

export { BUD_SHARE_DISPLAY, BUD_SHARE_URL };
