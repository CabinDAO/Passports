// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    address[] internal stakeholders;
    mapping(address => uint256) internal indices;
    mapping(address => uint256) internal stakes;
    ERC20 token;

    constructor(address _token) {
        token = ERC20(_token);
    }

    event StakeCreated();

    function createStake(uint256 _stake) public {
        token.transferFrom(msg.sender, address(this), _stake);
        if (stakes[msg.sender] == 0) {
            indices[msg.sender] = stakeholders.length;
            stakeholders.push(msg.sender);
        }
        stakes[msg.sender] = stakes[msg.sender] + _stake;
        emit StakeCreated();
    }

    event StakeRemoved();

    function removeStake(uint256 _stake) public {
        require(
            _stake <= stakes[msg.sender],
            "Cannot remove more than allocated stake"
        );
        stakes[msg.sender] = stakes[msg.sender] - _stake;
        if (stakes[msg.sender] == 0) {
            uint256 s = indices[msg.sender];
            address addressToMove = stakeholders[stakeholders.length - 1];
            if (addressToMove != msg.sender) {
                stakeholders[s] = addressToMove;
                indices[addressToMove] = s;
            }
            delete indices[addressToMove];
            stakeholders.pop();
        }
        token.transfer(msg.sender, _stake);
        emit StakeRemoved();
    }

    function isStakeholder(address _address) public view returns (bool) {
        return stakes[_address] >= 0;
    }
}
