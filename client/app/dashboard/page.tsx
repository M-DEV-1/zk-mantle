"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useSignMessage, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountdownTimer } from "@/components/CountdownTimer";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/schemas/vcSchema";
import {
    CheckCircle2, MapPin, Loader2, XCircle, ArrowLeft, Wallet,
    Shield, User, Clock, FileCheck, Check, LogOut
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { pinata, fetchVCPrivate } from "@/lib/pinata";

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
    // Location verification fields
    providerLat?: number;
    providerLon?: number;
    radiusKm?: number;
}

export default function UserDashboard() {
    const { address, isConnected } = useAccount();
    const { connect, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const { signMessageAsync } = useSignMessage();
    const [mounted, setMounted] = useState(false);

    // VC Form State
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [bloodGroup, setBloodGroup] = useState<string>("");
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isSubmittingVC, setIsSubmittingVC] = useState(false);
    const [cid, setCid] = useState<string | null>(null);
    const [hasExistingVC, setHasExistingVC] = useState(false);

    // Requests State
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (address && isConnected) {
            axios.get(`/api/user/get?address=${address}`)
                .then(res => {
                    if (res.data.success && res.data.user?.cid) {
                        setCid(res.data.user.cid);
                        setHasExistingVC(true);
                    }
                })
                .catch(() => { });
        }
    }, [address, isConnected]);

    const fetchRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const url = address
                ? `/api/request/list?address=${address}&role=user`
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

    const getLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setIsGettingLocation(false);
            },
            () => {
                toast.error("Unable to get location", { description: "Please enable location permissions." });
                setIsGettingLocation(false);
            }
        );
    };

    const handleCreateVC = async () => {
        if (!name || !dob || !nationalId || !address) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmittingVC(true);
        try {
            const metadata = {
                name,
                dob,
                nationalId,
                bloodGroup: bloodGroup || undefined,
                location: location || undefined,
                walletAddress: address,
                timestamp: new Date().toISOString()
            };

            const message = JSON.stringify(metadata, null, 2);
            const signature = await signMessageAsync({ message });

            const response = await axios.post('/api/user/create', {
                address,
                metadata,
                signature
            });

            if (response.data.success) {
                setCid(response.data.cid);
                setHasExistingVC(true);
            }
        } catch (error: any) {
            console.error("Error creating VC:", error);
            toast.error(error.message || "Failed to create VC");
        } finally {
            setIsSubmittingVC(false);
        }
    };

    const handleAcceptRequest = async (request: VerificationRequest) => {
        const requestId = request._id;
        const requestType = request.type;
        try {
            // 1. Accept the request first
            const acceptRes = await axios.post('/api/request/accept', { requestId });
            if (!acceptRes.data.success) {
                toast.error("Failed to accept request");
                return;
            }

            // 2. Fetch user's VC from IPFS
            if (cid) {
                try {
                    const { data: vcData } = await fetchVCPrivate(cid);

                    console.log('VC Data for proof generation:', vcData);

                    // 3. Generate AGE proof if needed
                    if (vcData.dob && (requestType === 'age' || requestType.includes('age'))) {
                        const dobDate = new Date(vcData.dob);
                        const birthYear = dobDate.getFullYear();
                        const birthMonth = dobDate.getMonth() + 1;
                        const birthDay = dobDate.getDate();
                        const currentYear = new Date().getFullYear();
                        const challenge = Date.now().toString();

                        console.log('Generating AGE proof:', { birthYear, birthMonth, birthDay });

                        const proofRes = await axios.post('/api/proof/generate', {
                            userAddress: address,
                            requestId,
                            type: 'age',
                            birthYear,
                            birthMonth,
                            birthDay,
                            referenceYear: currentYear,
                            challenge
                        });

                        if (proofRes.data.success) {
                            console.log('✅ Age ZK proof generated:', proofRes.data.proofId);
                        }
                    }

                    // 4. Generate LOCATION proof if needed - use LIVE GPS
                    if (requestType === 'location' || requestType.includes('location')) {
                        toast.info("Getting your live location...");

                        // Get live GPS position
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 10000
                            });
                        }).catch(() => null);

                        if (position) {
                            const userLat = position.coords.latitude;
                            const userLon = position.coords.longitude;
                            const providerLat = request.providerLat || 0;
                            const providerLon = request.providerLon || 0;
                            const radiusKm = request.radiusKm || 10;

                            console.log('Generating LOCATION proof with LIVE GPS:', { userLat, userLon, providerLat, providerLon, radiusKm });
                            toast.info("Generating location proof...");

                            const proofRes = await axios.post('/api/proof/generate', {
                                userAddress: address,
                                requestId,
                                type: 'location',
                                userLat,
                                userLon,
                                providerLat,
                                providerLon,
                                radiusKm
                            });

                            if (proofRes.data.success) {
                                toast.success("Location proof generated!");
                            }
                        } else {
                            toast.error("Could not get GPS location");
                        }
                    }
                } catch (vcError) {
                    console.error('Could not fetch VC or generate proof:', vcError);
                }
            }

            fetchRequests();
        } catch (error) {
            console.error("Accept error:", error);
            toast.error("Failed to accept request");
        }
    };

    const handleDenyRequest = async (requestId: string) => {
        try {
            const response = await axios.post('/api/request/deny', { requestId });
            if (response.data.success) {
                fetchRequests();
            }
        } catch (error) {
            toast.error("Failed to deny request");
        }
    };

    if (!mounted) return null;

    // Not connected state
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <Card className="max-w-md w-full bg-neutral-900 border-neutral-800">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-black" />
                        </div>
                        <CardTitle className="text-2xl text-white">Connect Wallet</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Connect your wallet to access your identity dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Button
                            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-black font-semibold rounded-xl"
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

    const pendingCount = requests.filter(r => r.status === 'pending' && r.userAddress === address).length;

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
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-bold text-lg text-white">ZK GPS</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-sm font-medium text-emerald-400">
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-neutral-400">Manage your identity credentials and verification requests</p>
                </div>

                <Tabs defaultValue="identity" className="w-full">
                    <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl mb-8">
                        <TabsTrigger
                            value="identity"
                            className="rounded-lg text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-black px-6"
                        >
                            <User className="w-4 h-4 mr-2" />
                            My Identity
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="rounded-lg text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-black px-6 relative"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Requests
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                                    {pendingCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Identity Tab */}
                    <TabsContent value="identity">
                        {hasExistingVC && cid ? (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardContent className="p-8">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Credential Active</h2>
                                        <p className="text-neutral-400 mb-6 max-w-md">
                                            Your identity credential is verified and ready for use.
                                        </p>
                                        <div className="bg-neutral-800 rounded-xl p-4 w-full max-w-sm">
                                            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">IPFS Identifier</div>
                                            <code className="text-sm font-mono text-emerald-400 break-all">{cid}</code>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-neutral-900 border-neutral-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl text-white">Create Your Credential</CardTitle>
                                    <CardDescription className="text-neutral-400">
                                        Enter your information below. This data will be signed with your wallet and stored securely on IPFS.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        {/* Wallet Address */}
                                        <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center">
                                                    <Wallet className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Wallet Address</div>
                                                    <div className="font-mono text-white text-sm">{address}</div>
                                                </div>
                                                <Check className="w-5 h-5 text-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-white font-medium">Full Name</Label>
                                                <Input
                                                    placeholder="Enter your full name"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="h-12 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white font-medium">Date of Birth</Label>
                                                <Input
                                                    type="date"
                                                    value={dob}
                                                    onChange={e => setDob(e.target.value)}
                                                    className="h-12 bg-neutral-800 border-neutral-700 text-white focus:border-emerald-500 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-white font-medium">National ID (Aadhar/SSN)</Label>
                                                <Input
                                                    placeholder="XXXX-XXXX-XXXX"
                                                    value={nationalId}
                                                    onChange={e => setNationalId(e.target.value)}
                                                    className="h-12 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white font-medium">Blood Group <span className="text-neutral-500 font-normal">(optional)</span></Label>
                                                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                                                    <SelectTrigger className="h-12 bg-neutral-800 border-neutral-700 text-white">
                                                        <SelectValue placeholder="Select blood group" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-800 border-neutral-700">
                                                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                                            <SelectItem key={bg} value={bg} className="text-white hover:bg-neutral-700 focus:bg-neutral-700">{bg}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="space-y-2">
                                            <Label className="text-white font-medium">Location <span className="text-neutral-500 font-normal">(optional)</span></Label>
                                            {location ? (
                                                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                                                    <MapPin className="w-5 h-5 text-emerald-400" />
                                                    <span className="text-sm text-emerald-400 font-medium">
                                                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setLocation(null)}
                                                        className="ml-auto text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={getLocation}
                                                    disabled={isGettingLocation}
                                                    className="w-full h-12 border-dashed border-neutral-700 bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-600"
                                                >
                                                    {isGettingLocation ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting location...</>
                                                    ) : (
                                                        <><MapPin className="w-4 h-4 mr-2" /> Add Current Location</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-black font-semibold text-base rounded-xl"
                                                onClick={handleCreateVC}
                                                disabled={isSubmittingVC || !name || !dob || !nationalId}
                                            >
                                                {isSubmittingVC ? (
                                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing & Creating...</>
                                                ) : (
                                                    <><Shield className="w-5 h-5 mr-2" /> Sign & Create Credential</>
                                                )}
                                            </Button>
                                            <p className="text-center text-sm text-neutral-500 mt-4">
                                                Your wallet will prompt you to sign the credential data
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Requests Tab */}
                    <TabsContent value="requests">
                        <Card className="bg-neutral-900 border-neutral-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl text-white">Verification Requests</CardTitle>
                                <CardDescription className="text-neutral-400">
                                    Review and respond to incoming verification requests from providers
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
                                            <FileCheck className="w-8 h-8 text-neutral-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">No requests yet</h3>
                                        <p className="text-neutral-500 max-w-sm mx-auto">
                                            When providers request verification of your credentials, they'll appear here.
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
                                                            From: <span className="font-mono text-neutral-300">{req.providerAddress.slice(0, 8)}...{req.providerAddress.slice(-6)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {req.status === 'accepted' && req.timerEnd && (
                                                            <CountdownTimer endTime={req.timerEnd} onExpire={fetchRequests} />
                                                        )}

                                                        {req.status === 'pending' && req.userAddress === address && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleDenyRequest(req._id)}
                                                                    className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Deny
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleAcceptRequest(req)}
                                                                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                                    Accept
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
