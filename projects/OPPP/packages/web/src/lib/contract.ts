import { Address, createPublicClient, http, parseAbi } from "viem"
import { monadTestnet } from "viem/chains"

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

const SonadAbiStrings = [
  // Write Functions
  "function approve(address to, uint256 tokenId)",
  "function deactivatePost(uint256 _postId)",
  "function renounceOwnership()",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function setMonadToken(address _newMonadToken)",
  "function tipCreator(uint256 _postId) payable",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function transferOwnership(address newOwner)",
  "function updateMinimumMonadHolding(uint256 _newMinimum)",
  "function verifyAndRegisterPost(string _tweetId, address _creator, string _content) returns (uint256)",
  "function vote(uint256 _postId, bool _isLit)",
  "function withdrawProtocolFees()",
]

export const SonadAbi = parseAbi(SonadAbiStrings)

export const contracts = {
  SonadContract: "0x96079982fD20Ed66CDEe1A8009058a50727cEBB3" as Address,
}
