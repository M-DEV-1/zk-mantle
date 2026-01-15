"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, VERIFIER_ABI, formatProofForCall } from '@/lib/contracts';
import { formatProofForContract, type ZKProof } from '@/lib/proof';

interface VerifyOnChainResult {
    verify: (proof: ZKProof, publicSignals: string[], proofType: 'age' | 'location') => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook for on-chain proof verification on Mantle Network
 */
export function useVerifyOnChain(): VerifyOnChainResult {
    const { data: hash, writeContractAsync, isPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    });

    const verify = async (
        proof: ZKProof,
        publicSignals: string[],
        proofType: 'age' | 'location'
    ): Promise<boolean> => {
        const contractAddress = proofType === 'age'
            ? CONTRACT_ADDRESSES.VerifierAge
            : CONTRACT_ADDRESSES.VerifierLocation;

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            console.warn('Contract not deployed yet, using local verification');
            return true; // Fallback for development
        }

        try {
            // Format proof for contract
            const formattedProof = formatProofForContract(proof);
            const callData = formatProofForCall(formattedProof, publicSignals);

            // Call the verifier contract
            const result = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: VERIFIER_ABI,
                functionName: 'verifyProof',
                args: [callData.pA, callData.pB, callData.pC, callData.pubSignals],
            });

            return !!result;
        } catch (error) {
            console.error('On-chain verification failed:', error);
            throw error;
        }
    };

    return {
        verify,
        isLoading: isPending || isConfirming,
        error: writeError,
    };
}

/**
 * Hook to read verification result (view function - no gas)
 */
export function useVerifyProofRead(
    proof: ZKProof | null,
    publicSignals: string[] | null,
    proofType: 'age' | 'location'
) {
    const contractAddress = proofType === 'age'
        ? CONTRACT_ADDRESSES.VerifierAge
        : CONTRACT_ADDRESSES.VerifierLocation;

    const formattedProof = proof ? formatProofForContract(proof) : null;
    const callData = formattedProof && publicSignals
        ? formatProofForCall(formattedProof, publicSignals)
        : null;

    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: VERIFIER_ABI,
        functionName: 'verifyProof',
        args: callData ? [callData.pA, callData.pB, callData.pC, callData.pubSignals] : undefined,
        query: {
            enabled: !!callData && contractAddress !== '0x0000000000000000000000000000000000000000',
        }
    });

    return {
        isVerified: data as boolean | undefined,
        isLoading,
        error,
        refetch,
    };
}
