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
    let input: any = null;
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
                // FORCE REGENERATION for debugging/fix
                // console.log('Returning existing proof for request:', requestId);
                // return NextResponse.json({
                //     success: true,
                //     proof: existingProof.proof,
                //     publicSignals: existingProof.publicSignals,
                //     proofId: existingProof._id,
                //     cached: true
                // });
                console.log('Ignoring existing proof to force regeneration (fix mode)');
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

        if (type === 'age') {
            const { birthYear, referenceYear, challenge } = body;

            if (!birthYear || !referenceYear || !challenge) {
                return NextResponse.json(
                    { error: 'Missing required age proof inputs' },
                    { status: 400 }
                );
            }

            input = {
                dobYear: birthYear,
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
                radius: Math.round(radiusKm * scale) // Circuit expects radius (linear), it squares it internally
            };
        }

        console.log(`Generating ${type} proof for user:`, userAddress);
        console.log('SnarkJS Inputs:', JSON.stringify(input, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
            , 2));

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

        console.log(`Local verification result for ${type}:`, isValid);
        console.log('Public Signals:', publicSignals);

        if (!isValid) {
            console.error("FATAL: Generated proof failed local verification!");
            console.error("This indicates a mismatch between zkey (generation) and vkey (verification).");
            throw new Error("Proof validitiy check failed");
        }

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
            {
                error: error.message || 'Proof generation failed',
                inputDebug: input // Return input for debugging
            },
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
