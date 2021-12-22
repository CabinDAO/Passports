// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PassportFactory.sol";

/**
 * The FactoryFactory contract
 */
contract FactoryFactory is Ownable {
  uint public factoryId = 0;
  mapping(uint => PassportFactory) public factories;

  constructor() public {}

  event FactoryDeployed(
    uint id
  );

  function create() public returns (PassportFactory passportFactory) {
    uint index = factoryId++;
    factories[index] = new PassportFactory(msg.sender);
    emit FactoryDeployed(factoryId); 
  }
}
