import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { VerificationRequest } from '../../../../lib/models';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const body = await req.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }

        const request = await VerificationRequest.findById(requestId);

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
        }

        request.status = 'denied';
        await request.save();

        return NextResponse.json({ success: true, request });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
