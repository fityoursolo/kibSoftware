// 'use client';
// import React, { useState, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// // ✅ Import deleteMedicine from the context
// import { useInventory, InventoryProvider, Medicine } from '../../inventorycontext'; 
// // NOTE: Assuming these imports are available from your global layout/wrapper
// import { useTheme, ThemeProvider, useToast, ToastProviderWrapper } from '../../page';

// // --- UTILITY ---
// const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// // --- CONFIG ---
// const ITEMS_PER_PAGE = 10;

// // --- CORE COMPONENT ---
// const InventoryListCore = () => {
//     const router = useRouter();
//     const { theme } = useTheme();
//     const toast = useToast();

//     // ✅ Use Inventory Context and destructure deleteMedicine and isMutating
//     const { 
//         medicines: allMedicines, 
//         isLoading, 
//         isError,
//         isMutating, // Used for disabling buttons during any mutation
//         deleteMedicine, // The new delete function!
//     } = useInventory();
    
//     // --- State Management ---
//     const [searchQuery, setSearchQuery] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);

//     // --- Data Filtering and Pagination (Memoized) ---
//     const filteredMedicines = useMemo(() => {
//         if (!allMedicines) return [];

//         const query = searchQuery.toLowerCase().trim();
//         if (!query) return allMedicines;

//         // Filter based on medicine name, batch number, or category
//         return allMedicines.filter(m =>
//             m.name.toLowerCase().includes(query) ||
//             m.batchNumber.toLowerCase().includes(query) ||
//             m.category.toLowerCase().includes(query)
//         );
//     }, [allMedicines, searchQuery]);
    
//     const paginatedMedicines = useMemo(() => {
//         const start = (currentPage - 1) * ITEMS_PER_PAGE;
//         const end = start + ITEMS_PER_PAGE;
//         return filteredMedicines.slice(start, end);
//     }, [filteredMedicines, currentPage]);

//     const totalPages = Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE);

//     // --- Handlers ---
//     const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSearchQuery(e.target.value);
//         setCurrentPage(1); // Reset to first page on new search
//     };

//     const handlePageChange = useCallback((page: number) => {
//         if (page > 0 && page <= totalPages) {
//             setCurrentPage(page);
//         }
//     }, [totalPages]);

//     // ✅ NEW: Delete Handler
//     const handleDelete = async (id: number, name: string) => {
//         if (isMutating) return; // Prevent multiple deletions
        
//         // Use standard JS confirm for simplicity, or replace with a custom modal
//         const confirmed = window.confirm(`Are you sure you want to delete the medicine: "${name}" (ID: ${id})? This action cannot be undone.`);
        
//         if (confirmed) {
//             try {
//                 // Call the delete mutation from context
//                 await deleteMedicine({ id });
//                 toast.success(`Medicine "${name}" deleted successfully.`);
//             } catch (error) {
//                 console.error("Deletion failed:", error);
//                 toast.error(`Failed to delete medicine: ${name}.`);
//             }
//         }
//     };


//     // --- UI/Theming Helpers ---
//     const isDark = theme === 'dark';
//     const tableHeaderClass = clsx("py-3 px-4 font-semibold text-xs uppercase tracking-wider", isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100');
//     const tableRowClass = clsx("border-b", isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50');
//     const textPrimary = isDark ? 'text-white' : 'text-gray-900';
//     const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

//     // --- Loading and Error States ---
//     if (isLoading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <p className="text-2xl text-green-500">Loading Inventory Data...</p>
//             </div>
//         );
//     }

//     if (isError) {
//         return (
//             <div className="min-h-screen p-8 text-center bg-red-50 dark:bg-red-900/20">
//                 <p className="text-xl font-bold text-red-600 dark:text-red-400">
//                     🔴 Error loading inventory data. Please check the console.
//                 </p>
//             </div>
//         );
//     }
    
//     // Check if the overall list is empty
//     const isListEmpty = !allMedicines || allMedicines.length === 0;

//     return (
//         <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
//             <div className="max-w-7xl mx-auto">
                
//                 {/* Header and Controls */}
//                 <div className="flex justify-between items-center mb-6">
//                     <h1 className={clsx("text-3xl font-bold flex items-center", textPrimary)}>
//                         💊 Inventory Stock List
//                     </h1>
//                     <div className="flex space-x-3">
//                         <button
//                             onClick={() => router.push('/inventory/create')}
//                             className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-150 flex items-center space-x-2"
//                             disabled={isMutating} // Disable if any mutation is pending
//                         >
//                             <span>+ Add Medicine</span>
//                         </button>
//                     </div>
//                 </div>

//                 {/* Search Bar */}
//                 <div className="mb-6 flex space-x-4">
//                     <div className="relative flex-grow">
//                         <input
//                             type="text"
//                             value={searchQuery}
//                             onChange={handleSearchChange}
//                             placeholder="Search by name, batch number, or category..."
//                             className={clsx(
//                                 "w-full py-3 pl-12 pr-4 border rounded-lg shadow-sm text-sm",
//                                 isDark 
//                                     ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500' 
//                                     : 'bg-white border-gray-300 focus:border-green-600 focus:ring-green-600'
//                             )}
//                             disabled={isMutating}
//                         />
//                         <span className="absolute inset-y-0 left-0 flex items-center pl-3">
//                             <svg className={clsx("w-5 h-5", textSecondary)} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
//                         </span>
//                     </div>
//                 </div>

