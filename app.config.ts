import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const expoConfig = appJson.expo as ExpoConfig;
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

export default (): ExpoConfig => ({
  ...expoConfig,
  ios: {
    ...expoConfig.ios,
    entitlements: {
      'aps-environment': isProductionBuild ? 'production' : 'development',
      ...(expoConfig.ios?.entitlements ?? {}),
    },
  },
  extra: {
    ...expoConfig.extra,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        expoConfig.extra?.eas?.projectId,
    },
  },
});
