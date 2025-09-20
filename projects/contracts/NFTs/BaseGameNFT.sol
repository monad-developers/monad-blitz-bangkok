// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BaseGameNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 public nextId;
    string private _base;

    constructor(
        address owner_,
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    )
        ERC721(name_, symbol_)
        Ownable(owner_)
    {
        _base = baseURI_;
    }

    /* ----------------------------- Admin / Config ---------------------------- */

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _base = baseURI_;
    }

    /* --------------------------------- Minting -------------------------------- */

    /// @notice mint โทเค็นใหม่ให้ `to` โดยแนบ suffix ของ metadata (เช่น "1.json")
    function mint(address to, string calldata tokenURISuffix)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        tokenId = ++nextId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURISuffix);
    }

    /// @notice batch mint
    /*function mintBatch(address[] calldata recipients, string[] calldata suffixes)
        external
        onlyOwner
        returns (uint256[] memory tokenIds)
    {
        require(recipients.length == suffixes.length, "LengthMismatch");
        tokenIds = new uint256[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = ++nextId;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, suffixes[i]);
            tokenIds[i] = tokenId;
        }
    }*/

    /* ---------------------------- Owner token listing ---------------------------- */

    /// @notice get all tokens of owner
    function getTokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = tokenOfOwnerByIndex(owner, i);
        }
        return ids;
    }

    /* ----------------------------- Required overrides ---------------------------- */

    // ERC721 + ERC721Enumerable + ERC721URIStorage
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}