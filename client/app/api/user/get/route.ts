import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { User } from '../../../../lib/models';

export async function GET(req: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
        }

        const user = await User.findOne({ address });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
