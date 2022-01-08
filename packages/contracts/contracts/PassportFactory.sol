// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Passport.sol";

/**
 * The PassportFactory contract
 */
contract PassportFactory is Ownable {
  mapping(address => address[]) public passportsByOwner;

  constructor() {}

  event PassportDeployed(
    address passport
  );

  function create(string memory name_, string memory symbol_, uint256[] memory tokenIds, uint256 price) public {
    require(tokenIds.length <= 100, "Could only mint max 100 passports");
    require(tokenIds.length > 0, "Required to mint at least 1 passport");
    Passport passport = new Passport(name_, symbol_, tokenIds, price);
    address _addr = address(passport);
    passportsByOwner[msg.sender].push(_addr);
    emit PassportDeployed(address(passport)); 
  }

  function getMemberships() public view returns(address[] memory) {
    return passportsByOwner[msg.sender];
  }
}
