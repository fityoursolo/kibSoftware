'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// =======================================================================
// 🚨 ACTION REQUIRED: IMPORT YOUR MEDICINE PAGE COMPONENT HERE
import MedicineManagementPage from './Medicine/page'; 
import SalesSummaryPage from './sales/page';
import Image from 'next/image';
// Dynamic import for client-side libraries (simulated chart component)
const DynamicChart = dynamic(() => Promise.resolve(({ isDarkMode }) => (
    <div className={`w-full h-72 rounded-xl p-4 flex items-center justify-center font-bold text-xl ${isDarkMode ? 'bg-slate-700 text-blue-300' : 'bg-white text-gray-700 border border-gray-200'}`}>
        Sales Trend Chart (Last 30 Days)
        <span className="text-sm font-light mt-2 absolute bottom-2">Data visualization placeholder</span>
    </div>
)), { ssr: false });
// --- KIBRAN COLOR CONSTANTS ---
const KIBRAN_COLOR = '#003A70'; // Deeper Blue (Primary) - Used for Text/Accents
const KIBRAN_COLOR_LIGHT = '#1A6AA5'; 

// --- STATIC COLOR CONSTANTS (Based on the sample image) ---
const MENU_BACKGROUND_COLOR = '#1E2C44'; // Dark Blue/Slate for Sidebar
const ACTIVE_MENU_COLOR = '#00A78F'; // Vibrant Teal/Turquoise for Active Menu Item
const HOVER_MENU_COLOR = '#2A3C5B'; // Slightly lighter hover for contrast

// Utility function to merge Tailwind classes
const clsx = (...classes: (string | boolean | null | undefined)[]) => classes.filter(Boolean).join(' ');

// The backgrounds images and the overlay colors
const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg';
const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';


// Icon definitions
const Icons = {
    // Basic Icons
    SunIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m-4-8H4m16 0h-2M6.34 6.34l1.41 1.41m12.71 12.71-1.41-1.41M6.34 17.66l1.41-1.41m12.71-12.71-1.41 1.41"/></svg>),
    MoonIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>),
    LogOutIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
    LayoutDashboardIcon: (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
    
    // Custom Pharmacy Icon 
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

// --- Dashboard Menu Structure (No Changes from previous revision) ---
const MENU_ITEMS = [
    { name: 'Dashboard', icon: Icons.LayoutDashboardIcon, component: 'DashboardContent', url: '/Dashboard' },
    { name: 'Invoice', icon: Icons.FileTextIcon, component: 'InvoiceContent', url: '/Invoice' }, 
    { name: 'Customer', icon: Icons.UserCheckIcon, component: 'CustomerContent', url: '/Customer' }, 
    { name: 'Manufacturer', icon: Icons.BriefcaseIcon, component: 'ManufacturerContent', url: '/Manufacturer' }, 
    { name: 'Medicine', icon: Icons.PillIcon, component: 'MedicineContent', url: '/Medicine' },
    { name: 'Purchase', icon: Icons.ShoppingCartIcon, component: 'PurchaseContent', url: '/Purchase' },
    { name: 'Stock', icon: Icons.PackageIcon, component: 'StockContent', url: '/Stock' },
    { name: 'Return', icon: Icons.Package2Icon, component: 'ReturnContent', url: '/Return' }, 
    { name: 'Report', icon: Icons.BarChartIcon, component: 'ReportingContent', url: '/Report' },
    { name: 'Account', icon: Icons.DollarSignIcon, component: 'AccountContent', url: '/Account' }, 
    { name: 'Bank', icon: Icons.CreditCardIcon, component: 'BankContent', url: '/Bank' }, 
    { name: 'Task', icon: Icons.ClipboardIcon, component: 'TaskContent', url: '/Task' }, 
    { name: 'sales' ,icon: Icons.ShoppingCartIcon , component:'SalesContent',url:'./sales'}
];

// ----------------------------------------------------------------------
// --- MOCKUP COMPONENTS FOR DYNAMIC CONTENT VIEWS (Unchanged) ---
// ----------------------------------------------------------------------

const KPICard = ({ title, value, isDarkMode }: { title: string, value: string, isDarkMode: boolean }) => {
    // Keep internal card dark/light mode for main content section
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

const DashboardContent = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const KPI_DATA = [
        { title: "Total Inventory Value", value: "$4.2 M" },
        { title: "Pending Orders", value: "87" },
        { title: "Total Sales (MoM)", value: "$75,200" },
        { title: "Low Stock Items", value: "34" },
    ];
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: KIBRAN_COLOR }}>Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {KPI_DATA.map(kpi => <KPICard key={kpi.title} {...kpi} isDarkMode={isDarkMode} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className={clsx("p-6 rounded-xl shadow-lg h-96", isDarkMode ? 'bg-slate-800/90' : 'bg-white/90')}>
                    <h3 className="text-xl font-bold mb-4">Sales Trend</h3>
                    <DynamicChart/>
                </div>
                <div className={clsx("p-6 rounded-xl shadow-lg h-96", isDarkMode ? 'bg-slate-800/90' : 'bg-white/90')}>
                    <h3 className="text-xl font-bold mb-4">Critical Alerts</h3>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>3 urgent stock alerts. 5 orders in limbo.</p>
                </div>
            </div>
        </div>
    );
};

