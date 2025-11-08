// app/medicine/page.tsx (NEW FILE)
'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { 
    KIBRAN_COLOR, KIBRAN_COLOR_LIGHT, LIGHT_MODE_BACKGROUND_IMAGE, DARK_MODE_BACKGROUND_IMAGE, 
    DARK_OVERLAY, LIGHT_OVERLAY, clsx, Icons, canModifySupplier, UserRole
} from '@/app/lib/constants'; 
import { Medicine, MedicineService } from '@/app/lib/medicine-service';

// --- Interfaces & Initial State ---

interface MedicineFormData extends Omit<Medicine, 'id' | 'stock'> {
    id?: number;
    stock?: number;
}

interface MedicineFilters {
    manufacturer: string;
    genericName: string;
    minStock: string;
    maxPrice: string;
}

const initialFormData: MedicineFormData = {
    name: '',
    genericName: '',
    unit: 'Tablet',
    manufacturer: '',
    purchasePrice: 0.00,
    sellingPrice: 0.00,
    expiryDate: '',
};

const initialFilterCriteria: MedicineFilters = {
    manufacturer: 'All',
    genericName: '',
    minStock: '',
    maxPrice: '',
};

const UNIT_OPTIONS = ['Tablet', 'Capsule', 'Bottle', 'Vial', 'Syrup', 'Other'];
const MANUFACTURER_OPTIONS = ['All', 'Global Pharma', 'Ethio Meds', 'Europe Meds', 'Biotech USA', 'Local Distributors', 'Other'];


// --- 1. MEDICINE FORM PANEL COMPONENT ---

interface MedicineFormPanelProps {
    formData: MedicineFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleCancel: () => void;
    isEdit: boolean;
    isDarkMode: boolean;
}

