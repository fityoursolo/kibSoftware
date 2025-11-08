// --- app/providers.tsx ---
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

// Create a client instance outside of the component to prevent re-creation on render
const queryClient = new QueryClient({
  // Optional: Default settings for all queries
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Provide the client to your app
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}