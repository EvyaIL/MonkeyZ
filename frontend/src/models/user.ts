export enum Role {
  manager = 0,
  default = 1
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  phone_number?: number | null;
}

export interface IProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  expiresAt: string;
  createdAt: string;
}
