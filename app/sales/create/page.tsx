'use client'
import React, { useState, useMemo, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// === CONTEXT IMPORTS ===
import { useSales, SalesProvider } from '../salescontext'; 

// === DATA PATHS ===
import { Medicine } from '../../lib/medicine-data'; 
import { Sale } from '../../lib/sales-type'; 

// === LOCAL TYPE DEFINITIONS ===
type NewSaleDataComplete = Omit<Sale, 'id'>;

// --- SHARED UTILITIES AND THEME CONTEXT (RETAINED AS IS) ---
const useToast = () => ({ 
    success: (msg: string) => { console.log(`SUCCESS: ${msg}`); alert(`Success: ${msg}`); },
    error: (msg: string) => { console.error(`ERROR: ${msg}`); alert(`Error: ${msg}`); } 
});
const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg'; 
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';         

interface ThemeContextType { theme: 'light' | 'dark'; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const ThemeProviderInternal = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light'); 
    const toggleTheme = useCallback(() => setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light')), []);
    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) { 
    return { theme: 'light', toggleTheme: () => {} } as ThemeContextType; 
  }
  return context;
};

// --- ICONS ---
const createIcon = (iconContent: React.ReactNode) => {
    const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{iconContent}</svg>
    );
    IconComponent.displayName = 'SvgIcon'; 
    return IconComponent;
};
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>)(props);
const SunIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path d="M12 2V3M12 21v1M21 12h-1M3 12h-1M18.36 5.64l-1.06 1.06M6.34 17.66l-1.06 1.06M17.66 17.66l-1.06-1.06M5.64 5.64l-1.06 1.06M12 7a5 5 0 100 10 5 5 0 000-10z"/>)(props);
const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>)(props);


