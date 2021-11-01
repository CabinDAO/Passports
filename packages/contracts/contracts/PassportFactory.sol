// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * The PassportFactory contract does this and that...
 */
contract PassportFactory is Ownable {
  constructor(address _custodian) public {
    transferOwnership(_custodian);
  }
}
