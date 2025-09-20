# BatchManager.sol และ BatchFactory.sol

## อัปเดตล่าสุด: ✅ EIP-1167 Minimal Proxy Suppo#### การใช้งาน

#### Deploy Template Contracts (ครั้งเดียว)
```solidity
// Deploy template contracts (implementation contracts)
Once721TemplateV2 erc721Template = new Once721TemplateV2();
Once1155TemplateV2 erc1155Template = new Once1155TemplateV2();

// Deploy BatchManager
BatchManager batchManager = new BatchManager();

// Deploy BatchFactory with template addresses
BatchFactory factory = new BatchFactory(
    address(batchManager),
    address(erc721Template),
    address(erc1155Template)
);
```

#### สำหรับ Issuer
```solidity
CreateBatchParams memory params = CreateBatchParams({
    nftType: NFTType.ERC721,
    name: "My Collection",
    symbol: "MC",
    merkleRoot: merkleRoot,
    tokensPerCode: 1,
    totalCodes: 1000,
    expireTime: block.timestamp + 30 days,
    existingNFTContract: address(0), // สร้างใหม่ด้วย minimal proxy
    royaltyRecipient: msg.sender,
    royaltyFeeNumerator: 500, // 5%
    baseURI: "https://api.example.com/metadata/"
});

(uint256 batchId, address nftContract) = batchFactory.createBatch(params);
// nftContract จะเป็น minimal proxy ที่ประหยัด gas
```

#### Predict Contract Address
```solidity
address predictedAddress = batchFactory.predictNFTContractAddress(
    issuer,
    NFTType.ERC721,
    "My Collection",
    "MC",
    block.timestamp
);
``` ได้รับการอัปเดตให้ใช้ **EIP-1167 minimal proxy (clone)** และ **CREATE2** ตามที่ระบุในสเปค:

- ✅ ใช้ `Clones.cloneDeterministic()` สำหรับ CREATE2 deployment
- ✅ สร้าง Once721TemplateV2 และ Once1155TemplateV2 ที่รองรับ initializer pattern
- ✅ สามารถ predict contract address ได้ด้วย `predictNFTContractAddress()`
- ✅ ประหยัด gas cost จากการใช้ minimal proxy แทนการ deploy contract ใหม่ทั้งหมด

## BatchManager.sol

Contract หลักสำหรับการจัดการ QR Code Batches ตามสเปคที่กำหนด

### ฟีเจอร์หลัก

#### Batch Management
- สร้าง Batch ใหม่ด้วย Merkle Tree verification
- รองรับทั้ง ERC721 และ ERC1155 NFTs
- ระบุจำนวน tokens ต่อ CodeId และจำนวน CodeIds ต่อ Batch
- กำหนดเวลาหมดอายุของ Batch

#### Claiming System
- ตรวจสอบ CodeId ด้วย Merkle Proof
- ป้องกันการ claim ซ้ำ
- Mint NFT อัตโนมัติเมื่อ claim สำเร็จ
- บันทึก claim events สำหรับ backend tracking

#### Access Control & Security
- **System Admin**: สามารถ pause/unpause ทั้งระบบ, Issuer, Batch, และ Wallet
- **Batch Owner**: เจ้าของ Batch สามารถจัดการ Batch ของตัวเอง
- **Batch Admin**: ได้รับมอบหมายจาก Owner เพื่อช่วยจัดการ Batch

#### Pause/Ban System
- Pause Issuer ทั้งหมด (System Admin เท่านั้น)
- Pause Batch เฉพาะ
- Pause User Wallet แบบ Global หรือเฉพาะ Batch
- Pause CodeId เฉพาะใน Batch

#### Admin Management
- Owner สามารถเพิ่ม/ลบ Admin ของ Batch ได้
- Role-based access control ด้วย OpenZeppelin AccessControl

### Events
- `BatchCreated`: เมื่อสร้าง Batch ใหม่
- `CodeClaimed`: เมื่อมีการ claim CodeId
- `BatchPaused`: เมื่อ pause/unpause Batch
- `IssuerPaused`: เมื่อ pause/unpause Issuer
- `WalletPaused`: เมื่อ pause/unpause Wallet
- `CodePaused`: เมื่อ pause/unpause CodeId
- `BatchExpireTimeSet`: เมื่อกำหนดเวลาหมดอายุ
- `BatchAdminAdded/Removed`: เมื่อเพิ่ม/ลบ Admin

## BatchFactory.sol

Contract Factory สำหรับสร้าง Batch และ deploy NFT contracts ด้วย **EIP-1167 Minimal Proxy**

### ฟีเจอร์หลัก

#### Batch Creation
- Interface หลักสำหรับการสร้าง Batch
- ตรวจสอบพารามิเตอร์ก่อนสร้าง Batch
- รองรับการใช้ NFT Contract เดิมหรือสร้างใหม่

