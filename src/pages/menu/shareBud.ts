import { Platform, Share } from 'react-native';

import { BUD_SHARE_DISPLAY, BUD_SHARE_URL } from '@/constants/preferences';

export async function shareBud() {
  const message = `Conhece o Bud? ${BUD_SHARE_URL}`;
  await Share.share(
    Platform.OS === 'ios'
      ? { message, url: BUD_SHARE_URL, title: 'Bud' }
      : { message, title: 'Bud' },
  );
}

export async function copyBudLink() {
  const reactNative = await import('react-native');
  const clipboard = (
    reactNative as typeof reactNative & {
      Clipboard?: { setString?: (value: string) => void };
    }
  ).Clipboard;
  if (clipboard?.setString) {
    clipboard.setString(BUD_SHARE_URL);
    return true;
  }
  await shareBud();
  return false;
}

export { BUD_SHARE_DISPLAY, BUD_SHARE_URL };
