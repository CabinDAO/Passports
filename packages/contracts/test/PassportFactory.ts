import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { PassportFactory } from "../typechain";
import { utils } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { fail } from "assert";

use(solidity);

/*
describe("PassportFactory", function () {
  let owner: SignerWithAddress | undefined;
  let dao1: SignerWithAddress | undefined;
  let contract: PassportFactory;

  beforeEach(async function () {
    const wallets = await ethers.getSigners();
    owner = wallets.pop();
    dao1 = wallets.pop();
    const factoryContract = await ethers.getContractFactory(
      "PassportFactory",
      owner
    );
    contract = await factoryContract.deploy();
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(await owner?.getAddress());
    });
  });

  describe("Create", function () {
    it("Should create a new instance of the Passport contract", async function () {
      if (!dao1) fail("dao1 address not properly set");
      const connectedContract = contract.connect(dao1);
      expect(await connectedContract.getMemberships()).to.have.length(0);
      const passport = await connectedContract.create(
        "test",
        "TES",
        15,
        utils.parseEther("0.75"),
        "0xmetadata",
        utils.parseEther("0"),
        false,
        false
      );
      await passport.wait();
      expect(await connectedContract.getMemberships()).to.have.length(1);
    });
  });
});
*/
