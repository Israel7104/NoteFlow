// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: ["react-native-reanimated/plugin"],
  };
};
