import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function deploy(key: string) {
  const name = key
    .split("_")
    .map((s) => `${s.slice(0, 1)}${s.slice(1).toLowerCase()}`)
    .join("");
  const FactoryContract = await ethers.getContractFactory(name);
  const contract = await FactoryContract.deploy();

  await contract.deployed();

  console.log(name, "deployed", contract.address, "to", network.name);
  if (network.name === "localhost") {
    const ENV_FILE_LOCATION = path.resolve(__dirname, "../../app/.env");
    const env = fs.readFileSync(ENV_FILE_LOCATION).toString();
    const localKey = `NEXT_PUBLIC_LOCAL_${key}_ADDRESS`;
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
      `module.exports.${network.name.toUpperCase()}_${key}_ADDRESS = "${
        contract.address
      }";\n`
    );
    fs.appendFileSync(
      "artifacts/addresses.d.ts",
      `export declare const ${network.name.toUpperCase()}_${key}_ADDRESS: string;\n`
    );
  }
}

async function main() {
  await deploy("PASSPORT_FACTORY");
  await deploy("STAKING");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