#### NFT Contract Deployment ด้วย Minimal Proxy
- ✅ ใช้ **EIP-1167 minimal proxy (clone)** แทนการ deploy contract ใหม่
- ✅ ใช้ **CREATE2** สำหรับ deterministic address deployment
- Deploy จาก Once721TemplateV2 และ Once1155TemplateV2 templates
- กำหนด owner, minter role, และ royalty ผ่าน `initialize()` function
- ตั้งค่า base URI สำหรับ metadata
- **ประหยัด gas cost อย่างมาก** เมื่อเทียบกับการ deploy contract ใหม่

#### NFT Types Support
- `ERC721`: สำหรับ NFTs แบบ unique
- `ERC1155_ART`: สำหรับ digital art/collectibles
- `ERC1155_STAMP`: สำหรับ digital stamps/badges

#### Configuration Management
- กำหนดจำนวน tokens ต่อ CodeId (default)
- กำหนดจำนวน CodeIds ขั้นต่ำต่อ Batch
- System Admin สามารถปรับค่าเริ่มต้นได้

#### Contract Tracking
- เก็บรายชื่อ NFT contracts ของแต่ละ Issuer
- จัดกลุ่มตามประเภท NFT
- รองรับการใช้ existing contracts

### การใช้งาน

#### สำหรับ Issuer
```solidity
CreateBatchParams memory params = CreateBatchParams({
    nftType: NFTType.ERC721,
    name: "My Collection",
    symbol: "MC",
    merkleRoot: merkleRoot,
    tokensPerCode: 1,
    totalCodes: 1000,
    expireTime: block.timestamp + 30 days,
    existingNFTContract: address(0), // สร้างใหม่
    royaltyRecipient: msg.sender,
    royaltyFeeNumerator: 500, // 5%
    baseURI: "https://api.example.com/metadata/"
});

(uint256 batchId, address nftContract) = batchFactory.createBatch(params);
```

#### สำหรับ End User
```solidity
string memory codeId = "ABC123DEF0";
bytes32[] memory proof = [...]; // Merkle proof

batchManager.claimCode(batchId, codeId, proof);
```

### Security Features

1. **Access Control**: Role-based permissions
2. **Merkle Tree Verification**: ป้องกันการ claim CodeId ที่ไม่ถูกต้อง
3. **Pause Mechanism**: หยุดการทำงานฉุกเฉิน
4. **Expiration Time**: กำหนดระยะเวลาการใช้งาน
5. **Ban System**: ห้ามผู้ใช้หรือ CodeId เฉพาะ

### Integration Points

#### Backend Integration
- ฟัง Events เพื่อบันทึก logs
- ใช้ Alchemy Webhook สำหรับ real-time tracking
- เก็บ metadata และ product information

#### Frontend Integration
- System Admin Console: จัดการทั้งระบบ
- Issuer Dashboard: สร้างและจัดการ Batch
- End User App: สแกน QR และ claim NFTs

### Template Contracts

#### Once721TemplateV2.sol & Once1155TemplateV2.sol
- รองรับ initializer pattern สำหรับ minimal proxy
- ใช้ `initialize()` function แทน constructor
- Implement pause/unpause functionality
- รองรับ ERC2981 royalty standard
- มี access control ด้วย roles
- **ไม่รองรับ Template V1** - ใช้ V2 เท่านั้นเพื่อความเรียบง่าย

### Deployment Notes

✅ **อัปเดต**: BatchFactory ได้รับการแก้ไขให้ใช้ EIP-1167 minimal proxy แล้ว

**ข้อดี**:
1. ✅ ประหยัด gas cost มากในการ deploy NFT contracts
2. ✅ ใช้ CREATE2 สำหรับ deterministic addresses
3. ✅ สามารถ predict contract address ได้
4. ✅ Template contracts deploy เพียงครั้งเดียว

### Gas Cost Comparison

| การ Deploy | แบบเดิม | แบบ Minimal Proxy |
|------------|---------|-------------------|
| Template Contract | ไม่มี | ~2M gas (ครั้งเดียว) |
| NFT Contract แต่ละตัว | ~2M gas | ~200K gas |
| การประหยัด | - | **~90% gas saving** |

### การปรับปรุงที่เสร็จแล้ว

1. ✅ ใช้ EIP-1167 Minimal Proxy Pattern สำหรับ NFT contracts
2. ✅ CREATE2 deterministic deployment
3. ✅ Initializer pattern สำหรับ proxy contracts
4. ✅ ใช้ Template V2 เท่านั้น (ไม่มี backward compatibility)

### การปรับปรุงที่เสร็จแล้ว

1. ✅ ใช้ EIP-1167 Minimal Proxy Pattern สำหรับ NFT contracts
2. ✅ CREATE2 deterministic deployment  
3. ✅ Initializer pattern สำหรับ proxy contracts
4. ✅ เปลี่ยนเป็นใช้ Template V2 เท่านั้น (โค้ดเรียบง่ายขึ้น)

### การปรับปรุงแนะนำต่อไป

1. แยก logic ออกเป็ย libraries เพื่อลดขนาด contract
2. เพิ่ม batch operations สำหรับ efficiency
3. เพิ่ม emergency withdraw functions
4. เพิ่ม upgrade mechanism สำหรับ BatchManager
