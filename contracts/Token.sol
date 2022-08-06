// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Token is ERC20, Ownable {
    constructor() ERC20("ConSector", "CS") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
