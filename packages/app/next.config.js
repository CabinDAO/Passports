/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const path = require("path");

module.exports = (phase) => {
  const baseConfig = {
    reactStrictMode: true,
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...baseConfig,
      webpack: (config) => {
        config.resolve.alias["@cabindao/nft-passport-contracts"] = path.resolve(
          __dirname,
          "../contracts"
        );
        return config;
      },
    };
  }

  return baseConfig;
};
