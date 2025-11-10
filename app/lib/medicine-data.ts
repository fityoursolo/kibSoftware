
export interface MockApiError extends Error {
    response?: {
        status: number;
        data?: { message: string };
    };
}

// --- 1. INTERFACE FOR MEDICINE LIST ---
export interface Medicine {
    id: number;
    name: string;
    category: string;
    type: string;
    batchNumber: string;
    manufacturer: string;
    expiryDate: string;
    unit: string;
    buyingPrice: number;
    sellingPrice: number;
    country: string;
    stock: number; 
}

// --- 2. INTERFACE FOR DROPDOWN OPTIONS (CRITICAL FIX) ---
export interface DropdownOptions {
    categories: string[];
    types: string[];
    units: string[];
    countries: string[];
}

// --- 3. DROPDOWN MOCK DATA (CRITICAL FIX: Fully defined) ---
export const mockDropdowns: DropdownOptions = {
    // These arrays must be defined and contain at least one element
    categories: ['Analgesic', 'Antibiotic', 'Vitamin', 'Antihistamine', 'Other'],
    types: ['Tablet', 'Capsule', 'Syrup', 'Injection'],
    units: ['Strip', 'Box', 'Bottle', 'Vial'],
    countries: ['India', 'USA', 'Ethiopia', 'Germany', 'China'],
};


// --- 4. MEDICINE LIST MOCK DATA ---
export const mockMedicineData: Medicine[] = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Analgesic', type: 'Tablet', batchNumber: 'P12345', manufacturer: 'Highnoon', expiryDate: '2026-10-01', unit: 'Strip', buyingPrice: 5.50, sellingPrice: 7.00, country: 'India', stock: 50 },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic', type: 'Capsule', batchNumber: 'A98765', manufacturer: 'Bosch', expiryDate: '2025-05-15', unit: 'Box', buyingPrice: 120.00, sellingPrice: 150.00, country: 'USA', stock: 10 },
    { id: 3, name: 'Vitamin C Syrup', category: 'Vitamin', type: 'Syrup', batchNumber: 'V54321', manufacturer: 'Martin dow', expiryDate: '2027-01-20', unit: 'Bottle', buyingPrice: 45.00, sellingPrice: 60.00, country: 'Ethiopia', stock: 100 },
    { id: 4, name: 'Omeprazole 20mg', category: 'Analgesic', type: 'Capsule', batchNumber: 'O67890', manufacturer: 'Werwick', expiryDate: '2025-11-30', unit: 'Strip', buyingPrice: 8.25, sellingPrice: 10.50, country: 'India', stock: 25 },
    { id: 5, name: 'Cetirizine 10mg', category: 'Antihistamine', type: 'Tablet', batchNumber: 'C11223', manufacturer: 'PharmaCo', expiryDate: '2026-03-05', unit: 'Strip', buyingPrice: 3.00, sellingPrice: 5.00, country: 'Germany', stock: 30 },
    { id: 6, name: 'Omeprazole 20mg', category: 'Analgesic', type: 'Capsule', batchNumber: 'O67890', manufacturer: 'Werwick', expiryDate: '2025-11-30', unit: 'Strip', buyingPrice: 8.25, sellingPrice: 10.50, country: 'India', stock: 15 },
    { id: 7, name: 'Ome', category: 'Analgesic', type: 'Capsule', batchNumber: 'O67890', manufacturer: 'Werwick', expiryDate: '2025-11-30', unit: 'Strip', buyingPrice: 8.25, sellingPrice: 10.50, country: 'India', stock: 5 },
];

let nextMedicineId = 8; // Start ID counter after the mock data

// --- 5. MOCK ASYNC FETCH FUNCTION ---
export async function getFullMedicineList(): Promise<Medicine[]> {
    // Simulating a network delay
    await new Promise(resolve => setTimeout(resolve, 50)); 
    return JSON.parse(JSON.stringify(mockMedicineData)) as Medicine[]; // Return a copy
}

// ⭐️ NEW 6. MOCK ASYNC ADD MEDICINE FUNCTION (Simulates POST /api/medicines)
export type NewMedicineData = Omit<Medicine, 'id'>;
export async function addMedicine(data: NewMedicineData): Promise<Medicine> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const newMed: Medicine = {
        ...data,
        id: nextMedicineId++,
        // Ensure stock is treated as a number during addition
        stock: data.stock
    };
    mockMedicineData.push(newMed);
    console.log(`[MOCK ADD] Added new medicine: ${newMed.name} (ID: ${newMed.id})`);
    return newMed;
}


// ⭐️ NEW 7. MOCK ASYNC GENERIC UPDATE MEDICINE FUNCTION (Simulates PUT/PATCH /api/medicines/{id})
export type UpdateMedicineData = Partial<Medicine> & { id: number };
export async function updateMedicine(medicineId: number, data: Partial<Medicine>): Promise<Medicine> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const index = mockMedicineData.findIndex(m => m.id === medicineId);

    if (index === -1) {
        // Throw an error that the React Query mutation can interpret (e.g., for a 404 handler)
        const error: MockApiError = new Error(`Medicine with ID ${medicineId} not found for update.`);
        // Simulate a 404 response structure for API error handling in context
        error.response = { status: 404, data: { message: 'Record not found' } }; 
        throw error;
    }

    // Merge existing data with new data
    mockMedicineData[index] = { ...mockMedicineData[index], ...data };
    const updatedMed = mockMedicineData[index];

    console.log(`[MOCK UPDATE] Updated medicine: ${updatedMed.name} (ID: ${medicineId})`);
    return updatedMed;
}


// ⭐️ EXISTING 8. MOCK ASYNC STOCK UPDATE FUNCTION (Simulates PATCH /api/medicines/{id}/stock)
export async function updateMedicineStock(medicineId: number, quantitySold: number): Promise<void> {
    // Simulating a network delay
    await new Promise(resolve => setTimeout(resolve, 100)); 

    const medicineIndex = mockMedicineData.findIndex(m => m.id === medicineId);

    if (medicineIndex === -1) {
        throw new Error(`Medicine with ID ${medicineId} not found.`);
    }

    const currentStock = mockMedicineData[medicineIndex].stock;
    const newStock = currentStock - quantitySold;

    if (newStock < 0) {
        throw new Error(`Insufficient stock for sale: Attempted to reduce stock of ${mockMedicineData[medicineIndex].name} below zero.`);
    }

    // Update the stock in the mock data array
    mockMedicineData[medicineIndex].stock = newStock;
    console.log(`[MOCK STOCK UPDATE] Reduced stock of ${mockMedicineData[medicineIndex].name} (ID: ${medicineId}) by ${quantitySold}. New stock: ${newStock}`);

    return;
}