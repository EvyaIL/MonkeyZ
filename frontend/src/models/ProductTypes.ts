export interface IKeyFormat {
  pattern: string;
  separator?: string;
  groups?: number[];
  allowedCharacters?: string;
}

export interface IKeyManagement {
  format: IKeyFormat;
  availableKeys: number;
  minStockAlert: number;
  autoGenerateKeys: boolean;
  validationMethod: 'format' | 'api' | 'custom';
  apiEndpoint?: string;
  expiryDays?: number;
  allowReuse: boolean;
}

export interface IProduct {
  id: string;
  name: {
    en: string;
    he: string;
  };
  description: {
    en: string;
    he: string;
  };
  price: number;
  category: string;
  imageUrl: string;
  active: boolean;
  keyManagement: IKeyManagement;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    customFields?: Record<string, any>;
  };
  is_new?: boolean;
  percent_off?: number;
  best_seller?: boolean;
  displayOnHomePage?: boolean;
  display_on_homepage?: boolean;
}

export interface IKey {
  id: string;
  productId: string;
  value: string;
  status: 'available' | 'used' | 'expired' | 'invalid';
  issuedAt?: string;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
}
