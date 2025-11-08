'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

// --- KIBRAN COLOR CONSTANTS ---
const KIBRAN_COLOR = '#003A70'; // Deeper Blue (Primary)
const KIBRAN_COLOR_LIGHT = '#1A6AA5'; 

// Utility function to merge Tailwind classes
const clsx = (...classes: (string | boolean | null | undefined)[]) => classes.filter(Boolean).join(' ');

// The backgrounds images and the overlay colors
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg';  
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';

// Icon definitions (A minimal set to avoid external dependency issues)
const Icons = {
    // FIX: Removed the trailing '()' from the function definitions
    SearchIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
    PlusIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
    EditIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>),
    TrashIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
    CopyIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>),
    SunIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m-4-8H4m16 0h-2M6.34 6.34l1.41 1.41m12.71 12.71-1.41-1.41M6.34 17.66l1.41-1.41m12.71-12.71-1.41 1.41"/></svg>),
    MoonIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>),
    FilterIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>),
};

// --- Interfaces ---
interface Supplier {
    id: number;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    created: string; // Format: YYYY-MM-DD
}

interface SupplierFormData extends Omit<Supplier, 'id' | 'created'> {
    id?: number;
}

// UPDATED: Filter Criteria Interface
interface FilterCriteria {
    country: string;
    name: string; // Filter by Supplier Name
    contact: string; // Filter by Contact Person
    dateFrom: string; // Filter by Created Date (Start)
    dateTo: string; // Filter by Created Date (End)
}


// --- Mock Data ---
const MOCK_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'Pharma Dist. Ethiopia', contact: 'Abebe Kebede', phone: '251-911-001001', email: 'abebe.k@pharma.com', address: 'Bole Road, Addis Ababa', country: 'Ethiopia', created: '2023-01-15' },
    { id: 2, name: 'Global Med Supplies', contact: 'Jane Smith', phone: '1-202-555-0199', email: 'janes@gms.com', address: '121 Main St, NY', country: 'USA', created: '2022-11-20' },
    { id: 3, name: 'Asian Generics LTD', contact: 'Li Wei', phone: '86-10-6500-1234', email: 'liwei@asia.com', address: 'Suzhou Industrial Park', country: 'China', created: '2023-05-01' },
    { id: 4, name: 'African Pharma', contact: 'Musa Diallo', phone: '251-911-001002', email: 'musa.d@pharma.com', address: 'Sarbet, Addis Ababa', country: 'Ethiopia', created: '2023-02-15' },
    { id: 5, name: 'Europe Medical', contact: 'Hans Muller', phone: '49-30-1234-5678', email: 'hans.m@euro.com', address: 'Berlin, Germany', country: 'Germany', created: '2023-08-10' },
];

const COUNTRY_OPTIONS = ['All Countries', 'Ethiopia', 'USA', 'China', 'India', 'Germany', 'Other'];

const initialFormData: SupplierFormData = {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    country: COUNTRY_OPTIONS[0],
};

// UPDATED: Initial filter state
const initialFilterCriteria: FilterCriteria = {
    country: 'All Countries',
    name: '',
    contact: '',
    dateFrom: '',
    dateTo: '',
};

// --- Utility: Simulated Permission Check (FIXED: Added '||' operator) ---
type UserRole = 'Admin' | 'Store Keeper' | 'Sales' | 'Cashier';
// FIX: Added '||' to correct boolean logic
const canModifySupplier = (role: UserRole) => role === 'Admin' || role === 'Store Keeper';


// ----------------------------------------------------------------------
// --- 1. SUPPLIER FORM PANEL COMPONENT ---
// ----------------------------------------------------------------------

interface SupplierFormPanelProps {
    formData: SupplierFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleCancel: () => void;
    isEdit: boolean;
    isDarkMode: boolean;
}

