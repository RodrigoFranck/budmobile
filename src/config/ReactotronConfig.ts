import { Platform } from 'react-native';
import Reactotron from 'reactotron-react-native';

declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

if (__DEV__) {
  // Android emulator: 10.0.2.2 = host machine. iOS simulator: localhost.
  // Physical devices: set EXPO_PUBLIC_REACTOTRON_HOST to your computer LAN IP.
  const host =
    process.env.EXPO_PUBLIC_REACTOTRON_HOST ||
    (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

  Reactotron.configure({
    name: 'Bud Mobile',
    host,
  })
    .useReactNative({
      asyncStorage: false, // Desabilitado pois usamos SecureStore
      networking: {
        ignoreUrls: /symbolicate/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();

  // Disponibiliza console.tron para logs
  console.tron = Reactotron;

  // Limpa logs anteriores ao iniciar
  Reactotron.clear();

  console.log(`🔧 Reactotron configurado! host=${host}`);
}

export default Reactotron;