//                 {/* Main Table Area */}
//                 <div className={clsx("shadow-xl rounded-xl overflow-hidden", isDark ? 'bg-gray-800' : 'bg-white')}>
//                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                         <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
//                             <tr>
//                                 <th className={tableHeaderClass}>ID</th>
//                                 <th className={tableHeaderClass}>Medicine Name</th>
//                                 <th className={tableHeaderClass}>Batch No.</th>
//                                 <th className={tableHeaderClass}>Category</th>
//                                 <th className={tableHeaderClass}>Stock</th>
//                                 <th className={tableHeaderClass}>Selling Price</th>
//                                 <th className={tableHeaderClass}>Expiry Date</th>
//                                 <th className={tableHeaderClass}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                             {paginatedMedicines.length > 0 ? (
//                                 paginatedMedicines.map((medicine) => (
//                                     <tr key={medicine.id} className={tableRowClass}>
//                                         <td className={clsx("py-3 px-4 text-sm font-medium", textPrimary)}>{medicine.id}</td>
//                                         <td className={clsx("py-3 px-4 text-sm font-semibold text-green-500")}>{medicine.name}</td>
//                                         <td className={clsx("py-3 px-4 text-sm", textSecondary)}>{medicine.batchNumber}</td>
//                                         <td className={clsx("py-3 px-4 text-sm", textSecondary)}>{medicine.category}</td>
//                                         <td className={clsx("py-3 px-4 text-sm font-bold", medicine.stock < 20 ? 'text-red-500' : 'text-green-500')}>
//                                             {medicine.stock} {medicine.unit}
//                                         </td>
//                                         <td className={clsx("py-3 px-4 text-sm font-semibold", textPrimary)}>${medicine.sellingPrice.toFixed(2)}</td>
//                                         <td className={clsx("py-3 px-4 text-sm", textSecondary)}>{medicine.expiryDate.split('T')[0]}</td>
//                                         <td className="py-3 px-4 text-sm space-x-2">
//                                             {/* Edit Button */}
//                                             <button 
//                                                 onClick={() => router.push(`/inventory/edit/${medicine.id}`)}
//                                                 title="Edit"
//                                                 className="text-blue-500 hover:text-blue-700 p-1 disabled:text-gray-400"
//                                                 disabled={isMutating}
//                                             >
//                                                 ✏️
//                                             </button>
//                                             {/* Delete Button (Now functional) */}
//                                             <button 
//                                                 onClick={() => handleDelete(medicine.id, medicine.name)}
//                                                 title="Delete"
//                                                 className="text-red-500 hover:text-red-700 p-1 disabled:text-gray-400"
//                                                 disabled={isMutating}
//                                             >
//                                                 🗑️
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan={8} className={clsx("py-12 text-center text-lg", textSecondary)}>
//                                         {isListEmpty 
//                                             ? "No medicine records found in the inventory." 
//                                             : "No inventory records match the current search criteria."}
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination and Summary */}
//                 <div className={clsx("mt-4 flex justify-between items-center text-sm", textSecondary)}>
//                     <span>
//                         Displaying {paginatedMedicines.length} of {filteredMedicines.length} total results.
//                     </span>
//                     <div className="flex space-x-1">
//                         <button
//                             onClick={() => handlePageChange(currentPage - 1)}
//                             disabled={currentPage === 1 || isMutating}
//                             className={clsx("px-3 py-1 rounded-lg", isDark ? 'bg-gray-700 disabled:bg-gray-900' : 'bg-white border disabled:bg-gray-100')}
//                         >
//                             Previous
//                         </button>
//                         {[...Array(totalPages)].map((_, index) => (
//                             <button
//                                 key={index + 1}
//                                 onClick={() => handlePageChange(index + 1)}
//                                 disabled={isMutating}
//                                 className={clsx("px-3 py-1 rounded-lg font-semibold", 
//                                     currentPage === index + 1
//                                     ? 'bg-green-600 text-white'
//                                     : (isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-200 border')
//                                 )}
//                             >
//                                 {index + 1}
//                             </button>
//                         ))}
//                         <button
//                             onClick={() => handlePageChange(currentPage + 1)}
//                             disabled={currentPage === totalPages || isMutating}
//                             className={clsx("px-3 py-1 rounded-lg", isDark ? 'bg-gray-700 disabled:bg-gray-900' : 'bg-white border disabled:bg-gray-100')}
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// // #######################################################
// // 2. MAIN PAGE WRAPPER (DEFAULT EXPORT)
// // #######################################################
// export default function InventoryPageWrapper() {
//     return (
//         <ThemeProvider>
//             <InventoryProvider> 
//                 <ToastProviderWrapper>
//                     <InventoryListCore /> 
//                 </ToastProviderWrapper>
//             </InventoryProvider>
//         </ThemeProvider>
//     );
// };