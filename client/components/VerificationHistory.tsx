"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Shield, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';

interface ProofRecord {
    _id: string;
    userAddress: string;
    proofType: 'age' | 'location';
    verified: boolean;
    verifiedOnChain: boolean;
    txHash?: string;
    verificationId?: string;
    createdAt: string;
    verifiedAt?: string;
}

interface VerificationHistoryProps {
    role: 'user' | 'provider';
}

export function VerificationHistory({ role }: VerificationHistoryProps) {
    const { address } = useAccount();
    const [proofs, setProofs] = useState<ProofRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProofs = async () => {
        if (!address) return;

        setLoading(true);
        try {
            const res = await axios.get(`/api/proof/generate?userAddress=${address}`);
            if (res.data.success) {
                setProofs(res.data.proofs);
            }
        } catch (error) {
            console.error('Error fetching proofs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProofs();
    }, [address]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </CardContent>
            </Card>
        );
    }

    if (proofs.length === 0) {
        return (
            <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="text-center py-12">
                    <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-7 h-7 text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Proof History</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto">
                        {role === 'user'
                            ? "Generated proofs will appear here."
                            : "Verified proofs will appear here."}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Verification History</CardTitle>
                <CardDescription className="text-neutral-400">
                    {role === 'user'
                        ? "Your generated ZK proofs"
                        : "Completed verifications"}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3">
                    {proofs.map((proof) => (
                        <div
                            key={proof._id}
                            className={`p-4 rounded-xl border ${proof.verifiedOnChain
                                    ? 'bg-cyan-500/5 border-cyan-500/30'
                                    : proof.verified
                                        ? 'bg-emerald-500/5 border-emerald-500/30'
                                        : 'bg-neutral-800 border-neutral-700'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${proof.verifiedOnChain
                                            ? 'bg-cyan-500/20'
                                            : 'bg-emerald-500/20'
                                        }`}>
                                        {proof.verifiedOnChain ? (
                                            <Shield className="w-5 h-5 text-cyan-400" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white capitalize">
                                                {proof.proofType} Verification
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    proof.verifiedOnChain
                                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                }
                                            >
                                                {proof.verifiedOnChain ? 'On-Chain' : 'Off-Chain'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-neutral-500">
                                            {formatDate(proof.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {proof.txHash && (
                                    <a
                                        href={`https://sepolia.mantlescan.xyz/tx/${proof.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-1" />
                                            View on MantleScan
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
