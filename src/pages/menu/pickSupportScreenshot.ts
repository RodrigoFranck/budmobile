import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import {
  isAllowedScreenshotType,
  sanitizeScreenshotFilename,
  type SupportScreenshot,
  validateSupportScreenshot,
} from '@/utils/supportEmail';

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

async function readBase64(uri: string, existing?: string | null): Promise<string> {
  if (existing) return existing;
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}

export async function pickSupportScreenshot(): Promise<SupportScreenshot | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && Platform.OS === 'ios') {
    throw new Error('Permita o acesso às fotos para anexar um print.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    exif: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const contentType = (asset.mimeType ?? mimeFromUri(asset.uri)).toLowerCase();
  if (!isAllowedScreenshotType(contentType)) {
    throw new Error('O print precisa ser uma imagem (jpg, png, webp ou heic).');
  }

  const screenshot: SupportScreenshot = {
    filename: sanitizeScreenshotFilename(asset.fileName ?? undefined, contentType),
    contentType,
    content: await readBase64(asset.uri, asset.base64),
  };

  const error = validateSupportScreenshot(screenshot);
  if (error) throw new Error(error);

  return screenshot;
}
