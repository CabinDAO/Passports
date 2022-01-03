// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Passport.sol";

/**
 * The PassportFactory contract
 */
contract PassportFactory is Ownable {
  uint public passportId = 0;
  mapping(uint => Passport) public passports;

  constructor() {}

  event PassportDeployed(
    uint id
  );

  function create() public {
    uint index = passportId++;
    passports[index] = new Passport();
    emit PassportDeployed(passportId); 
  }
}
