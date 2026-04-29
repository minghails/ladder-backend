// Sourced from BaseScan verified Contract ABI for Base Sepolia.
// Do not generate this file from contracts_audit.

export const MOCK_MIDAS_PRICE_ORACLE_ADDRESS = '0xBC63EdD2939fc399f4B8Fcc7658D0b71883c4168' as const;

export const MOCK_MIDAS_PRICE_ORACLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "oracleDecimals",
        "type": "uint8"
      },
      {
        "internalType": "int256",
        "name": "initialAnswer",
        "type": "int256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint80",
        "name": "",
        "type": "uint80"
      }
    ],
    "name": "getRoundData",
    "outputs": [
      {
        "internalType": "uint80",
        "name": "roundId",
        "type": "uint80"
      },
      {
        "internalType": "int256",
        "name": "answer",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "startedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "updatedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint80",
        "name": "answeredInRound",
        "type": "uint80"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {
        "internalType": "uint80",
        "name": "roundId",
        "type": "uint80"
      },
      {
        "internalType": "int256",
        "name": "answer",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "startedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "updatedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint80",
        "name": "answeredInRound",
        "type": "uint80"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "int256",
        "name": "newAnswer",
        "type": "int256"
      }
    ],
    "name": "setLatestAnswer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint80",
        "name": "roundId_",
        "type": "uint80"
      },
      {
        "internalType": "int256",
        "name": "answer_",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "startedAt_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "updatedAt_",
        "type": "uint256"
      },
      {
        "internalType": "uint80",
        "name": "answeredInRound_",
        "type": "uint80"
      }
    ],
    "name": "setLatestRoundData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newDescription",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "newVersion",
        "type": "uint256"
      }
    ],
    "name": "setMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

