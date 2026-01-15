import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { User } from '../../../../lib/models';
import { uploadVCPrivate, fetchVCPrivate } from '../../../../lib/pinata';
import { createVC, type CredentialSubject } from '../../../../lib/schemas/vcSchema';

export async function POST(req: Request) {
    await dbConnect();

    let cid: string;

    try {
        const body = await req.json();
        const { address, metadata, signature } = body;

        if (!address || !metadata) {
            return NextResponse.json({ error: 'Missing address or metadata' }, { status: 400 });
        }

        // Build the credential subject
        const subject: CredentialSubject = {
            walletAddress: address,
            nationalId: metadata.nationalId || metadata.govId,
            name: metadata.name,
            dob: metadata.dob,
            bloodGroup: metadata.bloodGroup,
            location: metadata.location,
        };

        // Create the W3C Verifiable Credential
        const vc = createVC(subject, signature || '');

        // Sanitize VC before upload (removes any unserializable fields)
        const cleanVC = JSON.parse(JSON.stringify(vc));

        // Upload to Pinata IPFS (Private)
        try {
            cid = await uploadVCPrivate(cleanVC, address);
            console.log("Pinned to IPFS (private):", cid);

            // Verify we can fetch it back
            try {
                const { data, contentType } = await fetchVCPrivate(cid);
                console.log("Verified CID fetch - Content-Type:", contentType);

                if (!data || !contentType) {
                    throw new Error("Invalid CID. Can't fetch files from IPFS with this CID");
                }
            } catch (fetchErr) {
                console.error("Failed to verify CID fetch:", fetchErr);
                // Continue anyway - the upload succeeded
            }
        } catch (ipfsError: any) {
            console.error("IPFS Upload Error:", ipfsError);

            // If Pinata is not configured, use a placeholder for development
            if (ipfsError.message?.includes('not set')) {
                cid = `dev-${Date.now()}-${address.slice(0, 8)}`;
                console.warn("Using development CID:", cid);
            } else {
                return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
            }
        }

        // Save to MongoDB (upsert)
        try {
            const user = await User.findOneAndUpdate(
                { address },
                {
                    address,
                    cid,
                    name: metadata.name
                },
                { upsert: true, new: true }
            );
            console.log("Stored CID in MongoDB");

            return NextResponse.json({ success: true, user, cid });
        } catch (dbErr: any) {
            console.error("MongoDB store error:", dbErr);
            // Return success with CID even if DB fails
            return NextResponse.json({ success: true, cid, dbError: true });
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
