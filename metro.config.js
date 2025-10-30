// Metro config to ensure .wasm files are treated as assets so imports like
// import wasmModule from './wa-sqlite/wa-sqlite.wasm' resolve correctly.
// This is needed when packages (like expo-sqlite web worker) import a .wasm file.
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure resolver and assetExts exist on the config and add 'wasm'
config.resolver = config.resolver || {};
config.resolver.assetExts = config.resolver.assetExts || [];
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
