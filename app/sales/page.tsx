'use client';
import React, { useState, useMemo, useEffect, createContext, useContext, useRef, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
// NOTE: Assuming SalesProvider, useSales, and SalesFilters are correctly imported from salescontext
import { SalesProvider, useSales, SalesFilters } from './salescontext'; 
import { Medicine, getFullMedicineList } from '../lib/medicine-data'; 
import { Sale } from '../lib/sales-type'; // Ensure Sale type is imported/defined

// --- SHARED UTILITIES ---
const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// --- DEFAULT FILTER STATE (Must match the default in salescontext.tsx) ---
const DEFAULT_FILTERS = {
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    medicineName: '',
};

// #######################################################
// 1. SHARED SVG ICONS (Retained as is)
// #######################################################
const createIcon = (iconContent: React.ReactNode) => {
    const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{iconContent}</svg>
    );
    IconComponent.displayName = 'SvgIcon'; 
    return IconComponent;
};

// General Icons
const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-6 6V19a1 1 0 0 1-1.447.894L9 18v-5.293l-6-6A1 1 0 0 1 3 6V4Z"/>)(props);
const SortUpIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>)(props);
const SortDownIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>)(props);

// Theme Icons
const SunIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0 1.414 1.414M6.343 17.657l1.414 1.414M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
)(props);
const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
)(props);

// Action Icons
const ICON_BASE_CLASS = "w-5 h-5 transition-colors duration-150";
const EDIT_ICON_CLASS = clsx(ICON_BASE_CLASS, "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200");
const DELETE_ICON_CLASS = clsx(ICON_BASE_CLASS, "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200");
const COPY_ICON_CLASS = clsx(ICON_BASE_CLASS, "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"); 

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>)({...props, className: EDIT_ICON_CLASS});
const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M4 7h16"/><path d="m6 7 1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
</>)({...props, className: DELETE_ICON_CLASS});
const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => createIcon(<> 
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</>)({...props, className: COPY_ICON_CLASS});


// #######################################################
// 2. TOAST CONTEXT (Retained as is - assuming it's correctly working)
// #######################################################
interface ToastContextType { success: (msg: string) => void; error: (msg: string) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VisualToast: React.FC<{ message: string, type: 'success' | 'error', onClose: () => void }> = ({ message, type, onClose }) => {
    const baseClass = "fixed top-20 right-8 z-50 p-4 font-semibold rounded-lg shadow-xl flex items-center space-x-3 transition-all duration-300 transform";
    const typeClass = type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
    const icon = type === 'success' ? '✅' : '❌';

    return (
        <div 
            className={clsx(baseClass, typeClass)}
            style={{ opacity: 1, transform: 'translateY(0)' }} 
        >
            <span className="text-xl">{icon}</span>
            <p>{message}</p>
            <button onClick={onClose} className="text-white ml-2 font-bold hover:text-gray-200">&times;</button>
        </div>
    );
}

export const ToastProviderWrapper = ({ children }: { children: React.ReactNode }) => {
    const [toastState, setToastState] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const hideToast = useCallback(() => {
        setToastState({ message: '', type: null });
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []); 
    
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        hideToast(); 
        setToastState({ message, type });
        console[type === 'success' ? 'log' : 'error'](`${type.toUpperCase()}: ${message}`); 
        timerRef.current = setTimeout(hideToast, 9000); 
    }, [hideToast]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const contextValue: ToastContextType = useMemo(() => ({
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
    }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {toastState.type && <VisualToast message={toastState.message} type={toastState.type} onClose={hideToast} />}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        return { 
            success: (msg: string) => console.log(`SUCCESS: ${msg} (Toast Provider Missing)`), 
            error: (msg: string) => console.error(`ERROR: ${msg} (Toast Provider Missing)`) 
        } as ToastContextType;
    }
    return context;
};


// #######################################################
// 3. THEME CONTEXT (Retained as is)
// #######################################################
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg'; 
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)';
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';
interface ThemeContextType { theme: 'light' | 'dark'; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light')), []);
    
    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'light', toggleTheme: () => {} } as ThemeContextType;
  }
  return context;
};


