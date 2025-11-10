
// Define the structure of a single sales transaction
export interface Sale {
    id: number;
    medicineName: string; // The name of the medicine sold
    quantity: number;
    sellingPrice: number;
    totalAmount: number;
    saleDate: string; // ISO date string (e.g., 'YYYY-MM-DD')
    customerName: string;
}