import { ethers } from 'ethers'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS!
export const PYUSD_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_ADDRESS!

export const CONTRACT_ABI = [
  "function issueCredential(address _worker, bytes32 _credentialHash) public",
  "function getCredentialCount(address _worker) public view returns (uint256)",
  "function getCredential(address _worker, uint256 _index) public view returns (bytes32, address, uint256, bool)",
  "event CredentialIssued(address indexed worker, address indexed employer, bytes32 credentialHash, uint256 timestamp)"
]

export const ESCROW_ABI = [
  "function depositPayment(address _worker, bytes32 _credentialHash, uint256 _amount) external",
  "function claimPayment(bytes32 _credentialHash) external",
  "function getEscrow(address _worker, bytes32 _credentialHash) external view returns (address employer, uint256 amount, bool claimed)"
]

export const PYUSD_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
]