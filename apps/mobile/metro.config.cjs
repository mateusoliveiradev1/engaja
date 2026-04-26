const { getDefaultConfig } = require("expo/metro-config");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = (request) => context.resolveRequest(context, request, platform);

  if (moduleName.startsWith(".") && moduleName.endsWith(".js")) {
    try {
      return resolve(moduleName);
    } catch {
      return resolve(moduleName.slice(0, -3));
    }
  }

  return resolve(moduleName);
};

module.exports = config;
