'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import medicine from './medicine/page';

// Dynamic import for client-side libraries (simulated chart component)
const DynamicChart = dynamic(() => Promise.resolve(({ isDarkMode }) => (
    <div className={`w-full h-72 rounded-xl p-4 flex items-center justify-center font-bold text-xl ${isDarkMode ? 'bg-slate-700 text-blue-300' : 'bg-white text-gray-700 border border-gray-200'}`}>
        Sales Trend Chart (Last 30 Days)
        <span className="text-sm font-light mt-2 absolute bottom-2">Data visualization placeholder</span>
    </div>
)), { ssr: false });

// --- KIBRAN COLOR CONSTANTS ---
const KIBRAN_COLOR = '#003A70'; // Deeper Blue (Primary)
const KIBRAN_COLOR_LIGHT = '#1A6AA5'; 

// Utility function to merge Tailwind classes
const clsx = (...classes: (string | boolean | null | undefined)[]) => classes.filter(Boolean).join(' ');

// The backgrounds images and the overlay colors
// NOTE: Ensure these files exist in your project's public directory
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg';
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';


// Icon definitions (A comprehensive set for all dashboard sections)
const Icons = {
    // Basic Icons
    SunIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m-4-8H4m16 0h-2M6.34 6.34l1.41 1.41m12.71 12.71-1.41-1.41M6.34 17.66l1.41-1.41m12.71-12.71-1.41 1.41"/></svg>),
    MoonIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>),
    LogOutIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
    LayoutDashboardIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
    
    // Custom Pharmacy Icon (Mortar and Pestle) - The original item that was likely missing
    MortarPestleIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 10h-2v3a5 5 0 0 0 5 5h2v-3a5 5 0 0 0-5-5Z"/><path d="M12 18h2a5 5 0 0 0 5-5v-3h-2a5 5 0 0 0-5 5Z"/><path d="M17 12h-2v-3a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v3h2a5 5 0 0 0 5 5h2v-3a5 5 0 0 0 5-5Z"/><path d="M15 12h2a5 5 0 0 0 5-5v-3h-2a5 5 0 0 0-5 5Z"/></svg>),
    
    // Menu Icon (Hamburger)
    MenuIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
    
    // Core Functions
    PillIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22h6c3.31 0 6-2.69 6-6s-2.69-6-6-6h-6m-6 0H6c-3.31 0-6 2.69-6 6s2.69 6 6 6h6m0-12V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v4M12 12V6c0-1.66 1.34-3 3-3s3 1.34 3 3v4"/></svg>),
    TruckIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><path d="M15 17h6"/><path d="M18 17v-4"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M14 17h-2v-3h2V5h4v12h-4"/></svg>),
    ShoppingCartIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.08a2 2 0 0 0 2 1.92h9.72a2 2 0 0 0 2-1.92L23 6H6"/></svg>),
    BarChartIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>),
    PackageIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><line x1="12" y1="22.76" x2="12" y2="12.5"/></svg>),
    UsersIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
    UserIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),

    // NEW ICONS for Header
    BellIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
    MessageSquareIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
    SettingsIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 .33 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
    
    // --- NEW ICONS FOR SIDEBAR ---
    FileTextIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>), // Invoice
    CreditCardIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>), // Bank
    DollarSignIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>), // Account/Finance
    Package2Icon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18"/></svg>), // Return
    BriefcaseIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>), // Manufacturer (as Business)
    ClipboardIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>), // Task
    UserCheckIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M17 11l-3 3l1.5 1.5"/></svg>), // Customer
};

