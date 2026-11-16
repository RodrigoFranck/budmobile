import { useEffect, useState } from 'react';
import { Image, View, type StyleProp, type ImageStyle } from 'react-native';

import { supabase } from '@/integrations/supabase/client';
import { CHAT_IMAGE_BUCKET } from '@/utils/chatImageMessage';

export function ChatPhoto({
  uri,
  storagePath,
  style,
}: {
  uri?: string | null;
  storagePath?: string | null;
  style: StyleProp<ImageStyle>;
}) {
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  useEffect(() => {
    if (uri || !storagePath) {
      setRemoteUri(null);
      return;
    }

    let cancelled = false;
    void supabase.storage
      .from(CHAT_IMAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setRemoteUri(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath, uri]);

  const source = uri || remoteUri;
  if (!source) return <View style={style} accessibilityLabel="Foto enviada" />;

  return (
    <Image
      source={{ uri: source }}
      style={style}
      resizeMode="cover"
      accessibilityLabel="Foto enviada"
      accessibilityIgnoresInvertColors
    />
  );
}
