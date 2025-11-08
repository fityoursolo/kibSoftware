// app/lib/supplier-service.ts

export interface Supplier {
    id: number;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    created: string; // Format: YYYY-MM-DD
}

const MOCK_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'Pharma Dist. Ethiopia', contact: 'Abebe Kebede', phone: '251-911-001001', email: 'abebe.k@pharma.com', address: 'Bole Road, Addis Ababa', country: 'Ethiopia', created: '2023-01-15' },
    { id: 2, name: 'Global Med Supplies', contact: 'Jane Smith', phone: '1-202-555-0199', email: 'janes@gms.com', address: '121 Main St, NY', country: 'USA', created: '2022-11-20' },
    { id: 3, name: 'Asian Generics LTD', contact: 'Li Wei', phone: '86-10-6500-1234', email: 'liwei@asia.com', address: 'Suzhou Industrial Park', country: 'China', created: '2023-05-01' },
    { id: 4, name: 'African Pharma', contact: 'Musa Diallo', phone: '251-911-001002', email: 'musa.d@pharma.com', address: 'Sarbet, Addis Ababa', country: 'Ethiopia', created: '2023-02-15' },
    { id: 5, name: 'Europe Medical', contact: 'Hans Muller', phone: '49-30-1234-5678', email: 'hans.m@euro.com', address: 'Berlin, Germany', country: 'Germany', created: '2023-08-10' },
];

export const SupplierService = {
    // This simulates fetching data from an API
    getAllSuppliers: (): Supplier[] => {
        return MOCK_SUPPLIERS;
    }
}