const ContentPlaceholder = ({ title, isDarkMode, children, functionality }: { title: string, isDarkMode: boolean, children?: React.ReactNode, functionality?: string[] }) => (
    <div className={clsx("p-8 rounded-xl shadow-2xl min-h-[85vh] transition-colors duration-500", 
        isDarkMode ? 'bg-slate-800/80 text-white backdrop-blur-sm' : 'bg-white/90 text-slate-800 backdrop-blur-sm')}>
        <h2 className="text-3xl font-extrabold mb-8 pb-4 border-b" style={{ color: KIBRAN_COLOR }}>{title}</h2>
        <p className={clsx("text-lg", isDarkMode ? 'text-blue-200' : 'text-slate-700')}>
            {children}
        </p>
        <div className="mt-10 p-4 border-t border-dashed" style={{ borderColor: isDarkMode ? '#1A6AA5' : '#003A70' }}>
            <p className="font-semibold" style={{ color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR }}>
                Key Functionality:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm">
                {(functionality || ["Search & Filter Records", "Add New / Edit Entries", "Bulk Import/Export"]).map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// --- SIDEBAR COMPONENT (Unchanged from previous revision) ---
// ----------------------------------------------------------------------

const DashboardSidebar = ({ activeItem, setActiveItem, userName, userRole, isVisible }: { activeItem: string, setActiveItem: (componentName: string, urlPath: string) => void, userName: string, userRole: string, isVisible: boolean }) => {
    
    // Sidebar class: ALWAYS uses the fixed dark color
    const sidebarClasses = clsx(
        "flex flex-col w-64 min-h-screen p-4 transition-all duration-500 flex-shrink-0 z-40 fixed left-0 top-0 text-white shadow-2xl backdrop-blur-md",
        isVisible ? 'translate-x-0' : '-translate-x-full'
    );
    const sidebarStyle = { backgroundColor: MENU_BACKGROUND_COLOR }; // Apply the fixed dark color

    const linkClasses = (isActive: boolean) => clsx(
        "flex items-center p-3 rounded-xl transition-all duration-200 font-medium text-base mb-2 hover:shadow-lg",
        // Active: Fixed Teal color. Text is always white.
        isActive
            ? 'text-white shadow-xl'
            // Inactive: Text is white, hover uses a lighter shade of the background color
            : 'text-white hover:opacity-80'
    );
    
    const linkStyle = (isActive: boolean) => isActive 
        ? { backgroundColor: ACTIVE_MENU_COLOR } 
        : { backgroundColor: 'transparent' };

return (
        <nav className={sidebarClasses} style={sidebarStyle}>
            {/* Logo/Branding */}
            <div className="flex items-center mb-10 py-4 px-2">
                <Image
                    src="/logo.jpeg" 
                    alt="Kibran Logo" 
                    className="w-10 h-10 rounded-full mr-3 shadow-md"
                    width={40}
                    height={60}
                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = `https://placehold.co/40x40/${KIBRAN_COLOR.substring(1)}/ffffff?text=K`; }}
                />
                <h2 className="text-xl font-extrabold uppercase tracking-wider" style={{ color: ACTIVE_MENU_COLOR }}>Kibran</h2>
            </div>
            
            {/* Menu Links */}
            <div className="flex-grow">
                {MENU_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.component;
                    return (
                        <button 
                            key={item.name}
                            onClick={() => setActiveItem(item.component, item.url)} 
                            className={clsx("w-full text-left", linkClasses(isActive))}
                            style={linkStyle(isActive)}
                        >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            {item.name}
                        </button>
                    );
                })}
            </div>

            {/* Profile & Logout Section */}
            <div className="p-4 mt-6 rounded-xl border-t border-slate-700">
                <div className="flex items-center mb-4">
                    <Icons.UserIcon className="w-8 h-8 mr-3 p-1 rounded-full text-white bg-blue-600" style={{ backgroundColor: KIBRAN_COLOR }}/>
                    <div>
                        <p className="font-bold text-sm">{userName}</p>
                        <p className="text-xs text-slate-400">{userRole}</p>
                    </div>
                </div>
                {/* LOGOUT BUTTON */}
                <button 
                    onClick={() => console.log('Logging out... Redirecting to login page.')} 
                    className="w-full flex items-center justify-center py-2 rounded-lg font-semibold text-sm transition-colors duration-200 bg-red-800/50 hover:bg-red-700 text-red-300"
                >
                    <Icons.LogOutIcon className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </div>
        </nav>
    );
};
// The toggleTheme prop is no longer needed but kept for type compatibility in DashboardPage, 
// though the function will be a no-op if the button is removed.

