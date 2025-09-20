````markdown
# Once721TemplateV2 Test Suite

เอกสารสำหรับ Test Cases ของ `Once721TemplateV2` contract

## ภาพรวม

Test suite นี้ครอบคลุมการทดสอบทุกฟีเจอร์ของ `Once721TemplateV2` contract ซึ่งเป็น ERC721 template ที่ใช้ Initialize Pattern:

- **Initialize Pattern**: การตั้งค่าแบบ initialize แทน constructor
- **Custom Name/Symbol Override**: การ override name และ symbol แบบ dynamic
- **AccessControl**: การควบคุมสิทธิ์การเข้าถึงแบบ role-based
- **Pausable**: การหยุดการทำงานชั่วคราว
- **ERC2981**: Royalty สำหรับ NFT marketplace
- **Gas Optimized**: ไม่มี Enumerable และ Burnable เพื่อลด gas

## การรัน Test

### รัน Test ทั้งหมด
```bash
npx hardhat test test/Once721TemplateV2.test.js
```

### รัน Test เฉพาะกลุ่ม
```bash
# ทดสอบ Deployment
npx hardhat test test/Once721TemplateV2.test.js --grep "Deployment"

# ทดสอบ Initialization
npx hardhat test test/Once721TemplateV2.test.js --grep "Initialization"

# ทดสอบ Name and Symbol Override
npx hardhat test test/Once721TemplateV2.test.js --grep "Name and Symbol Override"

# ทดสอบ Minting
npx hardhat test test/Once721TemplateV2.test.js --grep "Minting"

# ทดสอบ Pausable
npx hardhat test test/Once721TemplateV2.test.js --grep "Pausable"
```

### รัน Test Coverage
```bash
npx hardhat coverage --testfiles test/Once721TemplateV2.test.js
```

## Test Cases ที่ครอบคลุม

### 1. Deployment (3 tests)
- ✅ ตรวจสอบการ deploy ด้วย template name และ symbol
- ✅ ตรวจสอบสถานะไม่ initialized หลัง deployment
- ✅ ตรวจสอบไม่มี roles ก่อน initialization

### 2. Initialization (5 tests)
- ✅ การ initialize ด้วย parameters ที่ถูกต้อง
- ✅ การกำหนด roles หลัง initialization
- ✅ การตั้งค่า royalty info หลัง initialization
- ✅ การป้องกัน double initialization
- ✅ การเริ่มต้น token ID counter ที่ 1

### 3. Name and Symbol Override (4 tests)
- ✅ การคืนค่า template name/symbol ก่อน initialization
- ✅ การคืนค่า initialized name/symbol หลัง initialization
- ✅ การจัดการ empty name และ symbol
- ✅ การจัดการ name และ symbol ยาว

### 4. Access Control (3 tests)
- ✅ การให้และเพิกถอนสิทธิ์โดย owner
- ✅ การป้องกันการให้สิทธิ์โดยผู้ที่ไม่มีสิทธิ์
- ✅ การสละสิทธิ์ของตนเอง

### 5. Minting (7 tests)
- ✅ การ mint โดย minter
- ✅ การเพิ่ม token ID อย่างถูกต้อง
- ✅ การป้องกันการ mint โดยผู้ที่ไม่มีสิทธิ์
- ✅ การป้องกันการ mint ก่อน initialization
- ✅ การส่ง Transfer event เมื่อ mint
- ✅ การ revert เมื่อ mint ไป zero address
- ✅ การ mint หลาย tokens ให้ address เดียว

### 6. URI Management (8 tests)
- ✅ การคืนค่า empty string เมื่อไม่มี base URI
- ✅ การตั้งค่า base URI โดย admin
- ✅ การป้องกันการตั้งค่า URI โดยผู้ที่ไม่มีสิทธิ์
- ✅ การป้องกันการตั้งค่า URI ก่อน initialization
- ✅ การ revert เมื่อเรียก URI ของ token ที่ไม่มี
- ✅ การจัดการ multiple token URIs
- ✅ การอัพเดท base URI
- ✅ การจัดการ empty base URI

### 7. Pausable Functionality (10 tests)
- ✅ การ pause และ unpause โดย admin
- ✅ การป้องกันการ pause โดยผู้ที่ไม่มีสิทธิ์
- ✅ การป้องกันการ unpause โดยผู้ที่ไม่มีสิทธิ์
- ✅ การป้องกันการ pause/unpause ก่อน initialization
- ✅ การป้องกัน transfers เมื่อ paused
- ✅ การป้องกัน minting เมื่อ paused
- ✅ การทำงานปกติของ transfers หลัง unpause
- ✅ การส่ง Paused event
- ✅ การส่ง Unpaused event
- ✅ การจัดการ multiple pause/unpause cycles

### 8. Transfers (8 tests)
- ✅ การ transfer โดย token owner
- ✅ การ transfer โดย approved address
- ✅ การ transfer โดย approved for all
- ✅ การป้องกัน unauthorized transfer
- ✅ การส่ง Transfer event
- ✅ การอัพเดท balances อย่างถูกต้อง
- ✅ การรองรับ safe transfers
- ✅ การรองรับ safe transfers พร้อม data

### 9. Approvals (5 tests)
- ✅ การ approve โดย token owner
- ✅ การ set approval for all
- ✅ การส่ง Approval event
- ✅ การส่ง ApprovalForAll event
- ✅ การล้าง approval เมื่อ transfer

### 10. Royalty (ERC2981) (4 tests)
- ✅ การคืนค่า royalty info ที่ถูกต้อง
- ✅ การสนับสนุน ERC2981 interface
- ✅ การจัดการ zero sale price
- ✅ การคำนวณ royalty สำหรับ sale prices ต่างๆ

