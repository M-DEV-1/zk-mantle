import { NextResponse } from 'next/server';
import * as snarkjs from 'snarkjs';
import path from 'path';
import fs from 'fs';
import dbConnect from '../../../lib/db';
import { VerificationRequest } from '../../../lib/models';

interface VerifyRequest {
    requestId: string;
    proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
    };
    publicSignals: string[];
    type: 'age' | 'location';
}

export async function POST(req: Request) {
    try {
        const body: VerifyRequest = await req.json();
        const { requestId, proof, publicSignals, type } = body;

        if (!type || !['age', 'location'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid proof type. Must be "age" or "location"' },
                { status: 400 }
            );
        }

        // Load verification key
        const circuitsPath = path.join(process.cwd(), 'public', 'circuits');
        const vkeyPath = path.join(circuitsPath, `${type}_vkey.json`);

        if (!fs.existsSync(vkeyPath)) {
            return NextResponse.json(
                { error: `Verification key not found for ${type}` },
                { status: 500 }
            );
        }

        const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

        console.log(`Verifying ${type} proof...`);

        // Verify the proof using snarkjs
        let verified = false;
        try {
            // Add required fields for snarkjs type
            const fullProof = {
                ...proof,
                protocol: 'groth16',
                curve: 'bn128'
            };
            verified = await snarkjs.groth16.verify(vkey, publicSignals, fullProof);
            console.log('Verification result:', verified);
        } catch (verifyError) {
            console.error('Verification error:', verifyError);
            // Try with string format as fallback
            try {
                const stringProof = {
                    pi_a: proof.pi_a.map(x => x.toString()),
                    pi_b: proof.pi_b.map(pair => pair.map(x => x.toString())),
                    pi_c: proof.pi_c.map(x => x.toString()),
                    protocol: 'groth16',
                    curve: 'bn128'
                };
                const stringSignals = publicSignals.map(x => x.toString());
                verified = await snarkjs.groth16.verify(vkey, stringSignals, stringProof);
            } catch (retryError) {
                console.error('Retry verification also failed:', retryError);
            }
        }

        // Update request status in database if requestId provided
        if (requestId) {
            try {
                await dbConnect();
                await VerificationRequest.findByIdAndUpdate(requestId, {
                    status: verified ? 'verified' : 'accepted',
                    proofStatus: verified ? 'verified' : 'failed',
                    verifiedAt: verified ? new Date() : undefined,
                });
                console.log('Request status updated');
            } catch (dbError) {
                console.error('Failed to update request status:', dbError);
            }
        }

        return NextResponse.json({
            success: true,
            verified,
            proofStatus: verified ? 'Valid' : 'Invalid',
            message: verified
                ? 'ZK proof verified successfully!'
                : 'Proof verification failed'
        });

    } catch (error: any) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
