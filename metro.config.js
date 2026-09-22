// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Intercept console.warn so specific dependency deprecation warnings
// don't reach the Metro terminal.
const originalWarn = console.warn;
console.warn = (...args) => {
  const first = args[0];
  if (
    typeof first === 'string' &&
    first.includes(
      'getInfoAsync imported from "expo-file-system" is deprecated'
    )
  ) {
    return;
  }
  originalWarn(...args);
};

module.exports = config;
