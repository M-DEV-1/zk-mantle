import { NextResponse } from 'next/server';
import * as snarkjs from 'snarkjs';
import path from 'path';
import fs from 'fs';
import dbConnect from '../../../../lib/db';
import { Proof, VerificationRequest } from '../../../../lib/models';

interface ProofRequest {
    userAddress: string;
    requestId?: string;
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
        const { type, userAddress, requestId } = body;

        if (!type || !['age', 'location'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid proof type. Must be "age" or "location"' },
                { status: 400 }
            );
        }

        if (!userAddress) {
            return NextResponse.json(
                { error: 'userAddress is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if proof already exists for this request (caching)
        if (requestId) {
            const existingProof = await Proof.findOne({
                userAddress,
                requestId,
                proofType: type
            });

            if (existingProof) {
                console.log('Returning existing proof for request:', requestId);
                return NextResponse.json({
                    success: true,
                    proof: existingProof.proof,
                    publicSignals: existingProof.publicSignals,
                    proofId: existingProof._id,
                    cached: true
                });
            }
        }

        // Resolve paths to circuit artifacts
        const circuitsPath = path.join(process.cwd(), 'public', 'circuits');
        const wasmPath = path.join(circuitsPath, `${type}.wasm`);
        const zkeyPath = path.join(circuitsPath, `${type}_final.zkey`);

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

            const scale = 1000000;
            input = {
                userLat: Math.round(userLat * scale),
                userLon: Math.round(userLon * scale),
                providerLat: Math.round(providerLat * scale),
                providerLon: Math.round(providerLon * scale),
                radiusSquared: Math.round(radiusKm * radiusKm * scale * scale)
            };
        }

        console.log(`Generating ${type} proof for user:`, userAddress);

        // Generate ZK proof using SnarkJS + Circom WASM
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );

        console.log('Proof generated successfully');

        // Verify locally
        const vkeyPath = path.join(circuitsPath, `${type}_vkey.json`);
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        console.log('Local verification result:', isValid);

        // Store proof in MongoDB (per-user)
        const storedProof = await Proof.create({
            userAddress,
            requestId: requestId || undefined,
            proofType: type,
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

        console.log('Proof stored in MongoDB:', storedProof._id);

        // Update request status
        if (requestId) {
            await VerificationRequest.findByIdAndUpdate(requestId, {
                proofStatus: 'generated',
                proofId: storedProof._id
            });
        }

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
            proofId: storedProof._id,
            verified: isValid,
            cached: false
        });

    } catch (error: any) {
        console.error('Proof generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Proof generation failed' },
            { status: 500 }
        );
    }
}

// GET - Retrieve stored proofs for a user
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userAddress = searchParams.get('userAddress');

        if (!userAddress) {
            return NextResponse.json(
                { error: 'userAddress is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const proofs = await Proof.find({ userAddress })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ success: true, proofs });

    } catch (error: any) {
        console.error('Error fetching proofs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
