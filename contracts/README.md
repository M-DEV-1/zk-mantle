# ZK-DID Contracts on Mantle

This directory contains the core Zero-Knowledge related smart contracts and circuits for the ZK-DID project, deployed on the Mantle Network.

## Structure

*   `contracts/`: Solidity smart contracts (`DIDRegistry`, `SchemaRegistry`, Verifiers).
*   `circuits/`: Circom circuits (`age.circom`, `location.circom`).
*   `scripts/`: Deployment and compilation scripts.

## Setup

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Environment Variables**:
    Create a `.env` file with:
    ```
    ACCOUNT_PRIVATE_KEY=your_private_key_here
    ETHERSCAN_API_KEY=your_mantle_explorer_key_optional
    ```

## Usage

### 1. Circuit Compilation
Compile circuits and generate Solidity verifiers:
```bash
./scripts/compile-circuits.sh
```

### 2. Compilation (Contracts)
Compile the smart contracts:
```bash
npx hardhat compile
```

### 3. Deployment
Deploy all contracts to Mantle Sepolia Testnet:
```bash
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

### 4. Verification
Verify deployed contracts (Etherscan/Mantlescan):
```bash
npx hardhat verify --network mantleSepolia <CONTRACT_ADDRESS>
```
*Note: `scripts/deploy.ts` attempts to auto-verify.*

### 5. Check Balance
Check the balance of your configured account:
```bash
npx hardhat run scripts/check-balance.ts --network mantleSepolia
```

## Contracts Overview

*   **`SchemaRegistry`**: Manages VC schemas.
*   **`DIDRegistry`**: Handles user-provider verification status.
*   **`VerifierAge` / `VerifierLocation`**: Auto-generated Groth16 verifiers.