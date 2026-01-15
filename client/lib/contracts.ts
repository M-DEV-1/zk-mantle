/**
 * Mantle Network Contract Configuration
 * Contains ABIs and addresses for ZK GPS contracts
 */

// Mantle Sepolia Testnet Chain ID
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

// Contract Addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
    VerifierAge: process.env.NEXT_PUBLIC_VERIFIER_AGE_ADDRESS || '0x0000000000000000000000000000000000000000',
    VerifierLocation: process.env.NEXT_PUBLIC_VERIFIER_LOCATION_ADDRESS || '0x0000000000000000000000000000000000000000',
    ZKGPSVerifier: process.env.NEXT_PUBLIC_ZKGPS_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000',
    DIDRegistry: process.env.NEXT_PUBLIC_DID_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

// ZKGPSVerifier ABI - Main contract that stores results on-chain
export const ZKGPS_VERIFIER_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "userAddress", "type": "address" },
            { "internalType": "bytes32", "name": "requestHash", "type": "bytes32" },
            { "internalType": "uint256[2]", "name": "_pA", "type": "uint256[2]" },
            { "internalType": "uint256[2][2]", "name": "_pB", "type": "uint256[2][2]" },
            { "internalType": "uint256[2]", "name": "_pC", "type": "uint256[2]" },
            { "internalType": "uint256[3]", "name": "_pubSignals", "type": "uint256[3]" }
        ],
        "name": "verifyAge",
        "outputs": [
            { "internalType": "bool", "name": "verified", "type": "bool" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getUserVerifications",
        "outputs": [
            { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "provider", "type": "address" }
        ],
        "name": "getProviderVerifications",
        "outputs": [
            { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "verificationId", "type": "bytes32" }
        ],
        "name": "getVerification",
        "outputs": [
            {
                "components": [
                    { "internalType": "address", "name": "user", "type": "address" },
                    { "internalType": "address", "name": "provider", "type": "address" },
                    { "internalType": "uint8", "name": "verificationType", "type": "uint8" },
                    { "internalType": "bool", "name": "verified", "type": "bool" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                    { "internalType": "bytes32", "name": "requestHash", "type": "bytes32" }
                ],
                "internalType": "struct ZKGPSVerifier.VerificationRecord",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getStats",
        "outputs": [
            { "internalType": "uint256", "name": "total", "type": "uint256" },
            { "internalType": "uint256", "name": "successful", "type": "uint256" },
            { "internalType": "uint256", "name": "successRate", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "verificationId", "type": "bytes32" },
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "provider", "type": "address" },
            { "indexed": false, "internalType": "uint8", "name": "verificationType", "type": "uint8" },
            { "indexed": false, "internalType": "bool", "name": "verified", "type": "bool" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "name": "ProofVerified",
        "type": "event"
    }
] as const;

// Groth16 Verifier ABI (view-only, for direct calls)
export const VERIFIER_ABI = [
    {
        "inputs": [
            { "internalType": "uint256[2]", "name": "_pA", "type": "uint256[2]" },
            { "internalType": "uint256[2][2]", "name": "_pB", "type": "uint256[2][2]" },
            { "internalType": "uint256[2]", "name": "_pC", "type": "uint256[2]" },
            { "internalType": "uint256[3]", "name": "_pubSignals", "type": "uint256[3]" }
        ],
        "name": "verifyProof",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

/**
 * Format proof for contract call
 */
export function formatProofForCall(proof: {
    pA: [string, string];
    pB: [[string, string], [string, string]];
    pC: [string, string];
}, publicSignals: string[]): {
    pA: [bigint, bigint];
    pB: [[bigint, bigint], [bigint, bigint]];
    pC: [bigint, bigint];
    pubSignals: [bigint, bigint, bigint];
} {
    return {
        pA: [BigInt(proof.pA[0]), BigInt(proof.pA[1])],
        pB: [
            [BigInt(proof.pB[0][0]), BigInt(proof.pB[0][1])],
            [BigInt(proof.pB[1][0]), BigInt(proof.pB[1][1])]
        ],
        pC: [BigInt(proof.pC[0]), BigInt(proof.pC[1])],
        pubSignals: [
            BigInt(publicSignals[0]),
            BigInt(publicSignals[1]),
            BigInt(publicSignals[2])
        ]
    };
}

/**
 * Convert MongoDB ObjectId to bytes32 for on-chain storage
 */
export function requestIdToBytes32(requestId: string): `0x${string}` {
    // Pad the hex string to 32 bytes
    const hex = requestId.padStart(64, '0');
    return `0x${hex}` as `0x${string}`;
}
