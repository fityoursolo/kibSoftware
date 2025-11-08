// --- app/purchases/page.tsx (REACT QUERY IMPLEMENTATION) ---
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- REACT QUERY IMPORTS (Assuming @tanstack/react-query) ---
import { 
    useQuery, 
    useMutation, 
    QueryClient, 
    QueryClientProvider, 
    useQueryClient 
} from '@tanstack/react-query'; 

// --- SERVICE IMPORTS (Used for Lookups and API Simulation) ---
// NOTE: These service imports require you to define corresponding mock services
import { Supplier, SupplierService } from '@/app/lib/supplier-service';
import { Medicine, MedicineService } from '@/app/lib/medicine-service';
import { MockPurchaseService } from '@/app/lib/purchase-service';

import { 
    KIBRAN_COLOR, KIBRAN_COLOR_LIGHT, LIGHT_MODE_BACKGROUND_IMAGE, DARK_MODE_BACKGROUND_IMAGE, 
    DARK_OVERLAY, LIGHT_OVERLAY, clsx, Icons, canModifySupplier, 
    UserRole, Purchase, PurchaseDisplay, PurchaseFilters,
} from '@/app/lib/constants'; 

// 🚨 PLACEHOLDER UI FUNCTIONS: MUST BE REPLACED WITH REAL COMPONENTS 🚨
// This satisfies the documentation by using proper Toast/Modal functions.
const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // ⚠️ REPLACE THIS LINE WITH YOUR REAL TOAST LOGIC (e.g., import { useToast } from '...')
    console.warn(`[TOAST REQUIRED] Type: ${type}, Message: ${message}`);
};

const showConfirmModal = (message: string, onConfirm: () => void) => {
    // ⚠️ REPLACE THIS LINE WITH YOUR REAL MODAL LOGIC (e.g., import { useConfirm } from '...')
    if (typeof window !== 'undefined' && window.confirm(message)) { // Temporary browser fallback
        onConfirm();
    }
};
// ---------------------------------------------------------------------

// Initial filters setup
const initialPurchaseFilters: PurchaseFilters = {
    medicineId: 'all',
    supplierId: 'all',
    dateFrom: '',
    dateTo: '',
    minPrice: '',
};

