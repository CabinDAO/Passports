import { expect, use } from "chai";
import { ethers, waffle } from "hardhat";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { fail } from "assert";

use(solidity);

const CABIN_DAO = "0x8dca852d10c3CfccB88584281eC1Ef2d335253Fd";

describe("Stamp", function () {
  let dao1: SignerWithAddress | undefined;
  let member1: SignerWithAddress | undefined;

  beforeEach(async function () {
    const wallets = await ethers.getSigners();
    dao1 = wallets.pop();
    member1 = wallets.pop();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const factoryContract = await ethers.getContractFactory("Passport", dao1);
      const contract = await factoryContract.deploy(
        "Creator Cabins",
        "CC",
        100,
        utils.parseEther("1.0"),
        "0xdeadbeef",
        0,
        false
      );
      await contract.deployed();
      expect(await contract.owner()).to.equal(await dao1?.getAddress());
    });

    it("Should forward royalty to cabin address", async function () {
      const cabinDao = await ethers.getSigner(CABIN_DAO);
      const cabinBalance = await cabinDao.getBalance();

      const factoryContract = await ethers.getContractFactory("Passport", dao1);
      const price = utils.parseEther("40.0");
      const contract = await factoryContract.deploy(
        "Creator Cabins",
        "CC",
        100,
        price,
        "0xdeadbeef",
        0,
        false
      );
      await contract.deployed();
      if (!member1) fail('member1 not properly set');
      const contractToBuy = contract.connect(member1);
      const receipt = await contractToBuy.buy({
        from: await member1?.getAddress(),
        value: price,
      });
      await receipt.wait();

      expect(await waffle.provider.getBalance(contract.address)).to.equal(
        utils.parseEther("39.0")
      );
      expect((await cabinDao.getBalance()).sub(cabinBalance)).to.equal(
        utils.parseEther("1.0")
      );
    });
  });
});
