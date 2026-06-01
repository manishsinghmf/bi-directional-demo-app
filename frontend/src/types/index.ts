export type SyncStatus = "Synced" | "Syncing" | "Failed" | "Conflict";

export interface Customer {
  id: string;
  salesforceContactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  syncStatus: SyncStatus;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  salesforceOrderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
  status: string;
  syncStatus: SyncStatus;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEvent {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  direction: string;
  operation: string;
  status: "SUCCESS" | "FAILED" | "CONFLICT" | "SYNCING";
  message: string;
}

export interface SyncStatusSummary {
  totalCustomers: number;
  totalOrders: number;
  salesforceConnected: boolean;
  instanceUrl: string;
  lastSyncTime: string;
  syncSuccessCount: number;
  syncFailureCount: number;
}

export interface LiveCdcEvent {
  id: string;
  eventTime: string;
  eventType: string;
  object: string;
  recordId: string;
  changeType: string;
}
