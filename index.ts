// Reactotron deve ser importado PRIMEIRO
if (__DEV__) {
  require('./src/config/ReactotronConfig');
}

import './src/config/silenceWebRtcLogs';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
