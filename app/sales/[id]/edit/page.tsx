'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// === CONTEXT & DATA IMPORTS ===
// NOTE: Ensure all these imports are correctly set up in your actual project structure
import { useSales, SalesProvider } from '../../salescontext'; 
import { useToast, useTheme, ThemeProvider, ToastProviderWrapper } from '../../page'; 
import { Sale } from '../../../lib/sales-type'; 
import { Medicine } from '../../../lib/medicine-data'; 

// --- UTILITY ---
const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// --- CORE COMPONENT ---
const EditSalePageCore = () => {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { theme } = useTheme();

    // Safely parse the ID from params
    const saleId = params.id ? parseInt(params.id as string) : null;
    
    // De-structure sales state and update function
    const { sales, medicines, isLoading: isSalesLoading, updateSale } = useSales();
    
    const [currentSale, setCurrentSale] = useState<Sale | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Original Sale (Memoized) ---
    const originalSale = useMemo(() => {
        if (!isSalesLoading && saleId) {
            const foundSale = sales.find(s => s.id === saleId);
            
            if (foundSale) {
                // Ensure date is correctly formatted for input type="date"
                return {
                    ...foundSale,
                    saleDate: foundSale.saleDate.split('T')[0] 
                } as Sale;
            }
        }
        return null;
    }, [isSalesLoading, saleId, sales]);


    // --- Load Sale Data (Initializes Form State) ---
    useEffect(() => {
        if (!saleId) {
             toast.error('Missing Sale ID.');
             router.push('/sales');
             return;
        }

        // 1. If data is ready and we haven't initialized the form state yet
        if (!isSalesLoading && originalSale && !currentSale) {
            setCurrentSale(originalSale); 
            return;
        } 
        
        // 2. Handle scenario where data finished loading but the sale was not found
        if (!isSalesLoading && saleId && !originalSale) {
             console.error(`Sale ID ${saleId} not found.`);
             toast.error('Sale not found. Redirecting...');
             router.push('/sales'); 
        }
    }, [isSalesLoading, saleId, originalSale, router, toast]);


    // --- Derived State: Current Medicine from Catalog ---
    const currentMedicine = useMemo(() => {
        if (!medicines || !originalSale) {
             return undefined; 
        }
        // Use originalSale for a stable medicine name lookup
        const targetName = originalSale.medicineName.toLowerCase();
        
        // Find the corresponding medicine from the catalog (for stock check)
        return medicines.find(m => m.name.toLowerCase() === targetName) as Medicine | undefined;
    }, [originalSale, medicines]); 

    
    // --- Change Handler Logic ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setCurrentSale(prev => {
            if (!prev) return null;
            
            let newValue: string | number = value;
            
            if (name === 'quantity' || name === 'sellingPrice') {
                newValue = parseFloat(value);
                if (isNaN(newValue) || newValue < 0) newValue = 0; 
                
                const newQuantity = name === 'quantity' ? newValue : prev.quantity;
                const newPrice = name === 'sellingPrice' ? newValue : prev.sellingPrice;
                
                return { 
                    ...prev, 
                    [name]: newValue,
                    // Recalculate totalAmount
                    totalAmount: parseFloat((newQuantity * newPrice).toFixed(2)) 
                } as Sale;
            }

            return { ...prev, [name]: newValue } as Sale;
        });
    }, []);


    // --- Submit Handler Logic (NOW WITH REQUIRED ERROR PARSING) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting || !currentSale || !originalSale || !currentMedicine) {
             toast.error('Data not fully loaded. Please wait and try again.');
             return;
        }

        // ⭐ CRITICAL STOCK CALCULATION: The difference to adjust stock by
        const quantityDifference = currentSale.quantity - originalSale.quantity;
        const availableStock = currentMedicine.stock; 
        
        // Stock Check: If increasing quantity, ensure enough stock remains after sale
        if (quantityDifference > 0 && quantityDifference > availableStock) {
            toast.error(`Stock Error: Cannot increase quantity by ${quantityDifference}. Only ${availableStock} units currently remain in stock.`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Call the mutation with the new sale data AND the calculated stock difference
            await updateSale(currentSale, quantityDifference); 
            
            // UX: Show success toast and redirect
            const successMessage = encodeURIComponent("Sale updated successfully!");
            router.push(`/sales?status=success&message=${successMessage}`);
            
        } catch (error) {
            
            // ⭐ 🛑 NEW: ERROR PARSING LOGIC 🛑 ⭐
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Sale update failed:", errorMessage);

            if (errorMessage.startsWith('400:')) {
                // 400 Validation Error: Show INLINE errors (using toast as a fallback for missing form library)
                // You should integrate a form library (like Formik) to set specific field errors here.
                toast.error("Validation failed: Quantity and price must be positive."); 

            } else if (errorMessage.startsWith('404:')) {
                // 404 Not Found: Show specific toast
                toast.error("Record not found"); 

            } else if (errorMessage.startsWith('500:')) {
                // 500 Server Error: Show specific toast
                toast.error("Something went wrong, try again");
                
            } else {
                // Fallback for unexpected errors
                toast.error("An unexpected error occurred.");
            }
            // ⭐ 🛑 END OF NEW LOGIC 🛑 ⭐
            
            setIsSubmitting(false); 
        }
    };

    // --- Dynamic Class Variables (Omitted for brevity, assumed correct) ---
    const isDark = theme === 'dark';
    const formBg = isDark ? 'bg-gray-800' : 'bg-white';
    const headerBg = isDark ? 'bg-gray-700' : 'bg-gray-100';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const inputClass = clsx(
        "py-2 px-3 border rounded-lg shadow-inner w-full text-sm",
        isDark ? 
            'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 
            'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    );

    // Consolidated Loading State
    if (isSalesLoading || !originalSale || !currentSale) {
        if (!isSalesLoading && !originalSale) {
            return null; 
        }
        return <div className="min-h-screen flex items-center justify-center text-2xl text-indigo-500">Loading Sale Data...</div>;
    }

    // Error State: If data is loaded but the associated medicine cannot be found 
    if (!currentMedicine) {
         return <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-900 text-center">
            <div className="text-xl text-red-500 p-6 border-2 border-red-500 rounded-lg shadow-xl">
                 🔴 Error: Medicine **{currentSale?.medicineName || 'Unknown'}** not found in the catalog. Cannot ensure correct stock update.
            </div>
         </div>;
    }
    
    // Calculate theoretical remaining stock for display purposes
    const quantityDifference = currentSale.quantity - originalSale.quantity;
    const theoreticalRemainingStock = currentMedicine.stock - quantityDifference;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
            <div className={clsx("w-full max-w-xl rounded-xl shadow-2xl transform transition-all", formBg)}>
                
                {/* Header */}
                <div className={clsx("p-4 border-b rounded-t-xl flex justify-between items-center", headerBg)}>
                    <h2 className={clsx("text-xl font-bold text-blue-600 dark:text-blue-400", textPrimary)}>
                        ✏️ Edit Sale Transaction (ID: {currentSale.id})
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        
                        {/* Static Medicine Info & Stock Check */}
                        <div className="bg-indigo-50 dark:bg-gray-700 p-3 rounded-lg border border-indigo-200 dark:border-gray-600">
                            <h3 className={clsx("text-lg font-bold mb-1", textPrimary)}>{currentSale.medicineName}</h3>
                            <p className={clsx("text-sm", isDark ? 'text-gray-300' : 'text-gray-600')}>
                                Current Available Stock: **{currentMedicine.stock}**
                            </p>
                            <p className={clsx("text-sm font-semibold", theoreticalRemainingStock < 0 ? 'text-red-500' : (isDark ? 'text-blue-300' : 'text-blue-700'))}>
                                Theoretical Remaining Stock After Edit: **{theoreticalRemainingStock}**
                            </p>
                            {theoreticalRemainingStock < 0 && (
                                <p className="text-sm font-bold text-red-600 mt-1">
                                    🛑 Warning: This quantity change will result in negative stock. Please reduce the quantity.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            
                            {/* 1. Quantity Sold (Editable) */}
                            <div>
                                <label htmlFor="quantity" className={clsx("block text-sm font-medium mb-1", textPrimary)}>Quantity Sold *</label>
                                <input 
                                    id="quantity"
                                    name="quantity"
                                    type="number" 
                                    value={currentSale.quantity.toString()} 
                                    onChange={handleChange}
                                    min="1"
                                    className={inputClass}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 2. Selling Price (Editable) */}
                            <div>
                                <label htmlFor="sellingPrice" className={clsx("block text-sm font-medium mb-1", textPrimary)}>Unit Selling Price ($) *</label>
                                <input 
                                    id="sellingPrice"
                                    name="sellingPrice"
                                    type="number" 
                                    value={currentSale.sellingPrice.toString()} 
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0.01"
                                    className={inputClass}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 3. Sale Date */}
                            <div>
                                <label htmlFor="saleDate" className={clsx("block text-sm font-medium mb-1", textPrimary)}>Sale Date *</label>
                                <input 
                                    id="saleDate"
                                    name="saleDate"
                                    type="date" 
                                    value={currentSale.saleDate}
                                    onChange={handleChange}
                                    max={new Date().toISOString().substring(0, 10)} 
                                    className={inputClass}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* 4. Customer Name */}
                            <div>
                                <label htmlFor="customerName" className={clsx("block text-sm font-medium mb-1", textPrimary)}>Customer Name (Optional)</label>
                                <input 
                                    id="customerName"
                                    name="customerName"
                                    type="text" 
                                    value={currentSale.customerName}
                                    onChange={handleChange}
                                    placeholder="Cash Sale or Customer Name"
                                    className={inputClass}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        
                        {/* Total Amount Display */}
                        <div className="text-center pt-4 pb-2">
                            <div className={clsx("text-sm font-medium", textPrimary)}>UPDATED TOTAL SALE AMOUNT</div>
                            <div className="bg-green-600 text-white font-extrabold text-3xl py-3 rounded-lg mt-1 shadow-lg">
                                **${currentSale.totalAmount.toFixed(2)}**
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer Buttons */}
                    <div className={clsx("p-4 border-t flex justify-end space-x-3", headerBg)}>
                        <button 
                            type="button" 
                            onClick={() => router.push('/sales')}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-150"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400"
                            // Disable if submitting OR if the change would result in negative stock
                            disabled={isSubmitting || theoreticalRemainingStock < 0}
                        >
                            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// #######################################################
// 2. MAIN PAGE WRAPPER (DEFAULT EXPORT)
// #######################################################
export default function EditSalePageWrapper() {
    return (
        <ThemeProvider>
            <SalesProvider> 
                <ToastProviderWrapper>
                    <EditSalePageCore /> 
                </ToastProviderWrapper>
            </SalesProvider>
        </ThemeProvider>
    );
}