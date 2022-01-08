import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { PassportFactory } from "../typechain";
import { utils } from "ethers";

use(solidity);

describe("PassportFactory", async function () {
  let contract: PassportFactory;

  const wallets = await ethers.getSigners();
  const owner = wallets.pop();
  const dao1 = wallets.pop();

  beforeEach(async function () {
    const factoryContract = await ethers.getContractFactory(
      "PassportFactory",
      owner
    );
    contract = await factoryContract.deploy();
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner?.getAddress());
    });
  });

  describe("Create", function () {
    it("Should create a new instance of the Passport contract", async function () {
      const passport = await contract.connect(dao1?.address || "").create(
        "test",
        "TES",
        Array(10)
          .fill(null)
          .map((_, i) => i.toString()),
        utils.parseEther("0.75")
      );
      console.log(passport);
      expect(passport.blockHash).to.equal(dao1?.getAddress());
    });
  });
});