// --- LOCAL TYPES for Sorting ---
type SortDirection = 'asc' | 'desc';
type SortKey = 'id' | 'saleDate' | 'totalAmount' | 'medicineName'; 


// --- FOCUS STABILITY COMPONENTS & HOOKS (Retained as is) ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

interface SearchBarProps {
    value: string;
    onChange: (term: string) => void;
    isDark: boolean;
}

const SearchBar = memo(({ value, onChange, isDark }: SearchBarProps) => {
    return (
        <div className="relative flex-grow">
            <input
                key="sales-search-input" 
                type="text"
                placeholder="Search by Medicine Name or Customer..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={clsx("pl-4 h-12 w-full text-base rounded-xl shadow-lg border-2", 
                    isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900')}
            />
        </div>
    );
});
SearchBar.displayName = 'SearchBar';


// #######################################################
// 4. SALES LIST PAGE CORE COMPONENT
// #######################################################

const SalesListCore = () => {
    const { theme, toggleTheme } = useTheme();
    const toast = useToast();
    const router = useRouter();
    const searchParams = useSearchParams(); 
    
    const filterRef = useRef<HTMLDivElement>(null); 

    // ⭐ CRITICAL FIX: Destructure 'filters' from useSales() ⭐
    const { 
        sales, 
        isLoading: isSalesLoading, 
        deleteSale, 
        setSearchTerm,
        filters, // <-- NEW: Required to read the current global filters
        setFilters
    } = useSales();

    // --- SEARCH STATE ---
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300); 
    
    // ⭐ CRITICAL FIX: Safely initialize localFilters from global filters ⭐
    const [localFilters, setLocalFilters] = useState({
        ...DEFAULT_FILTERS,
        ...(filters as any || {}), // Safely merge global context filters on load
        sortBy: 'id' as SortKey, 
        sortDirection: 'asc' as SortDirection,
    });
    
    // --- MEDICINE CATALOG STATE ---
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isMedicineLoading, setIsMedicineLoading] = useState(true);
    
    // --- UI STATE ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Combine loading states
    const isLoading = isSalesLoading || isMedicineLoading;

    const [currentPage, setCurrentPage] = useState(1);
    const salesPerPage = 5; 

    // --- EFFECT: Debounced Search Term to Context ---
    useEffect(() => {
        setSearchTerm(debouncedSearchTerm);
    }, [debouncedSearchTerm, setSearchTerm]);
    
    // --- EFFECT: Click Outside Listener ---
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterOpen(false);
        }
    }, [filterRef]);
    
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    // --- Dynamic Background Styles and Data Fetching (Medicine List) ---
    const fixedBackgroundStyle = useMemo(() => ({
        backgroundImage: `url(${theme === 'dark' ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }), [theme]);
    const overlayColor = theme === 'dark' ? DARK_OVERLAY : LIGHT_OVERLAY;

    useEffect(() => {
        getFullMedicineList()
            .then(data => {
                setMedicines(data);
                setIsMedicineLoading(false);
            })
            .catch(error => {
                console.error("Medicine Catalog Fetch Error:", error);
                toast.error('Failed to load medicine catalog for filtering.');
                setIsMedicineLoading(false);
            });
    }, [toast]);
    
    // --- CHECK URL PARAMS FOR MESSAGES AFTER REDIRECT ---
    useEffect(() => {
        const status = searchParams.get('status');
        const message = searchParams.get('message');

        if (message) { 
            const decodedMessage = decodeURIComponent(message.replace(/\+/g, ' '));
            
            if (status === 'success') {
                toast.success(decodedMessage);
            } else {
                toast.error(decodedMessage); 
            }
            router.replace('/sales', { scroll: false }); 
        }
    }, [searchParams, toast, router]);


    // --- Filtering and Sorting Logic (Client-side Sorting remains) ---
    const filteredAndSortedSales = useMemo(() => {
        let result = [...sales];
        
        // --- ONLY KEEPING SORTING LOGIC HERE ---
        result.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;
            
            if (localFilters.sortBy === 'id') {
                aValue = a.id;
                bValue = b.id;
            } else if (localFilters.sortBy === 'saleDate') {
                aValue = new Date(a.saleDate).getTime();
                bValue = new Date(b.saleDate).getTime();
            } else if (localFilters.sortBy === 'totalAmount') {
                aValue = a.totalAmount;
                bValue = b.totalAmount;
            } else { // medicineName
                aValue = a.medicineName.toLowerCase();
                bValue = b.medicineName.toLowerCase();
            }

            if (aValue < bValue) return localFilters.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return localFilters.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [sales, localFilters]); 

    // --- Pagination Logic (Retained) ---
    const totalPages = Math.ceil(filteredAndSortedSales.length / salesPerPage);
    const paginatedSales = useMemo(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
        const startIndex = (currentPage - 1) * salesPerPage;
        return filteredAndSortedSales.slice(startIndex, startIndex + salesPerPage);
    }, [filteredAndSortedSales, currentPage, totalPages]);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    // --- Action Handlers (UPDATED handleDeleteSale) ---
    const handleEditSale = (id: number) => {
        router.push(`/sales/${id}/edit`);
    };

    const handleDeleteSale = (saleId: number, quantity: number, medicineName: string) => {
        if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete Sale ID: ${saleId}? This action will RESTOCK the items.`)) {
            
            // The core logic is now in the promise chain
            deleteSale(saleId, quantity, medicineName) 
                .then(() => {
                    // Success case
                    toast.success(`Sale ID ${saleId} deleted and stock restored.`); 
                })
                .catch((error) => {
                    // ⭐ 🛑 UPDATED: ERROR PARSING LOGIC FOR DELETE (404, 500) 🛑 ⭐
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error("Deletion Error:", errorMessage);

                    if (errorMessage.startsWith('404:')) {
                        // 404 Not Found: Critical for deletion
                        toast.error(`Deletion failed: Sale ID ${saleId} not found.`); 
                    } else if (errorMessage.startsWith('500:')) {
                        // 500 Server Error: Internal failure or stock restoration issue
                        toast.error("Something went wrong on the server while deleting the sale. Try again.");
                    } else {
                        // Fallback for unexpected errors
                        toast.error("An unexpected error occurred during deletion.");
                    }
                    // ⭐ 🛑 END OF UPDATED LOGIC 🛑 ⭐
                });
        }
    };

    const handleCopySaleId = (id: number) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            const idToCopy = id.toString();
            
            navigator.clipboard.writeText(idToCopy)
                .then(() => {
                    const message = `Copied Sale ID: ${id}`; 
                    toast.success(message);
                })
                .catch(err => {
                    toast.error('Failed to copy ID. Check console for details.');
                    console.error("Clipboard Copy Error:", err);
                });
        } else {
            toast.error('Clipboard access denied by browser.');
        }
    };
    
    // --- Sorting UI Helpers (Uses localFilters) ---
    const handleSort = (key: SortKey) => {
        setLocalFilters(prev => ({
            ...prev,
            sortBy: key,
            sortDirection: prev.sortBy === key 
                ? (prev.sortDirection === 'desc' ? 'asc' : 'desc') 
                : 'asc',
        }));
        setCurrentPage(1);
    };
    
    const renderSortArrow = (column: SortKey) => {
        if (localFilters.sortBy !== column) return null;
        const Icon = localFilters.sortDirection === 'asc' ? SortUpIcon : SortDownIcon;
        return <Icon className="w-4 h-4 inline ml-1"/>;
    };
    
    // --- Render Pagination and Filter Popover ---
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        return (
            <div className="flex items-center justify-center space-x-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                    Previous
                </button>
                {pageNumbers.map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={clsx(
                            "px-3 py-1 text-sm rounded-lg font-semibold",
                            currentPage === page ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        );
    };
    
    const renderFilterPopover = () => {
        const isDark = theme === 'dark';
        const inputClass = clsx(
            "py-2 px-3 border rounded-lg shadow-inner w-full text-sm",
            isDark ? 
                'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 
                'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        );
        const labelClass = clsx("block text-xs font-medium mb-1", isDark ? 'text-gray-300' : 'text-gray-600');
        const popoverBg = isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200';
        
        // This handler updates both local (UI) state and global (context) state
        const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            
            // ⭐ CRITICAL FIX: Safety check before calling setFilters ⭐
            if (typeof setFilters === 'function') {
                 // Update global context filters (triggers data refetch)
                setFilters({ [name]: value });
            } else {
                console.error("setFilters is not available in context. Cannot apply filter globally.");
            }
            
            // Update local state for UI value display
            setLocalFilters(prev => ({ ...prev, [name]: value }));
            setCurrentPage(1); // Reset page on filter change
        };

        return (
            <div 
                className={clsx("absolute top-full mt-2 w-[320px] sm:w-[500px] lg:w-[600px] xl:w-[700px] p-6 rounded-xl shadow-2xl z-20 transition-all transform origin-top-left", popoverBg)}
            >
                <h4 className={clsx("text-lg font-bold mb-4 border-b pb-2", isDark ? 'text-white border-gray-600' : 'text-gray-800 border-gray-200')}>
                    Advanced Filters
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Medicine Filter Dropdown (Uses local state) */}
                    <div>
                        <label className={labelClass}>Medicine Name</label>
                        <select
                            value={localFilters.medicineName}
                            onChange={handleFilterChange} 
                            name="medicineName"
                            className={inputClass}
                        >
                            <option value="">All Medicines</option>
                            {Array.from(new Set(medicines.map(m => m.name))).sort().map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Price Filters - Min (Uses local state) */}
                    <div>
                        <label className={labelClass}>Min Total Price ($)</label>
                        <input
                            type="number"
                            placeholder="Min Price"
                            name="minPrice"
                            value={localFilters.minPrice}
                            onChange={handleFilterChange}
                            className={inputClass}
                            min="0"
                        />
                    </div>

                    {/* Date Filters - Start (Uses local state) */}
                    <div>
                        <label className={labelClass}>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={localFilters.startDate}
                            onChange={handleFilterChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Date Filters - End (Uses local state) */}
                    <div>
                        <label className={labelClass}>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={localFilters.endDate}
                            onChange={handleFilterChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Price Filters - Max (Uses local state) */}
                    <div>
                        <label className={labelClass}>Max Total Price ($)</label>
                        <input
                            type="number"
                            placeholder="Max Price"
                            name="maxPrice"
                            value={localFilters.maxPrice}
                            onChange={handleFilterChange}
                            className={inputClass}
                            min="0"
                        />
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200"
                    >
                        Apply & Close Filters
                    </button>
                </div>
            </div>
        );
    };


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-2xl text-indigo-500">Loading Sales Data...</div>;
    }

    // --- Main Render ---
    const isDark = theme === 'dark';
    
    return (
        <div
            className={clsx("min-h-screen flex flex-col items-center p-4 sm:p-8 relative",
                theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100')}
        >
            {/* Background and Overlay */}
            <div className="fixed inset-0 w-full h-full z-0" style={fixedBackgroundStyle} />
            
            {/* Theme Toggle Button */}
            <button 
                onClick={toggleTheme} 
                className="fixed top-6 right-6 p-3 rounded-full text-xl z-20 bg-white dark:bg-gray-700 shadow-lg text-indigo-600 dark:text-yellow-400 hover:scale-110 transition-transform duration-200 ease-in-out" 
                aria-label="Toggle dark/light mode"
            >
                {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>

            <div
                className="max-w-7xl w-full p-8 rounded-xl shadow-2xl z-10"
                style={{ backgroundColor: overlayColor }}
            >
                {/* Header and Top Actions */}
                <h1 className="text-3xl font-bold mb-6 border-b pb-2 text-indigo-800 dark:text-indigo-200 border-gray-400 dark:border-gray-600">
                    💰 Sales Transaction List
                </h1>
                <div className="flex justify-between items-start mb-6 space-x-4">
                    <button
                        onClick={() => router.push('/sales/create')} 
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200"
                    >
                        ➕ Add Sale
                    </button>
                    {/* Navigate to Summary view */}
                    <button
                        onClick={() => router.push('/sales/summary')}
                        className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-200"
                    >
                        📈 Summary View
                    </button>
                </div>

                {/* --- FILTER INTERFACE: SEPARATE BUTTON AND INPUT --- */}
                <div className="relative flex items-start space-x-3 mb-8">
                    
                    {/* 1. Filter Icon Button (Trigger) */}
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="h-12 w-12 flex items-center justify-center p-2 text-xl rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-200"
                            aria-label="Toggle Advanced Filters"
                        >
                            <FilterIcon className="w-6 h-6"/>
                        </button>
                        
                        {/* --- FILTER POPOVER BOX --- */}
                        {isFilterOpen && renderFilterPopover()}
                    </div>

                    {/* 2. SearchBar uses LOCAL state and MEMOIZATION for stability */}
                    <SearchBar 
                        value={localSearchTerm} // Use local state for instant feedback
                        onChange={setLocalSearchTerm} // Updates local state
                        isDark={isDark} 
                    />
                </div>


                {/* --- SALES TABLE --- */}
                <div className="overflow-x-auto shadow-xl rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {/* ID column with Sorting enabled */}
                                <th 
                                    onClick={() => handleSort('id')} 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    ID{renderSortArrow('id')}
                                </th>
                                
                                <th onClick={() => handleSort('saleDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">Date{renderSortArrow('saleDate')}</th>
                                <th onClick={() => handleSort('medicineName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">Medicine{renderSortArrow('medicineName')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                                <th onClick={() => handleSort('totalAmount')} className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">Total{renderSortArrow('totalAmount')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedSales.length > 0 ? (
                                
                                paginatedSales.map((sale: Sale) => {
                                    
                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-150">
                                            
                                            {/* DISPLAY: Actual Sale ID */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                <span title={`Database ID: ${sale.id}`}>{sale.id}</span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(sale.saleDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600 dark:text-indigo-400">{sale.medicineName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{sale.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">${sale.sellingPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-right text-green-700 dark:text-green-400">${sale.totalAmount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{sale.customerName || 'Cash Sale'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <div className="flex items-center justify-center space-x-3">
                                                    
                                                    {/* Copy Button (Uses sale.id) */}
                                                    <button 
                                                        onClick={() => handleCopySaleId(sale.id)} 
                                                        aria-label="Copy Sale ID" 
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition duration-150"
                                                    >
                                                        <CopyIcon className="w-5 h-5"/>
                                                    </button>

                                                    {/* Edit Button (Uses sale.id) */}
                                                    <button 
                                                        onClick={() => handleEditSale(sale.id)} 
                                                        aria-label="Edit Sale" 
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition duration-150"
                                                    >
                                                        <EditIcon className="w-5 h-5"/>
                                                    </button>
                                                    
                                                    {/* Delete Button (Uses sale.id) */}
                                                 <button 
                                                    onClick={() => handleDeleteSale(sale.id, sale.quantity, sale.medicineName)} 
                                                    aria-label="Delete Sale" 
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition duration-150"
                                                 >
                                                    <DeleteIcon className="w-5 h-5"/>
                                                </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-lg text-gray-500 dark:text-gray-400">
                                        No sales records found matching the current criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- FOOTER AND PAGINATION --- */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        Displaying {paginatedSales.length} of {filteredAndSortedSales.length} total results.
                    </div>
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};

// #######################################################
// 5. MAIN PAGE WRAPPER (DEFAULT EXPORT)
// #######################################################

// Assuming ThemeProvider and ToastProviderWrapper are defined above
export default function SalesPage() {
    return (
        <ThemeProvider>
            <SalesProvider> 
                <ToastProviderWrapper>
                    <SalesListCore /> 
                </ToastProviderWrapper>
            </SalesProvider>
        </ThemeProvider>
    );
}