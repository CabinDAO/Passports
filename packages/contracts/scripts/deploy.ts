import { ethers } from "hardhat";

async function main() {
  const FactoryContract = await ethers.getContractFactory("PassportFactory");
  const contract = await FactoryContract.deploy();

  await contract.deployed();

  console.log("PassportFactory deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
