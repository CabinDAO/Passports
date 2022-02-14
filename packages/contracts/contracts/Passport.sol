// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * The Passport contract is an ERC721 that represents member access for DAOs.
 */
contract Passport is ERC721, Ownable, AccessControlEnumerable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  address payable public _owner;
  address payable public _cabindao = payable(0x8dca852d10c3CfccB88584281eC1Ef2d335253Fd);
  mapping(uint256 => bool) public sold;
  uint256 public price;
  uint256 public supply;
  string public metadataHash;
  bool public isPrivate;
  uint256 public royaltyPcnt;
  address public royaltyRecipient;
  bool public claimable;
  event Purchase(address owner, uint256 price, uint256 id, string uri);
  constructor(
    address owner_, 
    string memory name_, 
    string memory symbol_, 
    uint256 _supply, 
    uint256 _price, 
    string memory _metadataHash, 
    uint256 _royaltyPcnt, 
    bool _claimable,
    bool _isPrivate
  ) ERC721(name_, symbol_) {
    _owner = payable(owner_);
    price = _price;
    supply = _supply;
    metadataHash = _metadataHash;
    royaltyPcnt = _royaltyPcnt;
    royaltyRecipient = _owner;
    claimable = _claimable;
    isPrivate = _isPrivate;
    _setupRole(DEFAULT_ADMIN_ROLE, owner_);
  }

  /// @inheritdoc	ERC165
  function supportsInterface(bytes4 interfaceId)
      public
      view
      virtual
      override(ERC721, AccessControlEnumerable)
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
      receiver = royaltyRecipient;
      royaltyAmount = (value * royaltyPcnt) / 10000;
  }

  /// @notice Allows to set the royalties on the contract
  /// @dev This function in a real contract should be protected with a onlyOwner (or equivalent) modifier
  /// @param recipient recipient of the royalties
  /// @param value royalties value (between 0 and 10000)
  function setRoyalties(address recipient, uint256 value) public onlyOwner{
      require(value <= 10000, 'ERC2981Royalties: Too high');
      royaltyRecipient = recipient;
      royaltyPcnt = value;
  }

  function owner() public view override returns (address) {
    return _owner;
  }

  function setSupply(uint256 value) public onlyOwner {
    supply = value;
  }

  function buy() external payable {

    _tokenIds.increment();
    uint256 _id = _tokenIds.current();

    require(supply > 0, "Error, no more supply of this membership");
    require(msg.value >= price, "Error, Token costs more");
    require(!sold[_id], "Error, Token is sold");
    require(!isPrivate || isMinter(msg.sender), "Address is not allowed to mint");

    if (!claimable) {
      uint256 ownerPayment = msg.value * 39 / 40;
      (bool success1, ) = _owner.call{value: ownerPayment}("");
      require(success1, "Address: unable to send value, recipient may have reverted");
    }

    uint256 cabinPayment = msg.value / 40;
    (bool success2, ) = _cabindao.call{value: cabinPayment}("");
    require(success2, "Address: unable to send value, recipient may have reverted");
    
    _mint(msg.sender, _id);
    sold[_id] = true;
    supply = supply - 1;
    
    emit Purchase(msg.sender, price, _id, tokenURI(_id));
  }

  function get() public view returns(string memory, string memory, uint256, uint256, string memory, uint256, bool, bool) {
    return (name(), symbol(), supply, price, metadataHash, royaltyPcnt, claimable, isPrivate);
  }

  function claimEth() public onlyOwner {
    (bool success, ) = _owner.call{value: address(this).balance}("");
    require(success, "Address: unable to send value, recipient may have reverted");
  }

  event Received(address, uint);
  receive() external payable {
      emit Received(msg.sender, msg.value);
  }

  /**
    * @dev A method to verify if the account belongs to the minter role
    * @param account The address to verify.
    * @return Return `true` if the account belongs to the minter role.
    */
  function isMinter(address account)
      public
      virtual
      view
      returns(bool)
  {
      return hasRole(MINTER_ROLE, account);
  }

  /**
    * @dev Add accounts to the minter role. Restricted to admins.
    * @param accounts The members to add as a member.
    */
  function addMinters(address[] memory accounts)
      public
      virtual
      onlyOwner
  {
      for(uint i; i < accounts.length; i++) {
          grantRole(MINTER_ROLE, accounts[i]);
      }
  }

  /**
    * @dev Remove accounts from the minter role. Restricted to admins.
    * @param accounts The member to remove.
    */
  function removeMinters(address[] memory accounts)
      public
      virtual
      onlyOwner
  {
      for(uint i; i < accounts.length; i++) {
          revokeRole(MINTER_ROLE, accounts[i]);
      }
  }

  /**
    * @dev Return all accounts from the minter role. Restricted to admins.
    */
  function getAllowedMinters()
      public
      virtual
      onlyOwner
      returns(address[] memory)
  {
      uint minterCount = getRoleMemberCount(MINTER_ROLE);
      address[] memory minters = new address[](minterCount);
      
      for (uint i = 0; i < minterCount; ++i) {
        minters[i] = getRoleMember(MINTER_ROLE, i);
      }

      return minters;
  }

  /**
    * @dev Airdrop tokens to a list of address. Restricted to admins.
    * @param accounts The members to which token need to be airdropped.
    */
  function airdrop(address[] memory accounts)
      external
      payable
      onlyOwner
  {
      require(supply >= accounts.length, "Error, number of accounts exceeds supply");
      require(msg.value >= price*accounts.length, "Error, Airdrop costs more");
      require(!isPrivate || isMinter(msg.sender), "Address is not allowed to mint");
      
      if (!claimable) {
        uint256 ownerPayment = msg.value * 39 / 40;
        (bool success1, ) = _owner.call{value: ownerPayment}("");
        require(success1, "Address: unable to send value, recipient may have reverted");
      }

      uint256 cabinPayment = msg.value / 40;
      (bool success2, ) = _cabindao.call{value: cabinPayment}("");
      require(success2, "Address: unable to send value, recipient may have reverted");

      for(uint i; i < accounts.length; i++) {
          _tokenIds.increment();
          uint256 _id = _tokenIds.current();

          require(!sold[_id], "Error, Token is sold");

          _mint(msg.sender, _id);
          sold[_id] = true;
          supply = supply - 1;
          emit Purchase(msg.sender, price, _id, tokenURI(_id));

          safeTransferFrom(msg.sender, accounts[i], _id);        
      }
      
  }

}
