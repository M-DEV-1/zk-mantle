"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, Shield } from "lucide-react";

export default function ProviderDashboard() {
    const [requests, setRequests] = useState([
        {
            id: 1,
            user: "0x1234...5678",
            cid: "QmX...Y3z",
            requestTime: "2024-03-20 14:30",
            proofRequested: ["Age > 18"],
            timerStatus: "14:59",
            proofStatus: "Pending",
        },
        {
            id: 2,
            user: "0x8765...4321",
            cid: "QmABC...123",
            requestTime: "2024-03-20 12:15",
            proofRequested: ["Location"],
            timerStatus: "Expired",
            proofStatus: "Verified",
        }
    ]);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Provider Portal</h1>
                        <p className="text-gray-400">Monitor and verify incoming credential requests.</p>
                    </div>
                    <Button className="bg-white text-black hover:bg-gray-200">
                        Create Verification Request
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">1,234</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-400">45</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Verified</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-400">1,150</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Failed/Expired</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-400">39</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Ingress Requests</CardTitle>
                        <CardDescription className="text-gray-400">
                            Live feed of users attempting to verify against your schemas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-gray-300">User</TableHead>
                                    <TableHead className="text-gray-300">Request Time</TableHead>
                                    <TableHead className="text-gray-300">Proof Requested</TableHead>
                                    <TableHead className="text-gray-300">Timer Status</TableHead>
                                    <TableHead className="text-gray-300">Proof Status</TableHead>
                                    <TableHead className="text-right text-gray-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://avatar.vercel.sh/${req.user}`} />
                                                    <AvatarFallback>U</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div>{req.user}</div>
                                                    <div className="text-xs text-gray-500 font-mono">CID: {req.cid}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">{req.requestTime}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {req.proofRequested.map((proof) => (
                                                    <Badge key={proof} variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                                                        {proof}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`text-sm font-mono ${req.timerStatus === 'Expired' ? 'text-red-400' : 'text-white'}`}>
                                                {req.timerStatus}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    req.proofStatus === "Verified" ? "border-green-500 text-green-500"
                                                        : req.proofStatus === "Pending" ? "border-yellow-500 text-yellow-500"
                                                            : "border-gray-500 text-gray-500"
                                                }
                                            >
                                                {req.proofStatus === "Verified" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {req.proofStatus === "Pending" && <Clock className="w-3 h-3 mr-1" />}
                                                {req.proofStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.proofStatus === "Pending" && (
                                                <Button size="sm" className="bg-white text-black hover:bg-gray-200">
                                                    <Shield className="w-3 h-3 mr-2" />
                                                    Verify
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
