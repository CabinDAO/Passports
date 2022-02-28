// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Cabin Token", "CABIN") {
        _mint(address(this), 10000 * 10**uint256(decimals()));
    }

    event Fauceted(uint256 quantity);

    function faucet(uint256 quantity) public {
        _approve(address(this), msg.sender, quantity);
        transferFrom(address(this), msg.sender, quantity);
        emit Fauceted(quantity);
    }
}
