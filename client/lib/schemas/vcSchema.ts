/**
 * ZK GPS Verifiable Credential Schema
 * W3C-compliant structure for identity data
 */

export interface CredentialSubject {
    walletAddress: string;
    nationalId: string;      // Aadhar/SSN
    name: string;
    dob: string;             // YYYY-MM-DD format
    bloodGroup?: string;     // Optional
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface ZKProof {
    protocol: "groth16";
    curve: "bn128" | "bls12_381";
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    publicSignals: string[];
}

export interface VCProof {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;  // Wallet signature
}

export interface VerifiableCredential {
    "@context": string[];
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: CredentialSubject;
    zkProof?: ZKProof;
    proof: VCProof;
}

/**
 * JSON Schema for form validation
 */
export const VCSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://zkgps.io/vc/identity-v1.json",
    "title": "ZK GPS Verifiable Credential",
    "type": "object",

    "required": [
        "@context", "type", "issuer", "issuanceDate", "credentialSubject", "proof"
    ],

    "properties": {
        "@context": {
            "type": "array",
            "items": { "type": "string" },
            "default": ["https://www.w3.org/2018/credentials/v1"]
        },
        "type": {
            "type": "array",
            "items": { "type": "string" },
            "default": ["VerifiableCredential", "IdentityCredential"]
        },
        "issuer": {
            "type": "string",
            "default": "did:mantle:zkgps"
        },
        "issuanceDate": {
            "type": "string",
            "format": "date-time"
        },

        "credentialSubject": {
            "type": "object",
            "required": ["walletAddress", "nationalId", "name", "dob"],
            "properties": {
                "walletAddress": {
                    "type": "string",
                    "title": "Wallet Address",
                    "pattern": "^0x[a-fA-F0-9]{40}$",
                    "minLength": 42,
                    "maxLength": 42
                },
                "nationalId": {
                    "type": "string",
                    "title": "National ID (Aadhar/SSN)",
                    "minLength": 4,
                    "maxLength": 20
                },
                "name": {
                    "type": "string",
                    "title": "Full Name",
                    "minLength": 2,
                    "maxLength": 100
                },
                "dob": {
                    "type": "string",
                    "title": "Date of Birth",
                    "format": "date"
                },
                "bloodGroup": {
                    "type": "string",
                    "title": "Blood Group",
                    "enum": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
                },
                "location": {
                    "type": "object",
                    "title": "Location",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "minimum": -90,
                            "maximum": 90
                        },
                        "longitude": {
                            "type": "number",
                            "minimum": -180,
                            "maximum": 180
                        }
                    }
                }
            }
        },

        "zkProof": {
            "type": "object",
            "properties": {
                "protocol": { "type": "string", "enum": ["groth16"] },
                "curve": { "type": "string", "enum": ["bn128", "bls12_381"] },
                "pi_a": {
                    "type": "array",
                    "items": { "type": "string" },
                    "minItems": 3,
                    "maxItems": 3
                },
                "pi_b": {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": { "type": "string" }
                    }
                },
                "pi_c": {
                    "type": "array",
                    "items": { "type": "string" },
                    "minItems": 3,
                    "maxItems": 3
                },
                "publicSignals": {
                    "type": "array",
                    "items": { "type": "string" }
                }
            }
        },

        "proof": {
            "type": "object",
            "required": ["type", "created", "proofPurpose", "verificationMethod", "jws"],
            "properties": {
                "type": { "type": "string" },
                "created": { "type": "string", "format": "date-time" },
                "proofPurpose": { "type": "string" },
                "verificationMethod": { "type": "string" },
                "jws": { "type": "string" }
            }
        }
    }
};

/**
 * Create a new Verifiable Credential
 */
export function createVC(
    subject: CredentialSubject,
    signature: string
): VerifiableCredential {
    const now = new Date().toISOString();

    return {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "IdentityCredential"],
        "issuer": `did:mantle:${subject.walletAddress}`,
        "issuanceDate": now,
        "credentialSubject": subject,
        "proof": {
            "type": "EthereumEip712Signature2021",
            "created": now,
            "proofPurpose": "assertionMethod",
            "verificationMethod": `did:mantle:${subject.walletAddress}#key-1`,
            "jws": signature
        }
    };
}

/**
 * Request types for verification (ZK-proof based only)
 */
export type RequestType = 'age' | 'location' | 'age+location';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    'age': 'Age Verification (≥18)',
    'location': 'Location Check (Within Radius)',
    'age+location': 'Age + Location'
};

/**
 * Duration options for requests (in seconds)
 */
export const DURATION_OPTIONS = [
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
];
