// --- app/purchases/create/page.tsx (FINAL VERSION - Using Imported Services) ---
'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------
// 1. IMPORTED SERVICES, CONSTANTS, & INTERFACES
// ---------------------------------------------------------------------

// Import services for data fetching
import { Medicine, MedicineService } from '@/app/lib/medicine-service'; // Assuming Medicine type is exported here
import { Supplier, SupplierService } from '@/app/lib/supplier-service'; // Assuming Supplier type is exported here
// Import constants and utilities
import { 
    Icons, clsx, KIBRAN_COLOR, KIBRAN_COLOR_LIGHT, 
    DARK_OVERLAY, LIGHT_OVERLAY, LIGHT_MODE_BACKGROUND_IMAGE, DARK_MODE_BACKGROUND_IMAGE 
} from '@/app/lib/constants';
import { MockPurchaseService } from '@/app/lib/purchase-service'; // Contains createPurchase

// --- INTERFACES & INITIAL STATE (As provided by user) ---

interface PurchaseFormData {
    medicineId: string;
    supplierId: string;
    quantity: string;
    purchasePrice: string;
    purchaseDate: string;
}

interface FormErrors {
    medicineId?: string;
    supplierId?: string;
    quantity?: string;
    purchasePrice?: string;
    purchaseDate?: string;
}

const getTodayDate = () => new Date().toISOString().substring(0, 10);

export const initialNewPurchase: PurchaseFormData = {
    medicineId: '',
    supplierId: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: getTodayDate(),
}

// ---------------------------------------------------------------------
// 2. Toast Component & Logic
// ---------------------------------------------------------------------

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const Icon = type === 'success' ? Icons.CheckCircle : Icons.AlertTriangle;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={clsx("fixed bottom-5 right-5 p-4 rounded-xl shadow-xl text-white z-50 transition-transform duration-300", color)}>
            <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5" />
                <span>{message}</span>
                <button onClick={onClose} className="ml-4 font-bold opacity-80 hover:opacity-100 text-lg">×</button>
            </div>
        </div>
    );
};


