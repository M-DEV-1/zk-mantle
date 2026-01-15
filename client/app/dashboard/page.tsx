"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Ban, RotateCcw, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function UserDashboard() {
    const [connections, setConnections] = useState([
        {
            id: 1,
            name: "Age Verification Service",
            description: "Verifies you are over 18",
            category: "Identity",
            approvedFields: ["age > 18"],
            status: "Active",
            proofStatus: "Verified",
            lastActivity: "2 mins ago"
        },
        {
            id: 2,
            name: "Location Services Inc.",
            description: "Verifies radial location",
            category: "Location",
            approvedFields: ["within 10km"],
            status: "Inactive",
            proofStatus: "Pending",
            lastActivity: "1 day ago"
        }
    ]);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-gray-400">Manage your active verifications and credentials.</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <RotateCcw className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white">Active Connections</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">12</div>
                            <p className="text-xs text-gray-400">+2 from last month</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white">Pending Proofs</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">1</div>
                            <p className="text-xs text-gray-400">Action required</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Authorized Providers</CardTitle>
                        <CardDescription className="text-gray-400">
                            Services that have access to verify your credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-gray-300">Provider Name</TableHead>
                                    <TableHead className="text-gray-300">Category</TableHead>
                                    <TableHead className="text-gray-300">Approved Fields</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-gray-300">Proof Status</TableHead>
                                    <TableHead className="text-gray-300">Activity</TableHead>
                                    <TableHead className="text-right text-gray-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {connections.map((conn) => (
                                    <TableRow key={conn.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">
                                            <div>{conn.name}</div>
                                            <div className="text-xs text-gray-500">{conn.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                                {conn.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">
                                            {conn.approvedFields.join(", ")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={conn.status === "Active" ? "border-green-500 text-green-500" : "border-gray-500 text-gray-500"}
                                            >
                                                {conn.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                {conn.proofStatus === "Verified" ? (
                                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-yellow-500" />
                                                )}
                                                <span className="text-white">{conn.proofStatus}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">{conn.lastActivity}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                                <Ban className="h-4 w-4" />
                                            </Button>
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
