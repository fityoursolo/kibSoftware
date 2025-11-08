// --- app/purchases/[id]/edit/page.tsx ---
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Import useRouter to navigate, and useParams to read the dynamic ID from the URL
import { useRouter, useParams } from 'next/navigation';

// Import services for data fetching
import { Medicine, MedicineService } from '@/app/lib/medicine-service';
import { Supplier, SupplierService } from '@/app/lib/supplier-service';
import { MockPurchaseService } from '@/app/lib/purchase-service'; 

// Import constants and utilities
import { 
    Icons, clsx, KIBRAN_COLOR, KIBRAN_COLOR_LIGHT, 
    DARK_OVERLAY, LIGHT_OVERLAY, LIGHT_MODE_BACKGROUND_IMAGE, DARK_MODE_BACKGROUND_IMAGE, 
    Purchase, PurchaseData
} from '@/app/lib/constants'; // Assuming Purchase and PurchaseData are in constants.ts

// --- INTERFACES & INITIAL STATE ---

// Use the existing PurchaseData structure for the form state
interface PurchaseFormData extends PurchaseData {}

interface FormErrors {
    medicineId?: string;
    supplierId?: string;
    quantity?: string;
    purchasePrice?: string;
    purchaseDate?: string;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialFormData: PurchaseFormData = {
    medicineId: 0, // Must be 0 or null initially
    supplierId: 0, // Must be 0 or null initially
    quantity: '',
    purchasePrice: '',
    purchaseDate: getTodayDate(),
};


// --- EditPurchasePage Component ---

const EditPurchasePage = () => {
    const router = useRouter();
    // Get the ID from the URL, which will be a string
    const params = useParams();
    const purchaseId = params.id ? parseInt(params.id as string) : null;

    const [formData, setFormData] = useState<PurchaseFormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // --- Data Fetching (Uses Services) ---
    useEffect(() => {
        if (!purchaseId) {
            alert("Invalid Purchase ID.");
            router.push('/purchases');
            return;
        }

        const loadData = () => {
            try {
                // 1. Fetch dropdown data (Medicines and Suppliers)
                const medicines = MedicineService.getAllMedicines();
                const suppliers = SupplierService.getAllSuppliers();
                
                setAllMedicines(medicines);
                setAllSuppliers(suppliers);
                
                // 2. Fetch the specific Purchase to edit
                const existingPurchase = MockPurchaseService.getPurchaseById(purchaseId);

                if (!existingPurchase) {
                    alert(`Purchase with ID ${purchaseId} not found.`);
                    router.push('/purchases');
                    return;
                }

                // 3. Set form data from the existing purchase
                setFormData({
                    medicineId: existingPurchase.medicineId,
                    supplierId: existingPurchase.supplierId,
                    quantity: existingPurchase.quantity.toString(),
                    purchasePrice: existingPurchase.purchasePrice.toString(),
                    // Ensure the date is in YYYY-MM-DD format
                    purchaseDate: existingPurchase.purchaseDate,
                });

            } catch (error) {
                console.error("Failed to fetch data for edit:", error);
                alert("Failed to load purchase details for editing.");
            } finally {
                setIsLoading(false);
            }
        };

        // Determine theme
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }

        loadData();
    }, [purchaseId, router]);


