export const BUILD_INFO = Object.freeze({
  version: import.meta.env.VITE_CAMPUSOS_VERSION || 'unknown',
  buildCode: import.meta.env.VITE_CAMPUSOS_BUILD_CODE || 'unknown',
  commit: import.meta.env.VITE_CAMPUSOS_COMMIT || 'unknown',
  builtAt: import.meta.env.VITE_CAMPUSOS_BUILT_AT || 'unknown',
  channel: import.meta.env.MODE,
});
