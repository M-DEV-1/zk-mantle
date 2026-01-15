import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { VerificationRequest } from '../../../../lib/models';
import crypto from 'crypto';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const body = await req.json();
        const { providerAddress, userAddress, type, duration, providerLat, providerLon, radiusKm } = body;

        if (!providerAddress || !userAddress || !type || !duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique session ID and challenge
        const sessionId = crypto.randomUUID();
        const challenge = crypto.randomBytes(16).toString('hex');

        const requestData: any = {
            sessionId,
            providerAddress,
            userAddress,
            type,
            duration,
            challenge,
            status: 'pending'
        };

        // Add location data if it's a location request
        if (type === 'location' || type === 'age+location') {
            requestData.providerLat = providerLat || 0;
            requestData.providerLon = providerLon || 0;
            requestData.radiusKm = radiusKm || 10;
        }

        const newRequest = await VerificationRequest.create(requestData);

        return NextResponse.json({ success: true, request: newRequest });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

