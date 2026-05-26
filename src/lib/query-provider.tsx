"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

const buildClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(buildClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
