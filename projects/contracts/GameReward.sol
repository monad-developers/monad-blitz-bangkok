// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * GameReward.sol
 * - โอน Diamond ERC20 จากยอดคงเหลือในสัญญาให้กับผู้เรียก ตามลำดับอันดับ 1–3
 * - อันดับ 1: 100, อันดับ 2: 50, อันดับ 3: 25 (คิดตามทศนิยมของโทเค็น)
 */

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

contract GameReward is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Diamond ERC20 token
    IERC20 public immutable diamond;

    /// @notice Decimals ของโทเค็น (อ่านจาก token ถ้ามี ไม่งั้น fallback = 18)
    uint8 public immutable diamondDecimals;

    /// @notice หน่วย 10**decimals เพื่อคูณจำนวนแบบเป็นโทเค็นจริง
    uint256 private immutable UNIT;

    /// @notice Event เมื่อมีการเคลมรางวัล
    event RewardClaimed(address indexed player, uint8 indexed rank, uint256 amount);

    /// @notice Error เมื่อส่ง rank ไม่ถูกต้อง
    error InvalidRank();

    constructor(address diamondToken) {
        require(diamondToken != address(0), "Diamond token is zero");
        diamond = IERC20(diamondToken);

        uint8 decs;
        // พยายามอ่าน decimals() ถ้าโทเค็นรองรับ ERC20Metadata
        try IERC20Metadata(diamondToken).decimals() returns (uint8 d) {
            decs = d;
        } catch {
            decs = 18; // fallback มาตรฐานที่พบบ่อย
        }
        diamondDecimals = decs;
        UNIT = 10 ** uint256(decs);
    }

    /**
     * @notice เคลมรางวัลตามอันดับ
     * @param rank ใส่ 1, 2 หรือ 3 เท่านั้น
     * - 1 = 100 Diamond
     * - 2 = 50 Diamond
     * - 3 = 25 Diamond
     *
     * โทเค็นจะถูกโอนจากยอดคงเหลือของสัญญานี้ไปยัง msg.sender
     */
    function claimReward(uint8 rank) external nonReentrant {
        uint256 base;
        if (rank == 1) {
            base = 100;
        } else if (rank == 2) {
            base = 50;
        } else if (rank == 3) {
            base = 25;
        } else {
            revert InvalidRank();
        }

        uint256 amount = base * UNIT;
        diamond.safeTransfer(msg.sender, amount);
        emit RewardClaimed(msg.sender, rank, amount);
    }

    /**
     * @dev ฟังก์ชันช่วยดู balance ของ Diamond ในสัญญานี้ (เผื่อใช้ตรวจสอบก่อนเคลม)
     */
    function contractDiamondBalance() external view returns (uint256) {
        return diamond.balanceOf(address(this));
    }
}