
import mongoose from 'mongoose';
import { User, VerificationRequest, Proof } from '../lib/models';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

async function inspect() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected.');

        console.log('\n--- LATEST VERIFICATION REQUESTS ---');
        const requests = await VerificationRequest.find().sort({ createdAt: -1 }).limit(5);
        console.log(JSON.stringify(requests, null, 2));

        console.log('\n--- LATEST PROOFS ---');
        const proofs = await Proof.find().sort({ createdAt: -1 }).limit(5);

        proofs.forEach((p, i) => {
            console.log(`\nProof #${i + 1}:`);
            console.log(`ID: ${p._id}`);
            console.log(`Type: ${p.proofType}`);
            console.log(`Public Signals:`, p.publicSignals);
            console.log(`Verified (Local): ${p.verified}`);
            console.log(`Created At: ${p.createdAt}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
