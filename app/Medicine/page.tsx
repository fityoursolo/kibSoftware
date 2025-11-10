'use client'
import { Medicine, mockDropdowns, DropdownOptions, getFullMedicineList } from '../lib/medicine-data';
import React, { useState, useMemo, useRef, useEffect } from 'react';
// --- Global Constants ---
const KIBRAN_COLOR = '#4338CA'; // Indigo-700
const KIBRAN_COLOR_LIGHT = '#6366F1'; // Indigo-500
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg';
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg';
const DARK_OVERLAY = 'rgba(15, 23, 42, 0.7)';
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.7)';

// --- Utility ---
const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// --- Auth Mock (Kept for internal permission logic, as UI role selector is removed) ---
type UserRole = 'Admin' | 'StoreKeeper' | 'Guest';
const canModifyMedicine = (role: UserRole) => role === 'Admin' || role === 'StoreKeeper';

// --- Icon Definitions (Internalized) ---
const createIcon = (iconContent: React.ReactNode) => {
    const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{iconContent}</svg>
    );
    IconComponent.displayName = 'SvgIcon'; 
    return IconComponent;
};

    const SearchIcon = createIcon(<>
        <path d="m21 21-3.6-3.6"/>
        <circle cx="11" cy="11" r="8"/>
    </>);
    const FilterIcon = createIcon(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>);
    const SunIcon = createIcon(<>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="m4.9 4.9 1.4 1.4"/>
        <path d="m17.7 17.7 1.4 1.4"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
        <path d="m6.3 17.7-1.4 1.4"/>
        <path d="m19.1 4.9-1.4 1.4"/>
    </>);
    const MoonIcon = createIcon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>);
    const EditIcon = createIcon(<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>);
    const DeleteIcon = createIcon(<>
        <path d="M10 11v6"/>
        <path d="M14 11v6"/>
        <path d="M4 7h16"/>
        <path d="m6 7 1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/>
        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    </>);
    const CopyIcon = createIcon(<>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1-1.1-2-2.5-2-4 0-4.4 3.6-8 8-8h5"/>
    </>);
    const PackageIcon = createIcon(<path d="m7.5 4.2.9 5.4v9.6c0 .5.3.8-.4.8-.9v9.6l.9-5.4Z"/>);
    const CalendarIcon = createIcon(<>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <path d="M16 2v2"/>
        <path d="M8 2v2"/>
        <path d="M3 10h18"/>
    </>);
    const DollarSignIcon = createIcon(<>
        <path d="M12 2v20"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </>);
    const CheckIcon = createIcon(<path d="M20 6 9 17l-5-5"/>);
    const InfoIcon = createIcon(<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>);
    const GlobeIcon = createIcon(<><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>);
    const DropdownArrowIcon = createIcon(<path d="m7 10 5 5 5-5"/>);

    const Icons = { 
        SearchIcon, FilterIcon, SunIcon, MoonIcon, EditIcon, DeleteIcon, CopyIcon,
        PackageIcon, CalendarIcon, DollarSignIcon, CheckIcon, InfoIcon, GlobeIcon, DropdownArrowIcon
    };
    
    // --- Initial Data Safety Checks (CRITICAL FIX: Removed direct indexing) ---
    // The initial values will be an empty string, letting the `renderDropdown` use the placeholder.
    const initialCategory = ''; 
    const initialType = '';
    const initialUnit = '';
    const initialCountry = '';
    // --- END Initial Data Safety Checks ---

    const initialFormData: Omit<Medicine, 'id'> & { buyingPrice: string | number, sellingPrice: string | number } = { 
        name: '', category: initialCategory, type: initialType, 
        batchNumber: '', manufacturer: '', expiryDate: '', unit: initialUnit,
        buyingPrice: '', sellingPrice: '', country: initialCountry 
    };

    // --- Sub-Component: MedicineForm ---
    interface MedicineFormProps {
        formData: unknown;
        handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
        handleSubmit: (e: React.FormEvent) => void;
        dropdownOptions: typeof mockDropdowns;
        isEdit: boolean;
        isDarkMode: boolean;
    }

    const MedicineForm: React.FC<MedicineFormProps> = ({ 
        formData, 
        handleChange, 
        handleSubmit, 
        dropdownOptions, 
        isEdit, 
        isDarkMode 
    }) => {
        // Corrected inputClass padding to ensure icon space
        const inputClass = clsx("p-3 pl-10 border rounded-xl shadow-inner transition duration-300 w-full text-sm",
            isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        );
        const labelClass = clsx("block text-sm font-medium mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-700');
        const requiredSymbol = <span className="text-red-500">*</span>;
        
        // Icon positioning fixed using top-[35px] (after the label)
        const iconBaseClass = clsx("w-5 h-5 absolute left-3 top-[35px] pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500');
        const dropdownArrowClass = clsx("w-4 h-4 absolute right-3 top-[37px] pointer-events-none", isDarkMode ? 'text-gray-400' : 'text-gray-500');


        const renderInput = (name: keyof typeof initialFormData, label: string, type: string = 'text', Icon: React.FC<{className: string}>) => (
            <div className="relative">
                <label htmlFor={name} className={labelClass}>{label} {requiredSymbol}</label>
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    min={type === 'number' ? 0 : undefined}
                    placeholder={
                        name === 'name' ? 'e.g. Paracetamol 500mg' :
                        name === 'batchNumber' ? 'e.g. BTX-54321' :
                        name === 'manufacturer' ? 'e.g. Bayer or Highnoon' :
                        name === 'buyingPrice' ? '0.00' :
                        name === 'sellingPrice' ? '0.00' :
                        undefined
                    }
                />
                <Icon className={iconBaseClass} />
            </div>
        );

        const renderDropdown = (name: keyof typeof initialFormData, label: string, options: string[], Icon: React.FC<{className: string}>) => (
            <div className="relative">
                <label htmlFor={name} className={labelClass}>{label} {requiredSymbol}</label>
                <select
                    id={name}
                    name={name}
                    value={formData[name] || ''} // Use empty string for initial state
                    onChange={handleChange}
                    required
                    // Ensure the dropdown has the same padding/class as the input
                    className={clsx(inputClass, 'appearance-none')} 
                >
                    <option value="" disabled>{`Select ${label}`}</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                {/* The icon class ensures vertical alignment next to the input's content */}
                <Icon className={iconBaseClass} /> 
                <Icons.DropdownArrowIcon className={dropdownArrowClass} />
            </div>
        );

        const renderDateInput = (name: keyof typeof initialFormData, label: string, Icon: React.FC<{className: string}>) => (
            <div className="relative">
                <label htmlFor={name} className={labelClass}>{label} {requiredSymbol}</label>
                <input
                    id={name}
                    type="date"
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    required
                    // Ensure the date input has the same padding/class as the regular input
                    className={clsx(inputClass, 'appearance-none')} 
                    placeholder="mm/dd/yyyy"
                />
                {/* Calendar icon position fixed for date input */}
                <Icon className={iconBaseClass} /> 
            </div>
        );

        return (
            <form 
                onSubmit={handleSubmit} 
                className={clsx("p-6 rounded-2xl shadow-2xl transition-all duration-500", 
                    isDarkMode ? "bg-slate-800 border border-blue-600" : "bg-white border border-indigo-300"
                )}
            >
                <h2 className={clsx("text-2xl font-bold mb-6", isDarkMode ? 'text-blue-400' : 'text-indigo-800')}>
                    {isEdit ? "Edit Medicine Record" : "Add New Medicine"}
                </h2>
                {/* MODIFIED: Changed layout to grid-cols-2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Column 1 */}
                    {renderInput('name', 'Name', 'text', Icons.PackageIcon)}
                    {renderInput('batchNumber', 'Batch Number', 'text', Icons.CheckIcon)}
                    
                    {/* Column 2 */}
                    {renderInput('manufacturer', 'Manufacturer', 'text', Icons.InfoIcon)}
                    {renderDateInput('expiryDate', 'Expiry Date', Icons.CalendarIcon)}
                    
                    {/* Column 3 */}
                    {renderInput('buyingPrice', 'Buying Price (Unit Cost)', 'number', Icons.DollarSignIcon)}
                    {renderInput('sellingPrice', 'Selling Price (Sale Price)', 'number', Icons.DollarSignIcon)}
                    
                    {/* Column 4 */}
                    {renderDropdown('category', 'Category', dropdownOptions.categories, Icons.InfoIcon)}
                    {renderDropdown('type', 'Type (Form)', dropdownOptions.types, Icons.PackageIcon)}
                    
                    {/* Column 5 */}
                    {renderDropdown('unit', 'Selling Unit', dropdownOptions.units, Icons.PackageIcon)}
                    {renderDropdown('country', 'Country of Origin', dropdownOptions.countries, Icons.GlobeIcon)}
                </div>

                <div className="mt-8">
                    <button 
                        type="submit"
                        className={clsx("w-full py-3 px-6 rounded-xl font-bold transition duration-300 shadow-lg text-white",
                            isEdit 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-green-600 hover:bg-green-700'
                        )}
                    >
                        {isEdit ? "Update Medicine" : "Save Medicine"}
                    </button>
                </div>
            </form>
        );
    };


    // --- Filter Components (No changes needed here) ---
    interface FilterProps {
        filterKey: string;
        label: string;
        value: string;
        isDarkMode: boolean;
        onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
        options?: string[]; // Only for Dropdown
        placeholder?: string;
    }

    const FilterDropdown: React.FC<FilterProps & { options: string[] }> = 
        ({ filterKey, label, value, isDarkMode, onChange, options }) => {
        
        const selectClass = clsx("py-2 px-3 border rounded-lg shadow-inner transition duration-300 text-sm w-full",
            isDarkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        );

        return (
            <div className="w-full"> 
                <label className={clsx("block text-xs font-semibold mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                    {label}
                </label>
                <select
                    name={filterKey}
                    value={value}
                    onChange={onChange}
                    className={selectClass}
                >
                    <option value="">{`All ${label}s`}</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        );
    };

    const FilterTextInput: React.FC<FilterProps> = 
        ({ filterKey, label, value, isDarkMode, onChange, placeholder }) => {
        
        const inputClass = clsx("py-2 px-3 border rounded-lg shadow-inner transition duration-300 text-sm w-full",
            isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        );

        return (
            <div className="w-full">
                <label className={clsx("block text-xs font-semibold mb-1", isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                    {label}
                </label>
                <input
                    type="text"
                    id={filterKey}
                    name={filterKey}
                    placeholder={placeholder}
                    value={value} 
                    onChange={onChange}
                    className={inputClass}
                />
            </div>
        );
    };

    // --- Sub-Component: Medicine List Table (No changes needed here) ---
    interface MedicineListTableProps {
        medicines: Medicine[];
        isDarkMode: boolean;
        userCanModify: boolean;
        onEdit: (medicine: Medicine) => void;
        onDelete: (id: number) => void;
        onCopy: (medicine: Medicine) => void;
        isLoading: boolean;
    }

    const MedicineListTable: React.FC<MedicineListTableProps> = ({ medicines, isDarkMode, userCanModify, onEdit, onDelete, onCopy, isLoading }) => {
        const headerClass = clsx("px-4 py-3 text-left text-xs font-medium uppercase tracking-wider", isDarkMode ? 'text-gray-300' : 'text-gray-500');
        const cellClass = clsx("px-4 py-3 whitespace-nowrap text-sm", isDarkMode ? 'text-gray-200' : 'text-gray-900');
        const actionButtonClass = "p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 mx-1";
        const iconSizeClass = "w-6 h-6"; 
        const loadingTextClass = clsx("px-6 py-4 text-center text-sm", isDarkMode ? 'text-indigo-400' : 'text-indigo-600', 'font-semibold');

        const tableContent = () => {
            if (isLoading) {
                return (
                    <tr>
                        <td colSpan={11} className={loadingTextClass}>
                            <div className="flex items-center justify-center space-x-2 py-8">
                                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading medicine data...</span>
                            </div>
                        </td>
                    </tr>
                );
            }

            if (medicines.length === 0) {
                return (
                    <tr>
                        <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                            No medicines found matching the current criteria.
                        </td>
                    </tr>
                );
            }

            return medicines.map((med, index) => (
                <tr key={med.id} className={clsx("hover:bg-opacity-80 transition-colors", isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50')}>
                    <td className={cellClass}>{index + 1}</td>
                    <td className={cellClass}>{med.name}</td>
                    <td className={cellClass}>{med.batchNumber}</td>
                    <td className={cellClass}>{med.category}</td>
                    <td className={cellClass}>{med.unit}</td>
                    <td className={cellClass}>${med.buyingPrice.toFixed(2)}</td>
                    <td className={cellClass}>${med.sellingPrice.toFixed(2)}</td>
                    <td className={cellClass}>{med.expiryDate}</td>
                    <td className={cellClass}>{med.manufacturer}</td>
                    <td className={cellClass}>{med.country}</td>
                    <td className={clsx(cellClass, "text-right font-medium flex items-center")}>
                        {userCanModify ? (
                            <>
                                <button 
                                    onClick={() => onEdit(med)} 
                                    className={clsx(actionButtonClass, 'text-blue-500 hover:bg-blue-100 dark:hover:bg-slate-700')}
                                    title="Edit"
                                >
                                    <Icons.EditIcon className={iconSizeClass} />
                                </button>
                                <button 
                                    onClick={() => onDelete(med.id)} 
                                    className={clsx(actionButtonClass, 'text-red-500 hover:bg-red-100 dark:hover:bg-slate-700')}
                                    title="Delete"
                                >
                                    <Icons.DeleteIcon className={iconSizeClass} />
                                </button>
                                <button 
                                    onClick={() => onCopy(med)} 
                                    className={clsx(actionButtonClass, 'text-green-500 hover:bg-green-100 dark:hover:bg-slate-700')}
                                    title="Copy Details"
                                >
                                    <Icons.CopyIcon className={iconSizeClass} />
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-500 italic">No Actions</span>
                        )}
                    </td>
                </tr>
            ));
        };

        return (
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={clsx(isDarkMode ? 'bg-slate-700' : 'bg-gray-100')}>
                        <tr>
                            <th className={headerClass}>SL.</th>
                            <th className={headerClass}>Name</th>
                            <th className={headerClass}>Batch No.</th>
                            <th className={headerClass}>Category</th>
                            <th className={headerClass}>Unit</th>
                            <th className={headerClass}>Price (Buy)</th>
                            <th className={headerClass}>Price (Sell)</th>
                            <th className={headerClass}>Expiry Date</th>
                            <th className={headerClass}>Manufacturer</th>
                            <th className={headerClass}>Country</th>
                            <th className={headerClass}>Action</th>
                        </tr>
                    </thead>
                    <tbody className={clsx("divide-y divide-gray-200", isDarkMode ? 'bg-slate-800' : 'bg-white')}>
                        {tableContent()}
                    </tbody>
                </table>
            </div>
        );
    };

    // --- Other Utility Components (No changes needed here) ---
    interface NotificationProps { message: string; type: 'success' | 'error'; onClose: () => void; }
    const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
        const baseClass = "fixed bottom-4 right-4 z-[100] p-4 rounded-xl shadow-2xl text-white font-semibold flex items-center space-x-3 transition-transform duration-300 transform translate-x-0";
        const typeClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        return (
            <div className={clsx(baseClass, typeClass)}>
                <span>{message}</span>
                <button onClick={onClose} className="text-sm font-bold opacity-80 hover:opacity-100 ml-2">
                    &times;
                </button>
            </div>
        );
    };

    interface ConfirmationModalProps { message: string; onConfirm: () => void; onCancel: () => void; isDarkMode: boolean; }
    const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel, isDarkMode }) => {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className={clsx("p-6 rounded-xl shadow-2xl max-w-sm w-full", isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900')}>
                    <h3 className="text-xl font-bold mb-4">Confirm Action</h3>
                    <p className="mb-6">{message}</p>
                    <div className="flex justify-end space-x-3">
                        <button 
                            onClick={onCancel} 
                            className={clsx("py-2 px-4 rounded-lg font-semibold transition duration-200", isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className="py-2 px-4 rounded-lg font-semibold transition duration-200 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    // --- Main Page Component: MedicinePage ---
    const MedicinePage = () => {
        // --- State setup ---
        const [userRole, setUserRole] = useState<UserRole>('Admin'); // Role state for internal permission checks
        const [isDarkMode, setIsDarkMode] = useState(false); 
        const [isAdding, setIsAdding] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [medicineList, setMedicineList] = useState<Medicine[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [isEditing, setIsEditing] = useState(false);
        const [formData, setFormData] = useState<unknown>(initialFormData);
        
        // UI Feedback/Action States
        const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
        const [confirmAction, setConfirmAction] = useState<{ id: number; name: string; action: 'delete' } | null>(null);

        // Filter state - MODIFIED: Re-added manufacturer
        const [appliedFilters, setAppliedFilters] = useState<{ manufacturer: string; country: string; category: string; type: string; unit: string }>({ 
            manufacturer: '', country: '', category: '', type: '', unit: ''   
        });
        const [stagedFilters, setStagedFilters] = useState(appliedFilters);
        const [showFilters, setShowFilters] = useState(false); 
        const filterContainerRef = useRef<HTMLDivElement>(null);

        const userCanModify = useMemo(() => canModifyMedicine(userRole), [userRole]);
        
        // Close filter panel when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
                    setShowFilters(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);
        // --- End Effects/Logic ---

        // Notification utility function
        const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
            setNotification({ message, type });
            setTimeout(() => setNotification(null), 3500);
        };
        
        // Data Fetching Effect (No changes needed here)
        useEffect(() => {
            setIsLoading(true);
            getFullMedicineList()
                .then(data => { setMedicineList(data); })
                .catch(error => { console.error("Error fetching mock data:", error); showNotification("Failed to load initial data.", 'error'); })
                .finally(() => { setIsLoading(false); });
        }, []); 

        // Filter Logic
        const filterOptions = useMemo(() => {
            const uniqueCountries = new Set<string>();
            const uniqueCategories = new Set<string>();
            const uniqueTypes = new Set<string>(); 
            const uniqueUnits = new Set<string>();   
            medicineList.forEach(med => {
                uniqueCountries.add(med.country); uniqueCategories.add(med.category);
                uniqueTypes.add(med.type); uniqueUnits.add(med.unit);    
            });
            return {
                countries: Array.from(uniqueCountries).sort(), categories: Array.from(uniqueCategories).sort(),
                types: Array.from(uniqueTypes).sort(), units: Array.from(uniqueUnits).sort(),      
            };
        }, [medicineList]);

        const filteredMedicines = useMemo(() => {
            let list = medicineList;

            // 1. Filter by Search Term (Name, Manufacturer, Batch No.)
            if (searchTerm) {
                const lowerCaseSearch = searchTerm.toLowerCase();
                list = list.filter(med =>
                    med.name.toLowerCase().includes(lowerCaseSearch) ||
                    // med.manufacturer.toLowerCase().includes(lowerCaseSearch) || 
                    med.batchNumber.toLowerCase().includes(lowerCaseSearch)
                );
            }

            // 2. Filter by Applied Dropdown Filters (Manufacturer filter added back for appliedFilters)
            if (appliedFilters.manufacturer) {
                list = list.filter(med => med.manufacturer.toLowerCase().includes(appliedFilters.manufacturer.toLowerCase()));
            }

            if (appliedFilters.country) {
                list = list.filter(med => med.country === appliedFilters.country);
            }

            if (appliedFilters.category) {
                list = list.filter(med => med.category === appliedFilters.category);
            }
            
            if (appliedFilters.type) {
                list = list.filter(med => med.type === appliedFilters.type);
            }

            if (appliedFilters.unit) {
                list = list.filter(med => med.unit === appliedFilters.unit);
            }

            return list;
        }, [medicineList, searchTerm, appliedFilters]); 

        const handleStagedFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const { name, value } = e.target;
            setStagedFilters(prev => ({ ...prev, [name]: value === 'All' ? '' : value }));
        };

        const handleApplyFilters = () => {
            setAppliedFilters(stagedFilters);
            setShowFilters(false);
        }
        
        // Other Handlers (No changes needed here)
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            const processedValue = (type === 'number' && value === '') ? '' : value; 
            setFormData((prev: any) => ({ ...prev, [name]: processedValue }));
        };

        const handleFormSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!userCanModify) {
                showNotification("Permission denied. Only Admins/Store Keepers can modify records.", 'error');
                return;
            }
            const newMedicine = {
                ...formData,
                buyingPrice: parseFloat(formData.buyingPrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                id: isEditing ? formData.id : Math.max(0, ...medicineList.map(m => m.id)) + 1,
            };                                                   
            
            if (isEditing) {
                setMedicineList(prev => prev.map(med => med.id === newMedicine.id ? newMedicine : med));
                showNotification(`Medicine '${newMedicine.name}' updated successfully.`);
                setIsEditing(false);
            } else {
                setMedicineList(prev => [newMedicine, ...prev]); 
                showNotification(`New medicine '${newMedicine.name}' added successfully.`);
            }
            setFormData(initialFormData);
            setIsAdding(false);
        };

        const handleEdit = (medicine: Medicine) => {
            if (!userCanModify) return showNotification("Permission denied.", 'error');
            setFormData({ 
                ...medicine, 
                buyingPrice: String(medicine.buyingPrice), sellingPrice: String(medicine.sellingPrice)
            });
            setIsEditing(true);
            setIsAdding(true); 
        };

        const handleDelete = (id: number) => {
            const medToDelete = medicineList.find(m => m.id === id);
            if (!userCanModify) return showNotification("Permission denied.", 'error');
            if (medToDelete) {
                setConfirmAction({ id, name: medToDelete.name, action: 'delete' });
            }
        };

        const confirmDelete = () => {
            if (confirmAction) {
                setMedicineList(prev => prev.filter(med => med.id !== confirmAction.id));
                showNotification(`Medicine '${confirmAction.name}' deleted successfully.`, 'success');
                setConfirmAction(null);
            }
        };
        
        const handleCopy = async (medicine: Medicine) => {
            if (!userCanModify) return showNotification("Permission denied. Only Admins/Store Keepers can perform this action.", 'error');
            const detailsToCopy = 
                `Medicine Name: ${medicine.name}\nBatch Number: ${medicine.batchNumber}\nCategory: ${medicine.category}\nUnit: ${medicine.unit}\nBuying Price: $${medicine.buyingPrice.toFixed(2)}\nSelling Price: $${medicine.sellingPrice.toFixed(2)}\nExpiry Date: ${medicine.expiryDate}\nManufacturer: ${medicine.manufacturer}\nCountry: ${medicine.country}`;
            try {
                await navigator.clipboard.writeText(detailsToCopy);
                showNotification(`Details for ${medicine.name} copied to clipboard!`, 'success');
            } catch (err) {
                showNotification('Failed to copy details.', 'error');
            }
        };
        
        // --- Render Logic ---
        const bgColor = isDarkMode ? 'bg-slate-900' : 'bg-gray-100';
        const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
        const cardBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
        
        // Background and Overlay - MODIFIED: Conditional styling for background image and overlay
        const currentBackgroundImage = isDarkMode ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE;
        const currentOverlayColor = isDarkMode ? DARK_OVERLAY : LIGHT_OVERLAY;

        const fixedBackgroundStyle = {
            backgroundImage: `url(${currentBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };
        const overlayColorStyle = { backgroundColor: currentOverlayColor };


        return (
            <div className={clsx("min-h-screen relative p-4 sm:p-8", bgColor)}>
                
                {/* Fixed Background Image and Overlay */}
                <div className="fixed inset-0 w-full h-full z-0" style={fixedBackgroundStyle} />
                <div className="fixed inset-0 w-full h-full z-0" style={overlayColorStyle} />
                
                <button 
                    onClick={() => setIsDarkMode(prev => !prev)} 
                    className="fixed top-6 right-6 p-3 rounded-full text-xl z-20 bg-white dark:bg-gray-700 shadow-lg text-indigo-600 dark:text-yellow-400 hover:scale-110 transition-transform duration-200 ease-in-out" 
                    aria-label="Toggle dark/light mode"
                >
                    {isDarkMode ? <Icons.SunIcon className="w-6 h-6" /> : <Icons.MoonIcon className="w-6 h-6" />}
                </button>

                {/* Main Content Container */}
                <div className={clsx("max-w-7xl mx-auto p-6 md:p-10 rounded-2xl shadow-2xl z-10 relative", cardBg, textColor)}>
                    
                    {/* Header and Add Button */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                             Medicine Inventory
                        </h1>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => setIsAdding(true)}
                                disabled={!userCanModify}
                                className={clsx("py-2.5 px-5 rounded-xl font-semibold shadow-md transition duration-200", 
                                    userCanModify 
                                        ? 'bg-green-600 text-white hover:bg-green-700' 
                                        : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                )}
                            >
                                ➕ Add Medicine
                            </button>
                        </div>
                    </div>

                    {/* Search Bar and Filter Toggle Container */}
                    <div className="mb-8 relative" ref={filterContainerRef}>
                        <div className={clsx("flex items-center w-full py-1.5 pl-4 pr-1 rounded-xl shadow-lg transition duration-300", isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-300')}>
                            
                            {/* Filter Icon Button */}
                            <button 
                                onClick={() => {
                                    setShowFilters(prev => !prev);
                                    if(!showFilters) setStagedFilters(appliedFilters); 
                                }}
                                className={clsx("p-2 rounded-lg transition duration-200", isDarkMode ? 'text-indigo-400 hover:bg-slate-600' : 'text-indigo-600 hover:bg-gray-100')}
                                title="Toggle Filters"
                            >
                                <Icons.FilterIcon className="w-5 h-5"/>
                            </button>

                            {/* Search Input */}
                            <input
                                type="text"
                                placeholder="Search by name, manufacturer, or batch number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={clsx("flex-1 px-4 py-2 border-none focus:ring-0 text-base", isDarkMode ? 'bg-slate-700 text-white placeholder-gray-400' : 'bg-white text-gray-900')}
                            />
                        </div>

                        {/* Floating Filter Panel - MODIFIED: Re-added Manufacturer and adjusted layout */}
                        {showFilters && (
                            <div className={clsx("absolute top-full left-0 mt-2 p-6 rounded-xl shadow-2xl z-30 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 transition-opacity duration-300", 
                                isDarkMode ? 'bg-slate-800 border border-indigo-600' : 'bg-white border border-gray-200'
                            )}>
                                {/* Filter Row 1: Manufacturer (Text Input) and Country (Dropdown) */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* <FilterTextInput 
                                        filterKey="manufacturer"
                                        label="Manufacturer"
                                        value={stagedFilters.manufacturer}
                                        isDarkMode={isDarkMode}
                                        onChange={handleStagedFilterChange}
                                        placeholder="Type manufacturer name..."
                                    /> */}
                                    <FilterDropdown 
                                        filterKey="country"
                                        label="Country"
                                        value={stagedFilters.country}
                                        isDarkMode={isDarkMode}
                                        onChange={handleStagedFilterChange}
                                        options={filterOptions.countries}
                                    />
                                </div>
                                {/* Filter Row 2: Category and Type */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <FilterDropdown 
                                        filterKey="category"
                                        label="Category"
                                        value={stagedFilters.category}
                                        isDarkMode={isDarkMode}
                                        onChange={handleStagedFilterChange}
                                        options={filterOptions.categories}
                                    />
                                    <FilterDropdown 
                                        filterKey="type"
                                        label="Type"
                                        value={stagedFilters.type}
                                        isDarkMode={isDarkMode}
                                        onChange={handleStagedFilterChange}
                                        options={filterOptions.types}
                                    />
                                </div>
                                {/* Filter Row 3: Unit */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <FilterDropdown 
                                        filterKey="unit"
                                        label="Unit"
                                        value={stagedFilters.unit}
                                        isDarkMode={isDarkMode}
                                        onChange={handleStagedFilterChange}
                                        options={filterOptions.units}
                                    />
                                    <div></div> {/* Placeholder to maintain two-column structure */}
                                </div>

                                {/* Apply Filters Button */}
                                <button 
                                    onClick={handleApplyFilters}
                                    className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200 shadow-lg"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Medicine List Table */}
                    <MedicineListTable
                        medicines={filteredMedicines}
                        isDarkMode={isDarkMode}
                        userCanModify={userCanModify}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        isLoading={isLoading}
                    />
                </div>
                
                {/* Modals and Notifications */}
                {isAdding && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <MedicineForm 
                                formData={formData}
                                handleChange={handleChange}
                                handleSubmit={handleFormSubmit}
                                dropdownOptions={mockDropdowns}
                                isEdit={isEditing}
                                isDarkMode={isDarkMode}
                            />
                            <div className="flex justify-center mt-4">
                                <button 
                                    onClick={() => {
                                        setIsAdding(false); 
                                        setIsEditing(false);
                                        setFormData(initialFormData);
                                    }}
                                    className="py-2 px-4 rounded-xl font-semibold bg-gray-500 text-white hover:bg-gray-600 transition duration-200"
                                >
                                    Close Form
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {confirmAction && (
                    <ConfirmationModal
                        message={`Are you sure you want to delete the medicine record for: ${confirmAction.name}? This action cannot be undone.`}
                        onConfirm={confirmDelete}
                        onCancel={() => setConfirmAction(null)}
                        isDarkMode={isDarkMode}
                    />
                )}

                {notification && (
                    <Notification 
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </div>
        );
    };

    export default MedicinePage;