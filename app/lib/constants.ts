// --- app/lib/constants.ts ---

import React from 'react';
import { Icons } from './Icons';

// --- KIBRAN COLOR CONSTANTS ---
export const KIBRAN_COLOR = '#003A70'; // Deeper Blue (Primary)
export const KIBRAN_COLOR_LIGHT = '#1A6AA5'; 

// The backgrounds images and the overlay colors
export const LIGHT_MODE_BACKGROUND_IMAGE = '/background1.jpg'; 
export const DARK_MODE_BACKGROUND_IMAGE = '/background2.jpg';  
export const LIGHT_OVERLAY = 'rgba(255, 255, 255, 0.8)'; 
export const DARK_OVERLAY = 'rgba(0, 0, 0, 0.4)';

// Utility function to merge Tailwind classes
export const clsx = (...classes: (string | boolean | null | undefined)[]) => classes.filter(Boolean).join(' ');

// --- TYPES & INTERFACES ---
export type UserRole = 'Admin' | 'Store Keeper' | 'Sales' | 'Cashier';
export const canModifySupplier = (role: UserRole) => role === 'Admin' || role === 'Store Keeper';

export interface Supplier {
    id: number;
    name: string;
}

export interface Medicine {
    id: number;
    name: string;
    unit: string;
}

export interface Purchase {
    id: number;
    medicineId: number;
    supplierId: number;
    quantity: number;
    purchasePrice: number; // Cost per unit
    totalCost: number; // calculated: quantity * purchasePrice
    purchaseDate: string; // YYYY-MM-DD
    created: string;
}

export interface PurchaseFilters {
    medicineId: string;
    supplierId: string;
    dateFrom: string;
    dateTo: string;
    minPrice: string;
}

export interface PurchaseDisplay extends Omit<Purchase, 'medicineId' | 'supplierId'> {
    medicineName: string;
    supplierName: string;
}

export interface FormErrors {
    medicineId?: string;
    supplierId?: string;
    quantity?: string;
    purchasePrice?: string;
    purchaseDate?: string;
}

// Interface for the raw form data (uses strings for inputs)
export interface PurchaseFormData {
    medicineId: string;
    supplierId: string;
    quantity: string;
    purchasePrice: string;
    purchaseDate: string;
}


// --- MOCK DATA ---
export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'Pharma Dist. Ethiopia' },
    { id: 2, name: 'Global Med Supplies' },
    { id: 3, name: 'Asian Generics LTD' },
    { id: 4, name: 'African Pharma' },
    { id: 5, name: 'Europe Medical' },
];

export const MOCK_MEDICINES: Medicine[] = [
    { id: 101, name: 'Amoxicillin 500mg', unit: 'Tablet' },
    { id: 102, name: 'Paracetamol Syrup', unit: 'Bottle' },
    { id: 103, name: 'Dolo 650', unit: 'Tablet' },
];

export const MOCK_PURCHASES: Purchase[] = [
    { id: 1, medicineId: 101, supplierId: 1, quantity: 500, purchasePrice: 0.5, totalCost: 250, purchaseDate: '2025-10-20', created: '2025-10-21' },
    { id: 2, medicineId: 102, supplierId: 3, quantity: 100, purchasePrice: 15.0, totalCost: 1500, purchaseDate: '2025-09-15', created: '2025-09-15' },
    { id: 3, medicineId: 101, supplierId: 2, quantity: 1000, purchasePrice: 0.45, totalCost: 450, purchaseDate: '2025-10-29', created: '2025-10-30' },
    { id: 4, medicineId: 103, supplierId: 4, quantity: 2000, purchasePrice: 0.25, totalCost: 500, purchaseDate: '2025-10-10', created: '2025-10-10' },
];


// --- ICON DEFINITIONS ---
export { Icons };