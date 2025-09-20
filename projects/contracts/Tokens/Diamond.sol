// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Diamond is ERC20, ERC20Burnable, Ownable {
    constructor(address owner_)
        ERC20("DP-Diamond", "DPDM")
        Ownable(owner_)
    {
        _mint(owner_, 1_000_000e18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}