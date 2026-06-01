import { Order } from "../models/types.js";
import { randomUUID } from "node:crypto";

export function orderToSalesforce(order: Order) {
  return {
    Order_Number__c: order.orderNumber,
    Amount__c: order.amount,
    Status__c: order.status,
    Customer_Email__c: order.customerEmail
  };
}

export function salesforceToOrder(record: any, existing?: Order): Order {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? randomUUID(),
    salesforceOrderId: record.Id ?? existing?.salesforceOrderId ?? "",
    orderNumber: record.Order_Number__c ?? existing?.orderNumber ?? "",
    customerEmail: record.Customer_Email__c ?? existing?.customerEmail ?? "",
    amount: Number(record.Amount__c ?? existing?.amount ?? 0),
    status: record.Status__c ?? existing?.status ?? "",
    syncStatus: "Synced",
    lastModified: record.LastModifiedDate ?? now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
