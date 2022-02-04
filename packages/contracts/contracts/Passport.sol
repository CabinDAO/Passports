// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * The Passport contract does this and that...
 */
contract Passport is ERC721, Ownable {
  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

  struct RoyaltyInfo {
      address recipient;
      uint24 amount;
  }

  address payable public _owner;
  address payable public _cabindao = payable(0x8dca852d10c3CfccB88584281eC1Ef2d335253Fd);
  mapping(uint256 => bool) public sold;
  uint256 public price;
  uint256 public supply;
  uint256[] public tokenIds;
  string public metadataHash;
  uint256 public royaltyPcnt;
  RoyaltyInfo private _royalties;
  event Purchase(address owner, uint256 price, uint256 id, string uri);
  constructor(address owner_, string memory name_, string memory symbol_, uint256 _supply, uint256 _price, string memory _metadataHash, uint256 _royaltyPcnt) ERC721(name_, symbol_) {
    _owner = payable(owner_);
    price = _price;
    supply = _supply;
    metadataHash = _metadataHash;
    royaltyPcnt = _royaltyPcnt;
    _setRoyalties(owner_, _royaltyPcnt);
  }

  /// @inheritdoc	ERC165
  function supportsInterface(bytes4 interfaceId)
      public
      view
      virtual
      override
      returns (bool)
  {
      return (interfaceId == _INTERFACE_ID_ERC2981) || super.supportsInterface(interfaceId);
  }

  /// @notice Called with the sale price to determine how much royalty
  //          is owed and to whom.
  /// @param value - the sale price of the NFT asset specified by _tokenId
  /// @return receiver - address of who should be sent the royalty payment
  /// @return royaltyAmount - the royalty payment amount for value sale price
  function royaltyInfo(uint256, uint256 value)
      external
      view
      returns (address receiver, uint256 royaltyAmount)
  {
      RoyaltyInfo memory royalties = _royalties;
      receiver = royalties.recipient;
      royaltyAmount = (value * royalties.amount) / 10000;
  }

  /// @dev Sets token royalties
  /// @param recipient recipient of the royalties
  /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
  function _setRoyalties(address recipient, uint256 value) internal {
      require(value <= 10000, 'ERC2981Royalties: Too high');
      _royalties = RoyaltyInfo(recipient, uint24(value));
  }

  /// @notice Allows to set the royalties on the contract
  /// @dev This function in a real contract should be protected with a onlyOwner (or equivalent) modifier
  /// @param recipient the royalties recipient
  /// @param value royalties value (between 0 and 10000)
  function setRoyalties(address recipient, uint256 value) public onlyOwner{
      _setRoyalties(recipient, value);
  }

  function owner() public view override returns (address) {
    return _owner;
  }

  function setSupply(uint256 value) public onlyOwner{
    supply = value;
  }

  function buy(uint256 _id) external payable {
    require(supply > 0, "Error, no more supply of this membership");
    require(msg.value >= price, "Error, Token costs more");
    require(!sold[_id], "Error, Token is sold");

    uint256 ownerPayment = msg.value * 39 / 40;
    (bool success1, ) = _owner.call{value: ownerPayment}("");
    require(success1, "Address: unable to send value, recipient may have reverted");

    uint256 cabinPayment = msg.value / 40;
    (bool success2, ) = _cabindao.call{value: cabinPayment}("");
    require(success2, "Address: unable to send value, recipient may have reverted");
    
    _mint(msg.sender, _id);
    sold[_id] = true;
    supply = supply - 1;
    
    emit Purchase(msg.sender, price, _id, tokenURI(_id));
  }

  function get() public view returns(string memory, string memory, uint256, uint256, string memory, uint256) {
    return (name(), symbol(), supply, price, metadataHash, royaltyPcnt);
  }

  event Received(address, uint);
  receive() external payable {
      emit Received(msg.sender, msg.value);
  }
}
