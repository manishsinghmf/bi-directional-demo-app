import { Customer } from "../models/types.js";
import { randomUUID } from "node:crypto";

export function customerToContact(customer: Customer) {
  return {
    FirstName: customer.firstName,
    LastName: customer.lastName || "Unknown",
    Email: customer.email,
    Phone: customer.phone
  };
}

export function contactToCustomer(record: any, existing?: Customer): Customer {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? randomUUID(),
    salesforceContactId: record.Id ?? existing?.salesforceContactId ?? "",
    firstName: record.FirstName ?? existing?.firstName ?? "",
    lastName: record.LastName ?? existing?.lastName ?? "",
    email: record.Email ?? existing?.email ?? "",
    phone: record.Phone ?? existing?.phone ?? "",
    syncStatus: "Synced",
    lastModified: record.LastModifiedDate ?? now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
