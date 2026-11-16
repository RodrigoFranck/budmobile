import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import {
  validateChatGalleryImage,
  type ChatGalleryImage,
} from '@/utils/chatImageMessage';

async function readBase64(uri: string, existing?: string | null): Promise<string> {
  if (existing) return existing;
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}

export async function pickChatGalleryImage(): Promise<ChatGalleryImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permita o acesso às fotos para escolher da galeria.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    base64: true,
    exif: false,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.type && asset.type !== 'image') {
    throw new Error('Escolha uma foto da galeria.');
  }

  const image: ChatGalleryImage = {
    uri: asset.uri,
    base64: await readBase64(asset.uri, asset.base64),
    mimeType: 'image/jpeg',
  };

  const error = validateChatGalleryImage(image);
  if (error) throw new Error(error);
  return image;
}
