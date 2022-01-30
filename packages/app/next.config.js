/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const path = require("path");

module.exports = (phase) => {
  const baseConfig = {
    reactStrictMode: true,
    images: {
      domains: ['ipfs.io'],
    },
  };

  if (phase === PHASE_DEVELOPMENT_SERVER && process.env.USE_LOCAL_CONTRACTS) {
    return {
      ...baseConfig,
      webpack: (config) => {
        config.resolve.alias["@cabindao/nft-passport-contracts/artifacts/contracts"] = path.resolve(
          __dirname,
          "../contracts/artifacts/contracts"
        );
        return config;
      },
    };
  }

  return baseConfig;
};
