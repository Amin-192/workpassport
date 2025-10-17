import { ethers } from 'ethers'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!

export const CONTRACT_ABI = [
  "function issueCredential(address _worker, bytes32 _credentialHash) public",
  "function getCredentialCount(address _worker) public view returns (uint256)",
  "function getCredential(address _worker, uint256 _index) public view returns (bytes32, address, uint256, bool)",
  "event CredentialIssued(address indexed worker, address indexed employer, bytes32 credentialHash, uint256 timestamp)"
]
