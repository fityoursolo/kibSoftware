
import { Sale } from './sales-type';
// 1. Initial Data (same as before)
const initialSalesData: Sale[] = [
    { id: 1, medicineName: 'Paracetamol 500mg', quantity: 2, sellingPrice: 7.00, totalAmount: 14.00, saleDate: '2025-10-25', customerName: 'John Doe' },
    { id: 2, medicineName: 'Amoxicillin 250mg', quantity: 1, sellingPrice: 150.00, totalAmount: 150.00, saleDate: '2025-10-24', customerName: 'Jane Smith' },
    { id: 3, medicineName: 'Vitamin C Syrup', quantity: 3, sellingPrice: 60.00, totalAmount: 180.00, saleDate: '2025-10-24', customerName: 'Cash Sale' },
    { id: 4, medicineName: 'Omeprazole 20mg', quantity: 5, sellingPrice: 10.50, totalAmount: 52.50, saleDate: '2025-10-23', customerName: 'Cash Customer' },
    { id: 5, medicineName: 'Paracetamol 500mg', quantity: 10, sellingPrice: 7.00, totalAmount: 70.00, saleDate: '2025-10-23', customerName: 'John Doe' },
    { id: 6, medicineName: 'Cetirizine 10mg', quantity: 1, sellingPrice: 5.00, totalAmount: 5.00, saleDate: '2025-10-22', customerName: 'Mike Johnson' },
    { id: 7, medicineName: 'Amoxicillin 250mg', quantity: 2, sellingPrice: 150.00, totalAmount: 300.00, saleDate: '2025-10-22', customerName: 'Sarah Connor' },
    { id: 8, medicineName: 'Omeprazole 20mg', quantity: 1, sellingPrice: 10.50, totalAmount: 10.50, saleDate: '2025-10-21', customerName: 'T-800' },
];

// 2. Global State Interface
interface MockSalesDB {
    salesData: Sale[];
    nextSaleId: number;
}

// 3. Define a safe global type (CRITICAL CHANGE)
// We assert globalThis to this type to satisfy the TypeScript compiler.
type GlobalWithMockDB = typeof globalThis & {
    __GLOBAL_MOCK_SALES_DB__?: MockSalesDB;
}

const safeGlobal = globalThis as GlobalWithMockDB;

// 4. Enforce Singleton on globalThis
const globalKey = '__GLOBAL_MOCK_SALES_DB__';

if (!safeGlobal[globalKey]) {
    safeGlobal[globalKey] = {
        salesData: [...initialSalesData],
        nextSaleId: initialSalesData.length > 0 ? Math.max(...initialSalesData.map(s => s.id)) + 1 : 1,
    };
}

// Reference the persistent state
const dbState = safeGlobal[globalKey] as MockSalesDB; // We still assert the type on read

// --- EXPORTED DB FUNCTIONS ---
export const salesDB = {
    /** Returns a fresh copy of the persistent array */
    getAll: (): Sale[] => [...dbState.salesData], 
    
    /** Simulates creating a new sale and adds it to the persistent list */
    addSale: (newSale: Omit<Sale, 'id'>): Sale => {
        const calculatedTotal = newSale.quantity * newSale.sellingPrice;
        
        const saleWithId: Sale = { 
            ...newSale, 
            id: dbState.nextSaleId++,
            totalAmount: calculatedTotal
        };
        
        dbState.salesData.push(saleWithId); // Mutate the global array
        return saleWithId;
    },

    /** Simulates updating an existing sale */
    updateSale: (updatedSale: Sale): Sale | undefined => {
        const index = dbState.salesData.findIndex(s => s.id === updatedSale.id);
        if (index > -1) {
            dbState.salesData[index] = updatedSale; // Mutate the global array
            return updatedSale;
        }
        return undefined;
    },
    
    /** Simulates deleting a sale by ID */
    deleteSale: (id: number): boolean => {
        const index = dbState.salesData.findIndex(s => s.id === id);
        if (index > -1) {
            dbState.salesData = dbState.salesData.filter(sale => sale.id !== id); 
            return true;
        }
        return false;
    },
};