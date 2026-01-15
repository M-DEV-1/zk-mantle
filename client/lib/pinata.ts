import { PinataSDK } from "pinata";

let pinataInstance: PinataSDK | undefined;

export function getPinata(): PinataSDK {
    if (pinataInstance) {
        return pinataInstance;
    }

    const jwt = process.env.PINATA_JWT;
    let gateway = process.env.NEXT_PUBLIC_GATEWAY_URL;

    if (!jwt || !gateway) {
        throw new Error("PINATA_JWT or NEXT_PUBLIC_GATEWAY_URL is not set");
    }

    // Sanitize gateway URL (remove protocol and trailing slash)
    gateway = gateway.replace(/^https?:\/\//, '').replace(/\/$/, '');

    pinataInstance = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: gateway
    });

    return pinataInstance;
}

// Re-export for convenience
export const pinata = {
    get instance() {
        return getPinata();
    }
};

/**
 * Upload a Verifiable Credential to IPFS via Pinata (Private)
 */
export async function uploadVCPrivate(content: object, walletAddress: string): Promise<string> {
    const p = getPinata();

    const upload = await p.upload.private.json({
        content,
        name: `vc-${walletAddress}.json`,
    });

    return upload.cid;
}

/**
 * Fetch a private Verifiable Credential from IPFS via Pinata Gateway
 */
export async function fetchVCPrivate(cid: string): Promise<{ data: any; contentType: string }> {
    const p = getPinata();

    const result = await p.gateways.private.get(cid);

    if (!result.data) {
        throw new Error(`Failed to fetch from IPFS: Invalid CID or data not found`);
    }

    return {
        data: result.data,
        contentType: result.contentType || 'application/json'
    };
}
