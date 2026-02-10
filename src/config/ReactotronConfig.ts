import Reactotron from 'reactotron-react-native';

declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

if (__DEV__) {
  Reactotron.configure({
    name: 'Bud Mobile',
    host: 'localhost', // IP do seu computador para dispositivos físicos
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

  console.log('🔧 Reactotron configurado!');
}

export default Reactotron;