// --- Dashboard Menu Structure (UPDATED) ---
// Note: 'component' name should match the switch case in renderContent
const MENU_ITEMS = [
    { name: 'Dashboard', icon: Icons.LayoutDashboardIcon, component: 'DashboardContent' }, // Changed to LayoutDashboardIcon
    { name: 'Invoice', icon: Icons.FileTextIcon, component: 'InvoiceContent' }, 
    { name: 'Customer', icon: Icons.UserCheckIcon, component: 'CustomerContent' }, 
    { name: 'Manufacturer', icon: Icons.BriefcaseIcon, component: 'ManufacturerContent' }, 
    { name: 'Medicine', icon: Icons.PillIcon, component: 'MedicineContent' },
    { name: 'Purchase', icon: Icons.ShoppingCartIcon, component: 'PurchaseContent' },
    { name: 'Stock', icon: Icons.PackageIcon, component: 'StockContent' },
    { name: 'Return', icon: Icons.Package2Icon, component: 'ReturnContent' }, 
    { name: 'Report', icon: Icons.BarChartIcon, component: 'ReportingContent' },
    { name: 'Account', icon: Icons.DollarSignIcon, component: 'AccountContent' }, 
    { name: 'Bank', icon: Icons.CreditCardIcon, component: 'BankContent' }, 
    { name: 'Task', icon: Icons.ClipboardIcon, component: 'TaskContent' }, 
];

// ----------------------------------------------------------------------
// --- MOCKUP COMPONENTS FOR DYNAMIC CONTENT VIEWS (UPDATED) ---
// ----------------------------------------------------------------------

// Reused KPI Card (no changes)
const KPICard = ({ title, value, isDarkMode }: { title: string, value: string, isDarkMode: boolean }) => {
    const baseClasses = clsx(
        "p-6 rounded-xl shadow-lg flex flex-col justify-between h-full transition-all duration-300",
        isDarkMode ? 'bg-slate-800/90 text-white' : 'bg-white/90 text-slate-800 border border-gray-100'
    );
    return (
        <div className={baseClasses}>
            <p className={clsx("text-sm font-semibold", isDarkMode ? 'text-blue-300' : 'text-slate-600')}>{title}</p>
            <h2 className="text-3xl font-extrabold" style={{ color: KIBRAN_COLOR }}>{value}</h2>
        </div>
    );
};

// Dashboard Content (no changes)
const DashboardContent = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const KPI_DATA = [
        { title: "Total Inventory Value", value: "$4.2 M" },
        { title: "Pending Orders", value: "87" },
        { title: "Total Sales (MoM)", value: "$75,200" },
        { title: "Low Stock Items", value: "34" },
    ];
    return (
        <div>
            {/* Title is centered as requested */}
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: KIBRAN_COLOR }}>Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {KPI_DATA.map(kpi => <KPICard key={kpi.title} {...kpi} isDarkMode={isDarkMode} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className={clsx("p-6 rounded-xl shadow-lg h-96", isDarkMode ? 'bg-slate-800/90' : 'bg-white/90')}>
                    <h3 className="text-xl font-bold mb-4">Sales Trend</h3>
                    <DynamicChart isDarkMode={isDarkMode} />
                </div>
                <div className={clsx("p-6 rounded-xl shadow-lg h-96", isDarkMode ? 'bg-slate-800/90' : 'bg-white/90')}>
                    <h3 className="text-xl font-bold mb-4">Critical Alerts</h3>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>3 urgent stock alerts. 5 orders in limbo.</p>
                </div>
            </div>
        </div>
    );
};

// Placeholder for all other navigation pages (no changes)
const ContentPlaceholder = ({ title, isDarkMode, children }: { title: string, isDarkMode: boolean, children?: React.ReactNode }) => (
    <div className={clsx("p-8 rounded-xl shadow-2xl min-h-[85vh] transition-colors duration-500", 
        // Use a slightly opaque background so the main fixed background shows through (Frosted effect)
        isDarkMode ? 'bg-slate-800/80 text-white backdrop-blur-sm' : 'bg-white/90 text-slate-800 backdrop-blur-sm')}>
        <h2 className="text-3xl font-extrabold mb-8 pb-4 border-b" style={{ color: KIBRAN_COLOR }}>{title}</h2>
        <p className={clsx("text-lg", isDarkMode ? 'text-blue-200' : 'text-slate-700')}>
            {children || `This is the dedicated management interface for ${title}. Here you would find tables, forms, and specific KPIs related to this area.`}
        </p>
        <div className="mt-10 p-4 border-t border-dashed" style={{ borderColor: isDarkMode ? '#1A6AA5' : '#003A70' }}>
            <p className="font-semibold" style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}>
                Example Functionality:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm">
                <li>Search & Filter (e.g., by name, SKU, price)</li>
                <li>Add New / Edit Records (e.g., New Supplier, Edit Price)</li>
                <li>Bulk Import/Export</li>
            </ul>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// --- SIDEBAR COMPONENT (No changes) ---
