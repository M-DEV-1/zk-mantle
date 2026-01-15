import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    address: { type: String, required: true, unique: true },
    cid: { type: String, required: true }, // IPFS CID for VC metadata
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const RequestSchema = new Schema({
    sessionId: { type: String, unique: true, sparse: true },
    providerAddress: { type: String, required: true },
    userAddress: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['age', 'location', 'age+location'],
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'denied', 'expired', 'verified'],
        default: 'pending',
    },
    duration: { type: Number, required: true },
    acceptedAt: { type: Date },
    timerEnd: { type: Date },
    challenge: { type: String },
    proofStatus: { type: String, default: 'awaited' },
    proofId: { type: Schema.Types.ObjectId, ref: 'Proof' },
    txHash: { type: String },
    // Provider location for location verification
    providerLat: { type: Number },
    providerLon: { type: Number },
    radiusKm: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now },
});

// Proof model - stores generated ZK proofs per-user
const ProofSchema = new Schema({
    userAddress: { type: String, required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'VerificationRequest' },
    proofType: {
        type: String,
        required: true,
        enum: ['age', 'location']
    },
    // Proof data (Groth16)
    proof: {
        pi_a: [{ type: String }],
        pi_b: [[{ type: String }]],
        pi_c: [{ type: String }],
        protocol: { type: String, default: 'groth16' },
        curve: { type: String, default: 'bn128' }
    },
    publicSignals: [{ type: String }],
    // Verification status
    verified: { type: Boolean, default: false },
    verifiedOnChain: { type: Boolean, default: false },
    txHash: { type: String }, // On-chain tx hash
    verificationId: { type: String }, // On-chain verification ID (bytes32)
    // Metadata
    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
});

export const User = models.User || model('User', UserSchema);
export const VerificationRequest = models.VerificationRequest || model('VerificationRequest', RequestSchema);
export const Proof = models.Proof || model('Proof', ProofSchema);
