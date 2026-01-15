import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    address: { type: String, required: true, unique: true },
    cid: { type: String, required: true }, // IPFS CID for VC metadata
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const RequestSchema = new Schema({
    sessionId: { type: String, unique: true, sparse: true }, // Optional unique session ID
    providerAddress: { type: String, required: true },
    userAddress: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['age', 'location', 'blood', 'age+location', 'age+blood', 'location+blood', 'all'],
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'denied', 'expired', 'verified'],
        default: 'pending',
    },
    duration: { type: Number, required: true }, // Duration in seconds (for timer)
    acceptedAt: { type: Date }, // When user accepted (timer starts)
    timerEnd: { type: Date }, // When timer expires
    challenge: { type: String }, // Unique challenge for proof generation
    proofStatus: { type: String, default: 'awaited' }, // awaited, generated, verified
    proofId: { type: Schema.Types.ObjectId, ref: 'Proof' }, // Reference to stored proof
    txHash: { type: String }, // On-chain transaction hash
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