// ----------------------------------------------------------------------

const DashboardSidebar = ({ activeItem, setActiveItem, isDarkMode, userName, userRole, isVisible }: { activeItem: string, setActiveItem: (item: string) => void, isDarkMode: boolean, userName: string, userRole: string, isVisible: boolean }) => {
    
    // Sidebar class with translucent background and backdrop blur
    const sidebarClasses = clsx(
        "flex flex-col w-64 min-h-screen p-4 transition-all duration-500 flex-shrink-0 z-40 fixed left-0 top-0",
        // HIDE/SHOW LOGIC: Use 'translate-x-0' for visible, and '-translate-x-full' for hidden
        isVisible ? 'translate-x-0' : '-translate-x-full',
        isDarkMode 
            ? 'bg-slate-900/80 text-white shadow-2xl backdrop-blur-md' 
            : 'bg-white/80 text-slate-800 shadow-xl border-r border-gray-200 backdrop-blur-md'
    );

    const linkClasses = (isActive: boolean) => clsx(
        "flex items-center p-3 rounded-xl transition-all duration-200 font-medium text-base mb-2 hover:shadow-md",
        isActive
            ? `text-white shadow-lg`
            : (isDarkMode ? 'text-blue-300 hover:bg-slate-700/70' : 'text-slate-700 hover:bg-gray-100'),
        // Dynamic background for active link
        isActive ? 'bg-gradient-to-r from-[#003A70] to-blue-800' : 'bg-transparent'
    );

    return (
        <nav className={sidebarClasses}>
            {/* Logo/Branding (Restored original style, assuming the original image fits) */}
            <div className="flex items-center mb-10 py-4 px-2">
                <img 
                    src="./kibran-logo.jpg" 
                    alt="Kibran Logo" 
                    className="w-10 h-10 rounded-full mr-3 shadow-md"
                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = `https://placehold.co/40x40/${KIBRAN_COLOR.substring(1)}/ffffff?text=K`; }}
                />
                <h2 className="text-xl font-extrabold uppercase tracking-wider" style={{ color: KIBRAN_COLOR }}>Kibran</h2>
            </div>
            
            {/* Menu Links */}
            <div className="flex-grow">
                {MENU_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.component;
                    return (
                        <button 
                            key={item.name}
                            onClick={() => setActiveItem(item.component)}
                            className={clsx("w-full text-left", linkClasses(isActive))}
                            style={isActive ? { backgroundImage: `linear-gradient(to right, ${KIBRAN_COLOR}, ${KIBRAN_COLOR_LIGHT})` } : {}}
                        >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            {item.name}
                        </button>
                    );
                })}
            </div>

            {/* Profile & Logout Section */}
            <div className={clsx("p-4 mt-6 rounded-xl border-t", isDarkMode ? 'border-slate-700' : 'border-gray-200')}>
                <div className="flex items-center mb-4">
                    <Icons.UserIcon className="w-8 h-8 mr-3 p-1 rounded-full text-white bg-blue-600" style={{ backgroundColor: KIBRAN_COLOR }}/>
                    <div>
                        <p className="font-bold text-sm">{userName}</p>
                        <p className={clsx("text-xs", isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{userRole}</p>
                    </div>
                </div>
                {/* LOGOUT BUTTON */}
                <button 
                    // Replace console.log with your actual logout logic (e.g., router.push('/login'))
                    onClick={() => console.log('Logging out... Redirecting to login page.')} 
                    className={clsx("w-full flex items-center justify-center py-2 rounded-lg font-semibold text-sm transition-colors duration-200",
                        isDarkMode ? 'bg-red-800/50 hover:bg-red-700 text-red-300' : 'bg-red-100 hover:bg-red-200 text-red-600'
                    )}
                >
                    <Icons.LogOutIcon className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </div>
        </nav>
    );
};

// ----------------------------------------------------------------------
// --- NEW: HEADER ICONS COMPONENT (No changes) ---
// ----------------------------------------------------------------------

