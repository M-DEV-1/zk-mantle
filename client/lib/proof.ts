/**
 * ZK Proof Generation Utilities
 * Uses SnarkJS to generate Groth16 proofs for age and location verification
 */
import * as snarkjs from 'snarkjs';

export interface ZKProof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
}

export interface ProofResult {
    proof: ZKProof;
    publicSignals: string[];
}

/**
 * Generate an age verification proof
 * Proves: user is >= 18 years old without revealing DOB
 */
export async function generateAgeProof(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    referenceYear: number,
    challenge: string
): Promise<ProofResult> {
    // Circuit inputs
    const input = {
        birthYear: birthYear,
        birthMonth: birthMonth,
        birthDay: birthDay,
        referenceYear: referenceYear,
        challenge: BigInt(challenge).toString()
    };

    // Fetch circuit artifacts
    const wasmUrl = '/circuits/age.wasm';
    const zkeyUrl = '/circuits/age_final.zkey';

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmUrl,
            zkeyUrl
        );

        return {
            proof: {
                pi_a: proof.pi_a,
                pi_b: proof.pi_b,
                pi_c: proof.pi_c,
                protocol: proof.protocol,
                curve: proof.curve
            },
            publicSignals
        };
    } catch (error) {
        console.error('Age proof generation failed:', error);
        throw new Error(`Failed to generate age proof: ${error}`);
    }
}

/**
 * Generate a location verification proof
 * Proves: user is within radius of provider location without revealing exact position
 */
export async function generateLocationProof(
    userLat: number,
    userLon: number,
    providerLat: number,
    providerLon: number,
    radiusKm: number
): Promise<ProofResult> {
    // Scale coordinates to integers (multiply by 1e6 for precision)
    const scale = 1000000;

    const input = {
        userLat: Math.round(userLat * scale),
        userLon: Math.round(userLon * scale),
        providerLat: Math.round(providerLat * scale),
        providerLon: Math.round(providerLon * scale),
        radiusSquared: Math.round(radiusKm * radiusKm * scale * scale)
    };

    const wasmUrl = '/circuits/location.wasm';
    const zkeyUrl = '/circuits/location_final.zkey';

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmUrl,
            zkeyUrl
        );

        return {
            proof: {
                pi_a: proof.pi_a,
                pi_b: proof.pi_b,
                pi_c: proof.pi_c,
                protocol: proof.protocol,
                curve: proof.curve
            },
            publicSignals
        };
    } catch (error) {
        console.error('Location proof generation failed:', error);
        throw new Error(`Failed to generate location proof: ${error}`);
    }
}

/**
 * Verify a proof locally using the verification key
 */
export async function verifyProofLocally(
    proof: ZKProof,
    publicSignals: string[],
    proofType: 'age' | 'location'
): Promise<boolean> {
    const vkeyUrl = `/circuits/${proofType}_vkey.json`;

    try {
        const response = await fetch(vkeyUrl);
        const vkey = await response.json();

        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        return isValid;
    } catch (error) {
        console.error('Local verification failed:', error);
        return false;
    }
}

/**
 * Format proof for on-chain verification (Solidity)
 * Converts proof to format expected by Groth16Verifier contract
 */
export function formatProofForContract(proof: ZKProof): {
    pA: [string, string];
    pB: [[string, string], [string, string]];
    pC: [string, string];
} {
    return {
        pA: [proof.pi_a[0], proof.pi_a[1]],
        pB: [
            [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: reversed for Solidity
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        pC: [proof.pi_c[0], proof.pi_c[1]]
    };
}

/**
 * Parse DOB string to components
 */
export function parseDOB(dob: string): { year: number; month: number; day: number } {
    const date = new Date(dob);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };
}
