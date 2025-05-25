export interface KeyMetrics {
  lowStockProducts: number;
  totalKeys: number;
  availableKeys: number;
  usedKeys: number;
  expiredKeys: number;
  keyUsageByProduct: KeyUsageByProduct[];
}

export interface KeyUsageByProduct {
  productId: string;
  productName: string;
  totalKeys: number;
  availableKeys: number;
  usedKeys: number;
}

export interface IKeyBulkManagementProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  keyFormat?: string;
}
