"use client";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lasna } from "@/lib/contracts";
export const walletConfig = createConfig({
  chains: [baseSepolia, lasna],
  connectors: [injected()],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    ),
    [lasna.id]: http(
      process.env.NEXT_PUBLIC_REACTIVE_LASNA_RPC ||
        "https://lasna-rpc.rnk.dev/",
    ),
  },
});
export function Providers({ children }: { children: ReactNode }) {
  const [query] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 12_000 } },
      }),
  );
  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={query}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
