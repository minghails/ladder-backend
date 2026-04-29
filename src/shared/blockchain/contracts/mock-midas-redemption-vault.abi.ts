// Sourced from BaseScan verified Contract ABI for Base Sepolia.
// Do not generate this file from contracts_audit.

export const MOCK_MIDAS_REDEMPTION_VAULT_ADDRESS = '0x28Cc6C6e7C0c92Fa45DaCa66752F2B0eD5B9910d' as const;

export const MOCK_MIDAS_REDEMPTION_VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "mToken_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "mToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextRequestId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountMTokenIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minReceiveAmount",
        "type": "uint256"
      }
    ],
    "name": "redeemInstant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "redeemPayoutBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "redeemRequest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newBps",
        "type": "uint256"
      }
    ],
    "name": "setRedeemPayoutBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

