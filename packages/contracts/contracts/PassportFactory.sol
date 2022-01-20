// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Passport.sol";

/**
 * The PassportFactory contract
 */
contract PassportFactory is Ownable {
  mapping(uint256 => address[]) public passportsByOwner;
  mapping(address => uint256) public ownerIdByAddress;
  uint256 public ownerId = 1;

  constructor() {}

  event PassportDeployed(
    address passport
  );

  function create(string memory name_, string memory symbol_, uint256 supply, uint256 price) public {
    require(supply > 0, "Required to mint at least 1 passport");
    Passport passport = new Passport(name_, symbol_, supply, price);
    address _addr = address(passport);
    if (ownerIdByAddress[msg.sender] == 0) {
      ownerIdByAddress[msg.sender] = ownerId;
      ownerId++;
    }
    passportsByOwner[ownerIdByAddress[msg.sender]].push(_addr);
    
    emit PassportDeployed(address(passport)); 
  }

  function getMemberships() public view returns(address[] memory) {
    return passportsByOwner[ownerIdByAddress[msg.sender]];
  }

  function getPassportsByOwner(uint256 id) public view returns(address[] memory) {
    return passportsByOwner[id];
  }

  event Received(address, uint);
  receive() external payable {
      emit Received(msg.sender, msg.value);
  }
}