    // --- Calculation ---
    const totalCost = useMemo(() => {
        const qty = parseFloat(formData.quantity);
        const price = parseFloat(formData.purchasePrice);
        if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
            return 0.00;
        }
        return qty * price;
    }, [formData.quantity, formData.purchasePrice]);

    // --- Handlers ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // For select inputs (medicineId, supplierId), convert string value to number
        const val = (name === 'medicineId' || name === 'supplierId') ? parseInt(value) : value;

        setFormData(prev => ({ ...prev, [name]: val }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }, []);

    const validateForm = (data: PurchaseFormData): FormErrors => {
        const newErrors: FormErrors = {};

        // Convert data types for validation
        const medicineId = data.medicineId;
        const supplierId = data.supplierId;
        const quantity = parseFloat(data.quantity.toString());
        const price = parseFloat(data.purchasePrice.toString());
        
        if (!medicineId) newErrors.medicineId = "Medicine is required.";
        if (!supplierId) newErrors.supplierId = "Supplier is required.";
        if (!data.purchaseDate) newErrors.purchaseDate = "Purchase date is required.";

        if (!data.quantity) {
             newErrors.quantity = "Quantity is required.";
        } else if (isNaN(quantity) || quantity <= 0) {
            newErrors.quantity = "Quantity must be a positive number (min 1).";
        }
        
        if (!data.purchasePrice) {
            newErrors.purchasePrice = "Purchase price is required.";
        } else if (isNaN(price) || price <= 0.01) {
            newErrors.purchasePrice = "Price must be a positive number (min 0.01).";
        }

        return newErrors;
    };

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure ID is available
        if (!purchaseId) return;

        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            alert("Please correct the errors in the form.");
            return;
        }
        
        // Prepare data for the service call (ensure types are correct)
        const updatedPurchaseData: PurchaseData = {
            medicineId: formData.medicineId as number, // Should be number
            supplierId: formData.supplierId as number, // Should be number
            quantity: parseFloat(formData.quantity.toString()),
            purchasePrice: parseFloat(formData.purchasePrice.toString()),
            purchaseDate: formData.purchaseDate,
        };

        // --- Simulated API Call (PUT /api/purchases/:id) ---
        try {
            // Call the update service method
            MockPurchaseService.updatePurchase(purchaseId, updatedPurchaseData); 

            // Success feedback and redirection
            alert('✅ Purchase updated successfully! Stock was automatically adjusted.');
            router.push('/purchases'); 
        } catch (error) {
            console.error("Purchase update failed:", error);
            alert("❌ Failed to update purchase. Please check the console for details.");
        }

    }, [formData, purchaseId, router]);

    const handleCancel = useCallback(() => {
        router.push('/purchases');
    }, [router]);
    
    // --- Utility Classes (Same as CreatePurchasePage) ---
    const pageContainerClass = clsx("min-h-screen flex items-start justify-center p-8 transition-colors duration-700 relative z-0",
        isDarkMode ? 'bg-slate-900' : 'bg-white');
    const formPanelClass = clsx("w-full max-w-4xl p-8 rounded-2xl shadow-2xl relative z-20 mt-10",
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200');
    const inputClass = clsx("w-full p-3 border rounded-lg focus:ring-2 transition-colors",
        isDarkMode
            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500'
            : 'bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-700');
    const labelClass = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-blue-300' : 'text-slate-700');
    // Error class positioned for inputs in a relative container
    const errorClass = "text-red-500 text-xs mt-1 absolute bottom-[-1.2rem] left-0"; 
    
    if (isLoading) {
        return (
            <div className={pageContainerClass}>
                <p className={clsx("text-lg", isDarkMode ? 'text-gray-300' : 'text-slate-700')}>Loading purchase details...</p>
            </div>
        );
    }
    
    return (
        <div 
            className={pageContainerClass}
            style={{ 
                backgroundImage: `url(${isDarkMode ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'multiply', 
                backgroundColor: isDarkMode ? DARK_OVERLAY : LIGHT_OVERLAY
            }}
        >
            <div className="absolute inset-0 z-10"></div>
            
            <div className={formPanelClass}>
                <h1 className={clsx("text-3xl font-bold mb-6 text-center", isDarkMode ? 'text-blue-500' : 'text-indigo-800')}>
                    Update Purchase #{purchaseId}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                        
                        {/* 1. Medicine Dropdown */}
                        <div className="relative">
                            <label htmlFor="medicineId" className={labelClass}>Medicine *</label>
                            <select
                                id="medicineId"
                                name="medicineId"
                                // Ensure value is cast to string for the select element
                                value={formData.medicineId.toString()} 
                                onChange={handleChange}
                                className={clsx(inputClass, 'appearance-none cursor-pointer', errors.medicineId && 'border-red-500')}
                                required
                            >
                                <option value="" disabled>Select a medicine</option>
                                {allMedicines.map(med => (
                                    <option key={med.id} value={med.id}>
                                        {med.name} (Stock: {med.stock})
                                    </option>
                                ))}
                            </select>
                            <Icons.ArrowDownIcon className={clsx("absolute right-3 top-1/2 mt-1 w-5 h-5 pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                            {errors.medicineId && <p className={errorClass}>{errors.medicineId}</p>}
                        </div>

                        {/* 2. Supplier Dropdown */}
                        <div className="relative">
                            <label htmlFor="supplierId" className={labelClass}>Supplier *</label>
                            <select
                                id="supplierId"
                                name="supplierId"
                                // Ensure value is cast to string for the select element
                                value={formData.supplierId.toString()} 
                                onChange={handleChange}
                                className={clsx(inputClass, 'appearance-none cursor-pointer', errors.supplierId && 'border-red-500')}
                                required
                            >
                                <option value="" disabled>Select a supplier</option>
                                {allSuppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.name} ({sup.country})
                                    </option>
                                ))}
                            </select>
                            <Icons.ArrowDownIcon className={clsx("absolute right-3 top-1/2 mt-1 w-5 h-5 pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                            {errors.supplierId && <p className={errorClass}>{errors.supplierId}</p>}
                        </div>
                        
                        {/* 3. Quantity (Number) */}
                        <div className="relative">
                            <label htmlFor="quantity" className={labelClass}>Quantity * (Units)</label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                placeholder="e.g., 500"
                                value={formData.quantity}
                                onChange={handleChange}
                                className={clsx(inputClass, errors.quantity && 'border-red-500')}
                                min="1"
                                step="1"
                                required
                            />
                            {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
                        </div>
                        
                        {/* 4. Purchase Price (Number) */}
                        <div className="relative">
                            <label htmlFor="purchasePrice" className={labelClass}>Purchase Price * (Per Unit - $)</label>
                            <input
                                type="number"
                                id="purchasePrice"
                                name="purchasePrice"
                                placeholder="e.g., 0.15"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                className={clsx(inputClass, errors.purchasePrice && 'border-red-500')}
                                min="0.01"
                                step="0.01"
                                required
                            />
                            {errors.purchasePrice && <p className={errorClass}>{errors.purchasePrice}</p>}
                        </div>

                        {/* 5. Purchase Date (Date) */}
                        <div className="relative">
                            <label htmlFor="purchaseDate" className={labelClass}>Purchase Date *</label>
                            <input
                                type="date"
                                id="purchaseDate"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                className={clsx(inputClass, errors.purchaseDate && 'border-red-500')}
                                max={getTodayDate()} 
                                required
                            />
                            {errors.purchaseDate && <p className={errorClass}>{errors.purchaseDate}</p>}
                        </div>
                        
                        {/* 6. Calculated Total (Full Width) */}
                        <div className={clsx("relative md:col-span-1 p-3 rounded-lg font-bold text-center", isDarkMode ? 'bg-blue-600 text-white shadow-inner' : 'bg-blue-100 text-blue-800 shadow-sm')}>
                            <span className="text-sm font-semibold block mb-1">Calculated Total Cost:</span>
                            <span className="text-2xl">${totalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* --- Buttons --- */}
                    <div className="pt-4 flex justify-end space-x-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center space-x-2 py-3 px-6 rounded-xl font-bold text-lg transition duration-300 shadow-md hover:scale-[1.01]"
                            style={{ backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', color: isDarkMode ? 'white' : '#4B5563' }}
                        >
                            <Icons.XIcon className="w-5 h-5" />
                            <span>Cancel</span>
                        </button>
                        
                        <button
                            type="submit"
                            className="flex items-center space-x-2 py-3 px-6 rounded-xl font-bold text-white text-lg transition duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                            style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                        >
                            <Icons.CheckIcon className="w-5 h-5" />
                            <span>Update Purchase</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPurchasePage;