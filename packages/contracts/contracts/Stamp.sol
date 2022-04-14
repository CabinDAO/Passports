// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * The Stamp contract is an ERC721 that represents member access for DAOs.
 */
contract Stamp is ERC721, AccessControlEnumerable, Pausable {
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    address private immutable _cabindao =
        0x8dca852d10c3CfccB88584281eC1Ef2d335253Fd;
    address public owner;
    uint256 public price;
    uint256 public mintIndex;
    uint256 public maxSupply;
    bytes32 public metadataHash;
    bool public isPrivate;
    uint256 public royaltyPercent;
    address public royaltyRecipient;
    uint256 public maxOwned;
    event Purchase(address owner, uint256 price, uint256 id, string uri);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _supply,
        uint256 _price,
        bytes32 _metadataHash,
        uint256 _royaltyPercent,
        bool _isPrivate,
        uint256 _maxOwned
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
        price = _price;
        maxSupply = _supply;
        metadataHash = _metadataHash;
        royaltyPercent = _royaltyPercent;
        royaltyRecipient = msg.sender;
        isPrivate = _isPrivate;
        maxOwned = _maxOwned;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @inheritdoc	ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControlEnumerable)
        returns (bool)
    {
        return
            (interfaceId == _INTERFACE_ID_ERC2981) ||
            super.supportsInterface(interfaceId);
    }

    function royaltyInfo(uint256, uint256 value)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyRecipient;
        royaltyAmount = (value * royaltyPercent) / 10000;
    }

    function setRoyalties(address recipient, uint256 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set royalties"
        );
        require(value <= 10000, "ERC2981Royalties: Too high");
        royaltyRecipient = recipient;
        royaltyPercent = value;
    }

    function setRoyalty(uint256 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set royalties"
        );
        require(value <= 10000, "ERC2981Royalties: Too high");
        royaltyPercent = value;
    }

    function setSupply(uint256 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set supply"
        );
        require(value > mintIndex, "New supply must be higher than mint index");
        maxSupply = value;
    }

    function setPrice(uint256 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set price"
        );
        price = value;
    }

    function setMetadataHash(bytes32 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set new metadata"
        );
        metadataHash = value;
    }

    function setMaxOwned(uint256 value) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to set price"
        );
        price = value;
    }

    function buy() external payable whenNotPaused {
        require(maxSupply > mintIndex, "Error, no more supply of this stamp");
        require(
            maxOwned > balanceOf(msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Error, non-admin User already owns the maximum number of this stamp"
        );
        require(msg.value == price, "Error, Token costs more");
        require(
            !isPrivate || isMinter(msg.sender),
            "Address is not allowed to mint"
        );

        _mint(msg.sender, ++mintIndex);
    }

    function _baseURI() internal view override returns (string memory) {
        return string(abi.encodePacked("https://passports.creatorcabins.com/api/stamp?address=", address(this), "&token="));
    }

    function get()
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            bytes32,
            uint256,
            bool,
            uint256,
            bool
        )
    {
        return (
            name(),
            symbol(),
            maxSupply,
            mintIndex,
            price,
            metadataHash,
            royaltyPercent,
            isPrivate,
            maxOwned,
            paused()
        );
    }

    function claimEth() public {
        uint256 ownerPayment = (address(this).balance * 39) / 40;
        uint256 cabinPayment = address(this).balance / 40;
        (bool success, ) = payable(owner).call{value: ownerPayment}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
        (bool success2, ) = payable(_cabindao).call{value: cabinPayment}("");
        require(
            success2,
            "Address: unable to send value, recipient may have reverted"
        );
    }

    // event Received(address, uint256);

    // receive() external payable {
    //     emit Received(msg.sender, msg.value);
    // }

    /**
     * @dev A method to verify if the account belongs to the minter role
     * @param account The address to verify.
     * @return Return `true` if the account belongs to the minter role.
     */
    function isMinter(address account) public view virtual returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @dev Add accounts to the minter role. Restricted to admins.
     * @param accounts The members to add as a member.
     */
    function addMinters(address[] calldata accounts) public virtual {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to add accounts as minters"
        );
        for (uint256 i; i < accounts.length; ++i) {
            grantRole(MINTER_ROLE, accounts[i]);
        }
    }

    /**
     * @dev Remove accounts from the minter role. Restricted to admins.
     * @param accounts The member to remove.
     */
    function removeMinters(address[] calldata accounts) public virtual {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to remove accounts as minters"
        );
        for (uint256 i; i < accounts.length; ++i) {
            revokeRole(MINTER_ROLE, accounts[i]);
        }
    }

    /**
     * @dev Return all accounts from the minter role. Restricted to admins.
     */
    function getAllowedMinters() public virtual returns (address[] memory) {
        uint256 minterCount = getRoleMemberCount(MINTER_ROLE);
        address[] memory minters = new address[](minterCount);

        for (uint256 i = 0; i < minterCount; ++i) {
            minters[i] = getRoleMember(MINTER_ROLE, i);
        }

        return minters;
    }

    event Airdrop(address, uint256);

    /**
     * @dev Airdrop tokens to a list of address. Restricted to admins.
     * @param accounts The members to which token need to be airdropped.
     */
    function airdrop(address[] calldata accounts) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to airdrop NFTs"
        );
        require(
            maxSupply - mintIndex >= accounts.length,
            "Error, number of accounts exceeds available supply"
        );
        require(
            !isPrivate || isMinter(msg.sender),
            "Address is not allowed to mint"
        );

        for (uint256 i; i < accounts.length; ++i) {
            _mint(accounts[i], ++mintIndex);
        }

        emit Airdrop(msg.sender, mintIndex);
    }

    function grantAdmin(address account) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to denote another admin"
        );
        _setupRole(DEFAULT_ADMIN_ROLE, account);
    }

    function pause() public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to pause stamp"
        );
        _pause();
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must be admin role to unpause stamp"
        );
        _unpause();
    }
}