const SupplierFormPanel: React.FC<SupplierFormPanelProps> = ({ 
    formData, 
    handleChange, 
    handleSubmit, 
    handleCancel, 
    isEdit, 
    isDarkMode 
}) => {
    
    // Styling classes
    const containerClass = clsx("p-6 rounded-2xl shadow-xl mb-8 transition-colors duration-500",
        isDarkMode ? 'bg-slate-800' : 'bg-white'
    );
    const inputClass = clsx("w-full p-3 border rounded-lg focus:ring-2 transition-colors",
        isDarkMode
            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500'
            : 'bg-gray-50 border-gray-300 text-slate-800 focus:ring-blue-700'
    );
    const labelClass = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-blue-300' : 'text-slate-700');

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-2xl font-bold" style={{ color: KIBRAN_COLOR }}>
                    {isEdit ? 'Edit Supplier Details' : 'Add New Supplier'}
                </h2>
                <button
                    onClick={handleCancel}
                    className="py-2 px-4 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition duration-300 shadow-md"
                >
                    Cancel
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Row 1 */}
                <div>
                    <label htmlFor="name" className={labelClass}>Supplier Name *</label>
                    <input type="text" id="name" name="name" placeholder="e.g., Pharma Dist. Ethiopia" value={formData.name} onChange={handleChange} className={inputClass} required />
                </div>
                <div>