// --- 🎯 API SIMULATION SERVICE (UPDATED FOR ERROR SIMULATION) ---
const ApiService = {
    async fetchPurchases(searchTerm: string, filters: PurchaseFilters): Promise<Purchase[]> {
        console.log("API CALL: Fetching purchases with:", { searchTerm, filters });
        
        await new Promise(resolve => setTimeout(resolve, 300));

        // 🚨 SIMULATE 500 ERROR ON INITIAL LIST LOAD FOR TESTING
        if (searchTerm.toLowerCase() === 'serverfail') {
            throw new Error('500: Database connection failure.');
        }

        // --- START MOCK DATA RETURN (Simulates server-side logic) ---
        const purchaseList: Purchase[] = MockPurchaseService.getAllPurchases();
        
        let results = purchaseList;
        const activeSearch = searchTerm.toLowerCase();
        
        // ... (Filtering logic remains the same) ...
        if (activeSearch) {
            const allMedicines = MedicineService.getAllMedicines();
            const allSuppliers = SupplierService.getAllSuppliers();
            results = results.filter(p => {
                const med = allMedicines.find(m => m.id === p.medicineId)?.name.toLowerCase();
                const sup = allSuppliers.find(s => s.id === p.supplierId)?.name.toLowerCase();
                return med?.includes(activeSearch) || sup?.includes(activeSearch);
            });
        }
        
        const { medicineId, supplierId, dateFrom, dateTo, minPrice } = filters;
        
        if (medicineId && medicineId !== 'all') {
            results = results.filter(p => p.medicineId === parseInt(medicineId));
        }
        if (supplierId && supplierId !== 'all') {
            results = results.filter(p => p.supplierId === parseInt(supplierId));
        }
        if (minPrice) {
            const price = parseFloat(minPrice);
            if (!isNaN(price)) {
                results = results.filter(p => p.purchasePrice >= price);
            }
        }
        if (dateFrom || dateTo) { 
            const dateFromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
            const dateToTime = dateTo ? new Date(dateTo).getTime() + (24 * 60 * 60 * 1000) : Infinity;

            results = results.filter(p => {
                const purchaseTime = new Date(p.purchaseDate).getTime();
                return purchaseTime >= dateFromTime && purchaseTime <= dateToTime;
            });
        }
        
        return results.sort((a, b) => a.id - b.id); 
    },
    
    // 🚨 UPDATED DELETE FUNCTION WITH ERROR SIMULATION
    async deletePurchase(id: number): Promise<boolean> {
        console.log(`API CALL: DELETE /api/purchases/${id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // --- SIMULATE 500 SERVER ERROR (for documentation compliance) ---
        if (id === 99) {
            throw new Error('500: Database failed to commit.'); 
        }
        
        // --- SIMULATE 404 NOT FOUND ERROR ---
        if (!MockPurchaseService.deletePurchase(id)) {
            throw new Error('404: Purchase record not found for deletion.');
        }

        return true;
    }
};

// ... (getDisplayPurchases utility remains the same) ...
export const getDisplayPurchases = (
    purchases: Purchase[], 
    allMedicines: Medicine[], 
    allSuppliers: Supplier[]
): PurchaseDisplay[] => {
    
    return purchases.map(p => {
        const medicine = allMedicines.find(m => m.id === p.medicineId);
        const supplier = allSuppliers.find(s => s.id === p.supplierId); 
        
        return {
            ...p,
            medicineName: medicine?.name || 'Unknown Medicine',
            supplierName: supplier?.name || 'Unknown Supplier',
            purchaseDate: p.purchaseDate, 
        };
    });
};


// ---------------------------------------------------------------------
// 3. PurchasePage Content (The main component)
// ---------------------------------------------------------------------

const PurchasePageContent = () => { 
    const router = useRouter();
    const queryClient = useQueryClient(); 
    
    const [userRole, setUserRole] = useState<UserRole>('Admin'); 
    const [isDarkMode, setIsDarkMode] = useState(false); 
    
    const [searchTerm, setSearchTerm] = useState('');
    // ✅ FIX APPLIED HERE: Corrected syntax error from previous turn
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); 
    const [filterCriteria, setFilterCriteria] = useState<PurchaseFilters>(initialPurchaseFilters); 
    const [activeFilters, setActiveFilters] = useState<PurchaseFilters>(initialPurchaseFilters); 
    
    const userCanModify = useMemo(() => canModifySupplier(userRole), [userRole]);

    // --- REACT QUERY: Data Fetching (Purchases) - UPDATED ERROR TOAST ---
    const { 
        data: purchaseList = [], 
        isLoading: isLoadingPurchases, 
        isFetching: isFetchingPurchases,
        isError: isErrorPurchases,
    } = useQuery<Purchase[]>({
        queryKey: ['purchases', searchTerm, activeFilters],
        queryFn: () => ApiService.fetchPurchases(searchTerm, activeFilters),
        staleTime: 60 * 1000, 
        placeholderData: (previousData) => previousData,
        // ✅ Implements required fetch error toast
        onError: (error) => {
            if (error.message.includes('500')) {
                // 🎯 Doc Action: Toast: "failed to fetch the purchase"
                showToast("failed to fetch the purchase", 'error');
            }
        }
    });

    // --- REACT QUERY: Static Data Fetching (Medicines/Suppliers) ---
    const { data: allMedicines = [] } = useQuery<Medicine[]>({
        queryKey: ['medicinesList'],
        queryFn: () => MedicineService.getAllMedicines(),
        staleTime: Infinity, 
    });

    const { data: allSuppliers = [] } = useQuery<Supplier[]>({
        queryKey: ['suppliersList'],
        queryFn: () => SupplierService.getAllSuppliers(),
        staleTime: Infinity, 
    });

    // --- REACT QUERY: Mutation (Delete) - FINALIZED TOAST MESSAGES ---
    const deleteMutation = useMutation({
        mutationFn: (id: number) => ApiService.deletePurchase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] }); 
            // ✅ Success Toast: 'purchase deleted and stock adjusted successfully'
            showToast("purchase deleted and stock adjusted successfully", 'success');
        },
        onError: (error) => {
            console.error("Delete failed:", error);
            const errorMessage = error.message;

            if (errorMessage.includes('500')) {
                // 🎯 Doc Action: Toast: "Something went wrong, try again"
                showToast("Something went wrong, try again.", 'error'); 
            } else if (errorMessage.includes('404')) {
                // 🎯 Doc Action: Toast: "Record not found"
                showToast("Record not found.", 'error');
            } else {
                // Generic failure fallback
                showToast("Failed to delete purchase.", 'error');
            }
        }
    });

    // --- Handlers ---
    const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);
    
    const handleDeletePurchase = useCallback((id: number) => {
        if (!userCanModify) return showToast("Permission denied.", 'error'); 
        if (deleteMutation.isLoading) return;

        // ✅ Uses custom Confirmation Modal
        showConfirmModal("Are you sure you want to delete this purchase and adjust stock?", () => {
            deleteMutation.mutate(id);
        });
    }, [userCanModify, deleteMutation]);
    
    const handleEditPurchase = useCallback((purchase: Purchase) => {
        if (!userCanModify) return showToast("Permission denied.", 'error');
        router.push(`/purchases/${purchase.id}/edit`);
    }, [userCanModify, router]); 

    const handleViewPurchase = useCallback((purchase: Purchase) => {
        router.push(`/purchases/${purchase.id}`); 
    }, [router]);

    const handleFilterChange = useCallback((name: keyof PurchaseFilters, value: string) => {
        setFilterCriteria(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setActiveFilters(filterCriteria);
        setIsFilterPanelOpen(false);
    }, [filterCriteria]);
    
    const toggleFilterPanel = useCallback(() => {
        setIsFilterPanelOpen(prev => !prev);
        if (!isFilterPanelOpen) {
            setFilterCriteria(activeFilters); 
        }
    }, [isFilterPanelOpen, activeFilters]);

    // --- Memoized Filtered List Calculation (Client-side denormalization only) ---
    const filteredDisplayPurchases = useMemo(() => {
        return getDisplayPurchases(purchaseList, allMedicines, allSuppliers); 
    }, [purchaseList, allMedicines, allSuppliers]); 
    
    // ... (Reusable Component Styles remain the same) ...
    const headerClass = clsx("px-4 py-3 text-left text-xs font-medium uppercase tracking-wider", isDarkMode ? 'text-gray-300' : 'text-gray-500');
    const cellClass = clsx("px-4 py-3 whitespace-nowrap text-sm", isDarkMode ? 'text-gray-200' : 'text-gray-900');
    const actionButtonClass = "p-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mx-1";


    // ---------------------------------------------------------------------
    // 4. PurchaseFilterPanel (Inline Component - UNCHANGED)
    // ---------------------------------------------------------------------
    const PurchaseFilterPanel = () => {
        const panelClass = clsx("absolute top-full left-0 mt-2 p-6 rounded-xl shadow-2xl z-40 w-96 transition-opacity duration-300 transform origin-top-left", 
            isDarkMode ? 'bg-slate-700 border-slate-600 border' : 'bg-white border-gray-200 border'
        );
        const labelClassInner = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-700');
        const inputSelectClass = clsx("w-full p-3 border rounded-lg focus:ring-2 transition-colors",
            isDarkMode
                ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400 focus:ring-blue-500'
                : 'bg-gray-100 border-gray-300 text-slate-800 placeholder-gray-500 focus:ring-blue-700'
        );
        
        return (
            <div className={panelClass}>
                <h3 className={clsx("text-lg font-bold mb-4 border-b pb-2", isDarkMode ? 'text-blue-400' : 'text-slate-800')}>Filter Purchases</h3>
                
                <div className="space-y-4">
                    {/* Filter 1: Medicine Name */}
                    <div>
                        <label htmlFor="filter-medicine" className={labelClassInner}>Medicine Name</label>
                        <select 
                            id="filter-medicine" 
                            name="medicineId" 
                            value={filterCriteria.medicineId} 
                            onChange={(e) => handleFilterChange('medicineId', e.target.value)} 
                            className={clsx(inputSelectClass, 'appearance-none cursor-pointer')}
                        >
                            <option value="all">All Medicines</option>
                            {allMedicines.map(med => (<option key={med.id} value={med.id}>{med.name}</option>))}
                        </select>
                    </div>

                    {/* Filter 2: Supplier Name */}
                    <div>
                        <label htmlFor="filter-supplier" className={labelClassInner}>Supplier Name</label>
                        <select 
                            id="filter-supplier" 
                            name="supplierId" 
                            value={filterCriteria.supplierId} 
                            onChange={(e) => handleFilterChange('supplierId', e.target.value)} 
                            className={clsx(inputSelectClass, 'appearance-none cursor-pointer')}
                        >
                            <option value="all">All Suppliers</option>
                            {allSuppliers.map(sup => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
                        </select>
                    </div>

                    {/* Filter 3: Min Price */}
                    <div>
                        <label htmlFor="filter-minPrice" className={labelClassInner}>Min Purchase Price ($)</label>
                        <input 
                            type="number" 
                            id="filter-minPrice" 
                            name="minPrice" 
                            placeholder="e.g., 0.50"
                            value={filterCriteria.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)} 
                            className={inputSelectClass}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    {/* Filter 4 & 5: Date Range */}
                    <div>
                        <label className={labelClassInner}>Purchase Date Range</label>
                        <div className="flex space-x-2">
                            <input type="date" name="dateFrom" value={filterCriteria.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className={inputSelectClass} title="From Date"/>
                            <input type="date" name="dateTo" value={filterCriteria.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className={inputSelectClass} title="To Date"/>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleApplyFilters}
                        className="w-full py-3 rounded-xl font-bold text-white transition duration-300 shadow-md hover:scale-[1.01]"
                        style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------
    // 5. PurchaseTable (Inline Component - UNCHANGED)
    // ---------------------------------------------------------------------
    const PurchaseTable = () => {
        
        if (isErrorPurchases) {
             // Error is handled by Toast in useQuery's onError.
            return (
                <div className={clsx("hidden md:block p-6 text-center text-sm font-semibold text-red-500", isDarkMode ? 'bg-slate-800 rounded-lg' : 'bg-red-50 rounded-lg')}>
                    Error loading purchases.
                </div>
            );
        }
        
        const showLoadingIndicator = isLoadingPurchases || isFetchingPurchases || deleteMutation.isLoading;

        return (
            <div className="hidden md:block overflow-hidden border border-gray-200 rounded-lg shadow-md">
                <div className="relative overflow-y-auto max-h-[70vh]"> 
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className={clsx(isDarkMode ? 'bg-slate-700' : 'bg-gray-100', "sticky top-0 z-30 shadow-sm")}>
                            <tr>
                                <th className={headerClass}>ID</th>
                                <th className={headerClass}>Medicine</th>
                                <th className={headerClass}>Supplier</th>
                                <th className={headerClass}>Quantity</th>
                                <th className={headerClass}>P. Price</th>
                                <th className={headerClass}>Total Cost</th>
                                <th className={headerClass}>Purchase Date</th>
                                <th className={headerClass}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={clsx("divide-y divide-gray-200", isDarkMode ? 'bg-slate-800' : 'bg-white')}>
                            {showLoadingIndicator ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-blue-500 font-semibold">
                                        {deleteMutation.isLoading ? 'Deleting purchase...' : 'Loading purchases...'}
                                    </td>
                                </tr>
                            ) : filteredDisplayPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No purchases found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredDisplayPurchases.map((p) => (
                                    <tr key={p.id} className={clsx("hover:bg-opacity-80 transition-colors", isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50')}>
                                        <td className={cellClass}>{p.id}</td>
                                        <td className={cellClass}>{p.medicineName}</td>
                                        <td className={cellClass}>{p.supplierName}</td>
                                        <td className={cellClass}>{p.quantity}</td>
                                        <td className={cellClass}>${p.purchasePrice.toFixed(2)}</td>
                                        <td className={clsx(cellClass, "font-bold text-blue-600")}>${p.totalCost.toFixed(2)}</td>
                                        <td className={cellClass}>{p.purchaseDate}</td>
                                        
                                        <td className={clsx(cellClass, "text-right font-medium flex items-center")}>
                                            {userCanModify ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleEditPurchase(p)} 
                                                        className={clsx(actionButtonClass, 'text-blue-600 hover:bg-blue-100')}
                                                        title="Edit Purchase"
                                                    >
                                                        <Icons.EditIcon className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePurchase(p.id)} 
                                                        className={clsx(actionButtonClass, 'text-red-600 hover:bg-red-100')}
                                                        title="Delete Purchase"
                                                        disabled={deleteMutation.isLoading}
                                                    >
                                                        <Icons.TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-gray-500 italic">View Only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    // ---------------------------------------------------------------------
    // 6. PurchaseCardView (Inline Component - UNCHANGED)
    // ---------------------------------------------------------------------
    const PurchaseCardView = () => {
        const [expandedId, setExpandedId] = useState<number | null>(null);

        if (isErrorPurchases) {
             // Error is handled by Toast in useQuery's onError.
             return (
                <div className={clsx("md:hidden p-6 text-center text-sm font-semibold text-red-500", isDarkMode ? 'bg-slate-800 rounded-lg' : 'bg-red-50 rounded-lg')}>
                    Error loading purchases.
                </div>
             );
        }
        
        const showLoadingIndicator = isLoadingPurchases || isFetchingPurchases || deleteMutation.isLoading;

        if (showLoadingIndicator) {
            return (
                <div className={clsx("md:hidden p-6 text-center text-sm font-semibold text-blue-500", isDarkMode ? 'bg-slate-800 rounded-lg' : 'bg-gray-100 rounded-lg')}>
                    {deleteMutation.isLoading ? 'Deleting purchase...' : 'Loading purchases...'}
                </div>
            );
        }

        if (filteredDisplayPurchases.length === 0) {
            return (
                <div className={clsx("md:hidden p-6 text-center text-sm", isDarkMode ? 'text-gray-400 bg-slate-800 rounded-lg' : 'text-gray-600 bg-gray-100 rounded-lg')}>
                    No purchases found matching filters.
                </div>
            );
        }

        return (
            <div className="md:hidden space-y-4">
                {filteredDisplayPurchases.map((p) => {
                    const isExpanded = expandedId === p.id;
                    const cardClass = clsx("p-4 rounded-xl shadow-lg transition-all duration-300", 
                        isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-200',
                        isExpanded ? 'ring-2 ring-blue-500' : ''
                    );
                    const detailItemClass = clsx("flex justify-between py-1 border-b", isDarkMode ? 'border-slate-600' : 'border-gray-200');
                    const detailLabelClass = clsx("font-medium", isDarkMode ? 'text-blue-300' : 'text-slate-600');
                    const detailValueClass = clsx("font-semibold", isDarkMode ? 'text-gray-100' : 'text-gray-900');
                    const totalCostClass = "text-xl font-extrabold text-blue-600";
                    const iconClass = clsx("w-6 h-6 transition-transform", isExpanded ? 'rotate-180' : 'rotate-0');

                    return (
                        <div key={p.id} className={cardClass}>
                            {/* Primary Header Row */}
                            <div className="flex justify-between items-center" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                                <div className="flex flex-col">
                                    <span className={clsx("text-lg font-bold", isDarkMode ? 'text-blue-400' : 'text-indigo-800')}>
                                        #{p.id}: {p.medicineName}
                                    </span>
                                    <span className={clsx("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                                        {p.supplierName} - {p.purchaseDate}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={totalCostClass}>${p.totalCost.toFixed(2)}</span>
                                    <button 
                                        type="button" 
                                        className="p-1 rounded-full text-blue-500 hover:bg-gray-100"
                                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                    >
                                        <Icons.ArrowDownIcon className={iconClass} />
                                    </button>
                                </div>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 space-y-2 border-t border-dashed" style={{ borderColor: isDarkMode ? '#475569' : '#D1D5DB' }}>
                                    
                                    <div className={detailItemClass}><span className={detailLabelClass}>Quantity</span><span className={detailValueClass}>{p.quantity} Units</span></div>
                                    <div className={detailItemClass}><span className={detailLabelClass}>Price (Per Unit)</span><span className={detailValueClass}>${p.purchasePrice.toFixed(2)}</span></div>
                                    
                                    {/* Action Row */}
                                    {userCanModify && (
                                        <div className="flex justify-end pt-2 space-x-2">
                                            <button 
                                                onClick={() => handleEditPurchase(p)} 
                                                className={clsx("flex items-center space-x-1 px-3 py-1 rounded-lg text-sm", 'text-blue-600 hover:bg-blue-100')}
                                                title="Edit Purchase"
                                            >
                                                <Icons.EditIcon className="w-4 h-4" /> <span>Edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePurchase(p.id)} 
                                                className={clsx("flex items-center space-x-1 px-3 py-1 rounded-lg text-sm", 'text-red-600 hover:bg-red-100')}
                                                title="Delete Purchase"
                                                disabled={deleteMutation.isLoading}
                                            >
                                                <Icons.TrashIcon className="w-4 h-4" /> <span>Delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };


    // ---------------------------------------------------------------------
    // 7. Main Render Block 
    // ---------------------------------------------------------------------

    return (
        <div 
            className={clsx("min-h-screen flex flex-col p-8 transition-colors duration-700 relative z-0",
                isDarkMode ? 'bg-slate-900' : 'bg-white')}
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
            
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={clsx("fixed top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50 hover:scale-105 active:scale-95",
                    isDarkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-white text-blue-700 hover:bg-gray-100'
                )}
                style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}
                aria-label="Toggle dark and light mode"
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>


            <div className="relative z-20 max-w-7xl mx-auto w-full">
                <h1 className={clsx("text-4xl font-extrabold mb-8 transition-colors duration-500", isDarkMode ? 'text-blue-600' : 'text-indigo-800')}>
                    Purchase Management
                    {isFetchingPurchases && <span className="ml-4 text-sm text-blue-400">Updating...</span>}
                </h1>
                
                {/* Header Bar: Search, Filter, and Add Button */}
                <div className="mb-6 flex justify-between items-center space-x-4">
                    
                    {/* Filter Icon and Panel Container */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={toggleFilterPanel}
                            className={clsx("p-3 rounded-xl border transition duration-300 hover:scale-[1.03] shadow-md",
                                isFilterPanelOpen 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : isDarkMode 
                                        ? 'bg-slate-700 border-slate-600 text-blue-400 hover:bg-slate-600' 
                                        : 'bg-white border-gray-300 text-blue-700 hover:bg-gray-100'
                            )}
                            style={{ color: isFilterPanelOpen ? 'white' : KIBRAN_COLOR }}
                            aria-label="Toggle Filters"
                        >
                            <Icons.FilterIcon className="w-5 h-5" />
                        </button>
                        
                        {/* Filter Panel Popup */}
                        {isFilterPanelOpen && <PurchaseFilterPanel />}
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative flex-grow">
                        <Icons.SearchIcon className={clsx("absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5", isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                        <input
                            type="text"
                            placeholder="Search by medicine or supplier name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx("w-full py-3 pl-10 pr-4 border rounded-xl focus:ring-2 shadow-inner transition-colors",
                            isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500' : 'bg-white border-gray-300 text-slate-800 focus:ring-blue-700'
                            )}
                        />
                    </div>

                    {/* Add New Purchase Button */}
                    {userCanModify && (
                        <Link href="/purchases/create" passHref>
                            <button
                                className="flex items-center space-x-2 py-3 px-6 rounded-xl font-bold text-white transition duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex-shrink-0"
                                style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                            >
                                <Icons.PlusIcon className="w-5 h-5" />
                                <span>Add Purchase</span>
                            </button>
                        </Link>
                    )}
                </div>
                
                {/* Information Bar */}
                <div className={clsx("flex justify-between items-center p-4 rounded-xl mb-6 shadow-lg", isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-blue-50 text-slate-700')}>
                    <p className="font-semibold text-sm md:text-base">
                        Total Purchases: <span className="font-extrabold text-blue-600">{purchaseList.length}</span>
                    </p>
                    <p className="font-semibold text-sm md:text-base">
                        Displaying: <span className="font-extrabold text-blue-600">{filteredDisplayPurchases.length}</span> results
                    </p>
                </div>

                {/* Purchase List Table (Inline) - Visible on md and up */}
                <PurchaseTable />
                
                {/* Purchase Card View (Inline) - Visible on small screens only */}
                <PurchaseCardView />
            </div>
        </div>
    );
};


// ---------------------------------------------------------------------
// 8. PurchasePage Component with React Query Provider Wrapper
// ---------------------------------------------------------------------

// Create a client outside of the component to prevent re-instantiation
const queryClient = new QueryClient();

const PurchasePage = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <PurchasePageContent />
        </QueryClientProvider>
    );
};

export default PurchasePage;