interface HeaderIconsProps {
    isDarkMode: boolean;
    // toggleTheme is now optional or can be removed entirely as there is no button
    toggleTheme: () => void; 
}

const HeaderIcons: React.FC<HeaderIconsProps> = ({ isDarkMode }) => {
    
    // Base button styles for all header icons
    const iconButtonClass = clsx(`p-3 rounded-full shadow-lg transition-all duration-500 z-50
        hover:scale-105 active:scale-95`,
        isDarkMode
            ? 'bg-slate-700 text-blue-400 hover:bg-slate-600'
            : 'bg-white text-blue-700 hover:bg-slate-200'
    );
    const iconColorStyle = { color: isDarkMode ? KIBRAN_COLOR_LIGHT : KIBRAN_COLOR };

    const handleIconClick = (name: string) => {
        alert(`You clicked the ${name} icon! (Functionality not yet implemented)`);
    };
return (
        // Theme toggle button has been removed from this list.
        <div className="fixed top-4 right-24 flex space-x-3 z-50">
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
                    <span className="absolute -top-1 -right-1 left-40 block h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: '#FFD700' }}></span>
                </div>
            </button>
            {/* Theme Toggle Button was here, now removed. */}
        </div>
    );
};
// ----------------------------------------------------------------------
// --- MAIN DASHBOARD LAYOUT COMPONENT (Updated Initial State/Logic) ---
// ----------------------------------------------------------------------

