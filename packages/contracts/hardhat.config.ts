import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
    console.log(await account.getBalance());
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const getAccountsFromEnv= (key: string): string[]  => {
  const account = process.env[key];
  return account ? [account] : [];
}

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts: getAccountsFromEnv('ROPSTEN_PRIVATE_KEY'),
    },
    kovan: {
      url: process.env.KOVAN_URL || "",
      accounts: getAccountsFromEnv('KOVAN_PRIVATE_KEY'),
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: getAccountsFromEnv('PRIVATE_KEY')
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
