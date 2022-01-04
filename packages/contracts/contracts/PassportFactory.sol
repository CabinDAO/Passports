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

  function create(string memory name_, string memory symbol_, uint256[] memory tokenIds, uint256 price) public {
    require(tokenIds.length <= 100, "Could only mint max 100 passports");
    require(tokenIds.length > 0, "Required to mint at least 1 passport");
    uint index = passportId++;
    passports[index] = new Passport(name_, symbol_, tokenIds, price);
    emit PassportDeployed(passportId); 
  }
}
