// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract OnceToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Special address with unlimited allowance (e.g., factory contract)
    address public trustedSpender;

    constructor(address defaultAdmin, address minter)
        ERC20("OnceTest", "ONCT")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // Set trusted spender address (factory contract)
    function setTrustedSpender(address _trustedSpender) public onlyRole(DEFAULT_ADMIN_ROLE) {
        trustedSpender = _trustedSpender;
    }

    // Override allowance to provide unlimited allowance for trusted spender
    function allowance(address owner, address spender) public view override returns (uint256) {
        if (spender == trustedSpender && trustedSpender != address(0)) {
            return type(uint256).max; // Unlimited allowance for trusted spender
        }
        return super.allowance(owner, spender);
    }

    // Override _spendAllowance to handle trusted spender
    function _spendAllowance(address owner, address spender, uint256 value) internal override {
        if (spender == trustedSpender && trustedSpender != address(0)) {
            // No need to spend allowance for trusted spender
            return;
        }
        super._spendAllowance(owner, spender, value);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
