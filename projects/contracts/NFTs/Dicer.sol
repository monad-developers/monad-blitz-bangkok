// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseGameNFT} from "./BaseGameNFT.sol";

contract Dicer is BaseGameNFT {
    constructor(address owner_, string memory baseURI_)
        BaseGameNFT(owner_, "Dicer", "DICER", baseURI_)
    {}
}