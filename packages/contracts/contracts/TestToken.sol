// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 initialSupply) ERC20('Cabin Token', "CABIN") {
        _mint(msg.sender, initialSupply* 10**uint(decimals()));
    }

    event Fauceted(
        uint256 quantity
    );
    function faucet(uint256 quantity) public
    {
        this.transferFrom(address(this), msg.sender, quantity* 10**uint(decimals()));
        emit Fauceted(quantity); 
    }

    fallback() external {} 
}