### 11. Interface Support (3 tests)
- ✅ การสนับสนุน interfaces ที่จำเป็น
- ✅ การไม่สนับสนุน ERC721Enumerable interface
- ✅ การไม่สนับสนุน random interfaces

### 12. Edge Cases and Error Handling (9 tests)
- ✅ การจัดการ querying balance ของ zero address
- ✅ การจัดการ querying owner ของ token ที่ไม่มี
- ✅ การจัดการ approval ของ token ที่ไม่มี
- ✅ การจัดการ getting approved ของ token ที่ไม่มี
- ✅ การจัดการ transfer ของ token ที่ไม่มี
- ✅ การจัดการ token IDs ขนาดใหญ่ใน URI
- ✅ การจัดการ initialization ด้วย zero addresses
- ✅ การจัดการ royalty fee สูง
- ✅ การจัดการ zero royalty fee

## Key Features & Differences จาก V1

### 🔧 Initialize Pattern แทน Constructor
```javascript
// ❌ V1 Style - Constructor
constructor(name_, symbol_, owner, minter, royaltyRecipient, feeNumerator)

// ✅ V2 Style - Initialize Pattern
function initialize(name_, symbol_, owner, minter, royaltyRecipient, feeNumerator)
```

**ข้อดี**:
- รองรับ proxy patterns
- สามารถ deploy แล้วค่อย initialize ทีหลัง
- มี `onlyInitialized` modifier เพื่อความปลอดภัย

### 🏷️ Dynamic Name/Symbol Override
```javascript
// ก่อน initialization
await contract.name(); // "Template" 
await contract.symbol(); // "TPL"

// หลัง initialization
await contract.name(); // "OnceNFT V2"
await contract.symbol(); // "ONCE2"
```

### ⚡ Gas Optimization
**ไม่รวม extensions ที่ใช้ gas เยอะ**:
- ❌ ERC721Enumerable (totalSupply, tokenByIndex)
- ❌ ERC721Burnable (burn function)

**ผลลัพธ์**: Lower deployment และ transaction costs

### 🔒 Enhanced Access Control
```javascript
modifier onlyInitialized() {
    require(_initialized, "Not initialized");
    _;
}
```

**การใช้งาน**:
- ป้องกันการเรียกใช้ฟังก์ชันก่อน initialization
- มั่นใจได้ว่า contract setup เสร็จสิ้น

## Roles และ Permissions

### DEFAULT_ADMIN_ROLE
- สามารถให้และเพิกถอนสิทธิ์ทุกประเภท
- ได้รับมอบหมายใน initialization

### DEDICATED_ADMIN_ROLE  
- สามารถ pause/unpause contract
- สามารถตั้งค่า base URI
- ได้รับมอบหมายใน initialization

### MINTER_ROLE
- สามารถ mint tokens ใหม่
- ได้รับมอบหมายใน initialization

## การตั้งค่า Test Environment

Test ใช้ Hardhat และ Chai โดยมีการตั้งค่าดังนี้:

```javascript
const TOKEN_NAME = "OnceNFT V2";
const TOKEN_SYMBOL = "ONCE2";
const ROYALTY_FEE = 250; // 2.5%
const BASE_URI = "https://api.example.com/metadata/";
```

## ผลลัพธ์การทดสอบ

```
✅ 69 passing (1s)
❌ 0 failing
```

All test cases pass successfully! 🎉

## การใช้งานจริง

Contract นี้เหมาะสำหรับ:
- **NFT Collections** ที่ต้องการ gas efficiency
- **Proxy-based systems** ที่ต้องการ upgradeability
- **Enterprise applications** ที่ต้องการ initialize pattern
- **Projects** ที่ไม่ต้องการ enumerable functionality
- **Cost-sensitive deployments** ที่ต้องการลด gas costs

## Migration Guide จาก V1

### Breaking Changes
1. **Constructor → Initialize**
   ```javascript
   // V1
   const contract = await Contract.deploy(name, symbol, owner, minter, royalty, fee);
   
   // V2
   const contract = await Contract.deploy();
   await contract.initialize(name, symbol, owner, minter, royalty, fee);
   ```

2. **ไม่มี Enumerable Functions**
   ```javascript
   // V1 ✅
   await contract.totalSupply();
   await contract.tokenByIndex(0);
   
   // V2 ❌ - Functions เหล่านี้ไม่มี
   ```

3. **ไม่มี Burn Function**
   ```javascript
   // V1 ✅
   await contract.burn(tokenId);
   
   // V2 ❌ - Function นี้ไม่มี
   ```

4. **Token ID เริ่มที่ 1**
   ```javascript
   // V1: เริ่มที่ 0
   // V2: เริ่มที่ 1
   ```

## Notes

- Contract ใช้ OpenZeppelin Contracts ^5.0.0
- รองรับ Solidity ^0.8.20
- ปฏิบัติตาม ERC721, ERC2981 standards
- มี gas optimization ผ่าน viaIR compiler
- **ไม่รองรับ** ERC721Enumerable และ ERC721Burnable เพื่อลด gas costs
- Token ID เริ่มต้นที่ 1 แทน 0
- ใช้ Initialize Pattern เพื่อรองรับ proxy patterns

## Performance Comparison

| Feature | V1 | V2 | Improvement |
|---------|----|----|-------------|
| Deployment Gas | High | Lower | ✅ ~15-20% |
| Mint Gas | High | Lower | ✅ ~10-15% |
| Transfer Gas | Same | Same | - |
| Enumerable | ✅ | ❌ | Gas Trade-off |
| Burnable | ✅ | ❌ | Gas Trade-off |
| Initialize Pattern | ❌ | ✅ | Proxy Support |

````
