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
  keyFormat?: string;
  keyManagement?: {
    format: string;
    minStockAlert?: number;
    autoGenerateKeys?: boolean;
    validationMethod?: 'format' | 'api' | 'custom';
    allowReuse?: boolean;
    keyExpiry?: boolean;
    validityDays?: number;
  };
}

export interface IKeyMetricsProps {
  metrics: KeyMetrics;
  onRefresh: () => void;
  isLoading: boolean;
  onManageKeys: (product: KeyUsageByProduct) => void;
}

export interface IKeyBulkManagementProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  keyFormat?: string;
}
