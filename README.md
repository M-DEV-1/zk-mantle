# ZK GPS

> Zero-Knowledge Identity Verification on Mantle Network

[![Built on Mantle](https://img.shields.io/badge/Built%20on-Mantle-blue)](https://mantle.xyz)
[![Circom](https://img.shields.io/badge/ZK-Circom-green)](https://docs.circom.io/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black)](https://github.com/M-DEV-1/zk-mantle)

## Overview

ZK GPS enables privacy-preserving identity verification using zero-knowledge proofs. Users can prove age, location, or other attributes **without revealing actual data**.

## Architecture

```
┌─────────────┐                       ┌─────────────┐
│   Vercel    │                       │   Pinata    │
│  (Next.js)  │                       │   IPFS      │
└──────┬──────┘                       └─────────────┘
       │                                     ▲
       │ ZK Proof                            │ VC Storage
       ▼                                     │
┌─────────────┐                        ┌─────┴─────┐
│   Mantle    │                        │   User    │
│  Sepolia    │◄───────────────────────│  Wallet   │
└─────────────┘  On-Chain Verification └───────────┘
```

**No backend server needed!** Everything runs on:
- **Vercel**: Frontend + serverless API routes
- **Pinata IPFS**: Verifiable Credentials
- **Mantle Network**: On-chain proof verification

## Deployed Contracts (Mantle Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| ZKGPSVerifier | `0xd9348725241deaad074de7ce968d1f9463333795` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0xd9348725241deaad074de7ce968d1f9463333795) |
| VerifierAge | `0x0f266c9218758b0b2324f86292f44938d3ed21f4` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0x0f266c9218758b0b2324f86292f44938d3ed21f4) |
| VerifierLocation | `0xc88a743922ed825589c7954f2689a0228986d659` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0xc88a743922ed825589c7954f2689a0228986d659) |
| DIDRegistry | `0x320f8dbbcee4d9599280116535eee9a11a6f57c6` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0x320f8dbbcee4d9599280116535eee9a11a6f57c6) |

## Quick Start

### 1. Install Dependencies

```bash
# Client
cd client && pnpm install

# Contracts
cd contracts && pnpm install
```

### 2. Environment Setup

**client/.env**:
```
MONGODB_URI=mongodb+srv://...
PINATA_JWT=your-pinata-jwt
NEXT_PUBLIC_GATEWAY_URL=your-pinata-gateway

# Contract addresses (already deployed)
NEXT_PUBLIC_ZKGPS_VERIFIER_ADDRESS=0xd9348725241deaad074de7ce968d1f9463333795
NEXT_PUBLIC_VERIFIER_AGE_ADDRESS=0x0f266c9218758b0b2324f86292f44938d3ed21f4
NEXT_PUBLIC_VERIFIER_LOCATION_ADDRESS=0xc88a743922ed825589c7954f2689a0228986d659
NEXT_PUBLIC_DID_REGISTRY_ADDRESS=0x320f8dbbcee4d9599280116535eee9a11a6f57c6
```

### 3. Run Locally

```bash
cd client
pnpm dev
```

## How It Works

### 1. User Creates Credential
- Enter DOB, location, etc.
- Sign with wallet
- VC stored on IPFS (Pinata)

### 2. Provider Requests Verification
- Select user + verification type
- Request stored in MongoDB

### 3. User Accepts & Generates Proof
- ZK proof generated using Circom circuits (client-side or server-side)
- Proof stored per-user in MongoDB
- **DOB/location NEVER revealed**

### 4. Provider Verifies On-Chain
- Calls `ZKGPSVerifier.verifyAge()` on Mantle
- Result stored on-chain
- `ProofVerified` event emitted → visible on MantleScan

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, Tailwind, Shadcn |
| ZK Proofs | Circom, SnarkJS (Groth16) |
| Blockchain | Mantle Sepolia (L2) |
| Wallet | Wagmi, Viem |
| Storage | Pinata IPFS |

## Circuits

Located in `contracts/circuits/`:

- **age.circom**: Proves user is ≥18 without revealing DOB
- **location.circom**: Proves user is within radius without revealing exact position

Pre-compiled artifacts in `client/public/circuits/`.
