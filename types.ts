
export interface Phone {
  id: string;
  category: string;
  brand: string;
  model: string;
  variant: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  margin: number;
  marginPercentage: number;
  currentOffer: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface SheetConfig {
  sheetId: string;
  apiKey: string;
}
