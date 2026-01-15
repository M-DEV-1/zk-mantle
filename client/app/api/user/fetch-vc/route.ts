import { NextResponse } from 'next/server';
import { fetchVCPrivate } from '../../../../lib/pinata';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cid = searchParams.get('cid');

        if (!cid) {
            return NextResponse.json({ error: 'CID is required' }, { status: 400 });
        }

        console.log("Fetching VC via proxy for CID:", cid);
        const result = await fetchVCPrivate(cid);

        return NextResponse.json(result.data);
    } catch (error: any) {
        console.error("Proxy fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
