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
    createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model('User', UserSchema);
export const VerificationRequest = models.VerificationRequest || model('VerificationRequest', RequestSchema);

