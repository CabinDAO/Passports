// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * The Passport contract does this and that...
 */
contract Passport is ERC721, Ownable {
  address payable public _owner;
  mapping(uint256 => bool) public sold;
  uint256 public price;
  uint256 public supply;
  uint256[] public tokenIds;
  event Purchase(address owner, uint256 price, uint256 id, string uri);
  constructor(string memory name_, string memory symbol_, uint256[] memory _tokenIds, uint256 _price) ERC721(name_, symbol_) {
    _owner = payable(msg.sender);
    uint quantity = tokenIds.length;
    price = _price;
    supply = _tokenIds.length;
    tokenIds = _tokenIds;
    for (uint i = 0; i < quantity; i++) {
      uint256 _tokenId = _tokenIds[i];
      _mint(address(this), _tokenId);
      tokenURI(_tokenId);
    }
  }

  function buy() external payable {
    require(supply > 0, "Error, no more supply of this membership");
    uint256 _id = tokenIds[supply - 1];
    _validate(_id); 
    _trade(_id);
    emit Purchase(msg.sender, price, _id, tokenURI(_id));
  }
  function _validate(uint256 _id) internal {
    require(_exists(_id), "Error, wrong Token id");
    require(!sold[_id], "Error, Token is sold");
    require(msg.value >= price, "Error, Token costs more"); 
  }
  function _trade(uint256 _id) internal {
    _transfer(address(this), msg.sender, _id);
    _owner.transfer(msg.value);
    sold[_id] = true;
    supply = supply - 1;
  }

  function get() public view returns(string memory, string memory, uint256, uint256) {
    return (name(), symbol(), supply, price);
  }
}