interface HeaderIconsProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const HeaderIcons: React.FC<HeaderIconsProps> = ({ isDarkMode, toggleTheme }) => {
    
    // Base button styles for all header icons
    const iconButtonClass = clsx(`p-3 rounded-full shadow-lg transition-all duration-500 z-50
        hover:scale-105 active:scale-95`,
        isDarkMode
            ? 'bg-slate-700 text-blue-400 hover:bg-slate-600'
            : 'bg-white text-blue-700 hover:bg-slate-200'
    );
    const iconColorStyle = { color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR };

    // Function to handle icon click (placeholder for actual functionality)
    const handleIconClick = (name: string) => {
        alert(`You clicked the ${name} icon! (Functionality not yet implemented)`);
    };

    return (
        <div className="fixed top-4 right-4 flex space-x-3 z-50">
            {/* 1. Settings Icon */}
            <button
                onClick={() => handleIconClick('Settings')}
                className={iconButtonClass}
                style={iconColorStyle}
                aria-label="Settings"
            >
                <Icons.SettingsIcon className="w-6 h-6"/>
            </button>

            {/* 2. Message Icon (with simulated badge) */}
            <button
                onClick={() => handleIconClick('Messages')}
                className={iconButtonClass}
                style={iconColorStyle}
                aria-label="Messages"
            >
                <div className="relative">
                    <Icons.MessageSquareIcon className="w-6 h-6"/>
                    {/* Badge for unread messages */}
                    <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: '#FF6347' }}></span>
                </div>
            </button>

            {/* 3. Alert/Notification Icon (with simulated badge) */}
            <button
                onClick={() => handleIconClick('Alerts')}
                className={iconButtonClass}
                style={iconColorStyle}
                aria-label="Alerts"
            >
                <div className="relative">
                    <Icons.BellIcon className="w-6 h-6"/>
                    {/* Badge for unread notifications */}
                    <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: '#FFD700' }}></span>
                </div>
            </button>

            {/* 4. Theme Toggle Icon (Existing functionality, moved into the fixed container) */}
            <button
                onClick={toggleTheme}
                className={iconButtonClass}
                style={iconColorStyle}
                aria-label="Toggle dark and light mode"
            >
                {isDarkMode ? <Icons.SunIcon className="w-6 h-6"/> : <Icons.MoonIcon className="w-6 h-6"/>}
            </button>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- MAIN DASHBOARD LAYOUT COMPONENT ---
// ----------------------------------------------------------------------

