// No-op shim for expo-sqlite on web platform
// This is used when running in web mode to avoid WASM loading issues

export const openDatabaseAsync = async (name: string) => ({
  runAsync: async () => {},
  execAsync: async () => {},
  getAllAsync: async () => [],
  getFirstAsync: async () => null,
});

export default {
  openDatabaseAsync,
};
