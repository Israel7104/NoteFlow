// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { registerRootComponent } from 'expo';

import App from './App';

// Registra el componente raiz para que Expo lo arranque en web y nativo.
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