const DashboardPage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeView, setActiveView] = useState('PurchaseContent'); 
    const [isSidebarVisible, setIsSidebarVisible] = useState(true); 
    const [userName] = useState('MASOOD AHMAD'); 
    const [userRole] = useState('Online'); 
    
    const toggleTheme = () => setIsDarkMode(prev => !prev);
    const toggleSidebar = () => setIsSidebarVisible(prev => !prev);
    
    // Logic to hide sidebar when main content area is clicked
    const handleMainContentClick = () => {
        // Only hide the sidebar on mobile views (e.g., screen width < 768px in Tailwind)
        if (isSidebarVisible && window.innerWidth < 768) {
            setIsSidebarVisible(false);
        }
    };

    // Effect to set initial dark mode based on system preference
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }
    }, []);

    const pageClasses = clsx(
        "min-h-screen font-[Poppins,sans-serif] transition-colors duration-700 relative z-0 flex",
        isDarkMode ? 'text-white' : 'text-slate-800' 
    );

    const renderContent = useCallback(() => {
        switch (activeView) {
            case 'DashboardContent':
                return <DashboardContent isDarkMode={isDarkMode} />;
            case 'InvoiceContent':
                return <ContentPlaceholder title="Invoice Management" isDarkMode={isDarkMode}>Create and view customer sales invoices.</ContentPlaceholder>; 
            case 'CustomerContent':
                return <ContentPlaceholder title="Customer Management" isDarkMode={isDarkMode}>Manage customer profiles and contact information.</ContentPlaceholder>; 
            case 'ManufacturerContent':
                return <ContentPlaceholder title="Manufacturer/Supplier Management" isDarkMode={isDarkMode}>Manage manufacturer details, agreements, and payments.</ContentPlaceholder>; 
            case 'MedicineContent':
                return <ContentPlaceholder title="Medicine Inventory" isDarkMode={isDarkMode}>Manage product details, pricing, and classifications.</ContentPlaceholder>;
            case 'PurchaseContent':
                return <ContentPlaceholder title="Purchase Order Management" isDarkMode={isDarkMode}>Create, track, and receive new inventory orders.</ContentPlaceholder>;
            case 'StockContent':
                return <ContentPlaceholder title="Warehouse & Stock Control" isDarkMode={isDarkMode}>Monitor real-time stock levels, locations, and conduct cycle counts.</ContentPlaceholder>;
            case 'ReturnContent':
                return <ContentPlaceholder title="Returns & Exchanges" isDarkMode={isDarkMode}>Process customer or supplier returns and manage credit notes.</ContentPlaceholder>; 
            case 'ReportingContent':
                return <ContentPlaceholder title="Financial & Operational Reporting" isDarkMode={isDarkMode}>Generate sales reports, profit & loss, and inventory turnover analysis.</ContentPlaceholder>;
            case 'AccountContent':
                return <ContentPlaceholder title="Accounting & Ledger" isDarkMode={isDarkMode}>Manage general ledger, chart of accounts, and financial transactions.</ContentPlaceholder>; 
            case 'BankContent':
                return <ContentPlaceholder title="Bank & Cash Management" isDarkMode={isDarkMode}>Manage bank accounts, reconciliation, and cash flow.</ContentPlaceholder>; 
            case 'TaskContent':
                return <ContentPlaceholder title="Task Management" isDarkMode={isDarkMode}>Manage internal tasks, reminders, and staff assignments.</ContentPlaceholder>; 
            default:
                return <DashboardContent isDarkMode={isDarkMode} />;
        }
    }, [activeView, isDarkMode]);

    return (
        <div className={pageClasses}>
            
            {/* --- Fixed Background Image (The main "perspective" background) --- */}
            <div className={clsx("fixed inset-0 z-[-2] transition-all duration-700",
                isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
            )}
                style={{
                    backgroundImage: `url(${isDarkMode ? DARK_MODE_BACKGROUND_IMAGE : LIGHT_MODE_BACKGROUND_IMAGE})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundBlendMode: 'multiply',
                    backgroundColor: isDarkMode ? DARK_OVERLAY : LIGHT_OVERLAY 
                }}
            ></div>
            
            {/* --- Sidebar Toggle Button (Always visible on top-left) --- */}
            <button
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                className={clsx(`fixed top-4 left-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50
                    hover:scale-105 active:scale-95`,
                    // Moves button out of the way when the sidebar is open
                    isSidebarVisible ? 'translate-x-64' : 'translate-x-0', 
                    isDarkMode
                        ? 'bg-slate-700 text-blue-400 hover:bg-slate-600'
                        : 'bg-white text-blue-700 hover:bg-slate-200'
                )}
                style={{ color: KIBRAN_COLOR }}
                aria-label="Toggle sidebar"
            >
                <Icons.MenuIcon className="w-6 h-6"/>
            </button>


            {/* --- NEW: Header Icons (Settings, Message, Alert, Theme Toggle) --- */}
            <HeaderIcons 
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />
            
            {/* --- Sidebar (Navigation) --- */}
            <DashboardSidebar 
                activeItem={activeView}
                setActiveItem={setActiveView}
                isDarkMode={isDarkMode}
                userName={userName}
                userRole={userRole}
                isVisible={isSidebarVisible} 
            />

            {/* --- Main Content Area --- */}
            <main 
                className={clsx(
                    "flex-grow p-4 sm:p-8 relative z-10 min-h-screen overflow-y-auto transition-all duration-500",
                    // FIX: Ensure 'md:ml-64' is present for large screens when the sidebar is visible, otherwise use 'ml-0'
                    isSidebarVisible ? 'md:ml-64 ml-0' : 'ml-0'
                )}
                onClick={handleMainContentClick} // Hide sidebar on click
            > 
                {renderContent()}
            </main>
        </div>
    );
};

export default DashboardPage;