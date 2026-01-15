import { NextResponse } from 'next/server';
import * as snarkjs from 'snarkjs';
import path from 'path';
import fs from 'fs';

interface ProofRequest {
    type: 'age' | 'location';
    // Age proof inputs
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    referenceYear?: number;
    challenge?: string;
    // Location proof inputs
    userLat?: number;
    userLon?: number;
    providerLat?: number;
    providerLon?: number;
    radiusKm?: number;
}

export async function POST(req: Request) {
    try {
        const body: ProofRequest = await req.json();
        const { type } = body;

        if (!type || !['age', 'location'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid proof type. Must be "age" or "location"' },
                { status: 400 }
            );
        }

        // Resolve paths to circuit artifacts
        const circuitsPath = path.join(process.cwd(), 'public', 'circuits');
        const wasmPath = path.join(circuitsPath, `${type}.wasm`);
        const zkeyPath = path.join(circuitsPath, `${type}_final.zkey`);

        // Check if files exist
        if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
            return NextResponse.json(
                { error: `Circuit artifacts not found for ${type}` },
                { status: 500 }
            );
        }

        let input: Record<string, any>;

        if (type === 'age') {
            const { birthYear, birthMonth, birthDay, referenceYear, challenge } = body;

            if (!birthYear || !birthMonth || !birthDay || !referenceYear || !challenge) {
                return NextResponse.json(
                    { error: 'Missing required age proof inputs' },
                    { status: 400 }
                );
            }

            input = {
                birthYear,
                birthMonth,
                birthDay,
                referenceYear,
                challenge: BigInt(challenge).toString()
            };
        } else {
            const { userLat, userLon, providerLat, providerLon, radiusKm } = body;

            if (userLat === undefined || userLon === undefined ||
                providerLat === undefined || providerLon === undefined || !radiusKm) {
                return NextResponse.json(
                    { error: 'Missing required location proof inputs' },
                    { status: 400 }
                );
            }

            // Scale coordinates to integers
            const scale = 1000000;
            input = {
                userLat: Math.round(userLat * scale),
                userLon: Math.round(userLon * scale),
                providerLat: Math.round(providerLat * scale),
                providerLon: Math.round(providerLon * scale),
                radiusSquared: Math.round(radiusKm * radiusKm * scale * scale)
            };
        }

        console.log(`Generating ${type} proof with input:`, input);

        // Generate proof using snarkjs
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );

        console.log('Proof generated successfully');

        // Load verification key and verify locally
        const vkeyPath = path.join(circuitsPath, `${type}_vkey.json`);
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        console.log('Local verification result:', isValid);

        return NextResponse.json({
            success: true,
            proof: {
                pi_a: proof.pi_a,
                pi_b: proof.pi_b,
                pi_c: proof.pi_c,
                protocol: proof.protocol,
                curve: proof.curve
            },
            publicSignals,
            verified: isValid
        });

    } catch (error: any) {
        console.error('Proof generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Proof generation failed' },
            { status: 500 }
        );
    }
}
