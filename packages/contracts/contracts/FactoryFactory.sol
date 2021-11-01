// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PassportFactory.sol";

/**
 * The FactoryFactory contract
 */
contract FactoryFactory is Ownable {
  constructor() public {}

  function create () public returns (PassportFactory passportFactory) {
    passportFactory = new PassportFactory(msg.sender);
  }
}
