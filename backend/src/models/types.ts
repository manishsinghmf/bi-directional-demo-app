export type SyncStatus = "Synced" | "Syncing" | "Failed" | "Conflict";
export type SyncEventStatus = "SUCCESS" | "FAILED" | "CONFLICT" | "SYNCING";
export type SyncDirection = "APP_TO_SALESFORCE" | "SALESFORCE_TO_APP";
export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";

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
  entityType: "Customer" | "Order";
  entityId: string;
  direction: SyncDirection;
  operation: SyncOperation;
  status: SyncEventStatus;
  message: string;
}

export interface SalesforceConnection {
  instanceUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LiveCdcEvent {
  id: string;
  eventTime: string;
  eventType: string;
  object: "Contact" | "Order__c";
  recordId: string;
  changeType: string;
}
