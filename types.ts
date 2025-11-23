export interface Transaction {
  id: string;
  dispno: string; // เลขที่เอกสาร
  date: string; // YYYY-MM-DD
  department: string;
  code1: string; // Drug Code
  NAME: string; // Drug Name
  amount: number; // Positive for In, Negative for Out
  pack: string;
  price: number;
  LotNo: string;
  Barcode: string;
  ExpDate: string;
  timestamp: number;
  type: 'IN' | 'OUT';
}

export interface DrugConfig {
  minStock: number;
  cabinet: string; // A, B, C...
}

export interface InventoryItem {
  code: string;
  name: string;
  pack: string;
  totalIn: number;
  totalOut: number;
  balance: number;
  lotNo: string;
  expDate: string;
  minStock: number;
  cabinet: string;
  price: number;
  status: 'NORMAL' | 'LOW' | 'EMPTY';
  expStatus: 'OK' | 'NEAR' | 'EXPIRED';
  daysToExpire: number;
  lastUpdate: string;
}

export interface RequisitionItem extends InventoryItem {
  usageRatePerWeek: number;
  suggested1_2: number; // 1.2x
  suggested1_5: number; // 1.5x
  manualOrder: number;
  isSelected: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'USER';
}

export interface Requester {
  id: string;
  name: string;
}