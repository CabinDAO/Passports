import { ethers } from "hardhat";

async function main() {
  const FactoryFactoryContract = await ethers.getContractFactory("FactoryFactory");
  const contract = await FactoryFactoryContract.deploy();

  await contract.deployed();

  console.log("FactoryFactory deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
