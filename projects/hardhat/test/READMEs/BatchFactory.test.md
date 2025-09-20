# BatchFactory Test Cases

This test suite provides comprehensive coverage for the `BatchFactory` contract, which is responsible for creating batches and deploying NFT contracts using EIP-1167 minimal proxy pattern. The test suite includes comprehensive testing of the wallet nonce system and trusted signer functionality.

## Test Structure

### Prerequisites
- Uses Hardhat testing framework with Chai assertions
- Utilizes `merkletreejs` for Merkle tree creation and proof generation
- Tests both ERC721 and ERC1155 NFT contract deployments

### Test Categories

#### 1. Deployment Tests
- Verifies correct initialization of contract parameters
- Checks proper role assignments (DEFAULT_ADMIN_ROLE, SYSTEM_ADMIN_ROLE)
- Validates reversion when deployed with zero addresses

#### 2. Configuration Tests
- Tests system admin functions for setting:
  - Tokens per code (payment rate)
  - Minimum codes per batch
  - Payment token address
- Validates access control for configuration functions
- Tests input validation for configuration parameters

#### 3. Trusted Signer Management
- **Add Trusted Signer**: Tests system admin ability to add trusted signers
- **Remove Trusted Signer**: Tests system admin ability to remove trusted signers
- **Access Control**: Validates only system admin can manage trusted signers
- **Input Validation**: Tests zero address validation and duplicate signer prevention
- **Backend Signature Verification**: Tests signature validation with trusted signers

#### 4. Batch Creation with New NFT Contract
- **ERC721 Batch Creation**: Tests deployment and initialization of ERC721 contracts with backend signature verification
- **ERC1155 ART Batch Creation**: Tests deployment of ERC1155 contracts for art collections
- **ERC1155 STAMP Batch Creation**: Tests deployment of ERC1155 contracts for stamp collections
- **Contract Tracking**: Verifies issuer contract tracking functionality
- **Payment Collection**: Tests payment token collection for batch creation
- **Free Batch Creation**: Tests batch creation when tokens per code = 0
- **Signature Validation**: Tests backend signature verification for batch creation
- **Expired Signature Handling**: Tests rejection of expired signatures

#### 5. Batch Creation with Existing NFT Contract
- Tests batch creation using pre-existing NFT contracts
- Validates contract ownership verification
- Tests reversion with invalid existing contracts

#### 6. Input Validation Tests
- **Merkle Root Validation**: Ensures non-zero merkle root requirement
- **Minimum Codes Validation**: Tests minimum codes per batch requirement
- **Royalty Validation**: Tests royalty recipient and fee validation
- **Payment Validation**: Tests token allowance and balance requirements

#### 7. Nonce Management and Address Prediction
- **Nonce Incrementing**: Tests nonce increment after each deployment
- **Address Prediction**: Tests deterministic address prediction using CREATE2

#### 8. View Functions
- **Batch Cost Calculation**: Tests cost calculation based on tokens per code
- **Payment Balance**: Tests contract's payment token balance tracking

#### 9. Payment Management
- **Payment Withdrawal**: Tests system admin withdrawal functionality
- **Access Control**: Tests unauthorized withdrawal prevention
- **Input Validation**: Tests withdrawal to zero address prevention

#### 10. Reentrancy Protection
- Tests reentrancy guard functionality in `createBatch` function

#### 11. Edge Cases
- **Maximum Royalty Fee**: Tests 100% royalty fee handling
- **Empty Base URI**: Tests contract creation with empty base URI
- **Long Names/Symbols**: Tests contract creation with very long names and symbols

## Key Test Data

### Constants
- `TOKENS_PER_CODE`: 1 ether (payment per code)
- `MIN_CODES_PER_BATCH`: 10 codes minimum
- `ROYALTY_FEE`: 500 basis points (5%)

### Test Codes
Uses 10 QR codes (CODE001-CODE010) to meet minimum batch requirements.

### NFT Types
- `ERC721`: 0
- `ERC1155_ART`: 1
- `ERC1155_STAMP`: 2

## Setup Process

Each test case follows this setup:
1. Deploy OnceToken (ERC20 payment token)
2. Deploy template contracts (Once721TemplateV2, Once1155TemplateV2)
3. Deploy BatchManager contract
4. Deploy BatchFactory with all required addresses
5. Grant necessary roles to system admin
6. Mint tokens to test accounts for payment

## Test Coverage Areas

### Smart Contract Features Tested
- ✅ Contract deployment and initialization
- ✅ Access control and role management
- ✅ EIP-1167 minimal proxy deployment
- ✅ CREATE2 deterministic address generation
- ✅ Payment token integration
- ✅ Merkle tree validation
- ✅ Reentrancy protection
- ✅ Event emissions
- ✅ Input validation and error handling
- ✅ Trusted signer management and verification
- ✅ Backend signature validation and expiration
- ✅ Issuer nonce management

### Security Considerations Tested
- ✅ Access control enforcement
- ✅ Reentrancy protection
- ✅ Zero address validation
- ✅ Overflow/underflow protection
- ✅ Payment token security
- ✅ Signature replay protection
- ✅ Trusted signer verification
- ✅ Signature expiration validation

### Gas Optimization Features Tested
- ✅ EIP-1167 minimal proxy usage
- ✅ CREATE2 for deterministic addresses
- ✅ Efficient nonce management

## Running the Tests

```bash
npx hardhat test test/BatchFactory.test.js
```

## Notes

- Tests use empty baseURI strings to avoid permission issues
- All 40 test cases pass successfully
- Tests are designed to be run independently or as part of the full test suite
- Mock contracts and realistic test data ensure comprehensive coverage
