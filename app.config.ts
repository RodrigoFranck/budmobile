import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

export default (): ExpoConfig => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        appJson.expo.extra?.eas?.projectId,
    },
  },
});