// --- CREATE SALE FORM CORE COMPONENT ---
const CreateSaleForm = () => {
    const router = useRouter();
    const toast = useToast(); 
    const { theme, toggleTheme } = useTheme();

    // Destructure medicines and addSale from context
    const { addSale, medicines } = useSales(); 
    
    // --- STATE ---
    const [selectedMedicineName, setSelectedMedicineName] = useState(''); 
    const [quantity, setQuantity] = useState('0'); 
    const [customerName, setCustomerName] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().substring(0, 10));
    const [unitPrice, setUnitPrice] = useState('0.00'); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- CALCULATIONS ---
    const fixedBackgroundStyle = useMemo(() => ({
        backgroundImage: `url(${theme === 'dark' ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }), [theme]);

    const totalAmount = useMemo(() => {
        const q = parseFloat(quantity) || 0; 
        const p = parseFloat(unitPrice) || 0;
        return (q * p).toFixed(2);
    }, [quantity, unitPrice]);

    const currentMedicine = useMemo(() => 
        medicines.find(m => m.name === selectedMedicineName), 
    [medicines, selectedMedicineName]);
    
    const currentMedicineId = currentMedicine?.id;
    const currentStock = currentMedicine?.stock || 0; 
    
    // --- INITIALIZE SELECTION (Updated useEffect) ---
    useEffect(() => {
        // Only run if medicines are loaded AND no medicine is currently selected
        if (!selectedMedicineName && medicines.length > 0) {
            const firstMed = medicines[0];
            setSelectedMedicineName(firstMed.name);
            setUnitPrice(firstMed.sellingPrice.toFixed(2)); 
        }
    }, [medicines, selectedMedicineName]); 
    
    // --- HANDLERS ---
    const handleMedicineChange = (name: string) => {
        setSelectedMedicineName(name);
        setQuantity('0'); 
        const med = medicines.find(m => m.name === name);
        if (med) {
            // Automatically set the unit price based on selection
            setUnitPrice(med.sellingPrice.toFixed(2)); 
        } else {
            setUnitPrice('0.00');
        }
    };
    
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const num = parseInt(rawValue, 10);
        
        // Basic input sanitization
        if (rawValue === '' || isNaN(num) || num < 0) {
            setQuantity('0'); 
            return;
        }
        
        setQuantity(rawValue); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const q = parseFloat(quantity);
        const calculatedTotal = parseFloat(totalAmount); 
        
        // 1. CRITICAL STOCK CHECK (Final verification) - Client side pre-check
        if (q > currentStock) {
            toast.error(`Sale quantity (${q}) exceeds current stock (${currentStock}). Please reduce the quantity.`);
            return; 
        }

        // 2. Final required field validation - Client side pre-check
        if (!selectedMedicineName || q <= 0 || calculatedTotal <= 0) { 
            // NOTE: This triggers the toast BEFORE the mutation, preventing a 400 simulation
            // For robust error handling, a form library would be better, but we stick to the toast for now.
            toast.error('Required: Medicine, Quantity (positive), and Selling Price (positive).'); 
            return; 
        }
        
        if (!currentMedicineId) {
             toast.error('Cannot find Medicine ID required for sale record.');
             return;
        }

        setIsSubmitting(true);

        const completeNewSaleData: NewSaleDataComplete = {
            medicineName: selectedMedicineName,
            quantity: q,
            sellingPrice: parseFloat(unitPrice),
            saleDate: saleDate,
            customerName: customerName || 'Cash Sale',
            totalAmount: calculatedTotal, 
        };

        try {
            // 3. Call the React Query mutation wrapper function (addSale)
            const createdSale = await addSale(completeNewSaleData); 
            
            // 4. Show toast via redirect
            const message = encodeURIComponent(`Sale recorded successfully! ID: ${createdSale.id}. Stock updated.`);
            router.push(`/sales?status=success&message=${message}`); 
            
        } catch (error) {
            
            // ⭐ 🛑 NEW: ERROR PARSING LOGIC 🛑 ⭐
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Sale Submission Error:", errorMessage);

            if (errorMessage.startsWith('400:')) {
                // 400 Validation Error: Show INLINE errors (using toast as a fallback)
                // The client-side checks above already handle the core validation, but this catches
                // any remaining 400 errors from the context (e.g., negative price if a user bypassed client JS).
                toast.error("Validation failed: Please ensure all inputs are correct."); 

            } else if (errorMessage.startsWith('500:')) {
                // 500 Server Error: Show specific toast
                toast.error("Something went wrong, try again");
                
            } else {
                // Fallback for unexpected errors
                toast.error("An unexpected error occurred.");
            }
            // ⭐ 🛑 END OF NEW LOGIC 🛑 ⭐

        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERING FORM (Retained UI) ---
    const overlayColor = theme === 'dark' ? DARK_OVERLAY : LIGHT_OVERLAY; 
    
    const isQuantityOverStock = parseFloat(quantity) > currentStock;
    const isQuantityValid = parseFloat(quantity) > 0;
    
    // Disable if submitting OR required fields are missing OR stock is exceeded
    const shouldDisableSubmit = isSubmitting || !selectedMedicineName || !isQuantityValid || isQuantityOverStock || !currentMedicineId;

    return (
        <div 
            className={clsx("min-h-screen flex flex-col items-center p-4 sm:p-8 relative",
                theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100')}
        >
            <div 
                className="fixed inset-0 w-full h-full z-0" 
                style={fixedBackgroundStyle} 
            />
            
            <button 
                onClick={toggleTheme} 
                className="fixed top-6 right-6 p-3 rounded-full text-xl z-20 bg-white dark:bg-gray-700 shadow-lg text-indigo-600 dark:text-yellow-400 hover:scale-110 transition-transform duration-200 ease-in-out" 
                aria-label="Toggle dark/light mode"
            >
                {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
            
            <div 
                className="max-w-xl w-full p-8 rounded-xl shadow-2xl z-10"
                style={{ backgroundColor: overlayColor }}
            >
                <button 
                    onClick={() => router.push('/sales')}
                    className="mb-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition duration-150"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-1"/> Back to Sales List
                </button>
                
                <h1 className="text-3xl font-bold mb-6 border-b pb-2 text-indigo-800 dark:text-indigo-200 border-gray-400 dark:border-gray-600">
                    ✍️ Create New Sale
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Medicine Selection (Dropdown) */}
                    <div>
                        <label htmlFor="medicine" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Medicine *
                        </label>
                        <select 
                            id="medicine"
                            value={selectedMedicineName}
                            onChange={(e) => handleMedicineChange(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            <option value="" disabled>Select a medicine</option>
                            {medicines.map((m, index) => (
                                // NOTE: Using m.name as value is fine for lookup, but using a unique ID is safer in a real app.
                                <option key={m.id || index} value={m.name} className="text-gray-900 dark:text-white">
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Current Stock: **{currentStock}** units
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 2. Unit Price (Read-only/Defaulted) */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Unit Price
                            </label>
                            <input 
                                id="price"
                                type="text" 
                                value={`$${unitPrice}`} 
                                readOnly
                                className="w-full p-3 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-not-allowed font-semibold"
                            />
                        </div>

                        {/* 3. Quantity (Number) */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Quantity *
                            </label>
                            <input 
                                id="quantity"
                                type="number" 
                                value={quantity} 
                                onChange={handleQuantityChange}
                                min="1"
                                placeholder="Enter quantity (positive integer)"
                                className={clsx(
                                    "w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                                    isQuantityOverStock && "border-red-500 focus:border-red-500 focus:ring-red-500"
                                )}
                                required
                            />
                            {isQuantityOverStock && (
                                <p className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">
                                    ⚠️ Quantity exceeds current stock! Max allowed: {currentStock}.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 4. Sale Date (Date) */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Sale Date *
                            </label>
                            <input 
                                id="date"
                                type="date" 
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                                max={new Date().toISOString().substring(0, 10)} 
                                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>

                        {/* 5. Customer Name (Text) */}
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Customer Name (Optional)
                            </label>
                            <input 
                                id="customer"
                                type="text" 
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g., John Doe or Cash Sale"
                                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                    
                    {/* Total Amount Display */}
                    <div className="text-center pt-4 pb-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">TOTAL SALE AMOUNT</div>
                        <div className="bg-indigo-700 text-white font-extrabold text-4xl py-4 rounded-lg mt-1 shadow-lg">
                            **${totalAmount}**
                        </div>
                    </div>

                    {/* Button Group (Cancel and Submit) */}
                    <div className="flex space-x-4 pt-6">
                        <button
                            type="button" 
                            onClick={() => router.push('/sales')}
                            className="flex-1 py-3 bg-gray-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-gray-600 transition duration-200"
                        >
                            ❌ Cancel
                        </button>
                        
                        <button 
                            type="submit" 
                            disabled={shouldDisableSubmit}
                            className="flex-1 py-3 bg-green-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Recording Sale...' : '✅ Record Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- DEFAULT EXPORT WRAPPER ---
export default function CreateSalePage() {
    return (
        <ThemeProviderInternal>
            <SalesProvider> 
                <CreateSaleForm />
            </SalesProvider>
        </ThemeProviderInternal>
    );
}