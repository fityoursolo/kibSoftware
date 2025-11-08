// --- app/lib/purchase-service.ts (REVISED to fix import error) ---

import { 
    MOCK_PURCHASES, Purchase, PurchaseFormData,
} from './constants'; 
import { MedicineService } from './medicine-service'; 

const STORAGE_KEY = 'kibran_mock_purchases';

// Helper functions (now private to the module scope)
const getPurchasesFromStorage = (): Purchase[] => {
    if (typeof window === 'undefined') return MOCK_PURCHASES;
    
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    if (storedData) {
        return JSON.parse(storedData);
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PURCHASES));
    return MOCK_PURCHASES;
};

const savePurchasesToStorage = (purchases: Purchase[]) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    }
};


// FIX: Export a simple object instead of a class with static methods
export const MockPurchaseService = {

    // --- READ OPERATION ---
    getAllPurchases: (): Purchase[] => {
        return getPurchasesFromStorage();
    },
    
    getPurchaseById: (id: number): Purchase | undefined => {
        return getPurchasesFromStorage().find(p => p.id === id);
    },


    // --- CREATE OPERATION ---
    createPurchase: (data: PurchaseFormData): Purchase => {
        const currentList = getPurchasesFromStorage();
        
        // ... (calculation and newPurchase creation logic) ...
        const quantity = parseFloat(data.quantity);
        const purchasePrice = parseFloat(data.purchasePrice);
        const totalCost = quantity * purchasePrice;
        const newId = currentList.length > 0 ? Math.max(...currentList.map(p => p.id)) + 1 : 1;
        
        const newPurchase: Purchase = {
            id: newId,
            medicineId: parseInt(data.medicineId),
            supplierId: parseInt(data.supplierId),
            quantity: quantity,
            purchasePrice: purchasePrice,
            totalCost: totalCost,
            purchaseDate: data.purchaseDate,
            created: new Date().toISOString().substring(0, 10),
        };

        const updatedList = [...currentList, newPurchase];
        savePurchasesToStorage(updatedList);
        
        MedicineService.updateMedicineStock(newPurchase.medicineId, newPurchase.quantity);

        return newPurchase;
    },
    
    // --- DELETE OPERATION ---
    deletePurchase: (id: number): Purchase[] => {
        const currentList = getPurchasesFromStorage();
        const purchaseToDelete = currentList.find(p => p.id === id);

        if (purchaseToDelete) {
            MedicineService.updateMedicineStock(purchaseToDelete.medicineId, -purchaseToDelete.quantity);
        }

        const updatedList = currentList.filter(p => p.id !== id);
        savePurchasesToStorage(updatedList);
        return updatedList;
    },
    
    // --- UPDATE OPERATION (Omitting for brevity) ---
};