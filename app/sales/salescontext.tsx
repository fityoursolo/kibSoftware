// =======================================================
// File: ./salescontext.tsx
// FIX: Corrected TypeError by changing salesDB.getById to salesDB.getAll().find(...) 
//      and implemented full 400, 404, and 500 error simulation.
// =======================================================
'use client';
import React, { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react'; 
// ⭐ REACT QUERY IMPORTS ⭐
import { useQuery, useMutation, useQueryClient, QueryClientProvider, QueryClient } from '@tanstack/react-query'; 

import { Sale } from '../lib/sales-type'; 
import { salesDB } from '../lib/sales-mockdata'; 
import { Medicine, getFullMedicineList } from '../lib/medicine-data'; 

// NOTE: This mock function simulates the actual API call to update stock on the backend.
const updateMedicineStock = async (name: string, quantityDiff: number) => {
    // Simulate API latency for the stock update
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[Mock Stock Update]: Adjusted stock for ${name} by ${quantityDiff}`);
    
    // ⭐ MOCK: Simulate a 500 error if stock update fails for demonstration ⭐
    if (name.includes('FailStock')) {
        // Simulating 500 error
        throw new Error('500: Stock update failed at the server.'); 
    }
};


// --- REACT QUERY KEYS ---
const SALE_QUERY_KEY = 'sales';
const MEDICINE_QUERY_KEY = 'medicines';


// --- NEW TYPE: Sales Filters ---
type FilterValue = string | number | boolean | null;

export interface SalesFilters {
    startDate: string;
    endDate: string;
    minPrice: string;
    maxPrice: string;
    medicineName: string;
    [key: string]: FilterValue; // Allow dynamic access
}


// --- Fetcher Functions (Required by useQuery/useMutation) ---

// 1. Fetch Sales List (READ) <-- UPDATED to accept search term AND filters
const fetchSales = async (searchTerm: string = '', filters: SalesFilters): Promise<Sale[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // ⭐ MOCK DATA LOGIC FOR SEARCH & FILTERS ⭐
    let allSales = salesDB.getAll(); 

    // Apply Search
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        allSales = allSales.filter(sale => 
            sale.medicineName.toLowerCase().includes(lowerSearchTerm) || 
            sale.customerName.toLowerCase().includes(lowerSearchTerm)
        );
    }
    
    // Apply Filters (Basic Mock Logic)
    if (filters.medicineName) {
        allSales = allSales.filter(sale => sale.medicineName === filters.medicineName);
    }
    if (filters.minPrice) {
        allSales = allSales.filter(sale => sale.totalAmount >= parseFloat(filters.minPrice));
    }
    // Add more filter checks here if needed (e.g., dates)
    
    return allSales; 
};

// 2. Fetch Medicine Catalog (READ)
const fetchMedicines = async (): Promise<Medicine[]> => {
    return getFullMedicineList(); 
};


// --- Context Type Definition ---
interface SalesContextType {
    sales: Sale[];
    medicines: Medicine[]; 
    // React Query provides these states directly
    isLoading: boolean; 
    isError: boolean;
    
    // Search state and handler
    searchTerm: string; 
    setSearchTerm: (term: string) => void; 
    
    // NEW: Filter state and handler (FIXED)
    filters: SalesFilters; // <--- ADDED
    setFilters: React.Dispatch<React.SetStateAction<SalesFilters | {}>>; // <--- ADDED
    
    addSale: (newSale: Omit<Sale, 'id'>) => Promise<Sale>;
    updateSale: (updatedSale: Sale, quantityDiff: number) => Promise<void>; 
    deleteSale: (saleId: number, quantity: number, medicineName: string) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

// Initialize a QueryClient instance outside the component tree
const queryClient = new QueryClient(); 

// --- Core Sales Provider Logic (Wrapped by QueryClientProvider) ---
const SalesContentProvider = ({ children }: { children: ReactNode }) => { // <-- Fixed children prop type
    const queryClient = useQueryClient(); 
    
    // ⭐ NEW: STATE FOR SEARCH TERM ⭐
    const [searchTerm, setSearchTermState] = useState('');
    
    // ⭐ NEW: STATE FOR FILTERS (REQUIRED FOR CONTEXT) ⭐
    const [filters, setFiltersState] = useState<SalesFilters>({
        startDate: '',
        endDate: '',
        minPrice: '',
        maxPrice: '',
        medicineName: '',
    });


    // 1. USE QUERY: Fetch Sales List
    const { 
        data: sales = [], 
        isLoading: isLoadingSales, 
        isError: isErrorSales 
    } = useQuery({
        // ⭐ CRITICAL CHANGE: Query Key now includes the search term AND filters ⭐
        queryKey: [SALE_QUERY_KEY, searchTerm, filters], 
        // ⭐ CRITICAL CHANGE: Query Function now passes the search term AND filters ⭐
        queryFn: () => fetchSales(searchTerm, filters),
        staleTime: 5 * 60 * 1000, 
    });

    // 2. USE QUERY: Fetch Medicine Catalog
    const { 
        data: medicines = [], 
        isLoading: isLoadingMedicines 
    } = useQuery({
        queryKey: [MEDICINE_QUERY_KEY],
        queryFn: fetchMedicines,
    });

    // Combined loading and error states for consumer simplicity
    const isLoading = isLoadingSales || isLoadingMedicines;
    const isError = isErrorSales;


    // 3. USE MUTATION: Create (Add Sale) 
    const { mutateAsync: addSaleMutation } = useMutation({
        mutationFn: async (newSaleData: Omit<Sale, 'id'>) => {
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            // ⭐ 400: VALIDATION CHECK (Simulating backend check for positive values) ⭐
            if (!newSaleData.medicineName || newSaleData.quantity <= 0 || newSaleData.sellingPrice <= 0) {
                 // Throwing a 400 error for validation failure 
                 throw new Error('400: Missing required fields or non-positive values.');
            }
            
            const createdSale = salesDB.addSale(newSaleData); 
            
            // Stock Deduction Logic
            await updateMedicineStock(createdSale.medicineName, -createdSale.quantity); 

            return createdSale;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SALE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [MEDICINE_QUERY_KEY] }); 
        },
    });

    const addSale = (newSaleData: Omit<Sale, 'id'>): Promise<Sale> => {
        return addSaleMutation(newSaleData);
    };
    
    
    // 4. USE MUTATION: Update Sale 
    const { mutateAsync: updateSaleMutation } = useMutation({
        mutationFn: async ({ updatedSale, quantityDiff }: { updatedSale: Sale, quantityDiff: number }) => {
            await new Promise(resolve => setTimeout(resolve, 300));

            // ⭐ 404: NOT FOUND CHECK (FIXED: Using getAll().find to avoid TypeError) ⭐
            const originalSale = salesDB.getAll().find(sale => sale.id === updatedSale.id); 
            if (!originalSale) {
                 // Throwing a 404 error if record not found 
                 throw new Error('404: Record not found'); 
            }

            // ⭐ 400: VALIDATION CHECK (Simulating required fields/positive values) ⭐
            if (updatedSale.quantity <= 0 || updatedSale.sellingPrice <= 0) {
                 // Throwing a 400 error for validation failure 
                 throw new Error('400: Quantity and price must be positive.');
            }

            const result = salesDB.updateSale(updatedSale);
            // Simulating 500 if database layer fails
            if (!result) throw new Error('500: Database failed to commit update.'); 

            // Stock Adjustment Logic
            if (quantityDiff !== 0) {
                 await updateMedicineStock(updatedSale.medicineName, -quantityDiff);
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SALE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [MEDICINE_QUERY_KEY] }); 
        },
    });

    const updateSale = async (updatedSale: Sale, quantityDiff: number): Promise<void> => {
        await updateSaleMutation({ updatedSale, quantityDiff });
    };

    
    // 5. USE MUTATION: Delete Sale 
    const { mutateAsync: deleteSaleMutation } = useMutation({
        mutationFn: async ({ saleId, quantity, medicineName }: { saleId: number, quantity: number, medicineName: string }) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const deleted = salesDB.deleteSale(saleId);
            // ⭐ 404: NOT FOUND CHECK ⭐
            if (!deleted) {
                // Throwing a 404 error if record not found 
                throw new Error('404: Record not found'); 
            }
            
            // Stock Restoration Logic
            await updateMedicineStock(medicineName, quantity);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SALE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [MEDICINE_QUERY_KEY] }); 
        },
    });
    
    const deleteSale = async (saleId: number, quantity: number, medicineName: string): Promise<void> => {
        await deleteSaleMutation({ saleId, quantity, medicineName });
    };
    
    // ⭐ NEW: Export stable setter function for search term ⭐
    const setSearchTerm = useCallback((term: string) => {
        setSearchTermState(term);
    }, []);
    
    // ⭐ CRITICAL FIX: Export stable setter function for filters (Must be present!) ⭐
    const setFilters = useCallback((newFilters: SalesFilters | {}) => {
        setFiltersState(prev => ({
            ...prev,
            ...newFilters,
        } as SalesFilters));
    }, []);


    // --- Context Value ---
    const contextValue = useMemo(() => ({ 
        sales, 
        medicines, 
        isLoading, 
        isError,
        // NEW CONTEXT VALUES
        searchTerm, 
        setSearchTerm,
        filters, // <--- EXPORTED
        setFilters, // <--- EXPORTED (Fixes "setFilters is not a function")
        // EXISTING CONTEXT VALUES
        addSale, 
        updateSale, 
        deleteSale 
    }), [
        sales, 
        medicines, 
        isLoading, 
        isError, 
        // NEW DEPENDENCIES
        searchTerm, 
        setSearchTerm,
        filters, 
        setFilters,
        // EXISTING DEPENDENCIES
        addSale, 
        updateSale, 
        deleteSale
    ]); 

    return (
        <SalesContext.Provider value={contextValue}>
            {children}
        </SalesContext.Provider>
    );
};

// --- Top-Level Wrapper Export (FIXED) ---
// This line now correctly defines the 'children' prop type.
export const SalesProvider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <SalesContentProvider>{children}</SalesContentProvider>
    </QueryClientProvider>
);


// --- Custom Hook (No changes) ---
export const useSales = () => {
    const context = useContext(SalesContext);
    if (context === undefined) {
        throw new Error('useSales must be used within a SalesProvider (which contains QueryClientProvider)');
    }
    return context;
};