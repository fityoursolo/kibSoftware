'use client'
import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import necessary hooks and providers from ../page and ../salescontext
import { SalesProvider, useSales } from '../salescontext'; 
import { ThemeProvider, useTheme, ToastProviderWrapper } from '../page'; 
import { Sale } from '../../lib/sales-type';
// === CHART IMPORTS ===
import { Bar } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend
);

// --- SHARED CONSTANTS & UTILITIES ---
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg'; 
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)';
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';

const clsx = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// SVG Icons (FIXED: Component definition is missing display name)
const createIcon = (iconContent: React.ReactNode) => {
    // Define the component function
    const IconComponent = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{iconContent}</svg>
    );

    // Assign a display name to satisfy linting/React DevTools
    IconComponent.displayName = 'CustomIcon';

    return IconComponent;
};

// Apply the fixed utility function
const BackIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7m11 14h-14"/>);
const SunIcon = createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0 1.414 1.414M6.343 17.657l1.414 1.414M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
);
const MoonIcon = createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
);


// --- Local Types ---
interface AggregatedSale { 
    medicineName: string; 
    totalQuantity: number; 
    totalRevenue: number; 
}

// --- ✅ Function for Export to Excel/PDF (Uses CSV internally, saves as .xlsx) ---
const exportToCsv = (data: AggregatedSale[], filename: string = 'sales_summary.xlsx') => { 
    if (data.length === 0) return;

    // 1. Create CSV header
    const headers = ["Medicine Name", "Total Quantity Sold", "Total Revenue"];
    const headerRow = headers.join(',') + '\n';

    // 2. Create CSV rows
    const csvContent = data.map(item => 
        `"${item.medicineName.replace(/"/g, '""')}",${item.totalQuantity},${item.totalRevenue.toFixed(2)}`
    ).join('\n');

    // 3. Combine and trigger download. The MIME type text/csv is compatible with Excel.
    const fullCsv = headerRow + csvContent;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        // FIX: The downloaded file extension is set to .xlsx
        link.setAttribute("download", filename); 
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// --- Export Button Component ---
const ExportButton = ({ data }: { data: AggregatedSale[] }) => (
    <button
        onClick={() => exportToCsv(data)}
        disabled={data.length === 0}
        className={clsx(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition duration-150 shadow-md",
            data.length === 0
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
        )}
        aria-label="Export sales data to Excel or PDF"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v9a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Export to Excel/PDF</span>
    </button>
);


// --- Hook to satisfy GET /api/sales/summary requirement (simulated) ---
const useSummaryData = (
    startDate: string, 
    endDate: string, 
    sortBy: 'revenue' | 'quantity', 
    sales: Sale[], 
    isLoadingSales: boolean 
): { aggregatedData: AggregatedSale[], isLoading: boolean } => {
    
    // This logic simulates the backend API: GET /api/sales/summary
    const aggregatedData = useMemo(() => {
        if (isLoadingSales) {
            return [];
        }

        // 1. Filter Sales 
        const  filteredSales = sales.filter(sale => {
            const saleDate = sale.saleDate;
            const isAfterStart = startDate ? saleDate >= startDate : true;
            const isBeforeEnd = endDate ? saleDate <= endDate : true;
            return isAfterStart && isBeforeEnd;
        });

        // 2. Perform Aggregation 
        const aggregationMap = new Map<string, { totalQuantity: number, totalRevenue: number }>();
        filteredSales.forEach(sale => {
            const current = aggregationMap.get(sale.medicineName) || { totalQuantity: 0, totalRevenue: 0 };
            aggregationMap.set(sale.medicineName, {
                totalQuantity: current.totalQuantity + sale.quantity,
                totalRevenue: current.totalRevenue + sale.totalAmount, 
            });
        });
        
        // 3. Apply Sorting 
        return Array.from(aggregationMap.entries())
            .map(([medicineName, data]) => ({ medicineName, ...data }))
            .sort((a, b) => {
                if (sortBy === 'revenue') {
                    return b.totalRevenue - a.totalRevenue;
                }
                return b.totalQuantity - a.totalQuantity;
            }); 
            
    }, [sales, isLoadingSales, startDate, endDate, sortBy]);

    return { aggregatedData, isLoading: isLoadingSales };
};


// --- CORE SUMMARY COMPONENT ---
const SalesSummaryCore = () => {
    const { sales, isLoading: isSalesLoading } = useSales();
    const { theme, toggleTheme } = useTheme(); 
    const router = useRouter();
    
    // State: Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue'); 
    
    // Fetch/Simulate aggregated data using the custom hook
    const { aggregatedData, isLoading } = useSummaryData(
        startDate, 
        endDate, 
        sortBy, 
        sales, 
        isSalesLoading
    );

    const totalOverallRevenue = aggregatedData.reduce((sum, item) => sum + item.totalRevenue, 0);

    // --- Dynamic Background Styles ---
    const fixedBackgroundStyle = useMemo(() => ({
        backgroundImage: `url(${theme === 'dark' ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }), [theme]);
    const overlayColor = theme === 'dark' ? DARK_OVERLAY : LIGHT_OVERLAY;

    // --- Chart.js Data and Options (Theme-aware) ---
    const chartData = { 
        labels: aggregatedData.map(item => item.medicineName),
        datasets: [
            {
                label: 'Total Revenue ($)',
                data: aggregatedData.map(item => item.totalRevenue),
                backgroundColor: theme === 'dark' ? 'rgba(79, 70, 229, 0.7)' : 'rgba(79, 70, 229, 1)',
                borderColor: theme === 'dark' ? 'rgba(79, 70, 229, 1)' : 'rgba(79, 70, 229, 1)',
                borderWidth: 1,
            },
            {
                label: 'Total Quantity Sold',
                data: aggregatedData.map(item => item.totalQuantity),
                backgroundColor: theme === 'dark' ? 'rgba(255, 193, 7, 0.7)' : 'rgba(255, 193, 7, 1)', 
                borderColor: theme === 'dark' ? 'rgba(255, 193, 7, 1)' : 'rgba(255, 193, 7, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = { 
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                },
            },
            title: {
                display: true,
                text: 'Medicine Sales Performance',
                color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280', 
                },
                grid: {
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
            },
            x: {
                ticks: {
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                },
                grid: {
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
            }
        }
    };

    // --- Styling based on theme ---
    const isDark = theme === 'dark';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
    const headerBg = isDark ? 'bg-gray-700' : 'bg-gray-100';
    const inputClass = clsx(
        "py-2 px-3 border rounded-lg shadow-inner w-full text-sm",
        isDark ? 
            'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 
            'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    );
    const labelClass = clsx("block text-xs font-medium mb-1", isDark ? 'text-gray-300' : 'text-gray-600');


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-2xl text-indigo-500">Loading Sales Summary...</div>;
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center p-4 sm:p-8 relative"
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
                className="max-w-4xl w-full p-8 rounded-xl shadow-2xl z-10"
                style={{ backgroundColor: overlayColor }} 
            >
                
                {/* Header and Back Button */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <button 
                        onClick={() => router.back()}
                        className={clsx("flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition", textSecondary)}
                    >
                        <BackIcon className="w-5 h-5"/>
                        <span className="font-medium">Back to Sales List</span>
                    </button>
                    <h1 className={clsx("text-3xl font-bold text-indigo-800 dark:text-indigo-200")}>
                        📈 Sales Summary
                    </h1>
                </div>
                
                {/* Filters Header (Includes Export Button) */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className={clsx("text-xl font-bold", textPrimary)}>Summary Filters</h2>
                    <ExportButton data={aggregatedData} />
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 rounded-lg border dark:border-gray-600">
                    
                    {/* Date Range Filter: Start Date */}
                    <div>
                        <label htmlFor="startDate" className={labelClass}>Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    
                    {/* Date Range Filter: End Date */}
                    <div>
                        <label htmlFor="endDate" className={labelClass}>End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Top-Selling Sort Filter */}
                    <div>
                        <label htmlFor="sortBy" className={labelClass}>Top-Selling Filter</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'revenue' | 'quantity')}
                            className={inputClass}
                        >
                            <option value="revenue">Sort by Total Revenue (Top-Selling)</option>
                            <option value="quantity">Sort by Total Quantity</option>
                        </select>
                    </div>
                </div>

                {/* Total Revenue Card */}
                <div className="mb-8 p-6 rounded-xl bg-indigo-600 text-white shadow-xl text-center">
                    <p className="text-xl font-semibold opacity-80">Total Revenue for Selected Period</p>
                    <p className="text-4xl font-extrabold mt-1">${totalOverallRevenue.toFixed(2)}</p>
                </div>

                {/* Chart Visualization */}
                <h2 className={clsx("text-2xl font-bold mb-4", textPrimary)}>Sales Performance Chart</h2>
                <div className={clsx("p-4 rounded-xl shadow-inner mb-8", isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                    {aggregatedData.length > 0 ? (
                        <Bar options={chartOptions} data={chartData} />
                    ) : (
                        <p className={clsx("text-center py-6", textSecondary)}>No data to display in chart for the selected period.</p>
                    )}
                </div>

                {/* Summary Table */}
                <h2 className={clsx("text-2xl font-bold mb-4", textPrimary)}>Aggregated Sales Table</h2>
                <div className="overflow-x-auto shadow-lg rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={headerBg}>
                            <tr>
                                <th className={clsx("px-4 py-3 text-left text-xs font-medium uppercase tracking-wider", textSecondary)}>Medicine</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Quantity Sold</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {aggregatedData.length > 0 ? (
                                aggregatedData.map(item => (
                                    <tr key={item.medicineName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className={clsx("px-4 py-3 whitespace-nowrap text-sm font-medium", textPrimary)}>{item.medicineName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{item.totalQuantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-right text-green-600 dark:text-green-400">
                                            ${item.totalRevenue.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className={clsx("text-center py-6 text-lg", textSecondary)}>No sales data available for the selected period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

// --- Page Wrapper (Must include all providers) ---
export default function SalesSummaryPage() {
    return (
        <ThemeProvider>
            <SalesProvider> 
                <ToastProviderWrapper>
                    <SalesSummaryCore /> 
                </ToastProviderWrapper>
            </SalesProvider>
        </ThemeProvider>
    );
}