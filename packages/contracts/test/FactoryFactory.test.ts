import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { FactoryFactory } from "../typechain"
import type { Signer } from "ethers"

use(solidity);

describe("FactoryFactory", async function() {
  let contract: FactoryFactory

  let wallets = await ethers.getSigners();
  let owner = wallets.pop()
  let dao1 = wallets.pop()
  let dao2 = wallets.pop()
  let dao3 = wallets.pop()

  beforeEach(async function () {
    wallets = await ethers.getSigners();
    owner = wallets.pop()
    dao1 = wallets.pop()
    dao2 = wallets.pop()
    dao3 = wallets.pop()

    const factoryContract = await ethers.getContractFactory("FactoryFactory", owner)
    contract = await factoryContract.deploy()
    await contract.deployed()
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await contract.owner()).to.equal(owner?.getAddress())
    });
  });
  
  describe('Create', function() {
    it("Should create a new instance of the PassportFactory contract", async function() {
      const passportFactory = contract.connect(dao1).create();
      expect(await passportFactory.owner).to.equal(dao1?.getAddress())
    })

    // - set owner of the passport factory to the dao
  })
})

