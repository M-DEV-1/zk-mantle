
import mongoose from 'mongoose';
import { Proof, VerificationRequest } from '../lib/models';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

async function clear() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected.');

        console.log('Clearing Proofs collection...');
        const result = await Proof.deleteMany({});
        console.log(`Deleted ${result.deletedCount} proofs.`);

        // Also reset request statuses to 'pending' or 'accepted' (remove 'failed')?
        // Actually, better to leave requests as is, User can create new ones or re-accept?
        // If status is 'failed', User can't re-accept easily without UI support.
        // Let's reset 'failed' requests to 'accepted' so they can be re-processed?
        // Or simply let User create NEW requests.
        // User creates request from Provider dashboard.

        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

clear();
