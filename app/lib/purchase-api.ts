// --- app/lib/purchase-api.ts (or query-functions.ts) ---

import { Purchase, PurchaseData } from './constants';
import { MockPurchaseService } from './purchase-service';

// Utility to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * GET /api/purchases/:id (View specific purchase details)
 * This function is used by React Query's useQuery hook.
 */
export const fetchPurchaseById = async (id: number): Promise<Purchase | undefined> => {
    await delay(300);
    
    // Call the mock service method to retrieve the single item
    const purchase = MockPurchaseService.getPurchaseById(id);
    
    if (!purchase) {
        // In a real API, this would throw a 404 error.
        throw new Error(`Purchase with ID ${id} not found.`);
    }
    
    return purchase;
};

// ... (Other functions like fetchPurchases, deletePurchaseMutation, etc.)