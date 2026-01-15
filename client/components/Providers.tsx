"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { mantleSepoliaTestnet } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { injected } from "wagmi/connectors";

export const config = createConfig({
    chains: [mantleSepoliaTestnet],
    connectors: [
        injected(),
    ],
    transports: {
        [mantleSepoliaTestnet.id]: http(),
    },
});

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
