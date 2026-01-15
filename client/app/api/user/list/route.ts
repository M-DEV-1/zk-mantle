import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { User } from '../../../../lib/models';

export async function GET() {
    await dbConnect();

    try {
        // Fetch all users with credentials (for hackathon demo)
        const users = await User.find({})
            .select('address name cid createdAt')
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json({ success: true, users });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
