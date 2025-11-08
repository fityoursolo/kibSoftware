// app/lib/medicine-service.ts (CORRECTED)

export interface Medicine {
    id: number;
    name: string;
    genericName: string;
    unit: string; // e.g., 'Tablet', 'Bottle', 'Vial'
    manufacturer: string;
    purchasePrice: number; // Avg. Purchase Price
    sellingPrice: number;  // Default Selling Price
    stock: number;         // Current Stock Quantity
    expiryDate: string;    // YYYY-MM-DD
}

// FIX: Change to 'let' so the stock property can be updated at runtime.
const MOCK_MEDICINES: Medicine[] = [
    { id: 101, name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', unit: 'Tablet', manufacturer: 'Global Pharma', purchasePrice: 0.15, sellingPrice: 0.50, stock: 1500, expiryDate: '2025-12-31' },
    { id: 102, name: 'Paracetamol 10mg/ml', genericName: 'Acetaminophen', unit: 'Bottle', manufacturer: 'Ethio Meds', purchasePrice: 1.20, sellingPrice: 3.50, stock: 450, expiryDate: '2026-06-15' },
    { id: 103, name: 'Lisinopril 10mg', genericName: 'Lisinopril', unit: 'Tablet', manufacturer: 'Europe Meds', purchasePrice: 0.35, sellingPrice: 1.00, stock: 800, expiryDate: '2024-11-01' },
    { id: 104, name: 'Insulin Glargine', genericName: 'Insulin', unit: 'Vial', manufacturer: 'Biotech USA', purchasePrice: 15.00, sellingPrice: 45.00, stock: 120, expiryDate: '2025-08-20' },
    { id: 105, name: 'fitsum 81mg', genericName: 'Acetylsalicylic Acid', unit: 'Tablet', manufacturer: 'Local Distributors', purchasePrice: 0.05, sellingPrice: 0.25, stock: 5000, expiryDate: '2026-03-10' },
];

export const MedicineService = {
    getAllMedicines: (): Medicine[] => {
        return MOCK_MEDICINES;
    },
    getMedicineById: (id: number): Medicine | undefined => {
        return MOCK_MEDICINES.find(m => m.id === id);
    },
    
    // FIX: New function to update medicine stock
    updateMedicineStock: (id: number, quantityChange: number): Medicine | undefined => {
        const medicine = MOCK_MEDICINES.find(m => m.id === id);
        
        if (!medicine) {
            console.error(`Medicine ID ${id} not found for stock update.`);
            return undefined;
        }
        
        medicine.stock += quantityChange;
        
        return medicine;
    },
};