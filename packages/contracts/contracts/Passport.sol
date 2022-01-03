// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * The Passport contract does this and that...
 */
contract Passport is ERC721, Ownable {
  uint public passportId = 0;
  address payable public _owner;
  mapping(uint256 => bool) public sold;
  mapping(uint256 => uint256) public price;
  event Purchase(address owner, uint256 price, uint256 id, string uri);
  constructor() ERC721("YOUR TOKEN", "TOKEN") {
    _owner = payable(msg.sender);
  }
  function mint(uint256 _price)
  public
  onlyOwner
  returns (bool)
  {
    uint256 _tokenId = passportId++;
    price[_tokenId] = _price;
    _mint(address(this), _tokenId);
    tokenURI(_tokenId);
    return true;
  }
  function buy(uint256 _id) external payable {
    _validate(_id); 
    _trade(_id);
    emit Purchase(msg.sender, price[_id], _id, tokenURI(_id));
  }
  function _validate(uint256 _id) internal {
    require(_exists(_id), "Error, wrong Token id");
    require(!sold[_id], "Error, Token is sold");
    require(msg.value >= price[_id], "Error, Token costs more"); 
  }
  function _trade(uint256 _id) internal {
    _transfer(address(this), msg.sender, _id);
    _owner.transfer(msg.value);
    sold[_id] = true;
  }
}
