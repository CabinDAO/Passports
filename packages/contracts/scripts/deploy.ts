import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const FactoryContract = await ethers.getContractFactory("PassportFactory");
  const contract = await FactoryContract.deploy();

  await contract.deployed();

  console.log("PassportFactory deployed", contract.address, "to", network.name);
  if (network.name === "localhost") {
    const ENV_FILE_LOCATION = path.resolve(__dirname, "../../app/.env");
    const env = fs.readFileSync(ENV_FILE_LOCATION).toString();
    const localKey = "NEXT_PUBLIC_LOCAL_PASSPORT_ADDRESS";
    const newEnv = env.includes(localKey)
      ? env
          .split(/\n/)
          .map((s) =>
            s.startsWith(localKey) ? `${localKey}=${contract.address}` : s
          )
          .join("\n")
      : `${env.trim()}\n${localKey}=${contract.address}\n`;
    fs.writeFileSync(ENV_FILE_LOCATION, newEnv);
  } else {
    fs.appendFileSync(
      "artifacts/addresses.js",
      `module.exports.${network.name.toUpperCase()}_PASSPORT_FACTORY_ADDRESS = "${
        contract.address
      }";\n`
    );
    fs.appendFileSync(
      "artifacts/addresses.d.ts",
      `export declare const ${network.name.toUpperCase()}_PASSPORT_FACTORY_ADDRESS: string;\n`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
