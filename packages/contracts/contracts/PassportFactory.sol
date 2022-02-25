// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Passport.sol";

/**
 * The PassportFactory contract
 */
contract PassportFactory is Ownable {
    address[] public allPassports;
    mapping(address => address[]) public passportsByAddress;
    mapping(address => mapping(address => bool)) public passportOwned;

    constructor() {}

    event PassportDeployed(address passport);

    function create(
        string memory name_,
        string memory symbol_,
        uint256 supply,
        uint256 price,
        string memory metadataHash,
        uint256 royaltyPcnt,
        bool claimable,
        bool isPrivate
    ) public {
        require(supply > 0, "Required to mint at least 1 passport");
        Passport passport = new Passport(
            msg.sender,
            name_,
            symbol_,
            supply,
            price,
            metadataHash,
            royaltyPcnt,
            claimable,
            isPrivate
        );
        address _addr = address(passport);
        allPassports.push(_addr);
        passportsByAddress[msg.sender].push(_addr);
        passportOwned[msg.sender][_addr] = true;

        emit PassportDeployed(address(passport));
    }

    function getMemberships() public view returns (address[] memory) {
        return passportsByAddress[msg.sender];
    }

    function getPassports() public view returns (address[] memory) {
        return allPassports;
    }

    function grantPassport(address passport, address admin) public {
        require(
            !passportOwned[admin][passport],
            "User already has access to Passport"
        );
        passportOwned[admin][passport] = true;
        passportsByAddress[admin].push(passport);
    }

    event Received(address, uint256);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
