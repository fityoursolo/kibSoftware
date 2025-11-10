// app/providers.tsx
'use client'; // <-- MUST BE AT THE TOP

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();

// Use a NAMED export
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// DO NOT put a default export here, and ensure it's saved correctly.