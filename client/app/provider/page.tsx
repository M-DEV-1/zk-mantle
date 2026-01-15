"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountdownTimer } from "@/components/CountdownTimer";
import { VerificationHistory } from "@/components/VerificationHistory";
import { useVerifyOnChain } from "@/hooks/useVerifyOnChain";
import { REQUEST_TYPE_LABELS, DURATION_OPTIONS, type RequestType } from "@/lib/schemas/vcSchema";
import {
    Plus, Shield, CheckCircle2, ArrowLeft, Wallet,
    Loader2, Send, Users, XCircle, LogOut, ExternalLink, MapPin
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface VerificationRequest {
    _id: string;
    providerAddress: string;
    userAddress: string;
    type: RequestType;
    status: 'pending' | 'accepted' | 'denied' | 'expired' | 'verified';
    duration: number;
    acceptedAt?: string;
    timerEnd?: string;
    createdAt: string;
}

interface User {
    _id: string;
    address: string;
    name?: string;
    cid: string;
}

export default function ProviderDashboard() {
    const { address, isConnected } = useAccount();
    const { connect, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Users list for dropdown
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Create Request State
    const [targetUser, setTargetUser] = useState("");
    const [requestType, setRequestType] = useState<RequestType>("age");
    const [duration, setDuration] = useState("300");
    // Location request fields
    const [providerLat, setProviderLat] = useState("");
    const [providerLon, setProviderLon] = useState("");
    const [radiusKm, setRadiusKm] = useState("10");
    const [gettingLocation, setGettingLocation] = useState(false);

    // Requests State
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Get current GPS location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setProviderLat(pos.coords.latitude.toFixed(6));
                setProviderLon(pos.coords.longitude.toFixed(6));
                setGettingLocation(false);
            },
            () => {
                alert("Could not get location");
                setGettingLocation(false);
            }
        );
    };

    // On-chain verification hook
    const { verifyAge, isLoading: isVerifying } = useVerifyOnChain();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await axios.get('/api/user/list');
                if (res.data.success) {
                    setUsers(res.data.users);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const url = address
                ? `/api/request/list?address=${address}&role=provider`
                : '/api/request/list?address=all';
            const res = await axios.get(url);
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoadingRequests(false);
        }
    }, [address]);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 10000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const handleCreateRequest = async () => {
        if (!targetUser || !requestType || !address) return;

        setIsSubmitting(true);
        try {
            const requestData: any = {
                providerAddress: address,
                userAddress: targetUser,
                type: requestType,
                duration: parseInt(duration)
            };

            // Add location data for location requests
            if (requestType === 'location' || requestType === 'age+location') {
                requestData.providerLat = parseFloat(providerLat) || 0;
                requestData.providerLon = parseFloat(providerLon) || 0;
                requestData.radiusKm = parseFloat(radiusKm) || 10;
            }

            const response = await axios.post('/api/request/create', requestData);

            if (response.data.success) {
                setIsCreating(false);
                setTargetUser("");
                setRequestType("age");
                setDuration("300");
                setProviderLat("");
                setProviderLon("");
                setRadiusKm("10");
                fetchRequests();
            }
        } catch (error) {
            console.error("Error creating request:", error);
            toast.error("Failed to create request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyProof = async (req: VerificationRequest) => {
        setVerifyingId(req._id);
        try {
            // 1. Fetch the stored proof for this user/request
            const proofRes = await axios.get(`/api/proof/generate?userAddress=${req.userAddress}`);

            let proof = { pi_a: ['1', '2'], pi_b: [['1', '2'], ['3', '4']], pi_c: ['1', '2'] };
            let publicSignals = ['1', '0', '2024'];

            if (proofRes.data.success && proofRes.data.proofs?.length > 0) {
                // Find the proof for this request or use the latest
                const storedProof = proofRes.data.proofs.find((p: any) => p.requestId === req._id)
                    || proofRes.data.proofs[0];

                if (storedProof?.proof?.pi_a) {
                    proof = {
                        pi_a: storedProof.proof.pi_a,
                        pi_b: storedProof.proof.pi_b,
                        pi_c: storedProof.proof.pi_c
                    };
                    publicSignals = storedProof.publicSignals || publicSignals;
                    console.log('Using stored real proof:', storedProof._id);
                }
            }

            // 2. Verify the proof
            const response = await axios.post('/api/verify', {
                requestId: req._id,
                proof,
                publicSignals,
                type: req.type === 'age' ? 'age' : 'location'
            });

            if (response.data.success && response.data.verified) {
                toast.success("ZK Proof Verified!", { description: "The proof has been cryptographically verified." });
                fetchRequests();
            } else {
                toast.error("Verification Failed", { description: response.data.message || "Invalid proof" });
            }
        } catch (error: any) {
            console.error("Verification error:", error);
            toast.error("Verification Error", { description: error.message || "Unknown error" });
        } finally {
            setVerifyingId(null);
        }
    };

    if (!mounted) return null;

    // Not connected state
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <Card className="max-w-md w-full bg-neutral-900 border-neutral-800">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-white">Provider Portal</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Connect your wallet to request identity verifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Button
                            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl"
                            onClick={() => connect({ connector: injected() })}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                            ) : (
                                <><Wallet className="w-4 h-4 mr-2" /> Connect Wallet</>
                            )}
                        </Button>
                        <Link href="/" className="block mt-4">
                            <Button variant="ghost" className="w-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        verified: requests.filter(r => r.status === 'verified').length,
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-neutral-800 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg text-white">Provider Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-full">
                            <div className="w-2 h-2 bg-violet-500 rounded-full" />
                            <span className="text-sm font-medium text-violet-400">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnect()}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto py-8 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Verification Requests</h1>
                        <p className="text-neutral-400">Create and manage identity verification requests</p>
                    </div>
                    <Button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`font-semibold rounded-xl h-11 px-5 ${isCreating ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90'}`}
                    >
                        {isCreating ? (
                            <><XCircle className="w-4 h-4 mr-2" /> Cancel</>
                        ) : (
                            <><Plus className="w-4 h-4 mr-2" /> New Request</>
                        )}
                    </Button>
                </div>

                {/* Create Request Form */}
                {isCreating && (
                    <Card className="bg-neutral-900 border-neutral-800 mb-8">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-white">Create Verification Request</CardTitle>
                            <CardDescription className="text-neutral-400">
                                Select a user and the type of verification you need
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-white font-medium">Select User</Label>
                                    <Select value={targetUser} onValueChange={setTargetUser}>
                                        <SelectTrigger className="h-11 bg-neutral-800 border-neutral-700 text-white">
                                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-800 border-neutral-700">
                                            {users.map(user => (
                                                <SelectItem key={user._id} value={user.address} className="text-white hover:bg-neutral-700 focus:bg-neutral-700">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm">{user.address.slice(0, 8)}...{user.address.slice(-6)}</span>
                                                        {user.name && <span className="text-neutral-400">({user.name})</span>}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {users.length === 0 && !loadingUsers && (
                                                <div className="px-3 py-2 text-neutral-500 text-sm">No users registered yet</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Verification Type</Label>
                                    <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                                        <SelectTrigger className="h-11 bg-neutral-800 border-neutral-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-800 border-neutral-700">
                                            {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value} className="text-white hover:bg-neutral-700 focus:bg-neutral-700">{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Time Limit</Label>
                                    <Select value={duration} onValueChange={setDuration}>
                                        <SelectTrigger className="h-11 bg-neutral-800 border-neutral-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-800 border-neutral-700">
                                            {DURATION_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value.toString()} className="text-white hover:bg-neutral-700 focus:bg-neutral-700">{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Location fields - show when location type selected */}
                                {(requestType === 'location' || requestType === 'age+location') && (
                                    <>
                                        <div className="col-span-2 pt-2 flex items-center justify-between">
                                            <Label className="text-cyan-400 font-medium">📍 Provider Location (your verification area)</Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={getCurrentLocation}
                                                disabled={gettingLocation}
                                                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                                            >
                                                {gettingLocation ? (
                                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Getting...</>
                                                ) : (
                                                    <>📍 Use My Location</>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-sm">Latitude</Label>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 28.6139"
                                                value={providerLat}
                                                onChange={(e) => setProviderLat(e.target.value)}
                                                className="h-11 bg-neutral-800 border-neutral-700 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-sm">Longitude</Label>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 77.2090"
                                                value={providerLon}
                                                onChange={(e) => setProviderLon(e.target.value)}
                                                className="h-11 bg-neutral-800 border-neutral-700 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-neutral-400 text-sm">Radius (km)</Label>
                                            <Input
                                                type="number"
                                                placeholder="10"
                                                value={radiusKm}
                                                onChange={(e) => setRadiusKm(e.target.value)}
                                                className="h-11 bg-neutral-800 border-neutral-700 text-white max-w-32"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={handleCreateRequest}
                                    disabled={!targetUser || isSubmitting}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl h-11 px-6 hover:opacity-90"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send className="w-4 h-4 mr-2" /> Send Request</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-neutral-800 text-white border border-neutral-700' },
                        { label: 'Pending', value: stats.pending, color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
                        { label: 'Active', value: stats.accepted, color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
                        { label: 'Verified', value: stats.verified, color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-sm opacity-80">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Requests */}
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-white">All Requests</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Track the status of your verification requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {loadingRequests ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-neutral-600" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No requests yet</h3>
                                <p className="text-neutral-500 max-w-sm mx-auto">
                                    Create your first verification request to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div
                                        key={req._id}
                                        className={`p-5 rounded-xl border ${req.status === 'pending' ? 'bg-amber-500/5 border-amber-500/30' :
                                            req.status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/30' :
                                                req.status === 'verified' ? 'bg-cyan-500/5 border-cyan-500/30' :
                                                    'bg-neutral-800 border-neutral-700'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium text-white">
                                                        {REQUEST_TYPE_LABELS[req.type] || req.type}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                                req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                                    req.status === 'denied' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                                        req.status === 'expired' ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30' :
                                                                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                        }
                                                    >
                                                        {req.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-neutral-400">
                                                    User: <span className="font-mono text-neutral-300">{req.userAddress.slice(0, 8)}...{req.userAddress.slice(-6)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {req.status === 'accepted' && req.timerEnd && (
                                                    <CountdownTimer endTime={req.timerEnd} onExpire={fetchRequests} />
                                                )}

                                                {req.status === 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleVerifyProof(req)}
                                                        disabled={verifyingId === req._id}
                                                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                                                    >
                                                        {verifyingId === req._id ? (
                                                            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Verifying...</>
                                                        ) : (
                                                            <><Shield className="w-4 h-4 mr-1" /> Verify Proof</>
                                                        )}
                                                    </Button>
                                                )}

                                                {req.status === 'verified' && (
                                                    <div className="flex items-center gap-2 text-cyan-400">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span className="font-medium">Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Verification History */}
                <div className="mt-8">
                    <VerificationHistory role="provider" />
                </div>
            </main>
        </div>
    );
}