const DashboardPage = () => {
    // Set initial state. Since dark mode toggle is removed, you might want to hardcode 
    // this based on your preferred look for the content background. 
    // Setting to 'false' for a default light content area background.
    const [isDarkMode, setIsDarkMode] = useState(false); 
    
    // Function to extract component name from a URL slug (e.g., '/Medicine' -> 'MedicineContent')
    const urlToComponent = (url: string) => {
        const path = url.split('?')[0]; // Ignore query parameters
        const item = MENU_ITEMS.find(i => i.url.toLowerCase() === path.toLowerCase());
        return item ? item.component : 'DashboardContent';
    };

    // Initialize state from current URL path
    const [activeView, setActiveView] = useState('DashboardContent'); 
    
    const [isSidebarVisible, setIsSidebarVisible] = useState(true); 
    const [userName] = useState('KIB PHARMACY'); 
    const [userRole] = useState('Admin')
   
    
    // Removed toggleTheme function. The content background now depends solely on initial state.
    const toggleSidebar = () => setIsSidebarVisible(prev => !prev);
    
    // NEW: Update active view and URL history
    const setActiveItem = (componentName: string, urlPath: string) => {
        setActiveView(componentName);
        // Push the new state and URL to browser history without a full page reload
        if (typeof window !== 'undefined') {
            window.history.pushState({ component: componentName }, '', urlPath);
        }
    };
    
    // Initial load/mount effect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Set initial active view from path (e.g., if navigated directly to /Medicine)
            setActiveView(urlToComponent(window.location.pathname));
    // Listen for browser back/forward buttons
                const handlePopState = (event: PopStateEvent) => {
                const componentName = event.state?.component || urlToComponent(window.location.pathname);
                setActiveView(componentName);
            };
            window.addEventListener('popstate', handlePopState);
            // Removed system preference check since the toggle button is gone.
            // If you want the content area to *start* dark, change `useState(false)` to `useState(true)`.

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, []);
    // Logic to hide sidebar when main content area is clicked
    const handleMainContentClick = () => {
        // Only hide the sidebar on mobile views (e.g., screen width < 768px in Tailwind)
        if (isSidebarVisible && window.innerWidth < 768) {
            setIsSidebarVisible(false);
        }
    };

    const pageClasses = clsx(
        "min-h-screen font-[Poppins,sans-serif] transition-colors duration-700 relative z-0 flex",
        isDarkMode ? 'text-white' : 'text-slate-800' 
    );

    const renderContent = useCallback(() => {
        switch (activeView) {
            case 'DashboardContent':
                return <DashboardContent isDarkMode={isDarkMode} />;
            case 'InvoiceContent':
                return (
                    <ContentPlaceholder title="Sales & Invoice Management" isDarkMode={isDarkMode} functionality={["Generate/Print Invoices", "Track Payment Status", "Manage Sales History"]}>
                        Handle all customer sales transactions, generate detailed invoices, and manage payment records.
                    </ContentPlaceholder>
                ); 
            case 'CustomerContent':
                return (
                    <ContentPlaceholder title="Customer Relationship Management (CRM)" isDarkMode={isDarkMode} functionality={["Add/Edit Customer Profiles", "View Purchase History", "Manage Loyalty Programs"]}>
                        Maintain and manage detailed profiles for all customers.
                    </ContentPlaceholder>
                ); 
            case 'ManufacturerContent':
                return (
                    <ContentPlaceholder title="Manufacturer & Supplier Management" isDarkMode={isDarkMode} functionality={["Vendor Profile Management", "Contract and Pricing Negotiation", "Supplier Performance Tracking"]}>
                        Manage all external business partners supplying your inventory, including contact and contract details.
                    </ContentPlaceholder>
                ); 
            // INTEGRATE YOUR CUSTOM MEDICINE PAGE HERE
            case 'MedicineContent':
                return <MedicineManagementPage/>;
            // -------------------------------------------------
            case 'PurchaseContent':
                return (
                    <ContentPlaceholder title="Purchase Order Management" isDarkMode={isDarkMode} functionality={["Create New Purchase Orders", "Track Incoming Shipments", "Receive Stock and Update Inventory"]}>
                        Streamline the ordering process for new inventory from suppliers and track its journey to your pharmacy.
                    </ContentPlaceholder>
                );
            case 'StockContent':
                return (
                    <ContentPlaceholder title="Warehouse & Stock Control" isDarkMode={isDarkMode} functionality={["Real-time Stock Levels", "Expiry Date Monitoring", "Inventory Audits and Cycle Counting"]}>
                        Monitor, adjust, and optimize the physical stock levels across all storage locations.
                    </ContentPlaceholder>
                );
            case 'ReturnContent':
                return (
                    <ContentPlaceholder title="Returns & Exchanges Processing" isDarkMode={isDarkMode} functionality={["Process Customer Returns", "Manage Supplier Returns (Damaged/Expired)", "Issue Credit Notes and Refunds"]}>
                        Handle the entire process for returning products, whether from customers or back to suppliers.
                    </ContentPlaceholder>
                ); 
            case 'ReportingContent':
                return (
                    <ContentPlaceholder title="Financial & Operational Reporting" isDarkMode={isDarkMode} functionality={["Generate Sales Reports (Daily/Monthly)", "Inventory Turnover Analysis", "Profit and Loss Statements"]}>
                        Access comprehensive reports and analytics to monitor the health and performance of your business.
                    </ContentPlaceholder>
                );
            case 'AccountContent':
                return (
                    <ContentPlaceholder title="General Accounting & Ledger" isDarkMode={isDarkMode} functionality={["Manage Chart of Accounts", "Journal Entries and Ledger Updates", "Financial Period Closing"]}>
                        The central system for all bookkeeping and financial record management.
                    </ContentPlaceholder>
                ); 
            case 'BankContent':
                return (
                    <ContentPlaceholder title="Bank & Cash Management" isDarkMode={isDarkMode} functionality={["Bank Reconciliation", "Track Cash Flow", "Manage Petty Cash Funds"]}>
                        Oversee and reconcile all bank accounts and manage cash movements within the business.
                    </ContentPlaceholder>
                ); 
            case 'TaskContent':
                return (
                    <ContentPlaceholder title="Internal Task Management" isDarkMode={isDarkMode} functionality={["Assign Tasks to Staff", "Set Reminders (e.g., Re-order points)", "Track Task Completion Status"]}>
                        Organize and manage internal workflow, staff assignments, and reminders.
                    </ContentPlaceholder>
                ); 
                case 'SalesContent':
                return (
                    <SalesSummaryPage/>

                ); 
            default:
                return <DashboardContent isDarkMode={isDarkMode} />;
        }
    }, [activeView, isDarkMode]);
return (
        <div className={pageClasses}>
            
            {/* --- Fixed Background Image --- */}
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
            
            {/* --- Sidebar Toggle Button (Unchanged) --- */}
            <button
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                className={clsx(`fixed top-4 left-4 p-3 rounded-full shadow-lg transition-all duration-500 z-50
                    hover:scale-105 active:scale-95`,
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

            {/* --- Sidebar Component --- */}
            <DashboardSidebar 
                activeItem={activeView} 
                setActiveItem={setActiveItem} 
                userName={userName} 
                userRole={userRole} 
                isVisible={isSidebarVisible} 
            />

            {/* --- Main Content Area --- */}
            <main 
                className={clsx(
                    "flex-grow p-4 md:p-8 transition-all duration-500 min-h-screen pt-24 md:pt-8",
                    isSidebarVisible ? 'ml-64' : 'ml-0' 
                )}
                onClick={handleMainContentClick}
            >
                {renderContent()}
            </main>
            
            {/* --- Header Icons (Theme toggle removed) --- */}
            <HeaderIcons isDarkMode={isDarkMode} toggleTheme={() => {}} /> 
        </div>
    );
};
export default DashboardPage;