const CreatePurchasePage = () => {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const [formData, setFormData] = useState<PurchaseFormData>(initialNewPurchase);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    // State to hold data loaded from services
    const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);


    // --- Data Calculation (Memoized Total) ---
    const calculatedTotal = useMemo(() => {
        const qty = parseFloat(formData.quantity) || 0;
        const price = parseFloat(formData.purchasePrice) || 0;
        return qty * price;
    }, [formData.quantity, formData.purchasePrice]);
    

    // --- Data Fetching (Using Imported Services) ---
    useEffect(() => {
        const loadDropdownData = () => {
            try {
                // Fetch data from the services
                const medicines = MedicineService.getAllMedicines();
                const suppliers = SupplierService.getAllSuppliers();
                
                setAllMedicines(medicines);
                setAllSuppliers(suppliers);
                
                // Set initial selection to the first item (optional convenience)
                setFormData(prev => ({ 
                    ...prev, 
                    medicineId: medicines.length > 0 ? medicines[0].id.toString() : '',
                    supplierId: suppliers.length > 0 ? suppliers[0].id.toString() : '',
                }));

            } catch (error) {
                console.error("Failed to fetch dropdown data:", error);
                setToast({ message: "Failed to load initial data.", type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        // Determine theme
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }

        loadDropdownData();
    }, []);

    const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (toast) setToast(null); 
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // --- Validation Logic ---
    const validate = (): boolean => {
        let newErrors: FormErrors = {};
        let isValid = true;

        if (!formData.medicineId) { newErrors.medicineId = "Medicine is required."; isValid = false; }
        if (!formData.supplierId) { newErrors.supplierId = "Supplier is required."; isValid = false; }

        const quantity = parseFloat(formData.quantity);
        if (isNaN(quantity) || quantity <= 0) { newErrors.quantity = "Quantity must be a positive number (min 1)."; isValid = false; }

        const price = parseFloat(formData.purchasePrice);
        if (isNaN(price) || price <= 0.0) { newErrors.purchasePrice = "Price must be a positive number (min $0.01)."; isValid = false; }
        
        if (!formData.purchaseDate) { newErrors.purchaseDate = "Purchase Date is required."; isValid = false; }

        setErrors(newErrors);
        return isValid;
    };


    // --- Submission Logic (Using Imported MockPurchaseService) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setToast(null); 

        if (!validate()) {
            setToast({ message: "Please correct the errors in the form.", type: 'error' });
            return;
        }

        setIsSubmitting(true);
        
        // MOCK: Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            // ✅ Calls POST /api/purchases (via MockPurchaseService)
            MockPurchaseService.createPurchase(formData as any);
            
            // ✅ Displays toast: “Purchase recorded successfully”
            setToast({ message: "Purchase recorded successfully", type: 'success' });
            
            // ✅ Redirects back to /purchases
            setTimeout(() => {
                router.push('/purchases');
            }, 1000); 
            
        } catch (error) {
            setToast({ message: "Failed to record purchase. Please try again.", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Styles ---
    const cardClass = clsx("p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative z-20 mt-8 mb-8", isDarkMode ? 'bg-slate-800' : 'bg-white');
    const labelClass = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-700');
    const inputSelectClass = clsx("w-full p-3 border rounded-lg focus:ring-2 transition-colors appearance-none",
        isDarkMode
            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500'
            : 'bg-gray-50 border-gray-300 text-slate-800 placeholder-gray-500 focus:ring-blue-700'
    );
    const errorClass = "text-red-500 text-xs mt-1 italic";

    if (isLoading) {
        return (
            <div className={clsx("min-h-screen flex items-center justify-center", isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800')}>
                <p>Loading dropdown data...</p>
            </div>
        );
    }

    // ---------------------------------------------------------------------
    // 4. Render Block
    // ---------------------------------------------------------------------

    return (
        <div 
            className={clsx("min-h-screen flex flex-col p-8 transition-colors duration-700 relative z-0",
                isDarkMode ? 'bg-slate-900' : 'bg-white')}
            style={{ 
                backgroundImage: LIGHT_MODE_BACKGROUND_IMAGE || DARK_MODE_BACKGROUND_IMAGE ? `url(${isDarkMode ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'multiply', 
                backgroundColor: isDarkMode ? DARK_OVERLAY : LIGHT_OVERLAY
            }}
        >
            <div className="absolute inset-0 z-10"></div>
            
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={clsx(`fixed top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50 hover:scale-105 active:scale-95`,
                    isDarkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-white text-blue-700 hover:bg-slate-200'
                )}
                style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}
                aria-label="Toggle dark and light mode"
                disabled={isSubmitting}
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>

            <div className="relative z-20 max-w-7xl mx-auto w-full">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/purchases')}
                    className={clsx("flex items-center space-x-2 mb-6 p-2 rounded-lg transition-colors font-semibold", 
                        isDarkMode ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-700 hover:bg-blue-50'
                    )}
                    disabled={isSubmitting}
                >
                    <Icons.ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to Purchase List</span>
                </button>

                <div className={cardClass}>
                    <h1 className={clsx("text-3xl font-extrabold mb-6 text-center", isDarkMode ? 'text-blue-400' : 'text-indigo-800')}>
                        Record New Purchase
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Medicine Selection (Populated by MedicineService) */}
                        <div className="relative">
                            <label htmlFor="medicineId" className={labelClass}>Medicine Name <span className="text-red-500">*</span></label>
                            <select 
                                id="medicineId" 
                                name="medicineId" 
                                value={formData.medicineId} 
                                onChange={handleChange} 
                                className={clsx(inputSelectClass, errors.medicineId ? 'border-red-500' : '')}
                                disabled={isSubmitting}
                            >
                                <option value="">Select Medicine</option>
                                {allMedicines.map((med: any) => (<option key={med.id} value={med.id}>{med.name} ({med.unit || 'Unit'})</option>))}
                            </select>
                            <Icons.ArrowLeftIcon className={clsx("absolute right-3 top-[2.3rem] transform rotate-[-90deg] w-4 h-4 pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                            {errors.medicineId && <p className={errorClass}>{errors.medicineId}</p>}
                        </div>

                        {/* Supplier Selection (Populated by SupplierService) */}
                        <div className="relative">
                            <label htmlFor="supplierId" className={labelClass}>Supplier <span className="text-red-500">*</span></label>
                            <select 
                                id="supplierId" 
                                name="supplierId" 
                                value={formData.supplierId} 
                                onChange={handleChange} 
                                className={clsx(inputSelectClass, errors.supplierId ? 'border-red-500' : '')}
                                disabled={isSubmitting}
                            >
                                <option value="">Select Supplier</option>
                                {allSuppliers.map((sup: any) => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
                            </select>
                            <Icons.ArrowLeftIcon className={clsx("absolute right-3 top-[2.3rem] transform rotate-[-90deg] w-4 h-4 pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                            {errors.supplierId && <p className={errorClass}>{errors.supplierId}</p>}
                        </div>
                        
                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className={labelClass}>Quantity <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                id="quantity" 
                                name="quantity" 
                                placeholder="Enter quantity received (min 1)"
                                value={formData.quantity}
                                onChange={handleChange} 
                                className={clsx(inputSelectClass, errors.quantity ? 'border-red-500' : '')}
                                min="1"
                                step="any"
                                disabled={isSubmitting}
                            />
                            {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
                        </div>

                        {/* Purchase Price (Cost per Unit) */}
                        <div>
                            <label htmlFor="purchasePrice" className={labelClass}>Purchase Price (Per Unit) <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                id="purchasePrice" 
                                name="purchasePrice" 
                                placeholder="Enter cost per unit (min $0.01)"
                                value={formData.purchasePrice}
                                onChange={handleChange} 
                                className={clsx(inputSelectClass, errors.purchasePrice ? 'border-red-500' : '')}
                                step="0.01"
                                min="0.01"
                                disabled={isSubmitting}
                            />
                            {errors.purchasePrice && <p className={errorClass}>{errors.purchasePrice}</p>}
                        </div>
                        
                        {/* Purchase Date */}
                        <div>
                            <label htmlFor="purchaseDate" className={labelClass}>Purchase Date <span className="text-red-500">*</span></label>
                            <input 
                                type="date" 
                                id="purchaseDate" 
                                name="purchaseDate" 
                                value={formData.purchaseDate}
                                onChange={handleChange} 
                                className={clsx(inputSelectClass, errors.purchaseDate ? 'border-red-500' : '')}
                                disabled={isSubmitting}
                                max={getTodayDate()}
                            />
                            {errors.purchaseDate && <p className={errorClass}>{errors.purchaseDate}</p>}
                        </div>

                        {/* Calculated Total */}
                        <div className={clsx("p-4 rounded-xl font-extrabold text-center text-xl shadow-inner", isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800')}>
                            TOTAL COST: **${calculatedTotal.toFixed(2)}**
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 pt-2">
                            <button
                                type="button"
                                onClick={() => router.push('/purchases')}
                                className={clsx("w-full py-3 rounded-xl font-bold transition duration-300 shadow-md border", isDarkMode ? 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300')}
                                disabled={isSubmitting}
                            >
                                ❌ Cancel
                            </button>
                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl font-bold text-white transition duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] flex items-center justify-center space-x-2"
                                style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>✅ Save Purchase</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Toast Notification (Visual Display) */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CreatePurchasePage;