<label htmlFor="contact" className={labelClass}>Contact Person</label>
                    <input type="text" id="contact" name="contact" placeholder="e.g., Abebe Kebede" value={formData.contact} onChange={handleChange} className={inputClass} />
                </div>
                
                {/* Row 2 */}
                <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <input type="text" id="phone" name="phone" placeholder="e.g., +251-911-001001" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input type="email" id="email" name="email" placeholder="e.g., abebe.k@pharma.com" value={formData.email} onChange={handleChange} className={inputClass} />
                </div>

                {/* Row 3 */}
                <div>
                    <label htmlFor="country" className={labelClass}>Country *</label>
                    <select id="country" name="country" value={formData.country} onChange={handleChange} className={clsx(inputClass, 'appearance-none cursor-pointer')} required>
                        {COUNTRY_OPTIONS.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="address" className={labelClass}>Address</label>
                    <input type="text" id="address" name="address" placeholder="e.g., Bole Road, Addis Ababa" value={formData.address} onChange={handleChange} className={inputClass} />
                </div>
                
                {/* Submit Button (Full Width) */}
                <div className="md:col-span-2 pt-4">
                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl font-bold text-white text-lg transition duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                        style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                    >
                        {isEdit ? 'SAVE CHANGES' : 'ADD SUPPLIER'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- 2. SUPPLIER LIST TABLE COMPONENT ---
// ----------------------------------------------------------------------

interface SupplierListTableProps {
    suppliers: Supplier[];
    isDarkMode: boolean;
    userCanModify: boolean;
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: number) => void;
    onCopy: (supplier: Supplier) => void;
}

const SupplierListTable: React.FC<SupplierListTableProps> = ({ suppliers, isDarkMode, userCanModify, onEdit, onDelete, onCopy }) => {
    const headerClass = clsx("px-4 py-3 text-left text-xs font-medium uppercase tracking-wider", isDarkMode ? 'text-gray-300' : 'text-gray-500');
    const cellClass = clsx("px-4 py-3 whitespace-nowrap text-sm", isDarkMode ? 'text-gray-200' : 'text-gray-900');
    const actionButtonClass = "p-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mx-1";

return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className={clsx(isDarkMode ? 'bg-slate-700' : 'bg-gray-100')}>
                    <tr>
                        <th className={headerClass}>SL.</th>
                        <th className={headerClass}>Supplier Name</th>
                        <th className={headerClass}>Contact Person</th>
                        <th className={headerClass}>Phone</th>
                        <th className={headerClass}>Email</th>
                        <th className={headerClass}>Country</th>
                        <th className={headerClass}>Created Date</th>
                        <th className={headerClass}>Action</th>
                    </tr>
                </thead>
                <tbody className={clsx("divide-y divide-gray-200", isDarkMode ? 'bg-slate-800' : 'bg-white')}>
                    {suppliers.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                No suppliers found.
                            </td>
                        </tr>
                    ) : (
                        suppliers.map((sup, index) => (
                            <tr key={sup.id} className={clsx("hover:bg-opacity-80 transition-colors", isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50')}>
                                <td className={cellClass}>{index + 1}</td>
                                <td className={cellClass}>{sup.name}</td>
                                <td className={cellClass}>{sup.contact}</td>
                                <td className={cellClass}>{sup.phone}</td>
                                <td className={cellClass}>{sup.email}</td>
                                <td className={cellClass}>{sup.country}</td>
                                <td className={cellClass}>{sup.created}</td>
                                
                                <td className={clsx(cellClass, "text-right font-medium flex items-center")}>
                                    {userCanModify ? (
                                        <>
                                            <button 
                                                onClick={() => onEdit(sup)} 
                                                className={clsx(actionButtonClass, 'text-blue-600 hover:bg-blue-100')}
                                                title="Edit"
                                            >
                                                <Icons.EditIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(sup.id)} 
                                                className={clsx(actionButtonClass, 'text-red-600 hover:bg-red-100')}
                                                title="Delete"
                                            >
                                                <Icons.TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => onCopy(sup)} 
                                                className={clsx(actionButtonClass, 'text-green-600 hover:bg-green-100')}
                                                title="Copy Details"
                                            >
                                                <Icons.CopyIcon className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 italic">No Actions</span>
                                    )}
                                </td>
                            </tr>

))
                    )}
                </tbody>
            </table>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- 3. FILTER PANEL COMPONENT ---
// ----------------------------------------------------------------------

interface FilterPanelProps {
    currentFilters: FilterCriteria;
    onFilterChange: (name: keyof FilterCriteria, value: string) => void;
    onApplyFilters: () => void;
    isDarkMode: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ currentFilters, onFilterChange, onApplyFilters, isDarkMode }) => {
    const panelClass = clsx("absolute top-full left-0 mt-2 p-6 rounded-xl shadow-2xl z-40 w-80 transition-opacity duration-300 transform origin-top-left", 
        isDarkMode ? 'bg-slate-700 border-slate-600 border' : 'bg-white border-gray-200 border'
    );
    const labelClass = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-700');
    const inputSelectClass = clsx("w-full p-3 border rounded-lg focus:ring-2 transition-colors",
        isDarkMode
            ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400 focus:ring-blue-500'
            : 'bg-gray-100 border-gray-300 text-slate-800 placeholder-gray-500 focus:ring-blue-700'
    );

    return (
        <div className={panelClass}>
            <h3 className={clsx("text-lg font-bold mb-4 border-b pb-2", isDarkMode ? 'text-blue-400' : 'text-slate-800')}>Filter Criteria</h3>
            
            <div className="space-y-4">
                
                {/* Filter 1: Supplier Name */}
                <div>
                    <label htmlFor="filter-name" className={labelClass}>Supplier Name</label>
                    <input 
                        type="text" 
                        id="filter-name" 
                        name="name" 
                        placeholder="Search name..."
                        value={currentFilters.name}
                        onChange={(e) => onFilterChange('name', e.target.value)} 
                        className={inputSelectClass}
                    />
                </div>

                {/* Filter 2: Contact Person */}
                <div>
                    <label htmlFor="filter-contact" className={labelClass}>Contact Person</label>
                    <input 
                        type="text" 
                        id="filter-contact" 
                        name="contact" 
                        placeholder="Search contact..."
                        value={currentFilters.contact}
                        onChange={(e) => onFilterChange('contact', e.target.value)} 
                        className={inputSelectClass}
                    />
                </div>

                {/* Filter 3: Country */}
                <div>
                    <label htmlFor="filter-country" className={labelClass}>Country</label>
                    <select 
                        id="filter-country" 
                        name="country" 
                        value={currentFilters.country} 
                        onChange={(e) => onFilterChange('country', e.target.value)} 
                        className={clsx(inputSelectClass, 'appearance-none cursor-pointer')}
                    >
                        {COUNTRY_OPTIONS.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>


{/* Filter 4 & 5: Created Date Range */}
                <div>
                    <label className={labelClass}>Created Date Range</label>
                    <div className="flex space-x-2">
                        <input 
                            type="date" 
                            id="filter-dateFrom" 
                            name="dateFrom" 
                            value={currentFilters.dateFrom}
                            onChange={(e) => onFilterChange('dateFrom', e.target.value)} 
                            className={inputSelectClass}
                            title="From Date"
                        />
                        <input 
                            type="date" 
                            id="filter-dateTo" 
                            name="dateTo" 
                            value={currentFilters.dateTo}
                            onChange={(e) => onFilterChange('dateTo', e.target.value)} 
                            className={inputSelectClass}
                            title="To Date"
                        />
                    </div>
                </div>
                

                <button
                    onClick={onApplyFilters}
                    className="w-full py-3 rounded-xl font-bold text-white transition duration-300 shadow-md hover:scale-[1.01]"
                    style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- 4. MAIN SUPPLIER PAGE COMPONENT (Updated) ---
// ----------------------------------------------------------------------

const SupplierPage = () => {
    const [userRole, setUserRole] = useState<UserRole>('Admin'); // Mocked user role
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const [isAdding, setIsAdding] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); 
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierList, setSupplierList] = useState<Supplier[]>(MOCK_SUPPLIERS);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
    const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(initialFilterCriteria); 
    const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilterCriteria); 

    const userCanModify = useMemo(() => canModifySupplier(userRole), [userRole]);

    // Initial dark mode setup (optional)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }
    }, []);


    // --- Filtering Logic ---
    const filteredSuppliers = useMemo(() => {
        let results = supplierList;
        const activeSearch = searchTerm.toLowerCase();

        // 1. Global Search Term Filtering (applied first if present)
        if (activeSearch) {
            results = results.filter(sup =>
                Object.values(sup).some(value =>
                    String(value).toLowerCase().includes(activeSearch)
                )
            );
        }

        // 2. Filter Criteria Filtering (applied after global search)
        const { country, name, contact, dateFrom, dateTo } = activeFilters;
        
        // Filter by Country
        if (country && country !== 'All Countries') {
            results = results.filter(sup => sup.country === country);
        }

        // Filter by Supplier Name
        if (name) {
            const lowerName = name.toLowerCase();
            results = results.filter(sup => sup.name.toLowerCase().includes(lowerName));
        }


// Filter by Contact Person
        if (contact) {
            const lowerContact = contact.toLowerCase();
            results = results.filter(sup => sup.contact.toLowerCase().includes(lowerContact));
        }
        
        // Filter by Created Date Range (FIXED: Added '||' operator)
        if (dateFrom || dateTo) {
            const dateFromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
            // Add one day to dateTo to include the entire day
            const dateToTime = dateTo ? new Date(dateTo).getTime() + (24 * 60 * 60 * 1000) : Infinity;

            results = results.filter(sup => {
                const createdTime = new Date(sup.created).getTime();
                return createdTime >= dateFromTime && createdTime <= dateToTime;
            });
        }
        
        return results;
    }, [supplierList, searchTerm, activeFilters]); 

    // --- Form & Filter Handlers ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (name: keyof FilterCriteria, value: string) => {
        setFilterCriteria(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterCriteria); // Apply the staged filters
        setIsFilterPanelOpen(false); // Close the panel
    };
    
    // Toggle function for the filter panel
    const toggleFilterPanel = () => {
        setIsFilterPanelOpen(prev => !prev);
        // Sync the form criteria with active filters when opening
        if (!isFilterPanelOpen) {
            setFilterCriteria(activeFilters);
        }
    };


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userCanModify) {
            alert("Permission denied. Only Admins/Store Keepers can modify records.");
            return;
        }

        if (!formData.name.trim() || formData.country === COUNTRY_OPTIONS[0]) {
            alert("Please fill in all required fields (Supplier Name and Country).");
            return;
        }

        const dataToSave: Supplier = {
            ...formData,
            id: isEditing && formData.id ? formData.id : Math.max(0, ...supplierList.map(s => s.id)) + 1,
            created: isEditing ? supplierList.find(s => s.id === formData.id)?.created || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        } as Supplier;

        if (isEditing) {
            setSupplierList(prev => prev.map(sup => sup.id === dataToSave.id ? dataToSave : sup));
            setIsEditing(false);
        } else {
            setSupplierList(prev => [dataToSave, ...prev]);
        }

        setFormData(initialFormData);
        setIsAdding(false);
    };

    const toggleAdding = () => {
        setIsAdding(prev => !prev);
        setIsEditing(false);
        setFormData(initialFormData); // Reset form on cancel
    };

    const handleEdit = (supplier: Supplier) => {
        if (!userCanModify) return alert("Permission denied.");
        setFormData(supplier);
        setIsEditing(true);
        setIsAdding(true); // Open the form in edit mode
    };

    const handleDelete = (id: number) => {
        if (!userCanModify) return alert("Permission denied.");
        if (window.confirm("Are you sure you want to delete this supplier record?")) {
            setSupplierList(prev => prev.filter(sup => sup.id !== id));
        }
    };
    
    const handleCopy = async (supplier: Supplier) => {
        if (!userCanModify) return alert("Permission denied.");
        // FIX: Corrected template literal syntax from concatenation error
        const detailsToCopy = `Supplier Name: ${supplier.name}
Contact Person: ${supplier.contact}
Phone: ${supplier.phone}
Email: ${supplier.email}
Address: ${supplier.address}
Country: ${supplier.country}`;


try {
            await navigator.clipboard.writeText(detailsToCopy);
            alert(`Details for supplier '${supplier.name}' successfully copied to clipboard!`);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            prompt("Could not use clipboard API. Manually copy the text below:", detailsToCopy);
        }
    };

    const toggleTheme = () => setIsDarkMode(prev => !prev);


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
            
            {/* Theme Toggle Button (Fixed Position) */}
            <button
                onClick={toggleTheme}
                className={clsx(`fixed top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50
                    hover:scale-105 active:scale-95`,
                    isDarkMode
                        ? 'bg-slate-700 text-blue-400 hover:bg-slate-600'
                        : 'bg-white text-blue-700 hover:bg-slate-200'
                )}
                style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}
                aria-label="Toggle dark and light mode"
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>


            <div className="relative z-20 max-w-7xl mx-auto w-full">
                <h1 className={clsx("text-4xl font-extrabold mb-8 transition-colors duration-500", isDarkMode ? 'text-blue-600' : 'text-indigo-800')}>
                    Supplier Management
                </h1>
                
                {/* Search Bar, Filter Icon, and Add Button */}
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
                            <Icons.FilterIcon className="w-5 h-5"/>
                        </button>
                        
                        {/* Filter Panel Popup */}
                        {isFilterPanelOpen && (
                            <FilterPanel
                                currentFilters={filterCriteria}
                                onFilterChange={handleFilterChange}
                                onApplyFilters={handleApplyFilters}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </div>
                    
                    {/* Search Bar */}

            <div className="relative flex-grow">
                        <Icons.SearchIcon className={clsx("absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5", isDarkMode ? 'text-gray-400' : 'text-gray-500')}/>
                        <input
                            type="text"
                            placeholder="Search all columns (name, contact, phone, or country)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx("w-full py-3 pl-10 pr-4 border rounded-xl shadow-inner transition duration-300",
                                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            )}
                        />
                    </div>

                    {/* Add Supplier Button / Cancel Button */}
                    {userCanModify && (
                        <button 
                            onClick={toggleAdding}
                            className={clsx("py-3 px-6 rounded-xl font-bold transition duration-300 shadow-md whitespace-nowrap",
                                isAdding 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            )}
                        >
                            {isAdding ? "Cancel" : "➕ Add Supplier"}
                        </button>
                    )}
                </div>
                
                {/* Supplier Form Panel (VISIBLE when adding or editing) */}
                {userCanModify && isAdding && (
                    <SupplierFormPanel 
                        formData={formData} 
                        handleChange={handleChange} 
                        handleSubmit={handleFormSubmit}
                        handleCancel={toggleAdding}
                        isEdit={isEditing}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* Supplier List Table View Section */}
                <div 
                    className={clsx("mt-4 p-6 rounded-2xl shadow-2xl", 
                        isDarkMode ? "bg-slate-800" : "bg-blue-50/70" // Matches the light/dark background style
                    )}
                >
                    <h2 className={clsx("text-xl font-bold mb-4", isDarkMode ? 'text-blue-300' : 'text-slate-800')}>
                        Supplier List ({filteredSuppliers.length} entries)
                    </h2>
                    
                    <SupplierListTable
                        suppliers={filteredSuppliers}
                        isDarkMode={isDarkMode}
                        userCanModify={userCanModify}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default SupplierPage;