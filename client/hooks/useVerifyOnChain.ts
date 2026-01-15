"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ZKGPS_VERIFIER_ABI, requestIdToBytes32 } from '@/lib/contracts';
import { formatProofForContract, type ZKProof } from '@/lib/proof';

/**
 * Hook for on-chain proof verification on Mantle Network
 */
export function useVerifyOnChain() {
    const { data: hash, writeContractAsync, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const verifyAge = async (
        userAddress: string,
        requestId: string,
        proof: ZKProof,
        publicSignals: string[]
    ): Promise<{ hash: string; verified: boolean }> => {
        const contractAddress = CONTRACT_ADDRESSES.ZKGPSVerifier;

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed. Please deploy first.');
        }

        const formattedProof = formatProofForContract(proof);
        const requestHash = requestIdToBytes32(requestId);

        const pA: [bigint, bigint] = [BigInt(formattedProof.pA[0]), BigInt(formattedProof.pA[1])];
        const pB: [[bigint, bigint], [bigint, bigint]] = [
            [BigInt(formattedProof.pB[0][0]), BigInt(formattedProof.pB[0][1])],
            [BigInt(formattedProof.pB[1][0]), BigInt(formattedProof.pB[1][1])]
        ];
        const pC: [bigint, bigint] = [BigInt(formattedProof.pC[0]), BigInt(formattedProof.pC[1])];
        const pubSignals: [bigint, bigint, bigint] = [
            BigInt(publicSignals[0]),
            BigInt(publicSignals[1]),
            BigInt(publicSignals[2])
        ];

        const txHash = await writeContractAsync({
            address: contractAddress as `0x${string}`,
            abi: ZKGPS_VERIFIER_ABI,
            functionName: 'verifyAge',
            args: [userAddress as `0x${string}`, requestHash, pA, pB, pC, pubSignals],
        });

        return { hash: txHash, verified: true };
    };

    return {
        verifyAge,
        isLoading: isPending || isConfirming,
        error: writeError,
        txHash: hash || null,
    };
}

/**
 * Hook to get on-chain stats
 */
export function useOnChainStats() {
    const { data, isLoading, error } = useReadContract({
        address: CONTRACT_ADDRESSES.ZKGPSVerifier as `0x${string}`,
        abi: ZKGPS_VERIFIER_ABI,
        functionName: 'getStats',
        query: {
            enabled: CONTRACT_ADDRESSES.ZKGPSVerifier !== '0x0000000000000000000000000000000000000000',
        }
    });

    return {
        stats: data as [bigint, bigint, bigint] | undefined,
        isLoading,
        error,
    };
}