const MedicineFormPanel: React.FC<MedicineFormPanelProps> = ({ 
    formData, handleChange, handleSubmit, handleCancel, isEdit, isDarkMode 
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
                    {isEdit ? 'Edit Medicine Details' : 'Add New Medicine'}
                </h2>
                <button
                    onClick={handleCancel}
                    className="py-2 px-4 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition duration-300 shadow-md"
                >
                    Cancel
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Row 1: Name, Generic Name, Unit */}
                <div>
                    <label htmlFor="name" className={labelClass}>Trade Name *</label>
                    <input type="text" id="name" name="name" placeholder="e.g., Amoxicillin 500mg" value={formData.name} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="genericName" className={labelClass}>Generic Name *</label>
                    <input type="text" id="genericName" name="genericName" placeholder="e.g., Amoxicillin" value={formData.genericName} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="unit" className={labelClass}>Unit Type *</label>
                    <select id="unit" name="unit" value={formData.unit} onChange={handleChange} className={clsx(inputClass, 'appearance-none cursor-pointer')} required>
                        {UNIT_OPTIONS.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                    </select>
                </div>

                {/* Row 2: Manufacturer, Purchase Price, Selling Price */}
                <div>
                    <label htmlFor="manufacturer" className={labelClass}>Manufacturer *</label>
                    <input type="text" id="manufacturer" name="manufacturer" placeholder="e.g., Global Pharma" value={formData.manufacturer} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="purchasePrice" className={labelClass}>Purchase Price (Per Unit) *</label>
                    <input type="number" id="purchasePrice" name="purchasePrice" placeholder="e.g., 0.15" value={formData.purchasePrice} onChange={handleChange} className={inputClass} step="0.01" min="0" required />
                </div>
                <div>
                    <label htmlFor="sellingPrice" className={labelClass}>Selling Price (Default) *</label>
                    <input type="number" id="sellingPrice" name="sellingPrice" placeholder="e.g., 0.50" value={formData.sellingPrice} onChange={handleChange} className={inputClass} step="0.01" min="0" required />
                </div>

                {/* Row 3: Expiry Date, Current Stock (only if editing) */}
                <div className="md:col-span-1">
                    <label htmlFor="expiryDate" className={labelClass}>Default Expiry Date</label>
                    <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className={inputClass} />
                </div>
                {isEdit && (
                    <div className="md:col-span-1">
                        <label htmlFor="stock" className={labelClass}>Current Stock (Read Only)</label>
                        <input type="number" id="stock" name="stock" value={formData.stock || 0} className={clsx(inputClass, 'bg-gray-200 cursor-not-allowed')} disabled />
                    </div>
                )}
                
                {/* Submit Button (Full Width) */}
                <div className="md:col-span-3 pt-4">
                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl font-bold text-white text-lg transition duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                        style={{ backgroundColor: KIBRAN_COLOR, backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` }}
                    >
                        {isEdit ? 'SAVE CHANGES' : 'ADD MEDICINE'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- 2. MEDICINE LIST TABLE COMPONENT (Inline) ---

interface MedicineListTableProps {
    medicines: Medicine[];
    isDarkMode: boolean;
    userCanModify: boolean;
    onEdit: (medicine: Medicine) => void;
    onDelete: (id: number) => void;
}

const MedicineListTable: React.FC<MedicineListTableProps> = ({ medicines, isDarkMode, userCanModify, onEdit, onDelete }) => {
    const headerClass = clsx("px-4 py-3 text-left text-xs font-medium uppercase tracking-wider", isDarkMode ? 'text-gray-300' : 'text-gray-500');
    const cellClass = clsx("px-4 py-3 whitespace-nowrap text-sm", isDarkMode ? 'text-gray-200' : 'text-gray-900');
    const actionButtonClass = "p-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mx-1";

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className={clsx(isDarkMode ? 'bg-slate-700' : 'bg-gray-100')}>
                    <tr>
                        <th className={headerClass}>ID</th>
                        <th className={headerClass}>Trade Name</th>
                        <th className={headerClass}>Generic Name</th>
                        <th className={headerClass}>Unit</th>
                        <th className={headerClass}>Manufacturer</th>
                        <th className={headerClass}>Stock</th>
                        <th className={headerClass}>P. Price</th>
                        <th className={headerClass}>S. Price</th>
                        <th className={headerClass}>Expiry</th>
                        <th className={headerClass}>Action</th>
                    </tr>
                </thead>
                <tbody className={clsx("divide-y divide-gray-200", isDarkMode ? 'bg-slate-800' : 'bg-white')}>
                    {medicines.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                                No medicines found.
                            </td>
                        </tr>
                    ) : (
                        medicines.map((med) => (
                            <tr key={med.id} className={clsx("hover:bg-opacity-80 transition-colors", isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50')}>
                                <td className={cellClass}>{med.id}</td>
                                <td className={cellClass}>{med.name}</td>
                                <td className={cellClass}>{med.genericName}</td>
                                <td className={cellClass}>{med.unit}</td>
                                <td className={cellClass}>{med.manufacturer}</td>
                                <td className={clsx(cellClass, med.stock < 100 ? 'text-red-500 font-bold' : 'text-green-600')}>{med.stock}</td>
                                <td className={cellClass}>${med.purchasePrice.toFixed(2)}</td>
                                <td className={cellClass}>${med.sellingPrice.toFixed(2)}</td>
                                <td className={clsx(cellClass, new Date(med.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-gray-600')}>{med.expiryDate}</td>
                                
                                <td className={clsx(cellClass, "text-right font-medium flex items-center")}>
                                    {userCanModify ? (
                                        <>
                                            <button 
                                                onClick={() => onEdit(med)} 
                                                className={clsx(actionButtonClass, 'text-blue-600 hover:bg-blue-100')}
                                                title="Edit"
                                            >
                                                <Icons.EditIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(med.id)} 
                                                className={clsx(actionButtonClass, 'text-red-600 hover:bg-red-100')}
                                                title="Delete"
                                            >
                                                <Icons.TrashIcon className="w-5 h-5" />
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

// --- 3. FILTER PANEL COMPONENT (Inline) ---

interface FilterPanelProps {
    currentFilters: MedicineFilters;
    onFilterChange: (name: keyof MedicineFilters, value: string) => void;
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
                
                {/* Filter 1: Manufacturer */}
                <div>
                    <label htmlFor="filter-manufacturer" className={labelClass}>Manufacturer</label>
                    <select 
                        id="filter-manufacturer" 
                        name="manufacturer" 
                        value={currentFilters.manufacturer} 
                        onChange={(e) => onFilterChange('manufacturer', e.target.value)} 
                        className={clsx(inputSelectClass, 'appearance-none cursor-pointer')}
                    >
                        {MANUFACTURER_OPTIONS.map(m => (<option key={m} value={m}>{m}</option>))}
                    </select>
                </div>

                {/* Filter 2: Generic Name */}
                <div>
                    <label htmlFor="filter-genericName" className={labelClass}>Generic Name</label>
                    <input 
                        type="text" 
                        id="filter-genericName" 
                        name="genericName" 
                        placeholder="e.g., Amoxicillin"
                        value={currentFilters.genericName}
                        onChange={(e) => onFilterChange('genericName', e.target.value)} 
                        className={inputSelectClass}
                    />
                </div>

                {/* Filter 3: Min Stock */}
                <div>
                    <label htmlFor="filter-minStock" className={labelClass}>Min Stock Quantity</label>
                    <input 
                        type="number" 
                        id="filter-minStock" 
                        name="minStock" 
                        placeholder="e.g., 100"
                        value={currentFilters.minStock}
                        onChange={(e) => onFilterChange('minStock', e.target.value)} 
                        className={inputSelectClass}
                        min="0"
                    />
                </div>

                {/* Filter 4: Max Selling Price */}
                <div>
                    <label htmlFor="filter-maxPrice" className={labelClass}>Max Selling Price ($)</label>
                    <input 
                        type="number" 
                        id="filter-maxPrice" 
                        name="maxPrice" 
                        placeholder="e.g., 5.00"
                        value={currentFilters.maxPrice}
                        onChange={(e) => onFilterChange('maxPrice', e.target.value)} 
                        className={inputSelectClass}
                        step="0.01"
                        min="0"
                    />
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
// --- 4. MAIN MEDICINE PAGE COMPONENT ---
// ----------------------------------------------------------------------

const MedicinePage = () => {
    const [userRole, setUserRole] = useState<UserRole>('Admin'); 
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const [isAdding, setIsAdding] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); 
    const [searchTerm, setSearchTerm] = useState('');
    const [medicineList, setMedicineList] = useState<Medicine[]>([]); // Dynamic list
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<MedicineFormData>(initialFormData);
    const [filterCriteria, setFilterCriteria] = useState<MedicineFilters>(initialFilterCriteria); 
    const [activeFilters, setActiveFilters] = useState<MedicineFilters>(initialFilterCriteria); 

    const userCanModify = useMemo(() => canModifySupplier(userRole), [userRole]);

    // --- EFFECT: Load Data ---
    useEffect(() => {
        // Load initial data from the service
        setMedicineList(MedicineService.getAllMedicines());
        
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }
    }, []);


    // --- Filtering Logic ---
    const filteredMedicines = useMemo(() => {
        let results = medicineList;
        const activeSearch = searchTerm.toLowerCase();

        // 1. Global Search Term Filtering
        if (activeSearch) {
            results = results.filter(med =>
                med.name.toLowerCase().includes(activeSearch) ||
                med.genericName.toLowerCase().includes(activeSearch) ||
                med.manufacturer.toLowerCase().includes(activeSearch)
            );
        }

        // 2. Filter Criteria Filtering
        const { manufacturer, genericName, minStock, maxPrice } = activeFilters;
        
        // Filter by Manufacturer
        if (manufacturer && manufacturer !== 'All') {
            results = results.filter(med => med.manufacturer === manufacturer);
        }

        // Filter by Generic Name
        if (genericName) {
            const lowerGenericName = genericName.toLowerCase();
            results = results.filter(med => med.genericName.toLowerCase().includes(lowerGenericName));
        }

        // Filter by Minimum Stock
        if (minStock) {
            const minStockNum = parseInt(minStock);
            if (!isNaN(minStockNum)) {
                results = results.filter(med => med.stock >= minStockNum);
            }
        }
        
        // Filter by Maximum Selling Price
        if (maxPrice) {
            const maxPriceNum = parseFloat(maxPrice);
            if (!isNaN(maxPriceNum)) {
                results = results.filter(med => med.sellingPrice <= maxPriceNum);
            }
        }
        
        // Sort by expiry date (oldest first)
        return results.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }, [medicineList, searchTerm, activeFilters]); 

    // --- Form & Filter Handlers ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (name: keyof MedicineFilters, value: string) => {
        setFilterCriteria(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterCriteria); 
        setIsFilterPanelOpen(false); 
    };
    
    const toggleFilterPanel = () => {
        setIsFilterPanelOpen(prev => !prev);
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

        // Basic validation
        if (!formData.name.trim() || !formData.genericName.trim() || formData.purchasePrice <= 0 || formData.sellingPrice <= 0) {
            alert("Please fill in all required fields and ensure prices are greater than zero.");
            return;
        }

        // Construct the full Medicine object
        const dataToSave: Medicine = {
            id: isEditing && formData.id ? formData.id : Math.max(0, ...medicineList.map(m => m.id)) + 1,
            name: formData.name,
            genericName: formData.genericName,
            unit: formData.unit,
            manufacturer: formData.manufacturer,
            purchasePrice: parseFloat(formData.purchasePrice.toString()),
            sellingPrice: parseFloat(formData.sellingPrice.toString()),
            expiryDate: formData.expiryDate || 'N/A',
            stock: isEditing ? medicineList.find(m => m.id === formData.id)?.stock || 0 : 0 // Stock is 0 for new medicine
        } as Medicine;

        if (isEditing) {
            // Update an existing item
            setMedicineList(prev => prev.map(med => med.id === dataToSave.id ? dataToSave : med));
            setIsEditing(false);
        } else {
            // Add new item
            setMedicineList(prev => [dataToSave, ...prev]);
        }

        setFormData(initialFormData);
        setIsAdding(false);
    };

    const toggleAdding = () => {
        setIsAdding(prev => !prev);
        setIsEditing(false);
        setFormData(initialFormData); // Reset form on cancel
    };

    const handleEdit = (medicine: Medicine) => {
        if (!userCanModify) return alert("Permission denied.");
        setFormData(medicine);
        setIsEditing(true);
        setIsAdding(true); // Open the form in edit mode
    };

    const handleDelete = (id: number) => {
        if (!userCanModify) return alert("Permission denied.");
        if (window.confirm("Are you sure you want to delete this medicine? This will affect stock records.")) {
            setMedicineList(prev => prev.filter(med => med.id !== id));
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
                    Medicine Catalog Management
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
                            placeholder="Search by trade name, generic name, or manufacturer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx("w-full py-3 pl-10 pr-4 border rounded-xl shadow-inner transition duration-300",
                                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            )}
                        />
                    </div>

                    {/* Add Medicine Button / Cancel Button */}
                    {userCanModify && (
                        <button 
                            onClick={toggleAdding}
                            className={clsx("py-3 px-6 rounded-xl font-bold transition duration-300 shadow-md whitespace-nowrap",
                                isAdding 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            )}
                        >
                            {isAdding ? "Cancel" : "➕ Add Medicine"}
                        </button>
                    )}
                </div>
                
                {/* Medicine Form Panel (VISIBLE when adding or editing) */}
                {userCanModify && isAdding && (
                    <MedicineFormPanel 
                        formData={formData} 
                        handleChange={handleChange} 
                        handleSubmit={handleFormSubmit}
                        handleCancel={toggleAdding}
                        isEdit={isEditing}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* Medicine List Table View Section */}
                <div 
                    className={clsx("mt-4 p-6 rounded-2xl shadow-2xl", 
                        isDarkMode ? "bg-slate-800" : "bg-blue-50/70"
                    )}
                >
                    <h2 className={clsx("text-xl font-bold mb-4", isDarkMode ? 'text-blue-300' : 'text-slate-800')}>
                        Medicine List ({filteredMedicines.length} items)
                    </h2>
                    
                    <MedicineListTable
                        medicines={filteredMedicines}
                        isDarkMode={isDarkMode}
                        userCanModify={userCanModify}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default MedicinePage;