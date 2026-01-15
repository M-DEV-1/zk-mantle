import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { VerificationRequest } from '../../../../lib/models';

export async function GET(req: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        const role = searchParams.get('role'); // 'user' or 'provider'

        if (!address) {
            return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
        }

        let query = {};
        if (role === 'user') {
            query = { userAddress: address };
        } else if (role === 'provider') {
            query = { providerAddress: address };
        } else {
            // Default: return both
            query = {
                $or: [
                    { userAddress: address },
                    { providerAddress: address }
                ]
            };
        }

        // Check for expired requests and update them
        const now = new Date();
        await VerificationRequest.updateMany(
            {
                status: 'accepted',
                timerEnd: { $lt: now }
            },
            { status: 'expired' }
        );

        const requests = await VerificationRequest.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ success: true, requests });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
