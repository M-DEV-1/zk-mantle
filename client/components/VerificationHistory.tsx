"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';

interface VerifiedRequest {
    _id: string;
    userAddress: string;
    providerAddress: string;
    type: string;
    status: string;
    createdAt: string;
}

interface VerificationHistoryProps {
    role: 'user' | 'provider';
}

export function VerificationHistory({ role }: VerificationHistoryProps) {
    const { address } = useAccount();
    const [requests, setRequests] = useState<VerifiedRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVerifiedRequests = async () => {
        if (!address) return;

        setLoading(true);
        try {
            const roleParam = role === 'provider' ? 'provider' : 'user';
            const res = await axios.get(`/api/request/list?address=${address}&role=${roleParam}`);
            if (res.data.success) {
                // Filter only verified requests
                const verified = res.data.requests.filter((r: VerifiedRequest) => r.status === 'verified');
                setRequests(verified);
            }
        } catch (error) {
            console.error('Error fetching verified requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifiedRequests();
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

    if (requests.length === 0) {
        return (
            <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="text-center py-12">
                    <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-7 h-7 text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Verified Proofs Yet</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto">
                        {role === 'user'
                            ? "Completed verifications will appear here."
                            : "Successfully verified proofs will appear here."}
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
                    Successfully verified ZK proofs
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div
                            key={req._id}
                            className="p-4 rounded-xl border bg-cyan-500/5 border-cyan-500/30"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white capitalize">
                                                {req.type} Verification
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                            >
                                                Verified
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-neutral-500">
                                            {formatDate(req.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <Shield className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
