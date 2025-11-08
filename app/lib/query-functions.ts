// --- app/lib/query-functions.ts (OR merge these into purchase-api.ts) ---
// Note: You must ensure SupplierService and MedicineService are correctly implemented 
// and exported from their respective files.

import { Purchase, PurchaseData, Medicine, Supplier } from './constants';
import { MockPurchaseService } from './purchase-service';
// Assuming these exist and are correctly exported as classes/objects:
import { MedicineService } from './medicine-service';
import { SupplierService } from './supplier-service';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 1. Purchase Queries/Mutations ---
export const fetchPurchases = async (): Promise<Purchase[]> => {
    await delay(500);
    return MockPurchaseService.getAllPurchases(); // Assuming this is your mock 'database'
};

export const deletePurchaseMutation = async (id: number): Promise<void> => {
    await delay(300);
    MockPurchaseService.deletePurchase(id); 
};

// --- 2. Medicine Queries ---
export const fetchMedicines = async (): Promise<Medicine[]> => {
    await delay(200);
    return MedicineService.getAllMedicines(); // Assuming this returns the full list
};

// --- 3. Supplier Queries ---
export const fetchSuppliers = async (): Promise<Supplier[]> => {
    await delay(200);
    return SupplierService.getAllSuppliers(); // Assuming this returns the full list
};